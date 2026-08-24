import './styles.css'
import {
  ACCEPT,
  FORMAT_GROUPS,
  SAMPLE_RATES,
  DEFAULT_FORMAT,
  formatById,
  defaultRate,
  rateOptions,
  ghostLabel,
} from './formats.js'
import { Waveform, decodePeaks } from './waveform.js'
import { convertFile, loadEngine } from './engine.js'

const fileInput = document.querySelector('#file')
const platter = document.querySelector('#platter')
const core = document.querySelector('#core')
const note = document.querySelector('#stage-note')
const cutBtn = document.querySelector('#cut')
const toast = document.querySelector('#toast')
const ghost = document.querySelector('#ghost-rate')
const grain = document.querySelector('#grain')

fileInput.setAttribute('accept', ACCEPT)

const state = {
  file: null,
  meta: null,
  formatId: DEFAULT_FORMAT,
  rate: defaultRate(formatById(DEFAULT_FORMAT)),
  sampleRate: 'original',
  channels: 'original',
  status: 'idle',
  progress: 0,
  progressLabel: '',
  output: null,
  error: '',
  playing: null,
}

const wave = new Waveform(document.querySelector('#wave'))
const audio = new Audio()
let objectUrl = ''

function paintGrain() {
  const size = 180
  grain.width = size
  grain.height = size
  const ctx = grain.getContext('2d')
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 180 + Math.random() * 70
    img.data[i] = n
    img.data[i + 1] = n
    img.data[i + 2] = n
    img.data[i + 3] = 40
  }
  ctx.putImageData(img, 0, 0)
  grain.style.backgroundImage = `url(${grain.toDataURL('image/png')})`
  grain.style.backgroundRepeat = 'repeat'
  grain.width = 0
  grain.height = 0
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function rateLabelFor(format) {
  if (format.mode === 'flac') return 'Compresión'
  if (format.mode === 'none') return 'Tasa'
  return 'Tasa · kb/s'
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** i
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '—'
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function showToast(message) {
  toast.textContent = message
  toast.hidden = !message
}

function stopPlayback() {
  audio.pause()
  audio.removeAttribute('src')
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }
  state.playing = null
  wave.setPlaying(false, 0)
}

function playBlob(blob, key) {
  stopPlayback()
  objectUrl = URL.createObjectURL(blob)
  audio.src = objectUrl
  state.playing = key
  audio.play().catch(() => {
    state.playing = null
    render()
  })
  render()
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return
  wave.setPlaying(true, audio.currentTime / audio.duration)
})
audio.addEventListener('ended', () => {
  state.playing = null
  wave.setPlaying(false, 1)
  render()
})

class Select {
  constructor(root, { label, groups, value, onChange }) {
    this.root = root
    this.label = label
    this.groups = groups
    this.value = value
    this.onChange = onChange
    this.disabled = false
    this.open = false
    this.render()
    document.addEventListener('click', (event) => {
      if (!this.root.contains(event.target)) this.setOpen(false)
    })
  }

  setGroups(groups, value) {
    this.groups = groups
    if (value !== undefined) this.value = value
    this.render()
  }

  setValue(value) {
    this.value = value
    this.render()
  }

  setDisabled(disabled) {
    this.disabled = disabled
    this.render()
  }

  current() {
    return this.groups.flatMap((g) => g.items).find((item) => item.id === this.value) || this.groups[0].items[0]
  }

  setOpen(open) {
    this.open = open && !this.disabled
    this.render()
  }

  render() {
    const current = this.current()
    this.root.className = `select${this.open ? ' is-open' : ''}${this.disabled ? ' is-disabled' : ''}`
    this.root.innerHTML = `
      <span class="select-label">${this.label}</span>
      <button class="select-btn" type="button" aria-haspopup="listbox" aria-expanded="${this.open}">
        <span class="select-copy">
          <span class="select-value">${current.label}</span>
          <span class="select-hint">${current.hint || ''}</span>
        </span>
        <span class="select-caret" aria-hidden="true">${this.open ? '▴' : '▾'}</span>
      </button>
      <div class="select-panel" role="listbox" ${this.open ? '' : 'hidden'}>
        ${this.groups
          .map(
            (group) => `
            ${group.label ? `<div class="select-group">${group.label}</div>` : ''}
            ${group.items
              .map(
                (item) => `
                <button class="select-option${item.id === this.value ? ' is-active' : ''}" type="button" role="option" data-id="${item.id}">
                  <span>${item.label}</span>
                  <small>${item.hint || ''}</small>
                </button>
              `,
              )
              .join('')}
          `,
          )
          .join('')}
      </div>
    `
    this.root.querySelector('.select-btn').addEventListener('click', (event) => {
      event.stopPropagation()
      if (this.disabled) return
      this.setOpen(!this.open)
    })
    this.root.querySelectorAll('.select-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.value = btn.dataset.id
        this.setOpen(false)
        this.onChange(this.value)
      })
    })
  }
}

function formatGroupsForSelect() {
  return FORMAT_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.map((item) => ({
      id: item.id,
      label: item.name,
      hint: item.hint,
    })),
  }))
}

function rateGroupsFor(format) {
  return [{ label: '', items: rateOptions(format) }]
}

function hzGroups() {
  return [{ label: '', items: SAMPLE_RATES }]
}

const formatSelect = new Select(document.querySelector('#select-format'), {
  label: 'Formato',
  groups: formatGroupsForSelect(),
  value: state.formatId,
  onChange: (id) => {
    state.formatId = id
    const format = formatById(id)
    state.rate = defaultRate(format)
    rateSelect.label = rateLabelFor(format)
    rateSelect.setGroups(rateGroupsFor(format), state.rate)
    rateSelect.setDisabled(format.mode === 'none')
    if (format.lockSampleRate) {
      state.sampleRate = format.lockSampleRate
      hzSelect.setValue(state.sampleRate)
      hzSelect.setDisabled(true)
    } else {
      hzSelect.setDisabled(false)
    }
    if (format.lockChannels) {
      state.channels = format.lockChannels
    }
    updateGhost()
    renderChannels()
    if (state.status === 'done') {
      state.status = 'ready'
      state.output = null
    }
    render()
  },
})

const rateSelect = new Select(document.querySelector('#select-rate'), {
  label: rateLabelFor(formatById(state.formatId)),
  groups: rateGroupsFor(formatById(state.formatId)),
  value: state.rate,
  onChange: (id) => {
    state.rate = id
    if (state.status === 'done') {
      state.status = 'ready'
      state.output = null
    }
    updateGhost()
    render()
  },
})

const hzSelect = new Select(document.querySelector('#select-hz'), {
  label: 'Frecuencia',
  groups: hzGroups(),
  value: state.sampleRate,
  onChange: (id) => {
    state.sampleRate = id
    if (state.status === 'done') {
      state.status = 'ready'
      state.output = null
    }
    render()
  },
})

function updateGhost() {
  if (state.status === 'converting') {
    ghost.textContent = String(Math.round(state.progress * 100))
    return
  }
  if (state.status === 'loading') {
    ghost.textContent = String(Math.round(state.progress * 100))
    return
  }
  const format = formatById(state.formatId)
  ghost.textContent = ghostLabel(format, state.rate)
}

function renderChannels() {
  const format = formatById(state.formatId)
  document.querySelector('#channels').classList.toggle('is-locked', Boolean(format.lockChannels))
  document.querySelectorAll('#channels .chip').forEach((chip) => {
    chip.classList.toggle('is-on', chip.dataset.ch === state.channels)
  })
}

document.querySelector('#channels').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-ch]')
  if (!chip) return
  const format = formatById(state.formatId)
  if (format.lockChannels) return
  state.channels = chip.dataset.ch
  if (state.status === 'done') {
    state.status = 'ready'
    state.output = null
  }
  renderChannels()
  render()
})

function coreMarkup() {
  if (state.status === 'loading') {
    return `
      <div>
        <div class="spindle"></div>
        <p class="core-title">Calentando<br />el torno</p>
        <p class="core-sub">${state.progressLabel || 'descargando motor'}</p>
      </div>
    `
  }
  if (state.status === 'converting') {
    return `
      <div>
        <div class="spindle"></div>
        <p class="core-title">Cortando<br />el surco</p>
        <p class="core-sub">${Math.round(state.progress * 100)}%</p>
      </div>
    `
  }
  if (state.status === 'done' && state.output) {
    return `
      <div>
        <div class="spindle"></div>
        <p class="core-title">Máster<br />listo</p>
        <p class="core-meta">${escapeHtml(state.output.name)} · ${formatBytes(state.output.size)}</p>
        <div class="core-actions">
          <button class="text-link" type="button" data-act="listen-out">${state.playing === 'out' ? 'Pausa' : 'Escuchar'}</button>
          <button class="text-link" type="button" data-act="save">Guardar</button>
        </div>
      </div>
    `
  }
  if (state.file) {
    return `
      <div>
        <div class="spindle"></div>
        <p class="core-file" title="${escapeHtml(state.file.name)}">${escapeHtml(state.file.name)}</p>
        <p class="core-meta">${state.meta?.duration || '—'} · ${formatBytes(state.file.size)}${state.meta?.kind ? ` · ${escapeHtml(state.meta.kind)}` : ''}</p>
        <div class="core-actions">
          <button class="text-link" type="button" data-act="listen-in">${state.playing === 'in' ? 'Pausa' : 'Oír origen'}</button>
          <button class="text-link" type="button" data-act="change">Cambiar</button>
        </div>
      </div>
    `
  }
  return `
    <div>
      <div class="spindle"></div>
      <p class="core-title">Suelta<br />el audio</p>
      <p class="core-sub">o ábrelo del dispositivo</p>
      <div class="core-actions">
        <button class="text-link" type="button" data-act="sample">Probar una muestra</button>
      </div>
    </div>
  `
}

function render() {
  core.innerHTML = coreMarkup()
  updateGhost()
  const busy = state.status === 'loading' || state.status === 'converting'
  const openBtn = document.querySelector('#open-device')
  openBtn.disabled = busy
  openBtn.textContent = state.file ? 'Cambiar archivo' : 'Abrir almacenamiento'
  cutBtn.disabled = !state.file || busy
  cutBtn.classList.toggle('is-ready', state.status === 'done')
  if (state.status === 'done') cutBtn.textContent = 'Guardar el corte'
  else if (state.status === 'converting') cutBtn.textContent = 'Cortando…'
  else if (state.status === 'loading') cutBtn.textContent = 'Preparando torno…'
  else cutBtn.textContent = 'Cortar el máster'

  if (state.status === 'loading') {
    note.textContent = state.progressLabel || 'Descargando el motor de conversión…'
  } else if (state.status === 'converting') {
    note.textContent = 'El corte ocurre por completo en este navegador.'
  } else if (state.status === 'done') {
    note.textContent = 'El máster quedó en tu dispositivo. Nada se envió a un servidor.'
  } else if (state.file) {
    note.textContent = 'Elige formato y tasa. Luego corta el máster.'
  } else {
    note.textContent = 'El audio no sale de tu dispositivo.'
  }

  if (state.status === 'converting' || state.status === 'loading') wave.setMode(state.status)
  else if (state.status === 'done') wave.setMode('done')
  else if (state.file) wave.setMode('ready')
  else wave.setMode('idle')
  wave.setProgress(state.progress)
}

async function inspectFile(file) {
  const ext = (file.name.split('.').pop() || '').toUpperCase()
  const meta = { kind: ext, duration: '—' }
  const buffer = await decodePeaks(file)
  if (buffer) {
    meta.duration = formatTime(buffer.duration)
    meta.sampleRate = buffer.sampleRate
    meta.channels = buffer.numberOfChannels
    wave.setAudioBuffer(buffer)
  } else {
    wave.setAudioBuffer(null)
  }
  return meta
}

async function setFile(file) {
  if (!file) return
  stopPlayback()
  state.file = file
  state.output = null
  state.status = 'ready'
  state.error = ''
  state.progress = 0
  showToast('')
  if (file.size > 180 * 1024 * 1024) {
    showToast('Archivos muy grandes pueden agotar la memoria del navegador.')
  }
  state.meta = await inspectFile(file)
  render()
  loadEngine(() => {}).catch(() => {
    /* se cargará al primer corte */
  })
}

async function loadSample() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}muestra.wav`)
    const blob = await response.blob()
    const file = new File([blob], 'muestra.wav', { type: 'audio/wav' })
    await setFile(file)
  } catch {
    showToast('No se pudo cargar la muestra.')
  }
}

async function openFromDevice() {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Audio y vídeo',
            accept: {
              'audio/*': [
                '.mp3',
                '.wav',
                '.flac',
                '.ogg',
                '.oga',
                '.opus',
                '.m4a',
                '.aac',
                '.wma',
                '.aiff',
                '.aif',
                '.webm',
                '.amr',
                '.ac3',
                '.mp2',
                '.au',
                '.caf',
                '.voc',
                '.mka',
                '.wv',
                '.tta',
                '.w64',
                '.gsm',
                '.spx',
              ],
              'video/*': ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.3gp'],
            },
          },
        ],
      })
      const file = await handle.getFile()
      await setFile(file)
      return
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }
  fileInput.click()
}

async function saveOutput() {
  if (!state.output) return
  const { blob, name } = state.output
  const ext = `.${name.split('.').pop()}`
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [
          {
            description: name,
            accept: { [blob.type || 'application/octet-stream']: [ext] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

async function convert() {
  if (!state.file || state.status === 'converting' || state.status === 'loading') return
  const format = formatById(state.formatId)
  stopPlayback()
  state.status = 'loading'
  state.progress = 0
  render()

  try {
    await loadEngine(({ phase, value }) => {
      if (phase === 'wasm') {
        state.progress = value * 0.92
        state.progressLabel = `Motor ${Math.round(value * 100)}%`
      } else if (phase === 'core') {
        state.progress = value * 0.08
        state.progressLabel = 'Leyendo el torno'
      } else {
        state.progress = 1
        state.progressLabel = 'Listo'
      }
      wave.setProgress(state.progress)
      render()
    })

    state.status = 'converting'
    state.progress = 0
    render()

    const output = await convertFile(
      state.file,
      format,
      {
        rate: state.rate,
        sampleRate: format.lockSampleRate || state.sampleRate,
        channels: format.lockChannels || state.channels,
      },
      {
        onProgress: (value) => {
          state.progress = value
          wave.setProgress(value)
          render()
        },
      },
    )

    state.output = output
    state.status = 'done'
    state.progress = 1
    render()
  } catch (error) {
    console.error(error)
    state.status = state.file ? 'ready' : 'idle'
    state.error = error?.message || 'No se pudo completar el corte.'
    showToast(state.error)
    render()
  }
}

platter.addEventListener('click', (event) => {
  const act = event.target.closest('[data-act]')?.dataset.act
  if (act === 'change') {
    openFromDevice()
    return
  }
  if (act === 'listen-in' && state.file) {
    if (state.playing === 'in') {
      stopPlayback()
      render()
    } else {
      playBlob(state.file, 'in')
    }
    return
  }
  if (act === 'listen-out' && state.output) {
    if (state.playing === 'out') {
      stopPlayback()
      render()
    } else {
      playBlob(state.output.blob, 'out')
    }
    return
  }
  if (act === 'save') {
    saveOutput()
    return
  }
  if (act === 'sample') {
    loadSample()
    return
  }
  if (!act) openFromDevice()
})

platter.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openFromDevice()
  }
})

document.querySelector('#open-device').addEventListener('click', (event) => {
  event.preventDefault()
  openFromDevice()
})

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  fileInput.value = ''
  if (file) await setFile(file)
})

cutBtn.addEventListener('click', () => {
  if (state.status === 'done' && state.output) saveOutput()
  else convert()
})

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((type) => {
  window.addEventListener(type, (event) => {
    event.preventDefault()
    event.stopPropagation()
  })
})

window.addEventListener('dragenter', () => {
  document.body.classList.add('is-drag')
  wave.setDrag(true)
})
window.addEventListener('dragover', () => {
  document.body.classList.add('is-drag')
  wave.setDrag(true)
})
window.addEventListener('dragleave', (event) => {
  if (event.relatedTarget === null) {
    document.body.classList.remove('is-drag')
    wave.setDrag(false)
  }
})
window.addEventListener('drop', async (event) => {
  document.body.classList.remove('is-drag')
  wave.setDrag(false)
  const file = event.dataTransfer?.files?.[0]
  if (file) await setFile(file)
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'o' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    openFromDevice()
  }
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && state.file) {
    event.preventDefault()
    convert()
  }
})

paintGrain()
updateGhost()
renderChannels()
render()

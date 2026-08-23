import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { buildArgs, outputName } from './formats.js'

const CORE_VERSION = '0.12.10'
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`

let ffmpeg
let loaded = false
let loading = null

async function toBlobURL(url, mime, onProgress) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`No se pudo descargar el torno (${response.status})`)
  }
  const total = Number(response.headers.get('content-length') || 0)
  if (!response.body) {
    const blob = await response.blob()
    return URL.createObjectURL(new Blob([await blob.arrayBuffer()], { type: mime }))
  }

  const reader = response.body.getReader()
  const chunks = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    if (onProgress && total) onProgress(received / total)
  }
  return URL.createObjectURL(new Blob(chunks, { type: mime }))
}

export function isEngineReady() {
  return loaded
}

export async function loadEngine(onProgress = () => {}) {
  if (loaded) return ffmpeg
  if (loading) return loading

  loading = (async () => {
    ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ message }) => {
      if (message) console.debug('[torno]', message)
    })

    onProgress({ phase: 'core', value: 0 })
    const coreURL = await toBlobURL(
      `${CORE_BASE}/ffmpeg-core.js`,
      'text/javascript',
      (value) => onProgress({ phase: 'core', value }),
    )
    onProgress({ phase: 'wasm', value: 0 })
    const wasmURL = await toBlobURL(
      `${CORE_BASE}/ffmpeg-core.wasm`,
      'application/wasm',
      (value) => onProgress({ phase: 'wasm', value }),
    )

    await ffmpeg.load({ coreURL, wasmURL })
    loaded = true
    onProgress({ phase: 'ready', value: 1 })
    return ffmpeg
  })().catch((error) => {
    loading = null
    throw error
  })

  return loading
}

function safeMemName(name, fallback) {
  const cleaned = name.replace(/[^\w.\-]+/g, '_').slice(0, 80)
  return cleaned || fallback
}

async function unlink(engine, path) {
  try {
    await engine.deleteFile(path)
  } catch {
    /* empty */
  }
}

export async function convertFile(file, format, options, hooks = {}) {
  const { onProgress } = hooks
  const engine = await loadEngine()
  const logs = []

  const logger = ({ message }) => {
    if (message) logs.push(message)
  }
  const progressHandler = ({ progress }) => {
    if (typeof progress === 'number' && Number.isFinite(progress)) {
      onProgress?.(Math.max(0, Math.min(0.99, progress)))
    }
  }
  engine.on('log', logger)
  engine.on('progress', progressHandler)

  const ext = (file.name.match(/\.[^/.]+$/) || ['.bin'])[0]
  const inputName = safeMemName(`in${ext}`, 'input.bin')
  const bridgeName = 'bridge.wav'
  const outName = safeMemName(outputName(file.name, format), `out.${format.ext}`)

  const encodeOpts = {
    rate: options.rate,
    sampleRate: options.sampleRate,
    channels: options.channels,
    outputName: outName,
  }

  try {
    await unlink(engine, inputName)
    await unlink(engine, outName)
    await unlink(engine, bridgeName)
    await engine.writeFile(inputName, await fetchFile(file))

    const direct = buildArgs(format, { ...encodeOpts, inputName })
    let code = await engine.exec(direct)

    if (code !== 0) {
      logs.length = 0
      const decode = await engine.exec([
        '-hide_banner',
        '-i',
        inputName,
        '-map',
        '0:a:0',
        '-vn',
        '-c:a',
        'pcm_s16le',
        '-y',
        bridgeName,
      ])
      if (decode !== 0) {
        throw new Error(friendlyError(logs, 'No se encontró una pista de audio en ese archivo.'))
      }
      code = await engine.exec(buildArgs(format, { ...encodeOpts, inputName: bridgeName }))
    }

    if (code !== 0) {
      throw new Error(friendlyError(logs, 'El encoder no pudo cortar este archivo al formato elegido.'))
    }

    const data = await engine.readFile(outName)
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    const blob = new Blob([copy], { type: format.mime || 'application/octet-stream' })
    onProgress?.(1)
    return {
      blob,
      name: outputName(file.name, format),
      size: blob.size,
    }
  } finally {
    engine.off('progress', progressHandler)
    engine.off('log', logger)
    await unlink(engine, inputName)
    await unlink(engine, outName)
    await unlink(engine, bridgeName)
  }
}

function friendlyError(logs, fallback) {
  const text = logs.join('\n').toLowerCase()
  if (text.includes('does not contain any stream') || text.includes('matches no streams')) {
    return 'Ese archivo no tiene una pista de audio que se pueda cortar.'
  }
  if (text.includes('encoder') && (text.includes('not found') || text.includes('unknown'))) {
    return 'Este formato no está disponible en el torno de este navegador. Prueba MP3, WAV, AAC, OGG, Opus o FLAC.'
  }
  if (text.includes('invalid argument') || text.includes('error initializing')) {
    return 'Esa combinación de formato y tasa no es válida. Baja los kb/s o cambia el formato.'
  }
  return fallback
}

const TAU = Math.PI * 2

export class Waveform {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.peaks = null
    this.mode = 'idle'
    this.progress = 0
    this.playing = false
    this.playhead = 0
    this.drag = false
    this.raf = 0
    this.start = performance.now()
    this.dpr = 1
    this.resize()
    window.addEventListener('resize', () => this.resize())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopLoop()
      else this.loop()
    })
    this.loop()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.max(1, Math.floor(rect.width * this.dpr))
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr))
  }

  setAudioBuffer(buffer) {
    if (!buffer) {
      this.peaks = null
      this.mode = 'idle'
      return
    }
    const channel = buffer.getChannelData(0)
    const bars = 180
    const block = Math.floor(channel.length / bars)
    const peaks = new Float32Array(bars)
    for (let i = 0; i < bars; i += 1) {
      let sum = 0
      const start = i * block
      for (let j = 0; j < block; j += 32) {
        sum += Math.abs(channel[start + j] || 0)
      }
      peaks[i] = sum / (block / 32)
    }
    let max = 0
    for (let i = 0; i < bars; i += 1) max = Math.max(max, peaks[i])
    if (max > 0) {
      for (let i = 0; i < bars; i += 1) peaks[i] /= max
    }
    this.peaks = peaks
    this.mode = 'ready'
  }

  setMode(mode) {
    this.mode = mode
  }

  setProgress(value) {
    this.progress = Math.max(0, Math.min(1, value))
  }

  setPlaying(playing, playhead = 0) {
    this.playing = playing
    this.playhead = playhead
  }

  setDrag(drag) {
    this.drag = drag
  }

  stopLoop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  loop = () => {
    this.draw()
    this.raf = requestAnimationFrame(this.loop)
  }

  draw() {
    const { ctx, canvas } = this
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const radius = Math.min(w, h) * 0.48
    const t = (performance.now() - this.start) / 1000

    ctx.clearRect(0, 0, w, h)

    const copper = this.drag ? '201, 140, 90' : '201, 132, 78'
    const rings = 16
    for (let i = 0; i < rings; i += 1) {
      const r = radius * (0.42 + (i / rings) * 0.56)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, TAU)
      const alpha = 0.045 + i * 0.008 + (this.drag ? 0.04 : 0)
      ctx.strokeStyle = `rgba(${copper}, ${alpha})`
      ctx.lineWidth = Math.max(1, this.dpr * 0.7)
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.985, 0, TAU)
    ctx.strokeStyle = `rgba(${copper}, ${this.drag ? 0.72 : 0.38})`
    ctx.lineWidth = Math.max(1.2, this.dpr)
    ctx.stroke()

    const spin = t * 0.08
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.78, spin, spin + 0.9)
    ctx.strokeStyle = `rgba(${copper}, 0.22)`
    ctx.lineWidth = Math.max(1.4, this.dpr * 1.1)
    ctx.stroke()

    if (this.peaks) {
      const inner = radius * 0.46
      const outer = radius * 0.92
      const n = this.peaks.length
      for (let i = 0; i < n; i += 1) {
        const a = -Math.PI / 2 + (i / n) * TAU
        const amp = 0.18 + this.peaks[i] * 0.82
        const r0 = inner
        const r1 = inner + (outer - inner) * amp * 0.55
        const x0 = cx + Math.cos(a) * r0
        const y0 = cy + Math.sin(a) * r0
        const x1 = cx + Math.cos(a) * r1
        const y1 = cy + Math.sin(a) * r1
        const lit = this.playing && i / n < this.playhead
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.strokeStyle = lit ? `rgba(232, 196, 150, 0.95)` : `rgba(${copper}, ${0.28 + this.peaks[i] * 0.45})`
        ctx.lineWidth = Math.max(1, this.dpr * 1.15)
        ctx.stroke()
      }
    }

    if (this.mode === 'converting' || this.mode === 'loading') {
      const startA = -Math.PI / 2
      const endA = startA + TAU * (this.progress || 0)
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.96, startA, endA)
      ctx.strokeStyle = `rgba(232, 165, 107, 0.95)`
      ctx.lineWidth = Math.max(2.4, this.dpr * 2)
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    if (this.mode === 'done') {
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.96, 0, TAU)
      ctx.strokeStyle = `rgba(168, 186, 132, 0.75)`
      ctx.lineWidth = Math.max(2, this.dpr * 1.6)
      ctx.stroke()
    }
  }
}

export async function decodePeaks(file) {
  const ctx = new AudioContext()
  try {
    const raw = await file.arrayBuffer()
    const buffer = await ctx.decodeAudioData(raw.slice(0))
    await ctx.close()
    return buffer
  } catch {
    try {
      await ctx.close()
    } catch {
      /* empty */
    }
    return null
  }
}

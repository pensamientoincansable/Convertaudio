const KBPS = [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 192, 224, 256, 320]

const KBPS_HINT = {
  8: 'mínima',
  16: 'mínima',
  24: 'voz baja',
  32: 'radio',
  40: 'estrecha',
  48: 'voz',
  56: 'media baja',
  64: 'baja',
  80: 'podcast',
  96: 'estándar',
  112: 'media',
  128: 'común',
  160: 'buena',
  192: 'estudio',
  224: 'alta',
  256: 'muy alta',
  320: 'máxima',
}

export const RATE_HINT = KBPS_HINT

export const SAMPLE_RATES = [
  { id: 'original', label: 'Original', hint: 'sin resamplear' },
  { id: '8000', label: '8 kHz', hint: 'telefonía' },
  { id: '11025', label: '11.025 kHz', hint: 'voz' },
  { id: '16000', label: '16 kHz', hint: 'ancha' },
  { id: '22050', label: '22.05 kHz', hint: 'media' },
  { id: '32000', label: '32 kHz', hint: 'broadcast' },
  { id: '44100', label: '44.1 kHz', hint: 'CD' },
  { id: '48000', label: '48 kHz', hint: 'cine' },
  { id: '88200', label: '88.2 kHz', hint: 'estudio' },
  { id: '96000', label: '96 kHz', hint: 'máster' },
]

function lossy(partial) {
  return {
    mode: 'bitrate',
    bitrates: KBPS,
    defaultBitrate: 192,
    ...partial,
  }
}

export const FORMAT_GROUPS = [
  {
    id: 'diario',
    label: 'Uso diario',
    items: [
      lossy({
        id: 'mp3',
        name: 'MP3',
        hint: 'MPEG Layer III',
        ext: 'mp3',
        mime: 'audio/mpeg',
        encoder: ['-c:a', 'libmp3lame'],
      }),
      lossy({
        id: 'm4a',
        name: 'AAC',
        hint: 'M4A / iTunes',
        ext: 'm4a',
        mime: 'audio/mp4',
        encoder: ['-c:a', 'aac', '-movflags', '+faststart'],
      }),
      lossy({
        id: 'ogg',
        name: 'OGG',
        hint: 'Vorbis',
        ext: 'ogg',
        mime: 'audio/ogg',
        encoder: ['-c:a', 'libvorbis'],
      }),
      lossy({
        id: 'opus',
        name: 'Opus',
        hint: 'alta eficiencia',
        ext: 'opus',
        mime: 'audio/opus',
        encoder: ['-c:a', 'libopus'],
        bitrates: [16, 24, 32, 48, 64, 80, 96, 128, 160, 192, 256],
        defaultBitrate: 128,
      }),
      {
        id: 'wav16',
        name: 'WAV',
        hint: 'PCM 16-bit',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_s16le'],
        mode: 'none',
      },
      {
        id: 'flac',
        name: 'FLAC',
        hint: 'sin pérdida',
        ext: 'flac',
        mime: 'audio/flac',
        encoder: ['-c:a', 'flac'],
        mode: 'flac',
        levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        defaultLevel: 5,
      },
    ],
  },
  {
    id: 'estudio',
    label: 'Estudio · sin pérdida',
    items: [
      {
        id: 'wav24',
        name: 'WAV 24-bit',
        hint: 'PCM estudio',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_s24le'],
        mode: 'none',
      },
      {
        id: 'wav32f',
        name: 'WAV 32-bit float',
        hint: 'punto flotante',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_f32le'],
        mode: 'none',
      },
      {
        id: 'wav32',
        name: 'WAV 32-bit',
        hint: 'PCM entero',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_s32le'],
        mode: 'none',
      },
      {
        id: 'aiff16',
        name: 'AIFF',
        hint: 'PCM 16-bit',
        ext: 'aiff',
        mime: 'audio/aiff',
        encoder: ['-c:a', 'pcm_s16be'],
        mode: 'none',
      },
      {
        id: 'aiff24',
        name: 'AIFF 24-bit',
        hint: 'PCM estudio',
        ext: 'aiff',
        mime: 'audio/aiff',
        encoder: ['-c:a', 'pcm_s24be'],
        mode: 'none',
      },
      {
        id: 'alac',
        name: 'ALAC',
        hint: 'Apple Lossless',
        ext: 'm4a',
        mime: 'audio/mp4',
        encoder: ['-c:a', 'alac'],
        mode: 'none',
      },
      {
        id: 'wv',
        name: 'WavPack',
        hint: 'WV',
        ext: 'wv',
        mime: 'audio/x-wavpack',
        encoder: ['-c:a', 'wavpack'],
        mode: 'none',
      },
      {
        id: 'tta',
        name: 'TTA',
        hint: 'True Audio',
        ext: 'tta',
        mime: 'audio/x-tta',
        encoder: ['-c:a', 'tta'],
        mode: 'none',
      },
      {
        id: 'w64',
        name: 'W64',
        hint: 'Sony Wave64',
        ext: 'w64',
        mime: 'audio/x-w64',
        encoder: ['-c:a', 'pcm_s16le', '-f', 'w64'],
        mode: 'none',
      },
    ],
  },
  {
    id: 'web',
    label: 'Web y móviles',
    items: [
      lossy({
        id: 'aac',
        name: 'AAC ADTS',
        hint: 'archivo .aac',
        ext: 'aac',
        mime: 'audio/aac',
        encoder: ['-c:a', 'aac', '-f', 'adts'],
      }),
      lossy({
        id: 'mp4',
        name: 'MP4',
        hint: 'AAC en MP4',
        ext: 'mp4',
        mime: 'audio/mp4',
        encoder: ['-c:a', 'aac', '-movflags', '+faststart', '-f', 'mp4'],
      }),
      lossy({
        id: 'webm-opus',
        name: 'WebM',
        hint: 'Opus',
        ext: 'webm',
        mime: 'audio/webm',
        encoder: ['-c:a', 'libopus', '-f', 'webm'],
        bitrates: [16, 24, 32, 48, 64, 80, 96, 128, 160, 192, 256],
        defaultBitrate: 128,
      }),
      lossy({
        id: 'webm-vorbis',
        name: 'WebM Vorbis',
        hint: 'contenedor WebM',
        ext: 'webm',
        mime: 'audio/webm',
        encoder: ['-c:a', 'libvorbis', '-f', 'webm'],
      }),
      lossy({
        id: 'oga',
        name: 'OGA',
        hint: 'Vorbis',
        ext: 'oga',
        mime: 'audio/ogg',
        encoder: ['-c:a', 'libvorbis'],
      }),
      lossy({
        id: 'opus-ogg',
        name: 'Opus OGG',
        hint: 'en contenedor OGG',
        ext: 'ogg',
        mime: 'audio/ogg',
        encoder: ['-c:a', 'libopus'],
        bitrates: [16, 24, 32, 48, 64, 80, 96, 128, 160, 192, 256],
        defaultBitrate: 128,
      }),
      lossy({
        id: 'caf',
        name: 'CAF',
        hint: 'Core Audio',
        ext: 'caf',
        mime: 'audio/x-caf',
        encoder: ['-c:a', 'aac', '-f', 'caf'],
      }),
      lossy({
        id: '3gp',
        name: '3GP',
        hint: 'móvil legado',
        ext: '3gp',
        mime: 'audio/3gpp',
        encoder: ['-c:a', 'aac', '-f', '3gp'],
        defaultBitrate: 64,
      }),
      lossy({
        id: 'mov',
        name: 'MOV',
        hint: 'QuickTime audio',
        ext: 'mov',
        mime: 'audio/quicktime',
        encoder: ['-c:a', 'aac', '-f', 'mov'],
      }),
      lossy({
        id: 'm4b',
        name: 'M4B',
        hint: 'audiolibro AAC',
        ext: 'm4b',
        mime: 'audio/mp4',
        encoder: ['-c:a', 'aac', '-f', 'mp4', '-movflags', '+faststart'],
      }),
      lossy({
        id: 'opus-mp4',
        name: 'Opus MP4',
        hint: 'Opus en MP4',
        ext: 'mp4',
        mime: 'audio/mp4',
        encoder: ['-c:a', 'libopus', '-f', 'mp4', '-movflags', '+faststart'],
        bitrates: [16, 24, 32, 48, 64, 80, 96, 128, 160, 192, 256],
        defaultBitrate: 128,
      }),
    ],
  },
  {
    id: 'broadcast',
    label: 'Cine y broadcast',
    items: [
      lossy({
        id: 'ac3',
        name: 'AC-3',
        hint: 'Dolby Digital',
        ext: 'ac3',
        mime: 'audio/ac3',
        encoder: ['-c:a', 'ac3'],
        bitrates: [96, 128, 160, 192, 224, 256, 320, 384, 448, 640],
        defaultBitrate: 192,
      }),
      lossy({
        id: 'eac3',
        name: 'E-AC-3',
        hint: 'Dolby Digital Plus',
        ext: 'eac3',
        mime: 'audio/eac3',
        encoder: ['-c:a', 'eac3'],
        bitrates: [96, 128, 160, 192, 224, 256, 320, 384, 448, 640],
        defaultBitrate: 256,
      }),
      lossy({
        id: 'mp2',
        name: 'MP2',
        hint: 'MPEG Layer II',
        ext: 'mp2',
        mime: 'audio/mpeg',
        encoder: ['-c:a', 'mp2'],
        bitrates: [64, 96, 112, 128, 160, 192, 224, 256, 320, 384],
        defaultBitrate: 192,
      }),
      {
        id: 'dts',
        name: 'DTS',
        hint: 'experimental',
        ext: 'dts',
        mime: 'audio/vnd.dts',
        encoder: ['-c:a', 'dca', '-strict', '-2'],
        mode: 'bitrate',
        bitrates: [384, 448, 576, 640, 768, 960, 1536],
        defaultBitrate: 768,
      },
    ],
  },
  {
    id: 'legado',
    label: 'Legado y archivo',
    items: [
      lossy({
        id: 'wma',
        name: 'WMA',
        hint: 'Windows Media',
        ext: 'wma',
        mime: 'audio/x-ms-wma',
        encoder: ['-c:a', 'wmav2'],
      }),
      {
        id: 'amr',
        name: 'AMR-NB',
        hint: 'telefonía 8 kHz',
        ext: 'amr',
        mime: 'audio/amr',
        encoder: ['-c:a', 'libopencore_amrnb', '-ar', '8000', '-ac', '1'],
        mode: 'bitrate',
        bitrates: [4.75, 5.15, 5.9, 6.7, 7.4, 7.95, 10.2, 12.2],
        defaultBitrate: 12.2,
        lockSampleRate: '8000',
        lockChannels: 'mono',
      },
      {
        id: 'amrwb',
        name: 'AMR-WB',
        hint: 'telefonía 16 kHz',
        ext: 'amr',
        mime: 'audio/amr',
        encoder: ['-c:a', 'libvo_amrwbenc', '-ar', '16000', '-ac', '1'],
        mode: 'bitrate',
        bitrates: [6.6, 8.85, 12.65, 14.25, 15.85, 18.25, 19.85, 23.05, 23.85],
        defaultBitrate: 12.65,
        lockSampleRate: '16000',
        lockChannels: 'mono',
      },
      lossy({
        id: 'speex',
        name: 'Speex',
        hint: 'voz .spx',
        ext: 'spx',
        mime: 'audio/x-speex',
        encoder: ['-c:a', 'libspeex'],
        bitrates: [8, 11, 15, 18, 24, 32],
        defaultBitrate: 15,
      }),
      {
        id: 'gsm',
        name: 'GSM',
        hint: 'Full Rate',
        ext: 'gsm',
        mime: 'audio/gsm',
        encoder: ['-c:a', 'gsm', '-ar', '8000', '-ac', '1'],
        mode: 'none',
        lockSampleRate: '8000',
        lockChannels: 'mono',
      },
      {
        id: 'wav8',
        name: 'WAV 8-bit',
        hint: 'PCM unsigned',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_u8'],
        mode: 'none',
      },
      {
        id: 'mulaw',
        name: 'μ-law',
        hint: 'WAV G.711',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_mulaw', '-ar', '8000'],
        mode: 'none',
      },
      {
        id: 'alaw',
        name: 'A-law',
        hint: 'WAV G.711',
        ext: 'wav',
        mime: 'audio/wav',
        encoder: ['-c:a', 'pcm_alaw', '-ar', '8000'],
        mode: 'none',
      },
      {
        id: 'au',
        name: 'AU',
        hint: 'Sun / NeXT',
        ext: 'au',
        mime: 'audio/basic',
        encoder: ['-c:a', 'pcm_s16be', '-f', 'au'],
        mode: 'none',
      },
      {
        id: 'voc',
        name: 'VOC',
        hint: 'Creative',
        ext: 'voc',
        mime: 'audio/x-voc',
        encoder: ['-c:a', 'pcm_s16le', '-f', 'voc'],
        mode: 'none',
      },
      {
        id: 'mka',
        name: 'MKA',
        hint: 'Matroska audio',
        ext: 'mka',
        mime: 'audio/x-matroska',
        encoder: ['-c:a', 'libopus', '-f', 'matroska'],
        mode: 'bitrate',
        bitrates: [32, 48, 64, 80, 96, 128, 160, 192, 256],
        defaultBitrate: 128,
      },
    ],
  },
]

export const FORMATS = Object.fromEntries(
  FORMAT_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item])),
)

export const DEFAULT_FORMAT = 'mp3'

export const ACCEPT = [
  'audio/*',
  'video/*',
  '.mp3',
  '.wav',
  '.wave',
  '.flac',
  '.ogg',
  '.oga',
  '.opus',
  '.m4a',
  '.m4b',
  '.m4r',
  '.aac',
  '.adts',
  '.wma',
  '.aiff',
  '.aif',
  '.aifc',
  '.webm',
  '.weba',
  '.amr',
  '.awb',
  '.ac3',
  '.eac3',
  '.mp2',
  '.mpga',
  '.au',
  '.snd',
  '.caf',
  '.voc',
  '.mka',
  '.mkv',
  '.mp4',
  '.m4v',
  '.mov',
  '.3gp',
  '.3g2',
  '.wv',
  '.tta',
  '.alac',
  '.w64',
  '.gsm',
  '.spx',
  '.ra',
  '.ram',
  '.ape',
  '.dts',
  '.dtshd',
  '.tak',
  '.ofr',
  '.ofs',
  '.dsf',
  '.dff',
  '.wma',
  '.asf',
  '.avi',
  '.ts',
  '.m2ts',
  '.flac',
].join(',')

export function formatById(id) {
  return FORMATS[id] || FORMATS[DEFAULT_FORMAT]
}

export function outputName(originalName, format) {
  const base = originalName.replace(/\.[^/.]+$/, '') || 'audio'
  return `${base}.${format.ext}`
}

export function rateOptions(format) {
  if (format.mode === 'flac') {
    return format.levels.map((level) => ({
      id: String(level),
      label: `Nivel ${level}`,
      hint: level === 0 ? 'rápido' : level === 5 ? 'equilibrio' : level === 12 ? 'máximo' : 'compresión',
    }))
  }
  if (format.mode === 'bitrate') {
    return format.bitrates.map((rate) => ({
      id: String(rate),
      label: Number.isInteger(rate) ? `${rate} kb/s` : `${rate} kb/s`,
      hint: KBPS_HINT[rate] || 'tasa',
    }))
  }
  return [{ id: 'native', label: 'Nativo', hint: 'sin pérdida' }]
}

export function defaultRate(format) {
  if (format.mode === 'flac') return String(format.defaultLevel ?? 5)
  if (format.mode === 'bitrate') return String(format.defaultBitrate ?? 192)
  return 'native'
}

export function ghostLabel(format, rate) {
  if (format.mode === 'none') return '∞'
  if (format.mode === 'flac') return String(rate)
  return String(rate)
}

export function buildArgs(format, { rate, sampleRate, channels, inputName, outputName: out }) {
  const args = ['-hide_banner', '-i', inputName, '-map', '0:a:0', '-vn']

  if (format.lockSampleRate) {
    /* already in encoder sometimes */
  } else if (sampleRate && sampleRate !== 'original') {
    args.push('-ar', String(sampleRate))
  }

  if (format.lockChannels) {
    /* already in encoder */
  } else if (channels === 'mono') {
    args.push('-ac', '1')
  } else if (channels === 'stereo') {
    args.push('-ac', '2')
  }

  args.push(...format.encoder)

  if (format.mode === 'bitrate' && rate && rate !== 'native') {
    args.push('-b:a', `${rate}k`)
  }
  if (format.mode === 'flac') {
    args.push('-compression_level', String(rate))
  }

  args.push('-y', out)
  return args
}

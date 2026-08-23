# CORTE

Taller de conversión de audio. Simple, local, poco convencional.

Suelta un archivo — o ábrelo del almacenamiento del dispositivo — elige el formato y la tasa en kb/s, y corta el máster. El audio no viaja a ningún servidor: FFmpeg corre dentro del navegador.

## Qué hace

- Carga cualquier audio (y vídeo, para extraer la pista) desde el explorador de archivos o arrastrándolo.
- Convierte a decenas de formatos: MP3, AAC, M4A, OGG, Opus, WAV (16/24/32), FLAC, AIFF, ALAC, WavPack, AC-3, E-AC-3, MP2, WMA, WebM, CAF, AMR, μ-law y más.
- Tasas de bits desde telefonía hasta 320 kb/s — o 640 kb/s en broadcast — según el encoder.
- Frecuencia de muestreo, mono / estéreo, y compresión FLAC.
- Escucha el origen y el corte antes de guardarlo.

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

```bash
npm run build
npm run preview
```

## Privacidad

Nada se sube. El motor (~32 MB de WebAssembly) se descarga una vez desde el CDN de FFmpeg y trabaja en tu máquina.

## Licencias

Este repositorio está bajo Apache-2.0. El motor de conversión es [FFmpeg](https://ffmpeg.org/) compilado a WebAssembly (`ffmpeg.wasm`), sujeto a sus propias licencias LGPL/GPL.

# Recording Field Sounds: Starter Guide

Field recording is easy to start with a lightweight kit. This page is pre-baked so the wiki works without running the installer.

## Quick Checklist

- Recorder with XLR inputs (Zoom H5/H6 or Tascam DR-40X)
- Two matched cardioid mics (or the built-in XY pair)
- Closed-back headphones
- Wind protection: deadcat + foam
- Extra SD card and batteries

## Setup

1. 24-bit/48 kHz WAV
2. Low-cut at 80–100 Hz to tame rumble
3. Peaks around -12 dBFS
4. Monitor with headphones; disable limiter unless needed

## Mic Placement

- **Ambience**: XY mics forward at chest height; avoid hard surfaces behind you.
- **Foley/objects**: mics 30–60 cm from source; angle 90° to reduce plosives.
- **Vehicles**: stay upwind; lower gain before pass-bys.

![Mic Placement](../media/recording/mic-placement.jpg)
![Wind Protection](../media/recording/wind-protection.jpg)

## File Hygiene

- Name takes `YYYYMMDD_location_subject_take.wav`.
- Keep `notes` with weather, gain, retries.
- Light normalization only; avoid heavy EQ/NR on masters.
- Export an MP3 preview at -14 LUFS; keep WAVs untouched.

## Publishing

- Host WAVs on S3/CloudFront.
- Link to packs here; embed the preview.
- Add a client-side PayPal donate button on the pack page.

Replace the placeholder images by adding real files under `recording/` in the media manager.

# Recording Field Sounds: Starter Guide

Field recording is easy to start with a lightweight kit. This post outlines a simple workflow, gear tips, and file-handling hygiene for sharing clean sound packs.

## Quick Checklist
- Recorder with XLR inputs (Zoom H5/H6 or Tascam DR-40X)
- Two matched cardioid mics (or the built-in XY pair)
- Closed-back headphones
- Wind protection: deadcat + foam
- Extra SD card and batteries

## Setup
1) Set your recorder to 24-bit/48 kHz WAV.
2) Enable low-cut at 80–100 Hz to tame rumble.
3) Set input gain so peaks land around -12 dBFS.
4) Monitor with headphones; disable limiter unless you expect transients.

## Mic Placement
- For ambience: point the XY mics forward at chest height; avoid hard surfaces behind you.
- For Foley/objects: place mics 30–60 cm from source; angle 90° to reduce plosives.
- For vehicles: stay upwind; avoid clipping by lowering gain before pass-bys.

_Illustrations:_
- Mic placement diagram: {{:recording:mic-placement.jpg?600}}
- Wind protection example: {{:recording:wind-protection.jpg?600}}

## Field Notes Template
- Location: city, park, rooftop
- Weather: temp, wind, humidity
- Mic/recorder: model, capsules used
- Gain settings: input A/B values
- Notes: unwanted noises, retries, one-line summary

## File Hygiene
- Name takes as `YYYYMMDD_location_subject_take.wav` (e.g., `20260115_centralpark_ambience_01.wav`).
- Keep a `notes.md` alongside the takes with the field notes template.
- Normalize lightly if needed; avoid heavy EQ/NR on masters.
- Export a preview MP3 at -14 LUFS for sharing; keep WAVs untouched.

## Publishing
- Upload WAVs to S3/CloudFront for distribution.
- In DokuWiki, link to your sound pack and include the preview MP3 player.
- Add a PayPal donate button on the pack page; keep it client-side only.

Happy recording! Drop your reference images into `content/media/recording/` using the filenames above so the embeds resolve.

# pretext-handwriter-demo

Handwriter is a minimal browser app that turns handwriting into text.

## Current modes

- Draw: write directly into a canvas and recognize strokes through the browser's Google/Chromium Handwriting Recognition API.

## Local development

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev`.
3. Open the local URL printed by Vite in a Chromium-based browser that supports the Handwriting Recognition API.

## Notes

- Recognition happens in the browser through `navigator.createHandwritingRecognizer()`.
- This first version is intentionally narrow so later modes like upload and camera capture can reuse the same app shell and result area.

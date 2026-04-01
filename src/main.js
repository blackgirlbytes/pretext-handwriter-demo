import "./styles.css";
import { createDrawMode } from "./drawMode.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="app-shell">
    <section class="hero panel">
      <p class="eyebrow">Handwriter</p>
      <h1>Turn handwriting into text.</h1>
      <p class="hero-copy">
        First-pass browser app with a single Draw mode. The structure is kept
        mode-oriented so upload and camera inputs can slot in later without a rewrite.
      </p>
    </section>

    <section class="layout">
      <div class="panel sidebar">
        <p class="eyebrow">Modes</p>
        <button class="mode-pill is-active" type="button">Draw</button>
        <p class="sidebar-copy">
          Future modes can reuse the same recognition/result area while swapping only
          the input controller.
        </p>

        <div class="result-card">
          <p class="eyebrow">Live result</p>
          <div class="live-result" data-role="live-result">No text yet.</div>
        </div>
      </div>

      <div class="mode-mount" data-role="mode-mount"></div>
    </section>
  </main>
`;

const liveResult = app.querySelector('[data-role="live-result"]');
const modeMount = app.querySelector('[data-role="mode-mount"]');

createDrawMode({
  mount: modeMount,
  onRecognizedTextChange(text) {
    liveResult.textContent = text || "No text yet.";
  },
});

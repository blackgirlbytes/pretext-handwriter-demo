import {
  createGoogleHandwritingSession,
  getGoogleHandwritingSupport,
} from "./googleHandwriting.js";

export function createDrawMode({ mount, onRecognizedTextChange }) {
  const state = {
    session: null,
    isDrawing: false,
    lastPointerId: null,
    lastPoint: null,
    recognizedText: "",
    alternatives: [],
  };

  mount.innerHTML = `
    <section class="panel draw-mode">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Mode</p>
          <h2>Draw</h2>
        </div>
        <button type="button" class="secondary-button" data-action="clear-canvas">
          Clear
        </button>
      </div>

      <p class="panel-copy">
        Handwrite directly in the canvas. Recognition runs through the browser's
        Google/Chromium handwriting recognizer when available.
      </p>

      <div class="status-strip" data-role="support-status">Checking browser support…</div>

      <canvas
        class="draw-surface"
        width="960"
        height="420"
        aria-label="Handwriting input area"
      ></canvas>

      <div class="recognized-output">
        <div>
          <p class="eyebrow">Recognized text</p>
          <div class="recognized-text" data-role="recognized-text">Start writing to see text here.</div>
        </div>

        <div>
          <p class="eyebrow">Alternatives</p>
          <div class="alternatives" data-role="alternatives">No alternatives yet.</div>
        </div>
      </div>
    </section>
  `;

  const canvas = mount.querySelector("canvas");
  const clearButton = mount.querySelector('[data-action="clear-canvas"]');
  const supportStatus = mount.querySelector('[data-role="support-status"]');
  const recognizedTextNode = mount.querySelector('[data-role="recognized-text"]');
  const alternativesNode = mount.querySelector('[data-role="alternatives"]');
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const bounds = {
    width: canvas.width,
    height: canvas.height,
  };

  canvas.width = bounds.width * ratio;
  canvas.height = bounds.height * ratio;
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;
  context.scale(ratio, ratio);
  resetCanvas();

  initialize();

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  clearButton.addEventListener("click", clearAll);

  function resetCanvas() {
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, bounds.width, bounds.height);

    context.strokeStyle = "#d6d3cb";
    context.lineWidth = 1;

    for (let y = 56; y < bounds.height; y += 56) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(bounds.width, y);
      context.stroke();
    }

    context.strokeStyle = "#111827";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
  }

  async function initialize() {
    const support = await getGoogleHandwritingSupport(["en"]);

    if (!support) {
      supportStatus.textContent =
        "Handwriting recognition is unavailable in this browser. Use current Chrome or Chromium on a supported platform.";
      supportStatus.dataset.state = "unsupported";
      return;
    }

    try {
      state.session = await createGoogleHandwritingSession({
        languages: ["en"],
        alternatives: 3,
        recognitionType: "text",
      });
    } catch (error) {
      supportStatus.textContent =
        error instanceof Error
          ? error.message
          : "Handwriting recognition could not be initialized in this browser.";
      supportStatus.dataset.state = "unsupported";
      return;
    }

    supportStatus.textContent =
      "Ready. Draw with a mouse, touch, or stylus to trigger browser-side handwriting recognition.";
    supportStatus.dataset.state = "ready";
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function drawLine(from, to) {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function updateRecognizedText(text, alternatives = []) {
    state.recognizedText = text || "";
    state.alternatives = alternatives;

    recognizedTextNode.textContent =
      state.recognizedText || "No text recognized yet.";
    alternativesNode.textContent =
      state.alternatives.length > 0
        ? state.alternatives.join(" | ")
        : "No alternatives yet.";

    onRecognizedTextChange(state.recognizedText);
  }

  function handlePointerDown(event) {
    if (!state.session) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const point = getCanvasPoint(event);
    state.isDrawing = true;
    state.lastPointerId = event.pointerId;
    state.lastPoint = point;
    state.session.startStroke(point, event.pointerType);
  }

  function handlePointerMove(event) {
    if (!state.isDrawing || event.pointerId !== state.lastPointerId) {
      return;
    }

    const point = getCanvasPoint(event);
    drawLine(state.lastPoint, point);
    state.lastPoint = point;
    state.session.addPoint(point);
  }

  async function handlePointerUp(event) {
    if (!state.isDrawing || event.pointerId !== state.lastPointerId) {
      return;
    }

    const point = getCanvasPoint(event);
    drawLine(state.lastPoint, point);
    state.session.addPoint(point);
    state.isDrawing = false;
    state.lastPointerId = null;
    state.lastPoint = null;

    const predictions = await state.session.endStroke();
    const [bestPrediction, ...otherPredictions] = predictions || [];

    if (!bestPrediction) {
      updateRecognizedText("", []);
      return;
    }

    updateRecognizedText(
      bestPrediction.text,
      otherPredictions.map((prediction) => prediction.text).filter(Boolean),
    );
  }

  function clearAll() {
    resetCanvas();
    updateRecognizedText("", []);
    state.session?.clear();
    state.isDrawing = false;
    state.lastPointerId = null;
    state.lastPoint = null;
  }

  return {
    destroy() {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      clearButton.removeEventListener("click", clearAll);
      state.session?.finish();
    },
  };
}

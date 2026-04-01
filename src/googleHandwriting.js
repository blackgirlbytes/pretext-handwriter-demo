export async function getGoogleHandwritingSupport(languages = ["en"]) {
  if (!("queryHandwritingRecognizerSupport" in navigator)) {
    return null;
  }

  return navigator.queryHandwritingRecognizerSupport({ languages });
}

export async function createGoogleHandwritingSession({
  languages = ["en"],
  alternatives = 3,
  recognitionType = "text",
} = {}) {
  if (!("createHandwritingRecognizer" in navigator)) {
    throw new Error(
      "This browser does not support the Chromium handwriting recognition API.",
    );
  }

  const recognizer = await navigator.createHandwritingRecognizer({ languages });
  let drawing = null;
  let activeStroke = null;

  function ensureDrawing(pointerType) {
    if (drawing) {
      return drawing;
    }

    const inputType = ["mouse", "touch", "stylus"].find(
      (type) => type === pointerType,
    );

    drawing = recognizer.startDrawing({
      recognitionType,
      inputType,
      alternatives,
    });

    return drawing;
  }

  return {
    startStroke(point, pointerType) {
      ensureDrawing(pointerType);
      activeStroke = {
        stroke: new HandwritingStroke(),
        startTime: performance.now(),
      };

      this.addPoint(point);
    },

    addPoint(point) {
      if (!activeStroke) {
        return;
      }

      activeStroke.stroke.addPoint({
        x: point.x,
        y: point.y,
        t: Math.round(performance.now() - activeStroke.startTime),
      });
    },

    async endStroke() {
      if (!drawing || !activeStroke) {
        return [];
      }

      drawing.addStroke(activeStroke.stroke);
      activeStroke = null;

      return drawing.getPrediction();
    },

    clear() {
      if (drawing) {
        drawing.clear();
        drawing = null;
      }

      activeStroke = null;
    },

    finish() {
      if (drawing) {
        drawing.clear();
        drawing = null;
      }

      recognizer.finish();
      activeStroke = null;
    },
  };
}

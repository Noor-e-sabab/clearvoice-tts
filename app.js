
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const MAX_CHARS = 1500;
const MIN_SPEED = 0.8;
const MAX_SPEED = 1.2;
const VOICES = [
  ["af_heart", "Heart · American feminine"], ["af_alloy", "Alloy · American feminine"],
  ["af_aoede", "Aoede · American feminine"], ["af_bella", "Bella · American feminine"],
  ["af_jessica", "Jessica · American feminine"], ["af_kore", "Kore · American feminine"],
  ["af_nicole", "Nicole · American feminine"], ["af_nova", "Nova · American feminine"],
  ["af_river", "River · American feminine"], ["af_sarah", "Sarah · American feminine"],
  ["af_sky", "Sky · American feminine"], ["am_adam", "Adam · American masculine"],
  ["am_echo", "Echo · American masculine"], ["am_eric", "Eric · American masculine"],
  ["am_fenrir", "Fenrir · American masculine"], ["am_liam", "Liam · American masculine"],
  ["am_michael", "Michael · American masculine"], ["am_onyx", "Onyx · American masculine"],
  ["am_puck", "Puck · American masculine"], ["am_santa", "Santa · American masculine"],
  ["bf_alice", "Alice · British feminine"], ["bf_emma", "Emma · British feminine"],
  ["bf_isabella", "Isabella · British feminine"], ["bf_lily", "Lily · British feminine"],
  ["bm_daniel", "Daniel · British masculine"], ["bm_fable", "Fable · British masculine"],
  ["bm_george", "George · British masculine"], ["bm_lewis", "Lewis · British masculine"],
];
const ALLOWED = new Set(VOICES.map(([id]) => id));
const $ = (id) => document.getElementById(id);
const el = {
  text: $("script"), count: $("character-count"), voice: $("voice"), speed: $("speed"),
  speedOut: $("speed-value"), consent: $("consent"), go: $("generate"), status: $("status"),
  bar: $("bar"), player: $("audio"), download: $("download"),
};
let objectUrl = null;
let pendingGeneration = null;
const speechWorker = new Worker(new URL('./tts-worker.js', import.meta.url), { type: 'module' });

for (const [id, name] of VOICES) el.voice.add(new Option(name, id));
el.voice.value = "af_heart";

const setStatus = (message, isError = false) => {
  el.status.textContent = message;
  el.status.classList.toggle("err", isError);
};
const characterCount = (text) => text.length;

el.text.addEventListener("input", () => {
  // maxlength is based on UTF-16 code units. Count the same way so the counter
  // and browser limit cannot disagree, including when the text contains emoji.
  el.count.textContent = `${el.text.value.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()} characters`;
});
el.speed.addEventListener("input", () => {
  el.speedOut.value = `${Number(el.speed.value).toFixed(2)}×`;
});

speechWorker.addEventListener("message", ({ data }) => {
  if (data.type === "progress") {
    el.bar.hidden = false;
    el.bar.value = data.total ? (data.loaded / data.total) * 100 : 0;
    setStatus(`Downloading speech model… ${Math.round(el.bar.value)}%. This is usually a one-time download for this browser.`);
  } else if (data.type === "synthesizing") {
    el.bar.hidden = true;
    setStatus("Preparing the full text for speech on this device…");
  } else if (data.type === "chunk") {
    el.bar.hidden = true;
    setStatus(`Generating speech on this device… part ${data.current} of ${data.total}.`);
  } else if (data.type === "complete" && pendingGeneration) {
    pendingGeneration.resolve(data.blob);
    pendingGeneration = null;
  } else if (data.type === "error" && pendingGeneration) {
    const message = data.stage === "model"
      ? "The speech model download or setup did not finish. The first download is about 92 MB plus supporting files. Check your connection, disable any blocker for this site, wait a minute if the model host is busy, then click Generate speech to retry. Keep the tab open while it downloads; the browser may reuse cached files."
      : "Speech generation stopped before finishing. Try a shorter script or close other tabs to free device memory, then generate again.";
    pendingGeneration.reject(new Error(message));
    pendingGeneration = null;
  }
});
speechWorker.addEventListener("error", () => {
  if (pendingGeneration) {
    pendingGeneration.reject(new Error("The speech worker stopped unexpectedly."));
    pendingGeneration = null;
  }
});

function generateInWorker(text, voice, speed) {
  return new Promise((resolve, reject) => {
    pendingGeneration = { resolve, reject };
    speechWorker.postMessage({ type: "generate", text, voice, speed });
  });
}

function validate() {
  if (!el.consent.checked) return "Confirm the responsible-use notice before generating speech.";
  const text = el.text.value.trim();
  if (!text) return "Enter some text before generating speech.";
  if (characterCount(text) > MAX_CHARS) return `Text must be ${MAX_CHARS.toLocaleString()} characters or fewer.`;
  if (!ALLOWED.has(el.voice.value)) return "Choose one of the available preset voices.";
  const speed = Number(el.speed.value);
  if (!Number.isFinite(speed) || speed < MIN_SPEED || speed > MAX_SPEED) return `Pace must be between ${MIN_SPEED} and ${MAX_SPEED}.`;
  return null;
}

el.go.addEventListener("click", async () => {
  const problem = validate();
  if (problem) {
    setStatus(problem, true);
    return;
  }
  const text = el.text.value.trim();
  const voice = el.voice.value;
  const speed = Number(el.speed.value);
  el.go.disabled = true;
  el.player.hidden = true;
  el.download.hidden = true;
  el.bar.hidden = true;
  setStatus("Preparing speech… first use downloads about 92 MB of model weights plus supporting files. Please keep this page open.");

  try {
    const blob = await generateInWorker(text, voice, speed);
    el.bar.hidden = true;
    if (!(blob instanceof Blob) || blob.size < 100) throw new Error("The speech engine returned an empty audio file.");
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blob);
    el.player.src = objectUrl;
    el.player.hidden = false;
    el.download.href = objectUrl;
    el.download.hidden = false;
    setStatus("Speech is ready. Use the player to listen or download your audio.");
  } catch (error) {
    console.error("Clearvoice generation error:", error);
    el.bar.hidden = true;
    setStatus(error.message || "Speech could not be generated. Please retry.", true);
  } finally {
    el.go.disabled = false;
  }
});

window.addEventListener("pagehide", () => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  speechWorker.terminate();
});





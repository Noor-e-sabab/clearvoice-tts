let modelPromise = null;
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const MODEL_REVISION = "1939ad2a8e416c0acfeecc08a694d14ef25f2231";
const MAX_CHUNK_CHARACTERS = 200;
const PAUSE_SECONDS = 0.12;

function splitTextForModel(text) {
  const chunks = [];
  let current = "";
  const tokens = text.match(/\S+\s*/gu) ?? [];
  for (const token of tokens) {
    if (token.length > MAX_CHUNK_CHARACTERS) {
      if (current.trim()) chunks.push(current.trim());
      current = "";
      let part = "";
      for (const character of token) {
        if (part.length + character.length > MAX_CHUNK_CHARACTERS) {
          chunks.push(part);
          part = "";
        }
        part += character;
      }
      current = part;
    } else if (current.length + token.length > MAX_CHUNK_CHARACTERS) {
      if (current.trim()) chunks.push(current.trim());
      current = token;
    } else {
      current += token;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function loadModel() {
  if (modelPromise) return modelPromise;
  modelPromise = Promise.all([import("kokoro-js"), import("@huggingface/transformers")]).then(
    ([{ KokoroTTS, env }, { RawAudio }]) => {
      // The ONNX runtime stays on this origin; model assets use a pinned Hub commit.
      env.wasmPaths = new URL("../ort/", self.location.href).href;
      env.remotePathTemplate = `{model}/resolve/${MODEL_REVISION}/`;
      return KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: "q8",
        device: "wasm",
        progress_callback: (progress) => {
          if (progress.status === "progress" && progress.total) {
            self.postMessage({ type: "progress", loaded: progress.loaded, total: progress.total });
          }
        },
      }).then((tts) => ({ tts, RawAudio }));
    },
  ).catch((error) => {
    modelPromise = null;
    throw error;
  });
  return modelPromise;
}

self.addEventListener("message", async ({ data }) => {
  if (data?.type !== "generate") return;
  let stage = "model";
  try {
    const { tts, RawAudio } = await loadModel();
    stage = "synthesis";
    const chunks = splitTextForModel(data.text);
    self.postMessage({ type: "synthesizing", total: chunks.length });
    const audioParts = [];
    let sampleRate = null;
    for (let index = 0; index < chunks.length; index += 1) {
      self.postMessage({ type: "chunk", current: index + 1, total: chunks.length });
      const audio = await tts.generate(chunks[index], { voice: data.voice, speed: data.speed });
      if (sampleRate === null) sampleRate = audio.sampling_rate;
      if (audio.sampling_rate !== sampleRate || !(audio.audio instanceof Float32Array)) {
        throw new Error("The speech engine returned incompatible audio chunks.");
      }
      audioParts.push(audio.audio);
    }
    const pauseSamples = Math.round(sampleRate * PAUSE_SECONDS);
    const totalSamples = audioParts.reduce((total, part) => total + part.length, 0)
      + pauseSamples * Math.max(0, audioParts.length - 1);
    const combined = new Float32Array(totalSamples);
    let offset = 0;
    audioParts.forEach((part, index) => {
      combined.set(part, offset);
      offset += part.length;
      if (index < audioParts.length - 1) offset += pauseSamples;
    });
    const blob = new RawAudio(combined, sampleRate).toBlob();
    if (!(blob instanceof Blob) || blob.size < 100) throw new Error("Empty audio response.");
    self.postMessage({ type: "complete", blob });
  } catch (error) {
    console.error("Clearvoice worker error:", error);
    self.postMessage({ type: "error", stage });
  }
});

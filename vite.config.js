import { defineConfig } from "vite";

const MODEL_REVISION = "1939ad2a8e416c0acfeecc08a694d14ef25f2231";
const pinVoiceRevision = () => ({
  name: "pin-kokoro-voice-files",
  renderChunk(code) {
    return code.replace(
      "resolve/main/voices/",
      `resolve/${MODEL_REVISION}/voices/`,
    );
  },
});

export default defineConfig({
  base: "./",
  plugins: [pinVoiceRevision()],
  worker: { format: "es", plugins: () => [pinVoiceRevision()] },
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
});

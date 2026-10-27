import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const sourceDirectory = join(process.cwd(), "node_modules", "onnxruntime-web", "dist");
const destinationDirectory = join(process.cwd(), "public", "ort");
const runtimeFiles = [
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
];

await mkdir(destinationDirectory, { recursive: true });
await Promise.all(
  runtimeFiles.map((file) =>
    copyFile(join(sourceDirectory, file), join(destinationDirectory, file)),
  ),
);

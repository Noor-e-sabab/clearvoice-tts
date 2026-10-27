# Third-party notices

Clearvoice application source is offered under the MIT License (see `LICENSE`).

Speech model: Kokoro-82M by Hexgrad; the browser-ready ONNX export is published by ONNX Community. The pinned model card identifies Apache-2.0 and lists `hexgrad/Kokoro-82M` as its base model. Clearvoice is an independent project and is not affiliated with those maintainers.

Browser runtime dependencies and their package-declared licenses:
- `kokoro-js` 1.2.1 — Apache-2.0
- `@huggingface/transformers` 3.8.1 — Apache-2.0
- `phonemizer` 1.2.1 — Apache-2.0
- `onnxruntime-web` 1.22.0-dev.20250409-89f8206ba4 and `onnxruntime-common` — MIT
- `@huggingface/jinja` 0.5.10 and `platform` 1.3.6 — MIT
- `flatbuffers` 25.9.23 and `long` 5.3.2 — Apache-2.0
- `protobufjs` 7.6.6 — BSD-3-Clause
- `guid-typescript` 1.0.9 — ISC

The model, tokenizer, and voice assets are pinned to Hugging Face commit `1939ad2a8e416c0acfeecc08a694d14ef25f2231`. Dependency versions are locked in `pnpm-lock.yaml`; the public `notices.html` links to the upstream projects and model revision. Package license identifiers were checked against the locked installed package metadata on October 27, 2026. These notices are informational and are not legal advice.

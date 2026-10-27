# Clearvoice browser release

Clearvoice is a static, browser-only text-to-speech app using Kokoro-82M through `kokoro-js` and ONNX Runtime Web. It has no application server, account system, analytics, or server-side speech endpoint. The browser downloads model files from Hugging Face and synthesizes audio locally.

## Run locally

Requirements: Node.js 22 LTS (22.12 or newer) and pnpm 10 or newer.

```powershell
cd "C:\Users\noore\Documents\Codex\2026-10-26\x20-ai-text-to-speech-web\outputs\clearvoice-browser-release"
corepack enable
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The first synthesis downloads the speech engine/model files to the browser and may take a while. The model is large; leave the tab open until speech is ready. The model and tokenizer are pinned to a fixed Hugging Face commit. If a download is interrupted, check your connection or content blocker and click Generate speech again; the browser may reuse cached files.

## Build and preview the release

```powershell
pnpm build
pnpm preview
```

Vite writes the static website to `dist/`. To preview the production build, open the URL printed by `pnpm preview`.

## Publish on Cloudflare Pages

Use Cloudflare Pages Direct Upload for this standalone static release:

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Create a **Pages** project using **Direct Upload**.
3. Upload the contents of the `dist` folder (not the project folder, `node_modules`, or `.pnpm-store`).
4. Open the resulting `*.pages.dev` address and check the home page, generation, and `/notices.html`, `/privacy.html`, and `/acceptable-use.html`.

Rebuild with `pnpm build` and upload the new `dist` contents for a later release. Direct Upload projects cannot be converted to Git integration; choose a Git-backed Pages project from the start if automatic deployments are required. Hosting quotas and policies can change; check Cloudflare's current Pages documentation before publishing.

## Release checks

- Run `pnpm build` and `pnpm audit` before each upload.
- Keep `pnpm-lock.yaml` committed and review dependency/model licenses and credits.
- Verify `dist/_headers` is present after each build. It sets the static security headers and cache policy on Cloudflare Pages.
- Test a short script on a clean browser profile and verify model loading, playback, download, consent, voice selection, pace, mobile layout, and the privacy notice.
- The app limits input to 1,500 JavaScript string code units. Voice labels describe preset accent and vocal traits; they do not verify age or identity.
- Model, tokenizer, and voice assets are pinned to Hugging Face commit 1939ad2a8e416c0acfeecc08a694d14ef25f2231. Package dependencies are locked; update the model revision deliberately and re-test before deployment.
- This is a public static site; do not enter confidential text. The site does not send text to a Clearvoice server, but the hosting and model providers can see ordinary connection metadata.

## Project files

- `app.js`, `tts-worker.js`, `style.css`, `index.html`: static client app.
- `public/`: notices, acceptable-use/privacy pages, license and Cloudflare headers.
- `vite.config.js`, `package.json`, `pnpm-lock.yaml`: reproducible build configuration.
- `dist/`: generated upload folder (not committed).

Clearvoice is independent and not affiliated with the Kokoro model authors or Hugging Face.

## Attribution and reuse

The Clearvoice application source in this repository is licensed under the MIT License. When you redistribute the source or substantial portions of it, include the copyright and permission notice from `LICENSE`. MIT does not require a visible credit inside a reused product; a visible credit is appreciated. Suggested credit: “Clearvoice by Noor E Sabab” with a link to this repository.

The Clearvoice name and logo identify this project. The source-code license does not imply endorsement by Clearvoice or grant trademark rights. Kokoro and other bundled dependencies have their own licenses; keep the third-party notices with redistributions and review them for your use.
The start, build, and preview scripts copy the two ONNX Runtime Web files from the locked npm dependency into public/ort before running Vite. Those generated runtime files are intentionally excluded from Git; this keeps the repository smaller while preserving the same deployable build.


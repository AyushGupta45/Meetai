/**
 * Postinstall script — copies @ricky0123/vad-web assets (ONNX model + ONNX Runtime
 * WASM files) to the /public directory so they're served as static files and not
 * intercepted by Next.js dynamic routes.
 */

const fs = require("fs");
const path = require("path");

const publicDir = path.resolve(__dirname, "..", "public");

// Ensure /public exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// VAD model files
const vadDir = path.resolve(
  __dirname,
  "..",
  "node_modules",
  "@ricky0123",
  "vad-web",
  "dist",
);

const vadFiles = [
  "silero_vad_legacy.onnx",
  "silero_vad_v5.onnx",
  "vad.worklet.bundle.min.js",
];

vadFiles.forEach((file) => {
  const src = path.join(vadDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
  } else {
    console.log(`  ⚠ ${file} not found at ${src}`);
  }
});

// ONNX Runtime WASM files — may be at top-level or nested inside vad-web
const ortCandidates = [
  path.resolve(__dirname, "..", "node_modules", "onnxruntime-web", "dist"),
  path.resolve(
    __dirname,
    "..",
    "node_modules",
    "@ricky0123",
    "vad-web",
    "node_modules",
    "onnxruntime-web",
    "dist",
  ),
];

const ortDir = ortCandidates.find((d) => fs.existsSync(d));

if (ortDir) {
  // Only copy the specific WASM runtime files needed
  const neededFiles = [
    "ort-wasm-simd-threaded.mjs",
    "ort-wasm-simd-threaded.wasm",
  ];

  neededFiles.forEach((file) => {
    const src = path.join(ortDir, file);
    const dest = path.join(publicDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Copied ${file}`);
    } else {
      console.log(`  ⚠ ${file} not found at ${src}`);
    }
  });
} else {
  console.log("  ⚠ onnxruntime-web dist not found in any candidate path");
}

console.log("\n✅ VAD assets copied to /public\n");

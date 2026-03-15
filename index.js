import { mkdir, readdir } from "fs/promises";
import sharp from "sharp";

await mkdir("./logos_transparent", { recursive: true });

function makePool(concurrency) {
  let active = 0;
  const queue = [];
  return function run(fn) {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        active++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            if (queue.length) queue.shift()();
          });
      };
      active < concurrency ? attempt() : queue.push(attempt);
    });
  };
}

const THRESHOLD = 30;

function isWhite(pixels, i) {
  return (
    pixels[i] >= 255 - THRESHOLD &&
    pixels[i + 1] >= 255 - THRESHOLD &&
    pixels[i + 2] >= 255 - THRESHOLD
  );
}

function floodFill(pixels, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const stack = [];

  // seed from all 4 corners
  const corners = [0, width - 1, (height - 1) * width, (height - 1) * width + (width - 1)];

  for (const corner of corners) {
    const pi = corner * channels;
    if (isWhite(pixels, pi)) stack.push(corner);
  }

  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pi = idx * channels;
    if (!isWhite(pixels, pi)) continue;

    // make transparent
    pixels[pi + 3] = 0;

    const x = idx % width;
    const y = Math.floor(idx / width);

    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }
}

async function removeWhiteBackground(inputPath, outputPath) {
  try {
    const image = sharp(inputPath).ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    const pixels = new Uint8Array(data);
    floodFill(pixels, width, height, channels);

    await sharp(Buffer.from(pixels), { raw: { width, height, channels } }).png().toFile(outputPath);

    return true;
  } catch {
    return false;
  }
}

const pool = makePool(20);
const files = (await readdir("./logos")).filter((f) => f.endsWith(".png"));

let total = 0;
let ok = 0;

await Promise.all(
  files.map((file) =>
    pool(async () => {
      const success = await removeWhiteBackground(`./logos/${file}`, `./logos_transparent/${file}`);
      if (success) ok++;
      total++;
      if (total % 500 === 0) console.log(`processed ${total}/${files.length}, ${ok} converted...`);
    }),
  ),
);

console.log(`done. ${total} images processed, ${ok} written to logos_transparent/`);

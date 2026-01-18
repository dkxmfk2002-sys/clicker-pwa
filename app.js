const TOTAL_STEPS = 100;
const SPRITE_ROWS = 3;
const SPRITE_COLS = 4;
const SPRITE_FRAMES = SPRITE_ROWS * SPRITE_COLS;
const PRUSSIAN_BLUE = [0, 49, 83];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const countEl = document.getElementById("count");
const progressEl = document.getElementById("progress");
const messageEl = document.getElementById("message");
const resetBtn = document.getElementById("reset");

let count = 0;
let milestoneIndex = 0;
let dotRadius = 10;
const dotGrowth = 2;

let spriteSheet = null;
let background = null;
let frameWidth = canvas.width;
let frameHeight = canvas.height;

function updateUi() {
  countEl.textContent = `${count} / ${TOTAL_STEPS}`;
  progressEl.value = count;
  if (count >= TOTAL_STEPS) {
    messageEl.textContent = "Complete! Reset to play again.";
  } else {
    messageEl.textContent = "Tap or press Space.";
  }
}

function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function chroma(color) {
  return Math.max(color[0], color[1], color[2]) - Math.min(color[0], color[1], color[2]);
}

function processSpriteSheet(image) {
  const offscreen = document.createElement("canvas");
  offscreen.width = image.width;
  offscreen.height = image.height;
  const offCtx = offscreen.getContext("2d");
  offCtx.drawImage(image, 0, 0);

  const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;

  const corners = [
    [data[0], data[1], data[2]],
    [data[(offscreen.width - 1) * 4], data[(offscreen.width - 1) * 4 + 1], data[(offscreen.width - 1) * 4 + 2]],
    [data[(offscreen.width * (offscreen.height - 1)) * 4], data[(offscreen.width * (offscreen.height - 1)) * 4 + 1], data[(offscreen.width * (offscreen.height - 1)) * 4 + 2]],
    [
      data[(offscreen.width * offscreen.height - 1) * 4],
      data[(offscreen.width * offscreen.height - 1) * 4 + 1],
      data[(offscreen.width * offscreen.height - 1) * 4 + 2],
    ],
  ];

  const bg = [
    Math.round((corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4),
    Math.round((corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4),
    Math.round((corners[0][2] + corners[1][2] + corners[2][2] + corners[3][2]) / 4),
  ];

  const white = [255, 255, 255];

  for (let y = 0; y < offscreen.height; y += 1) {
    for (let x = 0; x < offscreen.width; x += 1) {
      const idx = (y * offscreen.width + x) * 4;
      const color = [data[idx], data[idx + 1], data[idx + 2]];

      if (colorDistance(color, bg) < 45 || colorDistance(color, white) < 45) {
        continue;
      }

      if (chroma(color) < 25 && color[0] + color[1] + color[2] < 330) {
        const toBg = colorDistance(color, bg);
        const toWhite = colorDistance(color, white);
        const target = toBg < toWhite ? bg : white;
        data[idx] = target[0];
        data[idx + 1] = target[1];
        data[idx + 2] = target[2];
        continue;
      }

      if (chroma(color) >= 30) {
        data[idx] = PRUSSIAN_BLUE[0];
        data[idx + 1] = PRUSSIAN_BLUE[1];
        data[idx + 2] = PRUSSIAN_BLUE[2];
      }
    }
  }

  offCtx.putImageData(imageData, 0, 0);
  const processed = new Image();
  processed.src = offscreen.toDataURL("image/png");
  return processed;
}

function drawBackground() {
  if (background) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f9f2df");
    gradient.addColorStop(1, "#e3e9e1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawSpriteFrame() {
  if (!spriteSheet) {
    ctx.save();
    ctx.fillStyle = "rgba(15, 47, 76, 0.7)";
    ctx.font = "18px 'Palatino Linotype', serif";
    ctx.textAlign = "center";
    ctx.fillText("Add sprite.jpg to assets/", canvas.width / 2, canvas.height / 2);
    ctx.restore();
    return;
  }

  const stepIndex = Math.min(milestoneIndex, Math.max(TOTAL_STEPS - 1, 0));
  let frameIndex = 0;
  let alpha = 0;
  if (TOTAL_STEPS > 1) {
    const framePos = (stepIndex * (SPRITE_FRAMES - 1)) / (TOTAL_STEPS - 1);
    frameIndex = Math.floor(framePos);
    alpha = framePos - frameIndex;
  }

  const row = Math.floor(frameIndex / SPRITE_COLS);
  const col = frameIndex % SPRITE_COLS;
  const sx = col * frameWidth;
  const sy = row * frameHeight;
  const dx = Math.round((canvas.width - frameWidth) / 2);
  const dy = Math.round((canvas.height - frameHeight) / 2);

  ctx.drawImage(spriteSheet, sx, sy, frameWidth, frameHeight, dx, dy, frameWidth, frameHeight);

  if (alpha > 0 && frameIndex < SPRITE_FRAMES - 1) {
    const nextIndex = frameIndex + 1;
    const nrow = Math.floor(nextIndex / SPRITE_COLS);
    const ncol = nextIndex % SPRITE_COLS;
    const nsx = ncol * frameWidth;
    const nsy = nrow * frameHeight;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(spriteSheet, nsx, nsy, frameWidth, frameHeight, dx, dy, frameWidth, frameHeight);
    ctx.restore();
  }
}

function drawDot() {
  const x = Math.round(canvas.width / 2);
  const y = Math.round(canvas.height / 2);
  ctx.save();
  ctx.fillStyle = "#d8342f";
  ctx.beginPath();
  ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawSpriteFrame();
  drawDot();
}

function onAdvance() {
  if (count >= TOTAL_STEPS) {
    return;
  }

  count += 1;
  dotRadius = Math.min(dotRadius + dotGrowth, Math.min(frameWidth, frameHeight) / 2);
  updateUi();

  if (milestoneIndex < TOTAL_STEPS && count >= milestoneIndex + 1) {
    milestoneIndex += 1;
    drawFrame();
  }
}

function reset() {
  count = 0;
  milestoneIndex = 0;
  dotRadius = 10;
  updateUi();
  drawFrame();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function init() {
  background = await loadImage("assets/background.jpg");
  const sprite = await loadImage("assets/sprite.jpg");
  if (sprite) {
    spriteSheet = processSpriteSheet(sprite);
    await new Promise((resolve) => {
      spriteSheet.onload = resolve;
      spriteSheet.onerror = resolve;
    });
  }

  if (background) {
    canvas.width = background.width;
    canvas.height = background.height;
  }

  if (spriteSheet) {
    frameWidth = Math.floor(spriteSheet.width / SPRITE_COLS);
    frameHeight = Math.floor(spriteSheet.height / SPRITE_ROWS);
    if (!background) {
      canvas.width = frameWidth;
      canvas.height = frameHeight;
    }
  }

  updateUi();
  drawFrame();
}

canvas.addEventListener("pointerdown", onAdvance);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    onAdvance();
  }
});
resetBtn.addEventListener("click", reset);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

init();

const START_YEAR = 1841;
const END_YEAR = 1911;
const RESET_YEARS = new Set([
  1841, 1844, 1845, 1850, 1851, 1863, 1870, 1879, 1891, 1901, 1911,
]);
const BANKNOTE_SCALE = 0.1;
const MAX_BANKNOTES = 10;
const BANKNOTE_PADDING = 10;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const countEl = document.getElementById("count");
const progressEl = document.getElementById("progress");
const messageEl = document.getElementById("message");
const resetBtn = document.getElementById("reset");

let count = 0;
let milestoneIndex = 0;
let poundCount = 0;
let backgroundIndex = 0;
let currentBackground = null;
let banknoteImage = null;
let overlayImage = null;

const backgroundUrls = [];
for (let year = START_YEAR; year <= END_YEAR; year += 1) {
  backgroundUrls.push(`assets/aligned_all_fixed/${year}.png`);
}
const TOTAL_STEPS = backgroundUrls.length;

function updateUi() {
  countEl.textContent = `${count} / ${TOTAL_STEPS}`;
  progressEl.value = count;
  progressEl.max = TOTAL_STEPS;
  if (count >= TOTAL_STEPS) {
    messageEl.textContent = "Complete! Reset to play again.";
  } else {
    messageEl.textContent = "Tap or press Space.";
  }
}

function drawBackground() {
  if (currentBackground) {
    ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f9f2df");
    gradient.addColorStop(1, "#e3e9e1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawYearLabel() {
  const year = START_YEAR + backgroundIndex;
  const pad = 16;
  const x = pad;
  const y = Math.round(canvas.height / 2);
  ctx.save();
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "black";
  ctx.fillText(String(year), x + 1, y + 1);
  ctx.fillStyle = "white";
  ctx.fillText(String(year), x, y);
  ctx.restore();
}

function drawOverlay() {
  if (!overlayImage) {
    return;
  }
  const scale = 0.1;
  const width = Math.max(1, Math.floor(overlayImage.width * scale));
  const height = Math.max(1, Math.floor(overlayImage.height * scale));
  const pad = 16;
  const x = pad;
  const y = canvas.height - pad - height;
  ctx.drawImage(overlayImage, x, y, width, height);
}

function drawBanknotes() {
  if (!banknoteImage || poundCount <= 0) {
    return;
  }
  const width = Math.max(1, Math.floor(banknoteImage.width * BANKNOTE_SCALE));
  const height = Math.max(1, Math.floor(banknoteImage.height * BANKNOTE_SCALE));
  const notesToDraw = Math.min(poundCount, MAX_BANKNOTES);
  for (let index = 0; index < notesToDraw; index += 1) {
    const x = canvas.width - BANKNOTE_PADDING - index * 8;
    const y = BANKNOTE_PADDING + index * 5;
    ctx.drawImage(banknoteImage, x - width, y, width, height);
  }
}

function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawYearLabel();
  drawOverlay();
  drawBanknotes();
}

async function setBackground(index) {
  const safeIndex = Math.max(0, Math.min(index, backgroundUrls.length - 1));
  backgroundIndex = safeIndex;
  const url = backgroundUrls[safeIndex];
  const img = await loadImage(url);
  if (img) {
    currentBackground = img;
    canvas.width = img.width;
    canvas.height = img.height;
  }
}

async function onAdvance() {
  if (count >= TOTAL_STEPS) {
    return;
  }

  count += 1;
  poundCount += 1;
  updateUi();

  if (milestoneIndex < TOTAL_STEPS && count >= milestoneIndex + 1) {
    milestoneIndex += 1;
    const nextIndex = Math.min(count - 1, backgroundUrls.length - 1);
    if (nextIndex !== backgroundIndex) {
      await setBackground(nextIndex);
      const year = START_YEAR + backgroundIndex;
      if (RESET_YEARS.has(year)) {
        poundCount = 0;
      }
    }
  }

  drawFrame();
}

function reset() {
  count = 0;
  milestoneIndex = 0;
  poundCount = 0;
  backgroundIndex = 0;
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

async function loadFirstImage(paths) {
  for (const path of paths) {
    // eslint-disable-next-line no-await-in-loop
    const img = await loadImage(path);
    if (img) {
      return img;
    }
  }
  return null;
}

async function init() {
  currentBackground = await loadImage(backgroundUrls[0]);
  if (currentBackground) {
    canvas.width = currentBackground.width;
    canvas.height = currentBackground.height;
  }
  banknoteImage = await loadFirstImage([
    "assets/banknote.webp",
    "assets/FCWyaWyyWQjEUAmJYOD1U7vnPqg41Ra7iTG5H6s0afAkh5sjrzqQObWO0OXwQjwY3SvRFhG8Y4E6vkvuyHHVeA.webp",
  ]);
  overlayImage = await loadFirstImage([
    "assets/overlay.png",
    "assets/KakaoTalk_20260118_234359052.png",
  ]);

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

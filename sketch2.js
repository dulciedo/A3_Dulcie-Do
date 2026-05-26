// THREAD PAGE

// PHẦN 1: CONST / LET
// MUSIC
const MUSIC_KEY       = "bgMusicTime";
const MUSIC_MUTED_KEY = "bgMusicMuted";

let musicCtx       = null;
let musicBuffer    = null;
let musicSource    = null;
let musicStartTime = 0;
let musicOffset    = 0;
let musicReady     = false;
let musicStarted   = false;
let gainNode       = null;
let isMuted        = false;


// BACKGROUND DUST 
const BACKGROUND_DUST_DENSITY = 3500;

let dustParticlesBg = [];


// CHAR IMAGE
const CHAR_SET  = "692035184751"; 
const CHAR_STEP = 9;            // khoảng cách giữa các ký tự

let img;           
let baseImg;       // bản sao gốc để rebuild 
let charPoints = []; // mảng điểm {x, y, char, alpha} tạo thành hình


// NODES
const NODE_COUNT = 50; // số điểm

let nodes      = []; // mảng chứa Node
let redThreads = []; // mảng chứa RedThread


// GUIDE TEXT 
const GUIDE_TEXT_1 = "click and hold to cut the red threads";

// Timing
const GUIDE_TYPING_SPEED = 70;   // ms/ký tự
const GUIDE_1_DELAY      = 800;  // ms chờ sau khi vào trang mới bắt đầu gõ

// State guide typing
let guideState = {
  charCount:  0,
  lastType:   0,
  started:    false,
  startedAt:  0,
  done:       false
};

// State flicker 
let guideFlicker = {
  indices:      [],
  nextFlicker:  0,
  flickerSpeed: 2800
};


// MAIN BOX — MAIN TEXT 
const MAIN_TEXT_MESSAGES = [
  "\u201cThe red thread\u201d is what connects people to one another, and through it, memories are created for each of us...",
  "Many people believe that if this \u201cred thread\u201d is cut, the relationship between two people will completely end, and they will never meet again...",
  "So try cutting that thread\u2026"
];

// Timing 
const MAIN_TEXT_TYPING_SPEED = 55;   
const MAIN_TEXT_DELAY        = 2000; 

// State typing
let mainTextTypingState = {
  messageIndex:  0,
  charCount:     0,
  lastTypeAt:    0,
  completedAt:   null,
  finishedAll:   false,
  finishedAt:    null
};


// MAIN BOX — FINAL TEXT + NEXT BUT 
const FINAL_MAIN_TEXT      = "But even when the thread is broken, it doesn't truly disappear, it still lingers somewhere, entangled in another thread.";
const FINAL_MAIN_TEXT_DELAY = 5000; 
const NEXT_DELAY            = 2200; 

// State final text
let finalMainTextState = {
  started:     false,
  charCount:   0,
  lastTypeAt:  0,
  completed:   false,
  completedAt: null
};

let nextAlpha  = 0;    // độ trong suốt nút NEXT 
let nextAppear = null; // millis() thời điểm bắt đầu fade in NEXT


// UI ICONS 
const ICON_SIZE   = 38;
const ICON_MARGIN = 14;
const ICON_TOP    = 16;


// PHẦN 2: MUSIC
function buildMusic() {
  const savedMuted = sessionStorage.getItem(MUSIC_MUTED_KEY);
  if (savedMuted !== null) isMuted = savedMuted === "true";

  musicCtx = new (window.AudioContext || window.webkitAudioContext)();

  fetch("bgS.wav")
    .then(r => r.arrayBuffer())
    .then(buf => musicCtx.decodeAudioData(buf))
    .then(decoded => {
      musicBuffer = decoded;
      musicReady  = true;
      resumeMusic();
    })
    .catch(e => console.warn("Music load failed:", e));
}

function playMusic(fromOffset) {
  if (!musicReady || !musicCtx) return;
  if (musicSource) { try { musicSource.stop(); } catch(e) {} musicSource = null; }
  if (musicCtx.state === "suspended") musicCtx.resume();

  musicSource        = musicCtx.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop   = true;

  gainNode            = musicCtx.createGain();
  gainNode.gain.value = isMuted ? 0 : 1;
  musicSource.connect(gainNode);
  gainNode.connect(musicCtx.destination);

  musicOffset    = fromOffset % musicBuffer.duration;
  musicSource.start(0, musicOffset);
  musicStartTime = musicCtx.currentTime;
  musicStarted   = true;
}

function getMusicTime() {
  if (!musicStarted || !musicCtx) return 0;
  return (musicOffset + (musicCtx.currentTime - musicStartTime)) % musicBuffer.duration;
}

function saveMusicTime() {
  if (musicStarted) sessionStorage.setItem(MUSIC_KEY, getMusicTime().toString());
}

function resumeMusic() {
  const isNavigating = sessionStorage.getItem("isNavigating") === "true";
  sessionStorage.removeItem("isNavigating");
  let offset = 0;
  if (isNavigating) {
    const saved = sessionStorage.getItem(MUSIC_KEY);
    offset = saved ? parseFloat(saved) : 0;
  }
  playMusic(offset);
}

function setMusicMute(muted) {
  isMuted = muted;
  sessionStorage.setItem(MUSIC_MUTED_KEY, muted.toString());
  if (gainNode) gainNode.gain.setTargetAtTime(muted ? 0 : 1, musicCtx.currentTime, 0.05);
}

window.addEventListener("beforeunload", saveMusicTime);

// PHẦN 3: PAGE TRANSITION OVERLAY
function setupTransitionCSS() {
  if (document.getElementById("page-transition-style")) return;
  const style = document.createElement("style");
  style.id = "page-transition-style";
  style.textContent = `
    html, body {
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
    #page-fade-overlay {
      position: fixed; inset: 0;
      background: rgb(252,235,222);
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      transition: opacity 0.55s ease;
    }
    #page-fade-overlay.fade-in { opacity: 1; pointer-events: all; }
  `;
  document.head.appendChild(style);
  const overlay = document.createElement("div");
  overlay.id = "page-fade-overlay";
  document.body.appendChild(overlay);
}

function goViaLoading(destination) {
  saveMusicTime();
  sessionStorage.setItem("isNavigating", "true");
  sessionStorage.setItem("loadingDestination", destination);
  const overlay = document.getElementById("page-fade-overlay");
  if (!overlay) { window.location.href = "loading.html"; return; }
  overlay.style.transition = "opacity 0.55s ease";
  void overlay.offsetWidth;
  overlay.classList.add("fade-in");
  overlay.style.opacity      = "1";
  overlay.style.pointerEvents = "all";
  let navigated = false;
  const doNavigate = () => { if (navigated) return; navigated = true; window.location.href = "loading.html"; };
  overlay.addEventListener("transitionend", doNavigate, { once: true });
  setTimeout(doNavigate, 700);
}

function fadeInLoading() {
  const overlay = document.getElementById("page-fade-overlay");
  if (!overlay) return;
  overlay.style.transition    = "none";
  overlay.style.opacity       = "1";
  overlay.style.pointerEvents = "all";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition    = "opacity 0.6s ease";
      overlay.style.opacity       = "0";
      overlay.style.pointerEvents = "none";
    });
  });
}


// PHẦN 4: SETUP & DRAW
function disableSmoothing() {
  noSmooth();
  drawingContext.imageSmoothingEnabled       = false;
  drawingContext.msImageSmoothingEnabled     = false;
  drawingContext.webkitImageSmoothingEnabled = false;
}

function preload() {
  img = loadImage("img/thread.jpg");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(window.devicePixelRatio || 1);
  disableSmoothing();
  textFont("Jersey 15");
  textAlign(CENTER, CENTER);
  setupTransitionCSS();
  fadeInLoading();
  buildMusic();
  setupDustParticlesBg();

  baseImg = img.get();
  buildCharImage();
  createNodes();
  createThreads();

  mainTextTypingState.lastTypeAt = millis();
  guideState.startedAt           = millis();
}

function draw() {
  background(252, 235, 222);
  cursor(ARROW);
  drawingContext.imageSmoothingEnabled = false;

  // Nền pixel 
  updateDustParticlesBg();
  drawDustParticlesBg();

  // Hình số
  drawCharImage();

  // Sợi chỉ đỏ + nodes
  updateRedThreads();
  drawRedThreads();
  drawNodes();

  // Guide text
  updateGuide();
  drawGuide();

  // Main box
  updateMainText();
  updateFinalMainTextTyping();
  drawMainBox();

  // UI Icons
  drawUIIcons();
}

// PHẦN 5: BACKGROUND DUST
function setupDustParticlesBg() {
  dustParticlesBg = [];
  const total = max(140, floor((width * height) / BACKGROUND_DUST_DENSITY));
  for (let i = 0; i < total; i++) {
    const sizeRoll = random();
    const size =
      sizeRoll < 0.62 ? 1.5 :
      sizeRoll < 0.88 ? 3.5 :
      random(2, 4);
    const driftAngle = random(TWO_PI);
    const driftSpeed = map(size, 1, 3.4, 0.2, 0.08);
    dustParticlesBg.push({
      x: random(width), y: random(height),
      renderX: 0, renderY: 0,
      size,
      glowSize:    size * random(2.4, 4.8),
      alpha:       random(75, 185),
      driftAngle,  driftHeading: driftAngle, driftSpeed,
      vx: cos(driftAngle) * driftSpeed,
      vy: sin(driftAngle) * driftSpeed,
      turnOffset:  random(1000), turnSpeed: random(0.001, 0.0022),
      swayPhaseX:  random(TWO_PI), swayPhaseY: random(TWO_PI),
      swaySpeedX:  random(0.01, 0.03), swaySpeedY: random(0.01, 0.03),
      swayRadiusX: random(0.3, 1.8),   swayRadiusY: random(0.6, 2.8),
      alphaPhase:  random(TWO_PI), alphaSpeed: random(0.004, 0.012)
    });
  }
}

function updateDustParticlesBg() {
  const t = frameCount;
  for (let p of dustParticlesBg) {
    const targetAngle =
      p.driftAngle + map(noise(p.turnOffset, t * p.turnSpeed), 0, 1, -0.9, 0.9);
    p.driftHeading = lerpAngle(p.driftHeading, targetAngle, 0.04);
    p.vx = lerp(p.vx, cos(p.driftHeading) * p.driftSpeed, 0.09);
    p.vy = lerp(p.vy, sin(p.driftHeading) * p.driftSpeed, 0.09);
    p.x += p.vx;
    p.y += p.vy;
    p.renderX = p.x + sin(t * p.swaySpeedX + p.swayPhaseX) * p.swayRadiusX;
    p.renderY = p.y + cos(t * p.swaySpeedY + p.swayPhaseY) * p.swayRadiusY;
    const margin = p.glowSize * 0.5 + 4;
    if (p.x < -margin)             p.x = width  + margin;
    else if (p.x > width  + margin) p.x = -margin;
    if (p.y < -margin)             p.y = height + margin;
    else if (p.y > height + margin) p.y = -margin;
  }
}

function drawDustParticlesBg() {
  push();
  noStroke();
  rectMode(CENTER);
  for (let p of dustParticlesBg) {
    const alphaPulse = 0.82 + sin(frameCount * p.alphaSpeed + p.alphaPhase) * 0.18;
    fill(147, 174, 191, p.alpha * alphaPulse);
    square(floor(p.renderX), floor(p.renderY), p.size);
  }
  pop();
}

// PHẦN 6: CHAR IMAGE
// Scan ảnh gốc PIXEL ,SỐ
function buildCharImage() {
  charPoints = [];
  let srcW = baseImg.width, srcH = baseImg.height;
  let imgRatio = srcW / srcH;
  let maxW = width * 0.82, maxH = height * 0.72;
  let drawW, drawH;
  if (maxW / imgRatio <= maxH) { drawW = maxW; drawH = maxW / imgRatio; }
  else { drawH = maxH; drawW = maxH * imgRatio; }

  let resized = baseImg.get();
  resized.resize(floor(drawW), floor(drawH));
  resized.loadPixels();

  let offsetX = width  / 2 - resized.width  / 2;
  let offsetY = height / 2 - resized.height / 2 - 20;

  for (let y = 0; y < resized.height; y += CHAR_STEP) {
    for (let x = 0; x < resized.width; x += CHAR_STEP) {
      let index  = (x + y * resized.width) * 4;
      let r = resized.pixels[index],
          g = resized.pixels[index + 1],
          b = resized.pixels[index + 2];
      let bright = (r + g + b) / 3;
      if (bright < 180) {
        let randomChar = CHAR_SET[floor(random(CHAR_SET.length))];
        charPoints.push({
          x:     floor(x + offsetX),
          y:     floor(y + offsetY),
          char:  randomChar,
          alpha: map(bright, 0, 180, 160, 40)
        });
      }
    }
  }
}

// Vẽ từng điểm số lên canvas
function drawCharImage() {
  push();
  noStroke();
  textSize(9);
  textFont("monospace");
  for (let p of charPoints) {
    fill(95, 168, 194, p.alpha);
    text(p.char, p.x, p.y);
  }
  pop();
}

// PHẦN 7: NODES & RED THREADS

// Node 
// Tạo NODE_COUNT ngẫu nhiên
function createNodes() {
  nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    let randomPoint = random(charPoints);
    nodes.push(new Node(randomPoint.x, randomPoint.y));
  }
}

class Node {
  constructor(x, y) { this.x = x; this.y = y; }
  display() {
    noStroke();
    fill(95, 168, 194);
    circle(this.x, this.y, 3.5);
  }
}

// RedThread 
// Tạo các sợi chỉ đỏ nối ngẫu nhiên
function createThreads() {
  redThreads = [];
  for (let i = 0; i < nodes.length; i++) {
    let a = nodes[i];
    for (let k = 0; k < 1; k++) {
      let b = random(nodes);
      if (a !== b) {
        redThreads.push(new RedThread(a, b, 0));
        redThreads.push(new RedThread(a, b, 1));
        redThreads.push(new RedThread(a, b, 2));
      }
    }
  }
}

class RedThread {
  constructor(a, b, type) {
    this.a = a; this.b = b; this.type = type;
    this.breakable    = random() < 0.35; // 35% sợi có thể cắt
    this.broken       = false;
    this.wave         = 0;
    this.waveTarget   = 0;
    this.dragOffset   = 0;
    this.fallOffset   = 0;
    this.fallVelocity = 0;
    this.seed         = random(1000);
    this.cutPoint     = random(0.2, 0.8); // vị trí cắt
  }

  update() {
    let mx = (this.a.x + this.b.x) * 0.5;
    let my = (this.a.y + this.b.y) * 0.5;
    let d  = dist(mouseX, mouseY, mx, my);

    // Interact khi chuột gần
    this.waveTarget = d < 120 ? map(d, 0, 120, 18, 0) : 0;
    this.wave = lerp(this.wave, this.waveTarget, 0.12);

    // Kéo giãn khi giữ chuột
    if (mouseIsPressed && d < 80 && !this.broken) {
      this.dragOffset = lerp(this.dragOffset, 70, 0.15);
    } else {
      this.dragOffset = lerp(this.dragOffset, 0, 0.06);
    }

    // Cắt đứt khi kéo
    if (this.breakable && this.dragOffset > 55 && !this.broken) {
      this.broken       = true;
      this.fallOffset   = 0;
      this.fallVelocity = random(1, 2.5);
    }

    // Rơi sau khi đứt
    if (this.broken) {
      this.fallVelocity += 0.08;
      this.fallOffset   += this.fallVelocity;
    }
  }

  display() {
    stroke(160, 37, 52);
    strokeWeight(0.45);
    noFill();
    let ax = this.a.x, ay = this.a.y;
    let bx = this.b.x, by = this.b.y;
    let mx = (ax + bx) * 0.5, my = (ay + by) * 0.5;
    let wave = sin(frameCount * 0.12 + this.seed) * this.wave;
    let drag = this.dragOffset;

    if (!this.broken) {
      // 3 đường cong khác nhau
      if      (this.type === 0) bezier(ax, ay, mx, my + wave + drag*0.2, mx, my - wave + drag*0.2, bx, by);
      else if (this.type === 1) bezier(ax, ay, mx, my - 20 + wave + drag, mx, my + 20 - wave + drag, bx, by);
      else                      bezier(ax, ay, mx, my + 45 + wave + drag, mx, my + 45 - wave + drag, bx, by);
    } else {
      // 2 đoạn rơi sau khi đứt
      let cutT    = this.cutPoint;
      let cutX    = lerp(ax, bx, cutT);
      let cutY    = lerp(ay, by, cutT);
      let leftLen  = dist(ax, ay, cutX, cutY);
      let rightLen = dist(cutX, cutY, bx, by);
      let leftSag  = min(leftLen  * 0.9, this.fallOffset);
      let rightSag = min(rightLen * 0.9, this.fallOffset);
      bezier(ax, ay, ax, ay + leftSag*0.5, cutX - leftLen*0.15, cutY + leftSag, cutX, cutY + leftSag);
      bezier(cutX, cutY + rightSag, cutX + rightLen*0.15, cutY + rightSag, bx, by + rightSag*0.5, bx, by);
    }
  }
}

function updateRedThreads() { for (let t of redThreads) t.update(); }
function drawRedThreads()   { for (let t of redThreads) t.display(); }
function drawNodes()        { for (let n of nodes) n.display(); }


// PHẦN 8: GUIDE TEXT
function updateGuide() {
  if (guideState.done) { tickGuideFlicker(GUIDE_TEXT_1, millis()); return; }
  const now = millis();
  if (!guideState.started) {
    if (now - guideState.startedAt > GUIDE_1_DELAY) {
      guideState.started  = true;
      guideState.lastType = now;
    }
    return;
  }
  if (now - guideState.lastType >= GUIDE_TYPING_SPEED) {
    guideState.charCount++;
    guideState.lastType = now;
    if (guideState.charCount >= GUIDE_TEXT_1.length) {
      guideState.charCount     = GUIDE_TEXT_1.length;
      guideState.done          = true;
      guideFlicker.nextFlicker = now + guideFlicker.flickerSpeed;
    }
  }
}

// Nhấp nháy ngẫu nhiên
function tickGuideFlicker(fullText, now) {
  if (now < guideFlicker.nextFlicker) return;
  const count = floor(random(1, 3));
  guideFlicker.indices = [];
  for (let i = 0; i < count; i++) guideFlicker.indices.push(floor(random(fullText.length)));
  guideFlicker.nextFlicker = now + guideFlicker.flickerSpeed + random(-400, 400);
}

// Guide text 
function drawGuide() {
  if (!guideState.started || guideState.charCount === 0) return;
  push();
  textFont("Jersey 15");
  textAlign(CENTER, CENTER);
  textSize(18);
  noStroke();
  const now          = millis();
  const fullText     = GUIDE_TEXT_1;
  const displayCount = guideState.charCount;

  let totalW = 0;
  for (let i = 0; i < displayCount; i++) totalW += textWidth(fullText[i]);
  let startX = width / 2 - totalW / 2;

  for (let i = 0; i < displayCount; i++) {
    const isFlickering = guideFlicker.indices.includes(i);
    const flickerPhase = sin(now * 0.012 + i * 0.8);
    const baseAlpha    = isFlickering ? map(flickerPhase, -1, 1, 80, 200) : 255;
    fill(125, 32, 39, baseAlpha);
    const cw = textWidth(fullText[i]);
    text(fullText[i], floor(startX + cw / 2), 36);
    startX += cw;
  }
  pop();
}


// ██ PHẦN 9 — MAIN BOX
// Đếm số dòng khi wrap text
function countMainTextLines(str, maxW) {
  if (!str || str.length === 0) return 1;
  const words  = str.split(" ");
  const spaceW = textWidth(" ");
  let lines = 1, cur = 0;
  for (let word of words) {
    const ww = textWidth(word);
    if (cur > 0 && cur + spaceW + ww > maxW) { lines++; cur = ww; }
    else cur += (cur > 0 ? spaceW : 0) + ww;
  }
  return lines;
}

// Update main text typing
function updateMainText() {
  const now = millis();
  if (mainTextTypingState.finishedAll) return;

  const currentMessage = MAIN_TEXT_MESSAGES[mainTextTypingState.messageIndex];

  if (mainTextTypingState.charCount < currentMessage.length) {
    const elapsed = now - mainTextTypingState.lastTypeAt;
    if (elapsed >= MAIN_TEXT_TYPING_SPEED) {
      const steps = floor(elapsed / MAIN_TEXT_TYPING_SPEED);
      mainTextTypingState.charCount    = min(currentMessage.length, mainTextTypingState.charCount + steps);
      mainTextTypingState.lastTypeAt  += steps * MAIN_TEXT_TYPING_SPEED;
      if (mainTextTypingState.charCount === currentMessage.length)
        mainTextTypingState.completedAt = now;
    }
    return;
  }

  if (mainTextTypingState.completedAt !== null &&
      now - mainTextTypingState.completedAt > MAIN_TEXT_DELAY) {
    if (mainTextTypingState.messageIndex < MAIN_TEXT_MESSAGES.length - 1) {
      mainTextTypingState.messageIndex++;
      mainTextTypingState.charCount    = 0;
      mainTextTypingState.lastTypeAt   = now;
      mainTextTypingState.completedAt  = null;
    } else {
      mainTextTypingState.finishedAll = true;
      mainTextTypingState.finishedAt  = now;
    }
  }
}

// Update final main text typing
// Gõ FINAL_MAIN_TEXT sau FINAL_MAIN_TEXT_DELAY
function updateFinalMainTextTyping() {
  if (!mainTextTypingState.finishedAll) return;
  if (finalMainTextState.completed) return;

  const now = millis();

  if (!finalMainTextState.started) {
    if (now - mainTextTypingState.finishedAt > FINAL_MAIN_TEXT_DELAY) {
      finalMainTextState.started    = true;
      finalMainTextState.lastTypeAt = now;
    }
    return;
  }

  if (now - finalMainTextState.lastTypeAt >= MAIN_TEXT_TYPING_SPEED) {
    finalMainTextState.charCount++;
    finalMainTextState.lastTypeAt = now;
    if (finalMainTextState.charCount >= FINAL_MAIN_TEXT.length) {
      finalMainTextState.charCount   = FINAL_MAIN_TEXT.length;
      finalMainTextState.completed   = true;
      finalMainTextState.completedAt = now;
      nextAppear = now + NEXT_DELAY;
    }
  }
}

// Vẽ toàn bộ Main Box
function drawMainBox() {
  const boxW = min(width * 0.78, 820);
  const x    = width / 2 - boxW / 2;
  const padV = 16;

  // Chiều rộng vùng text
  const textAreaW = nextAlpha > 0 ? boxW - 100 - 56 - 16 : boxW - 56;

  textFont("Jersey 15");
  textSize(20);
  const lineH = 20 * 1.4;

  // Text đang hiển thị
  const typed = !finalMainTextState.started
    ? MAIN_TEXT_MESSAGES[mainTextTypingState.messageIndex].slice(0, mainTextTypingState.charCount)
    : FINAL_MAIN_TEXT.slice(0, finalMainTextState.charCount);

  const lines = max(1, countMainTextLines(typed, textAreaW));
  const boxH  = lines * lineH + padV * 2;
  const y     = height - 40 - boxH;

  // Tọa độ next but
  const nextButW = 100, nextButH = 40;
  const nextButX = x + boxW - nextButW / 2 - 16;
  const nextButY = y + boxH / 2;

  // Fade in nút NEXT
  if (nextAppear !== null) {
    const now = millis();
    if (now >= nextAppear) nextAlpha = min(255, nextAlpha + 5);
  }

  // Hover cursor next but
  if (nextAlpha > 200) {
    const hoverNextBut =
      mouseX >= nextButX - nextButW / 2 && mouseX <= nextButX + nextButW / 2 &&
      mouseY >= nextButY - nextButH / 2 && mouseY <= nextButY + nextButH / 2;
    if (hoverNextBut) cursor(HAND);
  }

  push();

  // Khung main box
  fill(252, 235, 222);
  stroke(95, 168, 194);
  strokeWeight(1.5);
  rect(floor(x), floor(y), boxW, boxH, 6);

  // Tag box 
  noStroke();
  fill(95, 168, 194);
  rect(floor(x) + 18, floor(y) - 18, 90, 28, 5);
  fill(125, 32, 39);
  textAlign(CENTER, CENTER);
  textFont("Jersey 15");
  textSize(22);
  text("Thread", floor(x) + 63, floor(y) - 4);

  // Main text / Final text
  fill(125, 32, 39);
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Jersey 15");
  textSize(20);
  text(typed, floor(x) + 28, floor(y) + boxH / 2, textAreaW);

  // Next but
  if (nextAlpha > 0) {
    fill(153, 148, 54, nextAlpha);
    noStroke();
    rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), nextButW, nextButH, 6);
    fill(125, 32, 39, nextAlpha);
    textAlign(CENTER, CENTER);
    textFont("Jersey 15");
    textSize(28);
    text("NEXT", floor(nextButX), floor(nextButY) - 1);
  }

  pop();
}


// PHẦN 10: UI ICONS
function getIconRects() {
  const musicX = width - ICON_MARGIN - ICON_SIZE / 2;
  const camX   = width - ICON_MARGIN - ICON_SIZE - ICON_MARGIN - ICON_SIZE / 2;
  const iconY  = ICON_TOP + ICON_SIZE / 2;
  return {
    music: { x: musicX, y: iconY },
    cam:   { x: camX,   y: iconY }
  };
}

function drawUIIcons() {
  const icons = getIconRects();

  const hoverCam   = mouseX >= icons.cam.x   - ICON_SIZE/2 && mouseX <= icons.cam.x   + ICON_SIZE/2 && mouseY >= icons.cam.y   - ICON_SIZE/2 && mouseY <= icons.cam.y   + ICON_SIZE/2;
  const hoverMusic = mouseX >= icons.music.x - ICON_SIZE/2 && mouseX <= icons.music.x + ICON_SIZE/2 && mouseY >= icons.music.y - ICON_SIZE/2 && mouseY <= icons.music.y + ICON_SIZE/2;
  if (hoverCam || hoverMusic) cursor(HAND);

  push();
  rectMode(CENTER);

  // Icon camera
  stroke(95, 168, 194); strokeWeight(1.5); fill(252, 235, 222);
  rect(floor(icons.cam.x), floor(icons.cam.y), ICON_SIZE, ICON_SIZE, 6);
  let camX = floor(icons.cam.x), camY = floor(icons.cam.y) + 2;
  noFill(); stroke(125, 32, 39); strokeWeight(1.4);
  rectMode(CENTER);
  rect(camX, camY, 20, 14, 2);
  circle(camX, camY, 8);
  noFill(); stroke(125, 32, 39);
  rect(camX - 4, camY - 9, 8, 4, 1);

  // Icon music
  stroke(95, 168, 194); strokeWeight(1.5); fill(252, 235, 222);
  rectMode(CENTER);
  rect(floor(icons.music.x), floor(icons.music.y), ICON_SIZE, ICON_SIZE, 6);
  let musicX = floor(icons.music.x) - 5, musicY = floor(icons.music.y);
  noFill(); stroke(125, 32, 39); strokeWeight(1.4);
  beginShape();
  vertex(musicX-5, musicY-4); vertex(musicX, musicY-4); vertex(musicX+5, musicY-8);
  vertex(musicX+5, musicY+8); vertex(musicX, musicY+4); vertex(musicX-5, musicY+4);
  endShape(CLOSE);
  if (!isMuted) {
    noFill(); stroke(125, 32, 39); strokeWeight(1.2);
    arc(musicX+9, musicY, 8,  12, -PI*0.5, PI*0.5);
    arc(musicX+9, musicY, 14, 20, -PI*0.5, PI*0.5);
  } else {
    stroke(95, 168, 194); strokeWeight(1.8);
    line(musicX+7, musicY-7, musicX+14, musicY+7);
    line(musicX+14, musicY-7, musicX+7, musicY+7);
  }
  pop();
}

function saveScreenshot() {
  saveCanvas("screenshot_" + day() + "_" + hour() + minute() + second(), "png");
}


// PHẦN 11: MOUSE EVENTS
function mousePressed() {
  // Click icon camera / music
  const icons = getIconRects();
  if (mouseX >= icons.cam.x   - ICON_SIZE/2 && mouseX <= icons.cam.x   + ICON_SIZE/2 &&
      mouseY >= icons.cam.y   - ICON_SIZE/2 && mouseY <= icons.cam.y   + ICON_SIZE/2) {
    saveScreenshot(); return;
  }
  if (mouseX >= icons.music.x - ICON_SIZE/2 && mouseX <= icons.music.x + ICON_SIZE/2 &&
      mouseY >= icons.music.y - ICON_SIZE/2 && mouseY <= icons.music.y + ICON_SIZE/2) {
    setMusicMute(!isMuted); return;
  }

  // Click nút NEXT → chuyển sang sketch3
  if (nextAlpha > 200) {
    const boxW      = min(width * 0.78, 820);
    const x         = width / 2 - boxW / 2;
    const padV      = 16;
    textFont("Jersey 15");
    textSize(20);
    const textAreaW = boxW - 100 - 56 - 16;
    const lineH     = 20 * 1.4;
    const typed     = FINAL_MAIN_TEXT.slice(0, finalMainTextState.charCount);
    const lines     = max(1, countMainTextLines(typed, textAreaW));
    const boxH      = lines * lineH + padV * 2;
    const y         = height - 40 - boxH;
    const nextButW  = 100, nextButH = 40;
    const nextButX  = x + boxW - nextButW / 2 - 16;
    const nextButY  = y + boxH / 2;
    if (mouseX >= nextButX - nextButW/2 && mouseX <= nextButX + nextButW/2 &&
        mouseY >= nextButY - nextButH/2 && mouseY <= nextButY + nextButH/2) {
      goViaLoading("sketch3.html"); return;
    }
  }
}


// PHẦN 12: UTILITIES
function lerpAngle(start, end, amt) {
  let diff = ((end - start + PI) % TWO_PI) - PI;
  if (diff < -PI) diff += TWO_PI;
  return start + diff * amt;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  disableSmoothing();
  setupDustParticlesBg();
  charPoints = []; nodes = []; redThreads = [];
  buildCharImage();
  createNodes();
  createThreads();
}
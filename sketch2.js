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
const BACKGROUND_DUST_DENSITY = 7000;

let dustParticlesBg = [];


// CHAR IMAGE
const CHAR_SET  = "692035184751";
const CHAR_STEP = 8;

let img;
let baseImg;
let charPoints = [];


// NODES
const NODE_COUNT = 80;

let nodes      = [];
let redThreads = [];


// GUIDE TEXT 
const GUIDE_TEXT_1 = "click and hold to cut the red threads";

const GUIDE_TYPING_SPEED = 70;
const GUIDE_1_DELAY      = 800;

let guideState = {
  charCount:  0,
  lastType:   0,
  started:    false,
  startedAt:  0,
  done:       false
};

let guideFlicker = {
  indices:      [],
  nextFlicker:  0,
  flickerSpeed: 2800
};


// MAIN BOX 
const MAIN_TEXT_MESSAGES = [
  "\u201cThe red thread\u201d is what connects people to one another, and through it, memories are created for each of us...",
  "Many people believe that if this \u201cred thread\u201d is cut, the relationship between two people will completely end, and they will never meet again...",
  "So try cutting that thread\u2026"
];

const MAIN_TEXT_TYPING_SPEED = 55;
const MAIN_TEXT_DELAY        = 2000;

let mainTextTypingState = {
  messageIndex:  0,
  charCount:     0,
  lastTypeAt:    0,
  completedAt:   null,
  finishedAll:   false,
  finishedAt:    null
};


// FINAL TEXT + NEXT BUT
const FINAL_MAIN_TEXT       = "But even when the thread is broken, it doesn't truly disappear, it still lingers somewhere, entangled in another thread.";
const FINAL_MAIN_TEXT_DELAY = 5000;
const NEXT_DELAY            = 2200;

let finalMainTextState = {
  started:     false,
  charCount:   0,
  lastTypeAt:  0,
  completed:   false,
  completedAt: null
};

let nextAlpha  = 0;
let nextAppear = null;


// UI ICONS
const ICON_SIZE   = 60;
const ICON_MARGIN = 18;
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

  updateDustParticlesBg();
  drawDustParticlesBg();

  drawCharImage();

  updateRedThreads();
  drawRedThreads();
  drawNodes();

  updateGuide();
  drawGuide();

  updateMainText();
  updateFinalMainTextTyping();
  drawMainBox();

  drawUIIcons();
}

// PHẦN 5: BACKGROUND DUST 
function setupDustParticlesBg() {
  dustParticlesBg = [];
  const total = max(80, floor((width * height) / BACKGROUND_DUST_DENSITY));
  for (let i = 0; i < total; i++) {
    const sizeRoll = random();
    const size =
      sizeRoll < 0.62 ? 3 :
      sizeRoll < 0.88 ? 7 :
      random(4, 8);
    const driftAngle = random(TWO_PI);
    const driftSpeed = map(size, 2, 8, 0.12, 0.05);
    dustParticlesBg.push({
      x: random(width), y: random(height),
      renderX: 0, renderY: 0,
      size,
      glowSize:    size * random(2.4, 4.8),
      alpha:       random(75, 185),
      driftAngle,  driftHeading: driftAngle, driftSpeed,
      vx: cos(driftAngle) * driftSpeed,
      vy: sin(driftAngle) * driftSpeed,
      turnOffset:  random(1000), turnSpeed: random(0.0005, 0.0015),
      swayPhaseX:  random(TWO_PI), swayPhaseY: random(TWO_PI),
      swaySpeedX:  random(0.006, 0.018), swaySpeedY: random(0.006, 0.018),
      swayRadiusX: random(0.2, 0.8),   swayRadiusY: random(0.3, 1.2),
      alphaPhase:  random(TWO_PI), alphaSpeed: random(0.002, 0.006)
    });
  }
}

function updateDustParticlesBg() {
  const t = frameCount;
  for (let p of dustParticlesBg) {
    const targetAngle =
      p.driftAngle + map(noise(p.turnOffset, t * p.turnSpeed), 0, 1, -0.9, 0.9);
    p.driftHeading = lerpAngle(p.driftHeading, targetAngle, 0.02);
    p.vx = lerp(p.vx, cos(p.driftHeading) * p.driftSpeed, 0.06);
    p.vy = lerp(p.vy, sin(p.driftHeading) * p.driftSpeed, 0.06);
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

function drawCharImage() {
  push();
  noStroke();
  textSize(9);
  textFont("monospace");
  for (let p of charPoints) {
    fill(34, 103, 119, p.alpha);
    text(p.char, p.x, p.y);
  }
  pop();
}

// PHẦN 7: NODES & RED THREADS
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
    circle(this.x, this.y, 4);
  }
}

function createThreads() {
  redThreads = [];
  for (let i = 0; i < nodes.length; i++) {
    let a = nodes[i];
    for (let k = 0; k < 1; k++) {
      let b = random(nodes);
      if (a !== b) {
        redThreads.push(new RedThread(a, b, 0));
        redThreads.push(new RedThread(a, b, 1));
      }
    }
  }
}

class RedThread {
  constructor(a, b, type) {
    this.a = a; this.b = b; this.type = type;
    this.breakable    = random() < 0.35;
    this.broken       = false;
    this.wave         = 0;
    this.waveTarget   = 0;
    this.dragOffset   = 0;
    this.fallOffset   = 0;
    this.fallVelocity = 0;
    this.seed         = random(1000);
    this.cutPoint     = random(0.2, 0.8);

    // Cache midpoint để tránh tính lại mỗi frame
    this._mx = (a.x + b.x) * 0.5;
    this._my = (a.y + b.y) * 0.5;
  }

  update() {
    const mx = this._mx;
    const my = this._my;
    const dx = mouseX - mx;
    const dy = mouseY - my;
    const distSq = dx * dx + dy * dy;

    // Vùng hover mouse
    if (distSq < 32400) {
      const d = sqrt(distSq);
      this.waveTarget = d < 180 ? map(d, 0, 180, 60, 0) : 0;

      if (mouseIsPressed && distSq < 12100 && !this.broken) {
        this.dragOffset = lerp(this.dragOffset, 90, 0.22);
      } else {
        this.dragOffset = lerp(this.dragOffset, 0, 0.06);
      }
    } else {
      this.waveTarget = 0;
      // Khi xa chuột
      if (this.dragOffset > 0.1) this.dragOffset = lerp(this.dragOffset, 0, 0.06);
    }

    this.wave = lerp(this.wave, this.waveTarget, 0.18);

    if (this.breakable && this.dragOffset > 42 && !this.broken) {
      this.broken       = true;
      this.fallOffset   = 0;
      this.fallVelocity = random(10.5, 12.5);
    }

    if (this.broken) {
      this.fallVelocity += 0.75;
      this.fallOffset   += this.fallVelocity;
    }
  }

  display() {
    // Threads màu 
    stroke(190, 80, 90, 110);
    strokeWeight(2);
    noFill();
    let ax = this.a.x, ay = this.a.y;
    let bx = this.b.x, by = this.b.y;
    let mx = this._mx, my = this._my;
    let wave = sin(frameCount * 0.12 + this.seed) * this.wave;
    let drag = this.dragOffset;

    if (!this.broken) {
      if      (this.type === 0) bezier(ax, ay, mx, my + wave + drag*0.2, mx, my - wave + drag*0.2, bx, by);
      else if (this.type === 1) bezier(ax, ay, mx, my - 20 + wave + drag, mx, my + 20 - wave + drag, bx, by);
      else                      bezier(ax, ay, mx, my + 45 + wave + drag, mx, my + 45 - wave + drag, bx, by);
    } else {
      let cutT    = this.cutPoint;
      let cutX    = lerp(ax, bx, cutT);
      let cutY    = lerp(ay, by, cutT);
      let leftLen  = dist(ax, ay, cutX, cutY);
      let rightLen = dist(cutX, cutY, bx, by);
      let leftSag  = min(leftLen  * 1.4, this.fallOffset);
      let rightSag = min(rightLen * 1.4, this.fallOffset);
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

function tickGuideFlicker(fullText, now) {
  if (now < guideFlicker.nextFlicker) return;
  const count = floor(random(1, 3));
  guideFlicker.indices = [];
  for (let i = 0; i < count; i++) guideFlicker.indices.push(floor(random(fullText.length)));
  guideFlicker.nextFlicker = now + guideFlicker.flickerSpeed + random(-400, 400);
}

function drawGuide() {
  if (!guideState.started || guideState.charCount === 0) return;
  push();
  textFont("Jersey 15");
  textAlign(CENTER, CENTER);
  textSize(35);   
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
    text(fullText[i], floor(startX + cw / 2), 42);
    startX += cw;
  }
  pop();
}


// PHẦN 9: MAIN BOX
function getMainBoxLayout() {
  const BOX_W_FACTOR = 0.95;
  const TEXT_SIZE    = 37;
  const LINE_H       = TEXT_SIZE * 1.35;
  const PAD_V        = 28;
  const NEXT_W       = 190;
  const NEXT_H       = 76;

  const boxW      = min(width * BOX_W_FACTOR, 1500);
  const x         = width / 2 - boxW / 2;
  const hasNext   = nextAlpha > 0;
  const textAreaW = hasNext ? boxW - NEXT_W - 68 - 20 : boxW - 68;

  textFont("Jersey 15");
  textSize(TEXT_SIZE);

  const typed = !finalMainTextState.started
    ? MAIN_TEXT_MESSAGES[mainTextTypingState.messageIndex].slice(0, mainTextTypingState.charCount)
    : FINAL_MAIN_TEXT.slice(0, finalMainTextState.charCount);

  const lines = max(1, countMainTextLines(typed, textAreaW));
  const boxH  = lines * LINE_H + PAD_V * 2;
  const y     = height - 48 - boxH;

  const nextButX = x + boxW - NEXT_W / 2 - 20;
  const nextButY = y + boxH / 2;

  return {
    boxW, boxH, x, y,
    textAreaW, typed, TEXT_SIZE, LINE_H, PAD_V,
    NEXT_W, NEXT_H,
    nextButX, nextButY
  };
}

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

function drawMainBox() {
  const L = getMainBoxLayout();
  const { boxW, boxH, x, y, textAreaW, typed,
          nextButX, nextButY, NEXT_W, NEXT_H } = L;

  if (nextAppear !== null) {
    const now = millis();
    if (now >= nextAppear) nextAlpha = min(255, nextAlpha + 5);
  }

  if (nextAlpha > 200) {
    const hoverNextBut =
      mouseX >= nextButX - NEXT_W / 2 && mouseX <= nextButX + NEXT_W / 2 &&
      mouseY >= nextButY - NEXT_H / 2 && mouseY <= nextButY + NEXT_H / 2;
    if (hoverNextBut) cursor(HAND);
  }

  push();

  fill(252, 235, 222);
  stroke(95, 168, 194);
  strokeWeight(3);
  rect(floor(x), floor(y), boxW, boxH, 8);

  // Tag 
  const TAG_W = 180, TAG_H = 58;
  const tagX  = floor(x) + 18;
  const tagCX = tagX + TAG_W / 2;
  noStroke();
  fill(95, 168, 194);
  rect(tagX, floor(y) - 28, TAG_W, TAG_H, 8);
  fill(125, 32, 39);
  textAlign(CENTER, CENTER);
  textFont("Jersey 15");
  textSize(45);
  text("Thread", tagCX, floor(y) - 28 + TAG_H / 2);

  fill(125, 32, 39);
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Jersey 15");
  textSize(L.TEXT_SIZE);
  text(typed, floor(x) + 32, floor(y) + boxH / 2, textAreaW);

  if (nextAlpha > 0) {
    fill(153, 148, 54, nextAlpha);
    noStroke();
    rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), NEXT_W, NEXT_H, 6);
    fill(125, 32, 39, nextAlpha);
    textAlign(CENTER, CENTER);
    textFont("Jersey 15");
    textSize(54);
    text("NEXT", floor(nextButX), floor(nextButY) - 1);
  }

  pop();
}


// PHẦN 10: UI ICONS — size 60, khớp với orbitals
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

  stroke(95, 168, 194); strokeWeight(2.5); fill(252, 235, 222);
  rect(floor(icons.cam.x), floor(icons.cam.y), ICON_SIZE, ICON_SIZE, 6);
  let camX = floor(icons.cam.x), camY = floor(icons.cam.y) + 2;
  noFill(); stroke(125, 32, 39); strokeWeight(2.3);
  rectMode(CENTER);
  rect(camX, camY, 32, 22, 5); //thân máy
  circle(camX, camY, 14); //ống kính
  noFill(); stroke(127, 34, 41);
  rect(camX -  8, camY - 14, 13, 7, 3);

  stroke(95, 168, 194); strokeWeight(2.5); fill(252, 235, 222);
  rectMode(CENTER);
  rect(floor(icons.music.x), floor(icons.music.y), ICON_SIZE, ICON_SIZE, 6);
  let musicX = floor(icons.music.x) - 5, musicY = floor(icons.music.y);
  noFill(); stroke(125, 32, 39); strokeWeight(2.3);
  beginShape();
  vertex(musicX-8, musicY-6);
  vertex(musicX,   musicY-6);
  vertex(musicX+8, musicY-12);
  vertex(musicX+8, musicY+12);
  vertex(musicX,   musicY+6);
  vertex(musicX-8, musicY+6);
  endShape(CLOSE);
  if (!isMuted) {
    //sóng âm
    noFill(); stroke(125, 32, 39); strokeWeight(2.3);
    arc(musicX+13, musicY, 12, 18, -PI*0.5, PI*0.5);
    arc(musicX+13, musicY, 20, 28, -PI*0.5, PI*0.5);
  } else {
    // X câm
    stroke(95, 168, 194); strokeWeight(2.3);
    line(musicX+10, musicY-10, musicX+20, musicY+10);
    line(musicX+20, musicY-10, musicX+10, musicY+10);
  }
  pop();
}

function saveScreenshot() {
  saveCanvas("screenshot_" + day() + "_" + hour() + minute() + second(), "png");
}


// PHẦN 11: MOUSE EVENTS
function mousePressed() {
  const icons = getIconRects();
  if (mouseX >= icons.cam.x   - ICON_SIZE/2 && mouseX <= icons.cam.x   + ICON_SIZE/2 &&
      mouseY >= icons.cam.y   - ICON_SIZE/2 && mouseY <= icons.cam.y   + ICON_SIZE/2) {
    saveScreenshot(); return;
  }
  if (mouseX >= icons.music.x - ICON_SIZE/2 && mouseX <= icons.music.x + ICON_SIZE/2 &&
      mouseY >= icons.music.y - ICON_SIZE/2 && mouseY <= icons.music.y + ICON_SIZE/2) {
    setMusicMute(!isMuted); return;
  }

  if (nextAlpha > 200) {
    const L = getMainBoxLayout();
    if (mouseX >= L.nextButX - L.NEXT_W / 2 && mouseX <= L.nextButX + L.NEXT_W / 2 &&
        mouseY >= L.nextButY - L.NEXT_H / 2 && mouseY <= L.nextButY + L.NEXT_H / 2) {
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

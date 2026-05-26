// TABS PAGE

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


// TABS
// Tab Messenger
const TEXT_BOX_W     = 210;  
const TEXT_BOX_MIN_H = 110;  

// Tab Image
const IMG_BOX_MIN_W = 170; 
const IMG_BOX_MAX_W = 230;  
const IMG_BOX_MIN_H = 150;
const IMG_BOX_MAX_H = 230;  

// Title bar
const TITLEBAR_HEIGHT = 26;  
const BUTTON_SIZE     = 15;  
const BUTTON_GAP      = 4;   
const TITLE_SIZE      = 17;  
const CHAT_SIZE       = 13;  

// — Màu sắc tab —
const MESSENGER_BAR_COLOR  = [95, 168, 194];  
const IMG_BAR_COLOR        = [125, 32, 39];   
const IMG_TITLE_TEXT_COLOR = [95, 168, 194];  

let messages = [
  ["ban an com chuaa?",        "minh chuaaa"  ],
  ["u looked cute today btw",  "tks... :3"    ],
  ["u online but no reply?",   "seen"         ],
  ["will u be my girlfriend...", "i..."       ],
  ["E chi tao lam bai nay coi", "bai nao?"   ],
];

let tabImgs = [];
let tabs = [];


// GUIDE TEXT 
const GUIDE_TEXT = "click anywhere to reveal the memories";

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
  "Messages? or images? things that always stay deep inside your devices...",
  "Things you forget even though you hold it in your hands every day...",
  "A space that preserves traces, proving that\u2026"
];

// Timing 
const MAIN_TEXT_TYPING_SPEED = 55;   
const MAIN_TEXT_DELAY        = 1400;  

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
const FINAL_MAIN_TEXT       = "There was once a presence, someone who passed through our lives...";
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

let nextAlpha  = 0;    // độ trong suốt nút THE END 
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

// Fade rồi đi thẳng đến URL
function goWithFade(url) {
  saveMusicTime();
  sessionStorage.setItem("isNavigating", "true");
  sessionStorage.setItem("returnToLanding", "true");
  const overlay = document.getElementById("page-fade-overlay");
  if (!overlay) { window.location.href = url; return; }
  overlay.style.transition    = "opacity 0.55s ease";
  void overlay.offsetWidth;
  overlay.classList.add("fade-in");
  overlay.style.opacity       = "1";
  overlay.style.pointerEvents = "all";
  let navigated = false;
  const doNavigate = () => { if (navigated) return; navigated = true; window.location.href = url; };
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


// PHẦN 4: SETUP & DRAW (p5.js)
function disableSmoothing() {
  noSmooth();
  drawingContext.imageSmoothingEnabled       = false;
  drawingContext.msImageSmoothingEnabled     = false;
  drawingContext.webkitImageSmoothingEnabled = false;
}

function preload() {
  tabImgs.push(loadImage("img/city.png"));
  tabImgs.push(loadImage("img/me.jpg"));
  tabImgs.push(loadImage("img/cat.jpg"));
  tabImgs.push(loadImage("img/staff.jpg"));
  tabImgs.push(loadImage("img/walk.png"));
  tabImgs.push(loadImage("img/thread.jpg"));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(window.devicePixelRatio || 1);
  disableSmoothing();
  textFont("Jersey 15");
  setupTransitionCSS();
  fadeInLoading();
  buildMusic();
  setupDustParticlesBg();
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

  // Tabs (Messenger + Image)
  for (let tab of tabs) tab.display();

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

// PHẦN 6: TABS (Messenger + Image)
// Tạo tab ngẫu nhiên 

// Tạo ngẫu nhiên tab tại vị trí click
function createRandomTab(mx, my) {
  let type = random(["text", "image"]);
  let tab  = new RetroTab(mx, my, type);
  tabs.push(tab);
}

// Class RetroTab 
class RetroTab {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type;
    this.dragging = false; this.offsetX = 0; this.offsetY = 0;

    if (this.type === "text") {
      // Tab Messenger
      this.title      = "Messenger";
      this.barColorR  = MESSENGER_BAR_COLOR[0];
      this.barColorG  = MESSENGER_BAR_COLOR[1];
      this.barColorB  = MESSENGER_BAR_COLOR[2];
      this.titleTextR = 125; this.titleTextG = 32; this.titleTextB = 39;
      this.message    = random(messages);
      this.w          = TEXT_BOX_W;
      this.h          = null;
    } else {
      // Tab Image
      this.title      = "Image";
      this.barColorR  = IMG_BAR_COLOR[0];
      this.barColorG  = IMG_BAR_COLOR[1];
      this.barColorB  = IMG_BAR_COLOR[2];
      this.titleTextR = IMG_TITLE_TEXT_COLOR[0];
      this.titleTextG = IMG_TITLE_TEXT_COLOR[1];
      this.titleTextB = IMG_TITLE_TEXT_COLOR[2];
      this.img        = random(tabImgs);
      this.w          = random(IMG_BOX_MIN_W, IMG_BOX_MAX_W);
      this.h          = random(IMG_BOX_MIN_H, IMG_BOX_MAX_H);
    }
  }

  // Chiều cao tab chat
  _calcTextBoxHeight() {
    const bubbleH = CHAT_SIZE + 14;
    const topPad  = TITLEBAR_HEIGHT + 12;
    const bubbleGap = 10;
    const botPad  = 14;
    return topPad + bubbleH + bubbleGap + bubbleH + botPad;
  }

  // Toàn bộ tab
  display() {
    if (this.type === "text" && this.h === null) this.h = this._calcTextBoxHeight();
    const bx = floor(this.x), by = floor(this.y);

    // Khung tab
    fill(235); stroke(this.barColorR, this.barColorG, this.barColorB); strokeWeight(1.5);
    rect(bx, by, this.w, this.h, 4);

    // Thanh tiêu đề
    fill(this.barColorR, this.barColorG, this.barColorB); noStroke();
    rect(bx, by, this.w, TITLEBAR_HEIGHT, 4, 4, 0, 0);

    // Chữ tiêu đề
    fill(this.titleTextR, this.titleTextG, this.titleTextB);
    textAlign(LEFT, CENTER); textFont("Jersey 15"); textSize(TITLE_SIZE);
    text(this.title, bx + 8, by + floor(TITLEBAR_HEIGHT / 2));

    // Nút —, □, x
    this.drawButtons();

    // Nội dung
    if (this.type === "text") this.drawChat();
    else this.drawImageContent();

    // Cursor khi hover title bar / nút close
    if (mouseX >= this.x && mouseX <= this.x + this.w &&
        mouseY >= this.y && mouseY <= this.y + TITLEBAR_HEIGHT) cursor(ARROW);
    const closeX = this.x + this.w - 60 + (BUTTON_SIZE + BUTTON_GAP) * 2;
    const closeY = this.y + 5;
    if (mouseX >= closeX && mouseX <= closeX + BUTTON_SIZE &&
        mouseY >= closeY && mouseY <= closeY + BUTTON_SIZE) cursor(HAND);
  }

  // Vẽ 3 nút điều khiển (—, □, x) trên title bar
  drawButtons() {
    let bx = floor(this.x), by = floor(this.y);
    let startX = bx + this.w - 60, y = by + 5;
    fill(240); noStroke();
    rect(startX, y, BUTTON_SIZE, BUTTON_SIZE);
    rect(startX + BUTTON_SIZE + BUTTON_GAP, y, BUTTON_SIZE, BUTTON_SIZE);
    rect(startX + (BUTTON_SIZE + BUTTON_GAP) * 2, y, BUTTON_SIZE, BUTTON_SIZE);
    fill(0); noStroke();
    textAlign(CENTER, CENTER); textFont("Jersey 15"); textSize(9);
    text("—", startX + floor(BUTTON_SIZE / 2), y + floor(BUTTON_SIZE / 2) + 1);
    text("□", startX + BUTTON_SIZE + BUTTON_GAP + floor(BUTTON_SIZE / 2), y + floor(BUTTON_SIZE / 2));
    text("x", startX + (BUTTON_SIZE + BUTTON_GAP) * 2 + floor(BUTTON_SIZE / 2), y + floor(BUTTON_SIZE / 2) + 1);
  }

  // Vẽ 2 bong bóng tin nhắn
  drawChat() {
    let leftMsg  = this.message[0], rightMsg = this.message[1];
    textFont("Jersey 15"); textSize(CHAT_SIZE);
    let leftW  = textWidth(leftMsg)  + 22;
    let rightW = textWidth(rightMsg) + 22;
    const maxBubbleW = this.w - 24;
    leftW  = min(leftW,  maxBubbleW);
    rightW = min(rightW, maxBubbleW);
    let bx = floor(this.x), by = floor(this.y);
    const bubbleH  = CHAT_SIZE + 14;
    const topPad   = TITLEBAR_HEIGHT + 12;
    const bubbleGap = 10;
    const leftBY  = by + topPad;
    const rightBY = leftBY + bubbleH + bubbleGap;

    // Bong bóng trái
    fill(255); noStroke();
    rect(bx + 12, leftBY, leftW, bubbleH, 14);
    fill(0); noStroke(); textAlign(LEFT, CENTER);
    text(leftMsg, bx + 22, leftBY + bubbleH / 2);

    // Bong bóng phải
    fill(95, 168, 194); noStroke();
    rect(bx + this.w - rightW - 12, rightBY, rightW, bubbleH, 14);
    fill(255); textAlign(LEFT, CENTER);
    text(rightMsg, bx + this.w - rightW, rightBY + bubbleH / 2);
  }

  // Ảnh trong tab Image
  drawImageContent() {
    if (!this.img) return;
    drawingContext.imageSmoothingEnabled = false;
    let padding  = 12;
    let areaW    = this.w - padding * 2;
    let areaH    = this.h - 45;
    let imgRatio  = this.img.width / this.img.height;
    let areaRatio = areaW / areaH;
    let drawW, drawH;
    if (imgRatio > areaRatio) { drawW = areaW; drawH = drawW / imgRatio; }
    else { drawH = areaH; drawW = drawH * imgRatio; }
    let dx = floor(this.x + (this.w - drawW) / 2);
    let dy = floor(this.y + 34 + (areaH - drawH) / 2);
    image(this.img, dx, dy, floor(drawW), floor(drawH));
  }

  inside(mx, my) {
    return mx > this.x && mx < this.x + this.w &&
           my > this.y && my < this.y + this.h;
  }

  // Bắt đầu kéo tab
  startDrag(mx, my) {
    this.dragging = true;
    this.offsetX  = mx - this.x;
    this.offsetY  = my - this.y;
  }

  clickClose(mx, my) {
    let bx = this.x + this.w - 60 + (BUTTON_SIZE + BUTTON_GAP) * 2;
    let by = this.y + 5;
    return mx > bx && mx < bx + BUTTON_SIZE &&
           my > by && my < by + BUTTON_SIZE;
  }
}



// PHẦN 7: GUIDE TEXT
function updateGuide() {
  if (guideState.done) { tickGuideFlicker(GUIDE_TEXT, millis()); return; }
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
    if (guideState.charCount >= GUIDE_TEXT.length) {
      guideState.charCount     = GUIDE_TEXT.length;
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
  const fullText     = GUIDE_TEXT;
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


// PHẦN 8: MAIN BOX
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
      mainTextTypingState.charCount   = min(currentMessage.length, mainTextTypingState.charCount + steps);
      mainTextTypingState.lastTypeAt += steps * MAIN_TEXT_TYPING_SPEED;
      if (mainTextTypingState.charCount === currentMessage.length)
        mainTextTypingState.completedAt = now;
    }
    return;
  }

  if (mainTextTypingState.completedAt !== null &&
      now - mainTextTypingState.completedAt > MAIN_TEXT_DELAY) {
    if (mainTextTypingState.messageIndex < MAIN_TEXT_MESSAGES.length - 1) {
      mainTextTypingState.messageIndex++;
      mainTextTypingState.charCount   = 0;
      mainTextTypingState.lastTypeAt  = now;
      mainTextTypingState.completedAt = null;
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
      finalMainTextState.started   = true;
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

  // Tọa độ nút THE END
  const nextButW = 100, nextButH = 40;
  const nextButX = x + boxW - nextButW / 2 - 16;
  const nextButY = y + boxH / 2;

  // Fade in nút THE END
  if (nextAppear !== null) {
    const now = millis();
    if (now >= nextAppear) nextAlpha = min(255, nextAlpha + 5);
  }

  // Hover cursor nút THE END
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
  text("Trace", floor(x) + 63, floor(y) - 4);

  // Main text / Final text
  fill(125, 32, 39);
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Jersey 15");
  textSize(20);
  text(typed, floor(x) + 28, floor(y) + boxH / 2, textAreaW);

  // Nút THE END
  if (nextAlpha > 0) {
    fill(153, 148, 54, nextAlpha);
    noStroke();
    rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), nextButW, nextButH, 6);
    fill(125, 32, 39, nextAlpha);
    textAlign(CENTER, CENTER);
    textFont("Jersey 15");
    textSize(28);
    text("THE END", floor(nextButX), floor(nextButY) - 1);
  }

  pop();
}


// ██ PHẦN 9 — UI ICONS 
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


// PHẦN 10: MOUSE EVENTS
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

  // Click nút THE END → quay về index.html
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
      goWithFade("index.html"); return;
    }
  }

  // Click nút X → đóng tab
  for (let i = tabs.length - 1; i >= 0; i--) {
    if (tabs[i].clickClose(mouseX, mouseY)) { tabs.splice(i, 1); return; }
  }

  // Click vào tab → đưa lên trên cùng + bắt đầu kéo
  for (let i = tabs.length - 1; i >= 0; i--) {
    if (tabs[i].inside(mouseX, mouseY)) {
      let tab = tabs.splice(i, 1)[0];
      tabs.push(tab);
      tab.startDrag(mouseX, mouseY);
      return;
    }
  }

  // Click vào vùng trống → tạo tab mới
  createRandomTab(mouseX, mouseY);
}

function mouseDragged() {
  let top = tabs[tabs.length - 1];
  if (top && top.dragging) {
    top.x = mouseX - top.offsetX;
    top.y = mouseY - top.offsetY;
  }
}

function mouseReleased() {
  for (let tab of tabs) tab.dragging = false;
}


// PHẦN 11: UTILITIES
function lerpAngle(start, end, amt) {
  let diff = ((end - start + PI) % TWO_PI) - PI;
  if (diff < -PI) diff += TWO_PI;
  return start + diff * amt;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  disableSmoothing();
  setupDustParticlesBg();
}
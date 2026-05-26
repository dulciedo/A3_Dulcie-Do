// ORBITALS PAGE

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


// LANDING PAGE 
const LANDING_TITLE      = "QUEN QUEN";                           
const LANDING_HEADPHONES = "Headphones on for the best experience"; 

const TITLE_TYPING_SPEED       = 300; 
const HEADPHONES_TYPING_SPEED  = 80;  

const START_BUT_SIZE = 60;

const TRANSITION_DURATION = 950;

let landingState;
let transitionState = null;    
let currentScreen   = "landing"; 


// GUIDE TEXT
const GUIDE_TEXT_1 = "move your mouse to break the spheres";      
const GUIDE_TEXT_2 = "drag the bar and let the memories scatter"; 

const GUIDE_TYPING_SPEED        = 70; 
const GUIDE_1_DELAY             = 1;
const MAIN_TEXT_DELAY_AFTER_GUIDE = 100;

let guideState = {
  charCount:       0,    
  lastType:        0,    
  started:         false, 
  startTime:       0,    
  done:            false, 
  phase2Started:   false, 
  phase2CharCount: 0,    
  phase2LastType:  0,    
  phase2Done:      false, 
  phase2Trigger:   null  
};

let guideFlicker = {
  indices:      [],    
  nextFlicker:  0,     
  flickerSpeed: 2800 
};
let guidePhase1Done = null; 
let mainTextAllowed = false; 


// SPHERES 
const CAMERA_DISTANCE = 300;
const wordsSphere = [
  ["F","A","T","E"],
  ["T","R","A","C","E"],
  ["L","O","S","E"],
  ["L","I","N","G","E","R"],
  ["B","O","N","D"]
];

const sphereColors = [
  [224, 98, 36], 
  [142, 171, 58], 
  [0, 157, 173], 
  [115, 73, 142], 
  [186, 62, 142]  
];
let spheres     = [];    
let morphRatio  = 0;     
let barValue    = 0;     
let barDragging = false;
let slider;           


// MAIN BOX
const MAIN_TEXT_MESSAGES = [
  "\u201cFATE\u201d, \u201cTRACE\u201d, \u201cLOSE\u201d, \u201cLINGER\u201d, and \u201cBOND\u201d are the elements that form the emotional cycle of a relationship...",
  "From the moment people meet until they drift apart, those elements still remain...",
  "Even the connections that seem to have ended continue to exist in quieter ways...",
];

const MAIN_TEXT_TYPING_SPEED = 55;   
const MAIN_TEXT_DELAY        = 2000; 
const FINAL_MAIN_TEXT_DELAY  = 8000; 
const BAR_LEAD_TIME          = 2500; 

let mainTextTypingState = {
  messageIndex:  0,    
  charCount:     0,    
  lastType:      0,     
  completedTime: null,  
  finishedAll:   false,
  finishedTime:  null   
};


// BAR
const BAR_DELAY = 0;

let barAlpha  = 0;    
let barAppear = null; 


// FINAL MAIN TEXT + NEXT BUT 
const FINAL_MAIN_TEXT = "And even when forgotten or changed by time, those memories still exist somewhere within us.";
const NEXT_TEXT       = "NEXT";

const NEXT_DELAY = 2200; 

let finalMainTextState = {
  started:       false, 
  charCount:     0,     
  lastType:      0,     
  completed:     false, 
  completedTime: null,  
  _realFinished: null   
};

let nextAlpha  = 0;    
let nextAppear = null; 


// UI ICONS
const ICON_SIZE   = 60; 
const ICON_MARGIN = 18; 
const ICON_TOP    = 16; 


// LAYOUT HELPER 
function getMainBoxLayout() {
  const BOX_W_FACTOR = 0.95;
  const TEXT_SIZE    = 37;
  const LINE_H       = TEXT_SIZE * 1.35; 
  const PAD_V        = 28;             
  const NEXT_W       = 190;        
  const NEXT_H       = 76;              
  const BAR_W        = 250;

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

  const barX = x + boxW - BAR_W;
  const barY = y - 32; 

  return {
    boxW, boxH, x, y,
    textAreaW, typed, TEXT_SIZE, LINE_H, PAD_V,
    NEXT_W, NEXT_H, BAR_W,
    nextButX, nextButY,
    barX, barY, BAR_W
  };
}


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
  const isNavigating    = sessionStorage.getItem("isNavigating")    === "true";
  const returnToLanding = sessionStorage.getItem("returnToLanding") === "true";
  sessionStorage.removeItem("isNavigating");
  sessionStorage.removeItem("returnToLanding");
  if (returnToLanding) return;
  if (!isNavigating) return;
  const saved = sessionStorage.getItem(MUSIC_KEY);
  playMusic(saved ? parseFloat(saved) : 0);
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
    #page-fade-overlay.fade-in  { opacity: 1; pointer-events: all; }
    #page-fade-overlay.fade-out { opacity: 0; }
  `;
  document.head.appendChild(style);
  const overlay = document.createElement("div");
  overlay.id = "page-fade-overlay";
  document.body.appendChild(overlay);
}

function goWithFade(url) {
  saveMusicTime();
  sessionStorage.setItem("isNavigating", "true");
  sessionStorage.setItem("returnToLanding", "true");
  const overlay = document.getElementById("page-fade-overlay");
  if (!overlay) { window.location.href = url; return; }
  overlay.style.transition = "opacity 0.55s ease";
  void overlay.offsetWidth;
  overlay.classList.add("fade-in");
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "all";
  let navigated = false;
  const doNavigate = () => { if (navigated) return; navigated = true; window.location.href = url; };
  overlay.addEventListener("transitionend", doNavigate, { once: true });
  setTimeout(doNavigate, 700);
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
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "all";
  let navigated = false;
  const doNavigate = () => { if (navigated) return; navigated = true; window.location.href = "loading.html"; };
  overlay.addEventListener("transitionend", doNavigate, { once: true });
  setTimeout(doNavigate, 700);
}

function fadeInLoading() {
  const overlay = document.getElementById("page-fade-overlay");
  if (!overlay) return;
  overlay.style.transition   = "none";
  overlay.style.opacity      = "1";
  overlay.style.pointerEvents = "all";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition   = "opacity 0.6s ease";
      overlay.style.opacity      = "0";
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

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(window.devicePixelRatio || 1);
  disableSmoothing();

  setupDustParticlesBg();

  textFont("Jersey 15");
  textAlign(CENTER, CENTER);
  setupTransitionCSS();
  fadeInLoading();
  buildMusic();

  buildLanding();

  for (let i = 0; i < 5; i++) {
    spheres.push(new Sphere(
      random(220, width - 220),
      random(220, height - 220),
      random(155, 190),
      wordsSphere[i], sphereColors[i]
    ));
  }

  slider = createSlider(0, 100, 0);
  slider.position(-9999, -9999);
  slider.style("opacity", "0");
  slider.style("pointer-events", "none");
}

function draw() {
  background(252, 235, 222);
  drawingContext.imageSmoothingEnabled = false;

  updateDustParticlesBg();
  drawDustParticlesBg();

  if (barDragging) updateBar();

  if (transitionState !== null) {
    updateOrbitalScene();
    drawTransition();
    return;
  }

  if (currentScreen === "landing") {
    drawLanding();
    return;
  }

  cursor(ARROW);
  updateOrbitalScene();
  drawOrbitalScene();
  drawMainBox();
  updateGuide();
  drawGuide();
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


// PHẦN 6: LANDING PAGE
function buildLanding() {
  const now = millis();
  landingState = {
    titleCount:          0,
    headphonesCount:     0,
    titleLastType:       now,
    headphonesLastType:  0,
    titleDone:           null,
    headphonesDone:      null,
    buttonProgress:      0
  };
}

function updateLanding() {
  const now = millis();

  if (landingState.titleCount < LANDING_TITLE.length) {
    const elapsed = now - landingState.titleLastType;
    if (elapsed >= TITLE_TYPING_SPEED) {
      const steps = floor(elapsed / TITLE_TYPING_SPEED);
      landingState.titleCount = min(LANDING_TITLE.length, landingState.titleCount + steps);
      landingState.titleLastType += steps * TITLE_TYPING_SPEED;
      if (landingState.titleCount === LANDING_TITLE.length && landingState.titleDone === null) {
        landingState.titleDone = now;
        landingState.headphonesLastType = now;
      }
    }
    return;
  }

  if (landingState.headphonesCount < LANDING_HEADPHONES.length) {
    const elapsed = now - landingState.headphonesLastType;
    if (elapsed >= HEADPHONES_TYPING_SPEED) {
      const steps = max(1, floor(elapsed / HEADPHONES_TYPING_SPEED));
      landingState.headphonesCount = min(LANDING_HEADPHONES.length, landingState.headphonesCount + steps);
      landingState.headphonesLastType += steps * HEADPHONES_TYPING_SPEED;
      if (landingState.headphonesCount === LANDING_HEADPHONES.length && landingState.headphonesDone === null)
        landingState.headphonesDone = now;
    }
    return;
  }

  if (landingState.headphonesDone !== null && now - landingState.headphonesDone < 500) {
    landingState.buttonProgress = 0;
    return;
  }
  landingState.buttonProgress = min(1, landingState.buttonProgress + 0.006);
}

function drawLanding(options = {}) {
  const { updateState = true, forceComplete = false, interactive = true } = options;
  if (updateState) updateLanding();

  const layout          = landingLayout();
  const titleCount      = forceComplete ? LANDING_TITLE.length      : landingState.titleCount;
  const headphonesCount = forceComplete ? LANDING_HEADPHONES.length : landingState.headphonesCount;
  const buttonProgress  = forceComplete ? 1 : landingState.buttonProgress;

  push();
  fill(95, 168, 194);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width * 0.25, 250));
  textFont("Jersey 15");
  text(LANDING_TITLE.slice(0, titleCount), floor(width / 2), floor(layout.titleY));
  pop();

  if (titleCount === LANDING_TITLE.length) {
    push();
    fill(125, 32, 39);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    textSize(min(width * 0.028, 36));
    textFont("Jersey 15");
    text(
      LANDING_HEADPHONES.slice(0, headphonesCount),
      floor(width / 2),
      floor(layout.headphonesY)
    );
    pop();
  }

  if (headphonesCount === LANDING_HEADPHONES.length) {
    drawStartBut(layout.buttonY, buttonProgress, interactive);
  } else if (interactive) {
    cursor(ARROW);
  }
}

function drawStartBut(y, progressValue, interactive = true) {
  const progress = easeOutCubic(progressValue);
  const button   = getStartButRect(y);
  const hovered  = interactive && hoverStartBut(button);
  cursor(hovered ? HAND : ARROW);

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  noStroke();
  fill(173, 168, 54, 220 * progress);
  rect(floor(button.x), floor(button.y), button.w * (0.92 + progress * 0.08), button.h, 8);
  fill(125, 32, 39, (hovered ? 255 : 235) * progress);
  textFont("Jersey 15");
  textSize(START_BUT_SIZE);
  text("START", floor(button.x), floor(button.y) - 1);
  pop();
}

function getStartButRect(y) {
  push();
  textFont("Jersey 15");
  textSize(START_BUT_SIZE);
  textStyle(NORMAL);
  const textW = textWidth("START");
  pop();
  return { x: width / 2, y, w: max(120, textW + 50), h: START_BUT_SIZE + 24 };
}

function hoverStartBut(button) {
  return (
    landingState.buttonProgress > 0.95 &&
    mouseX >= button.x - button.w / 2 &&
    mouseX <= button.x + button.w / 2 &&
    mouseY >= button.y - button.h / 2 &&
    mouseY <= button.y + button.h / 2
  );
}

function landingLayout() {
  return {
    titleY:      height * 0.42,
    buttonY:     height * 0.58,
    headphonesY: height - max(32, height * 0.05)
  };
}

function enterOrbitalScene() {
  if (transitionState !== null) return;
  transitionState = { startTime: millis() };
  sessionStorage.removeItem(MUSIC_KEY);

  playMusic(0);

  mainTextTypingState = {
    messageIndex: 0, charCount: 0, lastType: millis(),
    completedTime: null, finishedAll: false, finishedTime: null
  };

  finalMainTextState = {
    started: false, charCount: 0, lastType: 0,
    completed: false, completedTime: null, _realFinished: null
  };

  nextAlpha  = 0;
  nextAppear = null;
  barAlpha   = 0;
  barAppear  = null;

  guidePhase1Done = null;
  mainTextAllowed = false;
  guideState = {
    charCount: 0, lastType: 0, started: false,
    startTime: millis() + TRANSITION_DURATION,
    done: false,
    phase2Started: false, phase2CharCount: 0,
    phase2LastType: 0, phase2Done: false,
    phase2Trigger: null
  };
  guideFlicker = { indices: [], nextFlicker: 0, flickerSpeed: 2800 };

  barValue = 0;
  slider.hide();
  cursor(ARROW);
}

// PHẦN 7: SCREEN TRANSITION
function drawTransition() {
  const elapsed       = millis() - transitionState.startTime;
  const transitionRaw = constrain(elapsed / TRANSITION_DURATION, 0, 1);
  const transitionEased = easeInOutCubic(transitionRaw);

  cursor(ARROW);
  drawLayerAlpha(() => drawOrbitalScene(), transitionEased, 1);
  drawLayerAlpha(
    () => drawLanding({ updateState: false, forceComplete: true, interactive: false }),
    1 - transitionEased, 1
  );

  if (transitionRaw >= 1) {
    transitionState = null;
    currentScreen   = "orbitals";
    slider.show();
    cursor(ARROW);
    guideState.startTime = millis();
  }
}

function drawLayerAlpha(renderFn, alpha, scaleValue) {
  if (alpha <= 0.001) return;
  push();
  const prevAlpha = drawingContext.globalAlpha;
  translate(width / 2, height / 2);
  scale(scaleValue);
  translate(-width / 2, -height / 2);
  drawingContext.globalAlpha = alpha;
  renderFn();
  drawingContext.globalAlpha = prevAlpha;
  pop();
}

// PHẦN 8: GUIDE TEXT
function updateGuide() {
  if (currentScreen !== "orbitals") return;
  const now = millis();

  if (!guideState.started) {
    if (now - guideState.startTime > GUIDE_1_DELAY) {
      guideState.started  = true;
      guideState.lastType = now;
    }
    return;
  }

  if (!guideState.done) {
    if (now - guideState.lastType >= GUIDE_TYPING_SPEED) {
      guideState.charCount++;
      guideState.lastType = now;
      if (guideState.charCount >= GUIDE_TEXT_1.length) {
        guideState.charCount = GUIDE_TEXT_1.length;
        guideState.done      = true;
        guideFlicker.nextFlicker = now + guideFlicker.flickerSpeed;
        guidePhase1Done = now;
      }
    }
    return;
  }

  if (!mainTextAllowed && guidePhase1Done !== null) {
    if (now - guidePhase1Done >= MAIN_TEXT_DELAY_AFTER_GUIDE) {
      mainTextAllowed = true;
      mainTextTypingState.lastType = now;
    }
  }

  if (guideState.done && !guideState.phase2Started) {
    tickGuideFlicker(GUIDE_TEXT_1, now);
  }

  if (mainTextTypingState.finishedAll && guideState.phase2Trigger === null) {
    guideState.phase2Trigger = mainTextTypingState.finishedTime;
  }

  if (
    guideState.phase2Trigger !== null &&
    now >= guideState.phase2Trigger &&
    !guideState.phase2Done
  ) {
    if (!guideState.phase2Started) {
      guideState.phase2Started    = true;
      guideState.phase2CharCount  = 0;
      guideState.phase2LastType   = now;
    } else {
      if (now - guideState.phase2LastType >= GUIDE_TYPING_SPEED) {
        guideState.phase2CharCount++;
        guideState.phase2LastType = now;
        if (guideState.phase2CharCount >= GUIDE_TEXT_2.length) {
          guideState.phase2CharCount = GUIDE_TEXT_2.length;
          guideState.phase2Done      = true;
          guideFlicker.indices       = [];
          guideFlicker.nextFlicker   = now + guideFlicker.flickerSpeed;
        }
      }
    }
  }

  if (guideState.phase2Done) tickGuideFlicker(GUIDE_TEXT_2, now);
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
  const usePhase2    = guideState.phase2Started;
  const fullText     = usePhase2 ? GUIDE_TEXT_2 : GUIDE_TEXT_1;
  const displayCount = usePhase2 ? guideState.phase2CharCount : guideState.charCount;

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

// PHẦN 9: SPHERES
class Sphere {
  constructor(x, y, r, chars, col) {
    this.pos  = createVector(x, y);
    this.vel  = p5.Vector.random2D().mult(random(0.01, 0.08));
    this.r    = r;
    this.screenRadius = r;
    this.chars = chars;
    this.col   = col;

    this.rotY = random(TWO_PI); this.rotX = random(TWO_PI); this.rotZ = random(TWO_PI);
    this.rotYSpeed = random(0.001, 0.002);
    this.rotXSpeed = random(0.0004, 0.001);
    this.rotZSpeed = random(-0.001, 0.001);

    this.depth        = random(-70, 90);
    this.depthOffset  = random(1000);
    this.driftOffsetX = random(1000);
    this.driftOffsetY = random(1000);
    this.homeOffsetX  = random(2000);
    this.homeOffsetY  = random(2000);

    this.maxSpeed        = random(1.2, 2.2);
    this.freeFlight      = 0;
    this.homeBase        = createVector(x, y);
    this.home            = createVector(x, y);
    this.roamRadiusX     = random(220, 420);
    this.roamRadiusY     = random(180, 380);
    this.homeDriftRadius = random(60, 120);
    this.separationBoost = random(0.9, 1.15);

    this.points = [];
    this.makeSphere();
  }

  makeSphere() {
    const bandCount = 10;
    const bandSteps = max(22, this.chars.length * 5);
    for (let band = 0; band < bandCount; band++) {
      let bandBase = (band / bandCount) * TWO_PI;
      for (let i = 0; i < bandSteps; i++) {
        let progress   = i / (bandSteps - 1);
        let phi        = lerp(-HALF_PI * 0.82, HALF_PI * 0.82, progress);
        let theta      = bandBase + sin(progress * PI) * 0.42 + progress * 0.95;
        let ringRadius = cos(phi);
        this.addPoint(cos(theta) * ringRadius, sin(phi), sin(theta) * ringRadius, true, i);
      }
    }
    const extraParticles = 800;
    for (let i = 0; i < extraParticles; i++) {
      let ny         = 1 - (i / (extraParticles - 1)) * 2;
      let ringRadius = sqrt(1 - ny * ny);
      let theta      = i * 2.399963;
      this.addPoint(cos(theta) * ringRadius, ny, sin(theta) * ringRadius, false, i);
    }
  }

  addPoint(nx, ny, nz, textSlot, charIndex) {
    this.points.push({
      baseX: nx * this.r, baseY: ny * this.r, baseZ: nz * this.r,
      x: nx * this.r, y: ny * this.r, z: nz * this.r,
      vx: 0, vy: 0,
      rx: 0, ry: 0, rz: 0,
      textSlot,                                    
      scatterX: random(-11, 11), scatterY: random(-11, 11),
      char: this.chars[charIndex % this.chars.length]
    });
  }

  separate(allSpheres) {
    let repel = createVector(0, 0);
    let count = 0;
    for (let other of allSpheres) {
      if (other === this) continue;
      let delta     = p5.Vector.sub(this.pos, other.pos);
      let preferred = (this.screenRadius + other.screenRadius) * 1.25 + 32;
      let distSq    = delta.magSq();
      if (distSq > 0.0001 && distSq < preferred * preferred) {
        delta.normalize();
        let dist     = sqrt(distSq);
        let strength = map(dist, 0, preferred, 0.015, 0) * this.separationBoost;
        repel.add(delta.mult(strength));
        count++;
      }
    }
    if (count > 0) { repel.div(count); this.vel.add(repel); }
  }

  update() {
    const t     = frameCount * 0.0024;
    const homeT = frameCount * 0.0011;
    this.freeFlight = max(0, this.freeFlight - 0.018);

    this.home.x = constrain(
      this.homeBase.x + map(noise(this.homeOffsetX, homeT), 0, 1, -this.homeDriftRadius, this.homeDriftRadius),
      this.r + 90, width - this.r - 90
    );
    this.home.y = constrain(
      this.homeBase.y + map(noise(this.homeOffsetY, homeT), 0, 1, -this.homeDriftRadius * 0.8, this.homeDriftRadius * 0.8),
      this.r + 100, height - this.r - 100
    );
    
    const targetX = this.home.x + map(noise(this.driftOffsetX, t), 0, 1, -this.roamRadiusX, this.roamRadiusX);
    const targetY = this.home.y + map(noise(this.driftOffsetY, t), 0, 1, -this.roamRadiusY, this.roamRadiusY);
    const steer   = createVector(targetX - this.pos.x, targetY - this.pos.y)
      .mult(lerp(0.00015, 0.0006, 1 - this.freeFlight));

    this.vel.add(steer);
    this.vel.limit(this.maxSpeed + this.freeFlight * 2.4);
    this.pos.add(this.vel);

    const padding = this.r * 0.95;
    if (this.pos.x < padding)            this.vel.x += (padding - this.pos.x) * 0.03;
    if (this.pos.x > width  - padding)   this.vel.x -= (this.pos.x - (width  - padding)) * 0.03;
    if (this.pos.y < padding)            this.vel.y += (padding - this.pos.y) * 0.03;
    if (this.pos.y > height - padding)   this.vel.y -= (this.pos.y - (height - padding)) * 0.03;

    this.vel.mult(0.999);
    this.rotY += this.rotYSpeed;
    this.rotX += this.rotXSpeed;
    this.rotZ += this.rotZSpeed;

    let targetDepth = map(noise(this.depthOffset, t * 0.8), 0, 1, -95, 120);
    this.depth      = lerp(this.depth, targetDepth, 0.035);
    this.screenRadius = this.r * (CAMERA_DISTANCE / (CAMERA_DISTANCE - this.depth));
  }

  interact() {
    const mouseRadius = 80;
    for (let p of this.points) {
      let px = this.pos.x + p.rx;
      let py = this.pos.y + p.ry;
      let dx = px - mouseX;
      let dy = py - mouseY;
      let d  = sqrt(dx * dx + dy * dy);
      if (d < mouseRadius) {
        let dir      = createVector(dx, dy).normalize();
        let strength = pow(1 - d / mouseRadius, 2.2);
        p.vx *= 0.85; p.vy *= 0.85;
        let repelForce = strength * 45;
        p.vx += dir.x * repelForce + random(-0.12, 0.12);
        p.vy += dir.y * repelForce + random(-0.12, 0.12);
        let swirl = createVector(-dir.y, dir.x);
        p.vx += swirl.x * strength * 1.2;
        p.vy += swirl.y * strength * 1.2;
      }
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    const textFade     = constrain(map(morphRatio, 0, 0.5, 255, 0), 0, 255);
    const particleFade = constrain(map(morphRatio, 0.3, 1.0, 0, 255), 0, 255);

    const renderPoints = [];

    for (let p of this.points) {
      let x = p.baseX, y = p.baseY, z = p.baseZ;
      let pulse = 1 + sin(frameCount * 0.018 + p.baseY * 0.03 + this.depthOffset) * 0.012;
      x *= pulse; y *= pulse; z *= pulse;

      p.x += (x - p.x) * 0.00001 + p.vx;
      p.y += (y - p.y) * 0.00001 + p.vy;
      p.z += (z - p.z) * 0.2;
      p.vx *= 0.92; p.vy *= 0.92;

      let rx1 = p.x * cos(this.rotY) - p.z * sin(this.rotY);
      let rz1 = p.x * sin(this.rotY) + p.z * cos(this.rotY);
      let ry1 = p.y * cos(this.rotX) - rz1 * sin(this.rotX);
      let rz2 = p.y * sin(this.rotX) + rz1 * cos(this.rotX);
      let rx2 = rx1 * cos(this.rotZ) - ry1 * sin(this.rotZ);
      let ry2 = rx1 * sin(this.rotZ) + ry1 * cos(this.rotZ);

      let worldZ      = rz2 + this.depth;
      let perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - worldZ);
      let rx = rx2 * perspective;
      let ry = ry2 * perspective;
      p.rx = rx; p.ry = ry; p.rz = worldZ;

      let mx    = lerp(rx, rx + p.scatterX * perspective, morphRatio);
      let my    = lerp(ry, ry + p.scatterY * perspective, morphRatio);
      let alpha = constrain(map(worldZ, -this.r - 150, this.r + 170, 0, 255), 0, 255);
      renderPoints.push({ point: p, mx, my, alpha, worldZ, perspective });
    }

    renderPoints.sort((a, b) => a.worldZ - b.worldZ);

    if (textFade > 0) {
      noStroke();
      const textItems = [];
      for (let item of renderPoints) {
        if (!item.point.textSlot) continue;
        const sz        = constrain(42 * item.perspective, 10, 46);
        const szRounded = floor(sz);
        textItems.push({ item, szRounded });
      }
      textItems.sort((a, b) => a.szRounded - b.szRounded);
      let lastSz = -1;
      for (let { item, szRounded } of textItems) {
        if (szRounded !== lastSz) { textFont("Jersey 15"); textSize(szRounded); lastSz = szRounded; }
        fill(this.col[0], this.col[1], this.col[2], 255 * (textFade / 255));
        text(item.point.char, floor(item.mx), floor(item.my));
      }
    }

    if (particleFade > 0) {
      noStroke();
      for (let item of renderPoints) {
        fill(this.col[0], this.col[1], this.col[2], item.alpha * (particleFade / 255));
        circle(floor(item.mx), floor(item.my), constrain(2.8 * item.perspective, 3, 9));
      }
    }

    pop();
  }
}

function updateOrbitalScene() {
  updateMainText();
  updateFinalMainTextTyping();

  if (nextAppear !== null) {
    const now = millis();
    if (now >= nextAppear) nextAlpha = min(255, nextAlpha + 5);
  }

  if (barAppear !== null) {
    const now = millis();
    if (now >= barAppear) barAlpha = min(255, barAlpha + 8);
  }

  morphRatio = barValue / 100;

  for (let s of spheres) { s.separate(spheres); s.update(); }
  for (let s of spheres) s.interact();
}

function drawOrbitalScene() {
  let orderedSpheres = [...spheres].sort((a, b) => a.depth - b.depth);
  for (let s of orderedSpheres) s.display();
}

// PHẦN 10: MAIN BOX
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
  if (!mainTextAllowed) return;
  const now = millis();
  if (mainTextTypingState.finishedAll) return;

  const currentMessage = MAIN_TEXT_MESSAGES[mainTextTypingState.messageIndex];

  if (mainTextTypingState.charCount < currentMessage.length) {
    const elapsed = now - mainTextTypingState.lastType;
    if (elapsed >= MAIN_TEXT_TYPING_SPEED) {
      const steps = floor(elapsed / MAIN_TEXT_TYPING_SPEED);
      mainTextTypingState.charCount = min(currentMessage.length, mainTextTypingState.charCount + steps);
      mainTextTypingState.lastType += steps * MAIN_TEXT_TYPING_SPEED;
      if (mainTextTypingState.charCount === currentMessage.length)
        mainTextTypingState.completedTime = now;
    }
    return;
  }

  if (mainTextTypingState.completedTime !== null &&
      now - mainTextTypingState.completedTime > MAIN_TEXT_DELAY) {
    if (mainTextTypingState.messageIndex < MAIN_TEXT_MESSAGES.length - 1) {
      mainTextTypingState.messageIndex++;
      mainTextTypingState.charCount      = 0;
      mainTextTypingState.lastType       = now;
      mainTextTypingState.completedTime  = null;
    } else {
      mainTextTypingState.finishedAll  = true;
      mainTextTypingState.finishedTime = now - BAR_LEAD_TIME;
      barAppear = now + BAR_DELAY;
    }
  }
}

function updateFinalMainTextTyping() {
  if (!mainTextTypingState.finishedAll) return;
  if (finalMainTextState.completed) return;

  const now = millis();

  if (!finalMainTextState.started) {
    if (!finalMainTextState._realFinished) finalMainTextState._realFinished = now;
    if (now - finalMainTextState._realFinished > FINAL_MAIN_TEXT_DELAY) {
      finalMainTextState.started  = true;
      finalMainTextState.lastType = now;
    }
    return;
  }

  if (now - finalMainTextState.lastType >= MAIN_TEXT_TYPING_SPEED) {
    finalMainTextState.charCount++;
    finalMainTextState.lastType = now;
    if (finalMainTextState.charCount >= FINAL_MAIN_TEXT.length) {
      finalMainTextState.charCount      = FINAL_MAIN_TEXT.length;
      finalMainTextState.completed      = true;
      finalMainTextState.completedTime  = now;
      nextAppear = now + NEXT_DELAY;
    }
  }
}

function drawMainBox() {
  const L = getMainBoxLayout();
  const { boxW, boxH, x, y, textAreaW, typed,
          nextButX, nextButY, NEXT_W, NEXT_H,
          barX, barY, BAR_W } = L;

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

  //tag
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
  text("Orbitals", tagCX, floor(y) - 28 + TAG_H / 2);

  //bar
  if (barAlpha > 0) {
    const BAR_H = 14;

    const hoveringBar =
      mouseX >= barX - 10 && mouseX <= barX + BAR_W + 10 &&
      mouseY >= barY - 24 && mouseY <= barY + 24;
    if (hoveringBar && barAlpha > 200) cursor(HAND);

    fill(125, 32, 39, barAlpha);
    noStroke();
    textAlign(CENTER, CENTER);
    textFont("Jersey 15");
    textSize(27);
    text("TEXT <-> PARTICLES", floor(barX + BAR_W / 2), floor(barY - 20));

    noFill();
    stroke(153, 148, 54, barAlpha);
    strokeWeight(3);
    rect(floor(barX), floor(barY), BAR_W, BAR_H, 10);

    noStroke();
    fill(125, 32, 39, barAlpha);
    const handleX = map(barValue, 0, 100, barX + 9, barX + BAR_W - 9);
    circle(floor(handleX), floor(barY + BAR_H / 2), 20);
  }

  fill(125, 32, 39);
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Jersey 15");
  textSize(L.TEXT_SIZE);
  if (mainTextAllowed) {
    text(typed, floor(x) + 32, floor(y) + boxH / 2, textAreaW);
  }

  if (nextAlpha > 0) {
    fill(153, 148, 54, nextAlpha);
    noStroke();
    rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), NEXT_W, NEXT_H, 6);
    fill(125, 32, 39, nextAlpha);
    textAlign(CENTER, CENTER);
    textFont("Jersey 15");
    textSize(54); 
    text(NEXT_TEXT, floor(nextButX), floor(nextButY) - 1);
  }

  pop();
}

// PHẦN 11: UI ICONS
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
  if (currentScreen !== "orbitals") return;
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
  rect(camX, camY, 32, 22, 5);
  circle(camX, camY, 14);
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
    noFill(); stroke(125, 32, 39); strokeWeight(2.3);
    arc(musicX+13, musicY, 12, 18, -PI*0.5, PI*0.5);
    arc(musicX+13, musicY, 20, 28, -PI*0.5, PI*0.5);
  } else {
    stroke(95, 168, 194); strokeWeight(2.3);
    line(musicX+10, musicY-10, musicX+20, musicY+10);
    line(musicX+20, musicY-10, musicX+10, musicY+10);
  }
  pop();
}

function saveScreenshot() {
  saveCanvas("screenshot_" + day() + "_" + hour() + minute() + second(), "png");
}

// PHẦN 12: MOUSE EVENTS
function mousePressed() {

  if (currentScreen === "orbitals") {
    const icons = getIconRects();
    if (mouseX >= icons.cam.x   - ICON_SIZE/2 && mouseX <= icons.cam.x   + ICON_SIZE/2 &&
        mouseY >= icons.cam.y   - ICON_SIZE/2 && mouseY <= icons.cam.y   + ICON_SIZE/2) {
      saveScreenshot(); return;
    }
    if (mouseX >= icons.music.x - ICON_SIZE/2 && mouseX <= icons.music.x + ICON_SIZE/2 &&
        mouseY >= icons.music.y - ICON_SIZE/2 && mouseY <= icons.music.y + ICON_SIZE/2) {
      setMusicMute(!isMuted); return;
    }
  }

  if (nextAlpha > 200) {
    const L = getMainBoxLayout();
    if (mouseX >= L.nextButX - L.NEXT_W / 2 && mouseX <= L.nextButX + L.NEXT_W / 2 &&
        mouseY >= L.nextButY - L.NEXT_H / 2 && mouseY <= L.nextButY + L.NEXT_H / 2) {
      goToNextScene(); return;
    }
  }

  if (transitionState === null && currentScreen === "landing" &&
      landingState.headphonesCount === LANDING_HEADPHONES.length) {
    const layout = landingLayout();
    if (hoverStartBut(getStartButRect(layout.buttonY))) { enterOrbitalScene(); return; }
  }

  if (mainTextTypingState.finishedAll && barAlpha > 200) {
    const L = getMainBoxLayout();
    const { barX, barY, BAR_W } = L;
    if (mouseX >= barX - 20 && mouseX <= barX + BAR_W + 20 &&
        mouseY >= barY - 20 && mouseY <= barY + 20) {
      barDragging = true; updateBar(); return;
    }
  }
}

function mouseReleased() {
  barDragging = false;
}

function updateBar() {
  const L = getMainBoxLayout();
  const { barX, BAR_W } = L;
  barValue = constrain(map(mouseX, barX, barX + BAR_W, 0, 100), 0, 100);
}

// PHẦN 13: UTILITIES
function lerpAngle(start, end, amt) {
  let diff = ((end - start + PI) % TWO_PI) - PI;
  if (diff < -PI) diff += TWO_PI;
  return start + diff * amt;
}

function easeOutCubic(t)   { return 1 - pow(1 - t, 3); }

function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - pow(-2*t+2, 3)/2; }

function goToNextScene() { goViaLoading("sketch2.html"); }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  disableSmoothing();
  setupDustParticlesBg();
}

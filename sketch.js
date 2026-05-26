// ORBITALS PAGE

// PHẦN 1: CONST / LET
// MUSIC
// lưu/đọc nhạc khi chuyển trang
const MUSIC_KEY       = "bgMusicTime";     // lưu thời điểm đang phát
const MUSIC_MUTED_KEY = "bgMusicMuted";    // lưu mute

let musicCtx       = null;   // Web Audio context
let musicBuffer    = null;   // dữ liệu file nhạc đã decode
let musicSource    = null;   // nguồn phát nhạc
let musicStartTime = 0;      
let musicOffset    = 0;      
let musicReady     = false;  
let musicStarted   = false;  
let gainNode       = null;   // điều chỉnh âm lượng
let isMuted        = false;  // tắt tiếng


// BACKGROUND DUST 
const BACKGROUND_DUST_DENSITY = 3500; 

let dustParticlesBg = [];


// LANDING PAGE 
// First screen: "QUEN QUEN" 
const LANDING_TITLE      = "QUEN QUEN";                           
const LANDING_HEADPHONES = "Headphones on for the best experience"; 

// Tốc độ gõ chữ 
const TITLE_TYPING_SPEED       = 300; 
const HEADPHONES_TYPING_SPEED  = 80;  

// Nút START 
const START_BUT_SIZE = 25;

// Chuyển màn
const TRANSITION_DURATION = 950; // thời gian landing → orbitals

// Landing state lưu gõ chữ + fade in nút START
let landingState;               // object lưu gõ chữ + nút landing
let transitionState = null;    
let currentScreen   = "landing"; 


// GUIDE TEXT

const GUIDE_TEXT_1 = "move your mouse to break the spheres";      
const GUIDE_TEXT_2 = "drag the bar and let the memories scatter"; 

// Timing
const GUIDE_TYPING_SPEED        = 70; 
const GUIDE_1_DELAY             = 1;   // ms chờ 
const MAIN_TEXT_DELAY_AFTER_GUIDE = 100; // ms sau guide 1

// State guide typing
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

// State flicker 
let guideFlicker = {
  indices:      [],    
  nextFlicker:  0,     
  flickerSpeed: 2800 
};
let guidePhase1Done = null; 
let mainTextAllowed = false; 


// SPHERES 
const CAMERA_DISTANCE = 250; // khoảng cách camera
const wordsSphere = [
  ["F","A","T","E"],
  ["T","R","A","C","E"],
  ["L","O","S","E"],
  ["L","I","N","G","E","R"],
  ["B","O","N","D"]
];

// Màu
const sphereColors = [
  [224, 98, 36], 
  [142, 171, 58], 
  [0, 157, 173], 
  [115, 73, 142], 
  [186, 62, 142]  
];
let spheres     = [];    
let morphRatio  = 0;     
let barValue    = 0;     // thanh kéo
let barDragging = false; // có đang kéo thanh hay không
let slider;           


// MAIN BOX — MAIN TEXT
const MAIN_TEXT_MESSAGES = [
  "\u201cFATE\u201d, \u201cTRACE\u201d, \u201cLOSE\u201d, \u201cLINGER\u201d, and \u201cBOND\u201d are the elements that form the emotional cycle of a relationship...",
  "From the moment people meet until they drift apart, those elements still remain...",
  "Even the connections that seem to have ended continue to exist in quieter ways...",
];

// Timing main text 
const MAIN_TEXT_TYPING_SPEED = 55;   
const MAIN_TEXT_DELAY        = 2000; 
const FINAL_MAIN_TEXT_DELAY  = 8000; 
const BAR_LEAD_TIME          = 2500; 

// — State main text typing —
let mainTextTypingState = {
  messageIndex:  0,    
  charCount:     0,    
  lastType:      0,     
  completedTime: null,  
  finishedAll:   false,
  finishedTime:  null   
};


// BAR (TEXT ↔ PARTICLES)
const BAR_DELAY = 0;

let barAlpha  = 0;    // độ trong suốt bar 
let barAppear = null; 


// MAIN BOX — FINAL MAIN TEXT + NEXT BUT 
const FINAL_MAIN_TEXT = "And even when forgotten or changed by time, those memories still exist somewhere within us.";
const NEXT_TEXT       = "NEXT";

// Timing 
const NEXT_DELAY = 2200; 

// State final text 
let finalMainTextState = {
  started:       false, 
  charCount:     0,     
  lastType:      0,     
  completed:     false, 
  completedTime: null,  
  _realFinished: null   
};

let nextAlpha  = 0;    // độ trong suốt nút NEXT 
let nextAppear = null; 


// UI ICONS (camera + music)
const ICON_SIZE   = 38; 
const ICON_MARGIN = 14; 
const ICON_TOP    = 16; 



// PHẦN 2: MUSIC
// Tạo AudioContext và load file nhạc bgS.wav
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
      resumeMusic(); // tiếp tục từ thời điểm session đã lưu
    })
    .catch(e => console.warn("Music load failed:", e));
}

// Bắt đầu phát nhạc từ (giây) bất kỳ
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

// Trả về vị trí hiện tạitrong bài nhạc
function getMusicTime() {
  if (!musicStarted || !musicCtx) return 0;
  return (musicOffset + (musicCtx.currentTime - musicStartTime)) % musicBuffer.duration;
}

// Lưu thời điểm đang phát
function saveMusicTime() {
  if (musicStarted) sessionStorage.setItem(MUSIC_KEY, getMusicTime().toString());
}

// Đọc offset đã lưu trong session và tiếp tục phát
function resumeMusic() {
  const isNavigating = sessionStorage.getItem("isNavigating") === "true";
  const returnToLanding = sessionStorage.getItem("returnToLanding") === "true";
  sessionStorage.removeItem("isNavigating");
  sessionStorage.removeItem("returnToLanding");
  if (returnToLanding) return;
  let offset = 0;
  if (isNavigating) {
    const saved = sessionStorage.getItem(MUSIC_KEY);
    offset = saved ? parseFloat(saved) : 0;
  }
  playMusic(offset);
}

// Bật /tắt tiếng — cập nhật gainNode ngay lập tức
function setMusicMute(muted) {
  isMuted = muted;
  sessionStorage.setItem(MUSIC_MUTED_KEY, muted.toString());
  if (gainNode) gainNode.gain.setTargetAtTime(muted ? 0 : 1, musicCtx.currentTime, 0.05);
}

// Tự động lưu nhạc
window.addEventListener("beforeunload", saveMusicTime);


// PHẦN 3: PAGE TRANSITION OVERLAY
// Inject CSS + tạo div overlay vào DOM 
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

// Fade sang một URL
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

// Fade rồi chuyển qua loading.html
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

// Fade in khi trang vừa load xong
function fadeInLoading() {
  const overlay = document.getElementById("page-fade-overlay");
  if (!overlay) return;
  overlay.style.transition   = "none";
  overlay.style.opacity      = "1";
  overlay.style.pointerEvents = "all";
  overlay.classList.remove("fade-out");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition   = "opacity 0.6s ease";
      overlay.style.opacity      = "0";
      overlay.style.pointerEvents = "none";
    });
  });
}

// PHẦN 4: SETUP & DRAW 

// Tắt anti-aliasing để pixel sharp
function disableSmoothing() {
  noSmooth();
  drawingContext.imageSmoothingEnabled       = false;
  drawingContext.msImageSmoothingEnabled     = false;
  drawingContext.webkitImageSmoothingEnabled = false;
}

// Chạy 1 lần khi trang load
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

  // Tạo 5 quả cầu ngẫu nhiên
  for (let i = 0; i < 5; i++) {
    spheres.push(new Sphere(
      random(220, width - 220),
      random(220, height - 220),
      random(90, 120),
      wordsSphere[i], sphereColors[i]
    ));
  }

  // Slider ẩn
  slider = createSlider(0, 100, 0);
  slider.position(-9999, -9999);
  slider.style("opacity", "0");
  slider.style("pointer-events", "none");
}

// Vòng lặp render
function draw() {
  background(252, 235, 222);
  drawingContext.imageSmoothingEnabled = false;

  // Lớp nền
  updateDustParticlesBg();
  drawDustParticlesBg();

  // Cập nhật bar nếu đang kéo
  if (barDragging) updateBar();

  // Đang trong hiệu ứng chuyển màn
  if (transitionState !== null) {
    updateOrbitalScene();
    drawTransition();
    return;
  }

  // Màn Landing
  if (currentScreen === "landing") {
    drawLanding();
    return;
  }

  // Màn Orbitals
  cursor(ARROW);
  updateOrbitalScene();
  drawOrbitalScene();
  drawMainBox();
  updateGuide();
  drawGuide();
  drawUIIcons();
}

// PHẦN 5: BACKGROUND DUST
// Tạo toàn bộ hạt bụi
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

// Cập nhật vật lý
function updateDustParticlesBg() {
  const t = frameCount;
  for (let p of dustParticlesBg) {
    // Hướng bay thay đổi nhẹ theo noise
    const targetAngle =
      p.driftAngle + map(noise(p.turnOffset, t * p.turnSpeed), 0, 1, -0.9, 0.9);
    p.driftHeading = lerpAngle(p.driftHeading, targetAngle, 0.04);
    p.vx = lerp(p.vx, cos(p.driftHeading) * p.driftSpeed, 0.09);
    p.vy = lerp(p.vy, sin(p.driftHeading) * p.driftSpeed, 0.09);
    p.x += p.vx;
    p.y += p.vy;
    // Sway nhỏ để tạo cảm giác nổi
    p.renderX = p.x + sin(t * p.swaySpeedX + p.swayPhaseX) * p.swayRadiusX;
    p.renderY = p.y + cos(t * p.swaySpeedY + p.swayPhaseY) * p.swayRadiusY;
    // Wrap quanh màn
    const margin = p.glowSize * 0.5 + 4;
    if (p.x < -margin)        p.x = width  + margin;
    else if (p.x > width  + margin) p.x = -margin;
    if (p.y < -margin)        p.y = height + margin;
    else if (p.y > height + margin) p.y = -margin;
  }
}

// Vẽ từng hạt bụi
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
// Khởi tạo state
function buildLanding() {
  const now = millis();
  landingState = {
    titleCount:          0,
    headphonesCount:     0,
    titleLastType:       now - TITLE_TYPING_SPEED,      // bắt đầu gõ ngay
    headphonesLastType:  now - HEADPHONES_TYPING_SPEED,
    titleDone:           null,  // millis() khi title xong
    headphonesDone:      null,  // millis() khi headphones xong
    buttonProgress:      0      // 0→1: nút START fade in
  };
}

// Update state mỗi frame
function updateLanding() {
  const now = millis();

  // Gõ title từng ký tự
  if (landingState.titleCount < LANDING_TITLE.length) {
    const elapsed = now - landingState.titleLastType;
    if (elapsed >= TITLE_TYPING_SPEED) {
      const steps = floor(elapsed / TITLE_TYPING_SPEED);
      landingState.titleCount = min(LANDING_TITLE.length, landingState.titleCount + steps);
      landingState.titleLastType += steps * TITLE_TYPING_SPEED;
      if (landingState.titleCount === LANDING_TITLE.length && landingState.titleDone === null)
        landingState.titleDone = now;
    }
    return;
  }

  // Chờ sau title xong mới gõ headphones
  if (landingState.titleDone !== null && now - landingState.titleDone < 1000) {
    landingState.headphonesLastType = now;
    return;
  }

  // Gõ headphones từng ký tự
  if (landingState.headphonesCount < LANDING_HEADPHONES.length) {
    const elapsed = now - landingState.headphonesLastType;
    if (elapsed >= HEADPHONES_TYPING_SPEED) {
      const steps = floor(elapsed / HEADPHONES_TYPING_SPEED);
      landingState.headphonesCount = min(LANDING_HEADPHONES.length, landingState.headphonesCount + steps);
      landingState.headphonesLastType += steps * HEADPHONES_TYPING_SPEED;
      if (landingState.headphonesCount === LANDING_HEADPHONES.length && landingState.headphonesDone === null)
        landingState.headphonesDone = now;
    }
    return;
  }

  // Chờ sau headphones xong mới hiện nút START
  if (landingState.headphonesDone !== null && now - landingState.headphonesDone < 1000) {
    landingState.buttonProgress = 0;
    return;
  }

  // Fade in nút START
  landingState.buttonProgress = min(1, landingState.buttonProgress + 0.0055);
}

// Vẽ landing 
function drawLanding(options = {}) {
  const { updateState = true, forceComplete = false, interactive = true } = options;
  if (updateState) updateLanding();

  const layout          = landingLayout();
  const titleCount      = forceComplete ? LANDING_TITLE.length      : landingState.titleCount;
  const headphonesCount = forceComplete ? LANDING_HEADPHONES.length : landingState.headphonesCount;
  const buttonProgress  = forceComplete ? 1 : landingState.buttonProgress;

  // Title "QUEN QUEN"
  push();
  fill(95, 168, 194);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width * 0.2, 100));
  textFont("Jersey 15");
  text(LANDING_TITLE.slice(0, titleCount), floor(width / 2), floor(layout.titleY));
  pop();

  // Headphones subtitle
  if (titleCount === LANDING_TITLE.length) {
    push();
    fill(125, 32, 39);
    textAlign(CENTER, BOTTOM);
    textStyle(NORMAL);
    textSize(min(width * 0.027, 24));
    textFont("Jersey 15");
    text(
      LANDING_HEADPHONES.slice(0, headphonesCount),
      width * 0.12, layout.headphonesY - 34,
      width * 0.76, 34
    );
    pop();
  }

  // Nút START
  if (headphonesCount === LANDING_HEADPHONES.length) {
    drawStartBut(layout.buttonY, buttonProgress, interactive);
  } else if (interactive) {
    cursor(ARROW);
  }
}

// Nút START
// Vẽ nút START 
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

// Tính vị trí + kích thước nút START
function getStartButRect(y) {
  push();
  textFont("Jersey 15");
  textSize(START_BUT_SIZE);
  textStyle(NORMAL);
  const textW = textWidth("START");
  pop();
  return { x: width / 2, y, w: max(98, textW + 40), h: START_BUT_SIZE + 20 };
}

// Kiểm tra mouse có đang hover nút START không
function hoverStartBut(button) {
  return (
    landingState.buttonProgress > 0.95 &&
    mouseX >= button.x - button.w / 2 &&
    mouseX <= button.x + button.w / 2 &&
    mouseY >= button.y - button.h / 2 &&
    mouseY <= button.y + button.h / 2
  );
}

// Layout helper 

// Vị trí Y của title / button / headphones theo chiều cao màn
function landingLayout() {
  const groupCenterY = height * 0.5;
  return {
    titleY:      groupCenterY - max(44, height * 0.06),
    buttonY:     groupCenterY + max(30, height * 0.04),
    headphonesY: height - max(26, height * 0.035)
  };
}

// Kích hoạt chuyển sang Orbitals

// Khi user bấm START — reset và bắt đầu transition
function enterOrbitalScene() {
  if (transitionState !== null) return;
  transitionState = { startTime: millis() };
  sessionStorage.removeItem(MUSIC_KEY);

  // Bắt đầu / restart nhạc từ đầu
  if (!musicStarted && musicReady) playMusic(0);
  else if (musicStarted) playMusic(0);

  // Reset main text 
  mainTextTypingState = {
    messageIndex: 0, charCount: 0, lastType: millis(),
    completedTime: null, finishedAll: false, finishedTime: null
  };

  // Reset final text 
  finalMainTextState = {
    started: false, charCount: 0, lastType: 0,
    completed: false, completedTime: null, _realFinished: null
  };

  // Reset next but + bar
  nextAlpha  = 0;
  nextAppear = null;
  barAlpha   = 0;
  barAppear  = null;

  // Reset guide 
  guidePhase1Done = null;
  mainTextAllowed = false;
  guideState = {
    charCount: 0, lastType: 0, started: false,
    startTime: millis() + TRANSITION_DURATION, // bắt đầu sau khi transition xong
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
// Hiệu ứng mỗi frame trong lúc transition
function drawTransition() {
  const elapsed       = millis() - transitionState.startTime;
  const transitionRaw = constrain(elapsed / TRANSITION_DURATION, 0, 1);
  const transitionEased = easeInOutCubic(transitionRaw);

  cursor(ARROW);
  // Orbitals fade in
  drawLayerAlpha(() => drawOrbitalScene(), transitionEased, 1);
  // Landing fade out
  drawLayerAlpha(
    () => drawLanding({ updateState: false, forceComplete: true, interactive: false }),
    1 - transitionEased, 1
  );

  // Transition xong → chuyển màn 
  if (transitionRaw >= 1) {
    transitionState = null;
    currentScreen   = "orbitals";
    slider.show();
    cursor(ARROW);
    guideState.startTime = millis();
  }
}

// Vẽ một layer
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
// Logic gõ chữ 
function updateGuide() {
  if (currentScreen !== "orbitals") return;
  const now = millis();

  // Chờ delay trước khi bắt đầu
  if (!guideState.started) {
    if (now - guideState.startTime > GUIDE_1_DELAY) {
      guideState.started  = true;
      guideState.lastType = now;
    }
    return;
  }

  // Gõ guide text từng ký tự
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

  // Sau khi guide 1 xong → gõ main text
  if (!mainTextAllowed && guidePhase1Done !== null) {
    if (now - guidePhase1Done >= MAIN_TEXT_DELAY_AFTER_GUIDE) {
      mainTextAllowed = true;
      mainTextTypingState.lastType = now;
    }
  }

  // Flicker trong lúc chờ
  if (guideState.done && !guideState.phase2Started) {
    tickGuideFlicker(GUIDE_TEXT_1, now);
  }

  // Sau khi main text xong → set trigger pha 2
  if (mainTextTypingState.finishedAll && guideState.phase2Trigger === null) {
    guideState.phase2Trigger = mainTextTypingState.finishedTime;
  }

  // Gõ guide text pha 2
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

  // Flicker pha 2 sau khi gõ xong
  if (guideState.phase2Done) tickGuideFlicker(GUIDE_TEXT_2, now);
}

// Chọn ngẫu nhiên ký tự để nhấp nháy
function tickGuideFlicker(fullText, now) {
  if (now < guideFlicker.nextFlicker) return;
  const count = floor(random(1, 3));
  guideFlicker.indices = [];
  for (let i = 0; i < count; i++) guideFlicker.indices.push(floor(random(fullText.length)));
  guideFlicker.nextFlicker = now + guideFlicker.flickerSpeed + random(-400, 400);
}

// Vẽ guide text lên canvas 
function drawGuide() {
  if (!guideState.started || guideState.charCount === 0) return;
  push();
  textFont("Jersey 15");
  textAlign(CENTER, CENTER);
  textSize(18);
  noStroke();
  const now          = millis();
  const usePhase2    = guideState.phase2Started;
  const fullText     = usePhase2 ? GUIDE_TEXT_2 : GUIDE_TEXT_1;
  const displayCount = usePhase2 ? guideState.phase2CharCount : guideState.charCount;

  // Tính tổng chiều rộng để căn giữa
  let totalW = 0;
  for (let i = 0; i < displayCount; i++) totalW += textWidth(fullText[i]);
  let startX = width / 2 - totalW / 2;

  // Vẽ từng ký tự, flicker nếu được chọn
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

// PHẦN 9: SPHERES (5 quả cầu chữ 3D)
class Sphere {
  constructor(x, y, r, chars, col) {
    this.pos  = createVector(x, y);
    this.vel  = p5.Vector.random2D().mult(random(0.01, 0.08));
    this.r    = r;               // bán kính 
    this.screenRadius = r;       // bán kính đằng sau
    this.chars = chars;          // chữ hiển thị
    this.col   = col;            // màu

    // Góc xoay 3 trục
    this.rotY = random(TWO_PI); this.rotX = random(TWO_PI); this.rotZ = random(TWO_PI);
    this.rotYSpeed = random(0.001, 0.002);
    this.rotXSpeed = random(0.0004, 0.001);
    this.rotZSpeed = random(-0.001, 0.001);

    // Độ sâu + noise offset
    this.depth        = random(-70, 90);
    this.depthOffset  = random(1000);
    this.driftOffsetX = random(1000);
    this.driftOffsetY = random(1000);
    this.homeOffsetX  = random(2000);
    this.homeOffsetY  = random(2000);

    // Chuyển động
    this.maxSpeed        = random(1.2, 2.2);
    this.freeFlight      = 0;              // tăng khi bị đẩy bởi chuột
    this.homeBase        = createVector(x, y); // điểm gốc cố định
    this.home            = createVector(x, y); // điểm gốc drift theo noise
    this.roamRadiusX     = random(220, 420);
    this.roamRadiusY     = random(180, 380);
    this.homeDriftRadius = random(60, 120);
    this.separationBoost = random(0.9, 1.15); // hệ số đẩy khi chạm cầu khác

    this.points = [];
    this.makeSphere();
  }

  // Tạo các điểm trên mặt cầu
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
    // Điểm phân bố spread cho particle mode
    const extraParticles = 800;
    for (let i = 0; i < extraParticles; i++) {
      let ny         = 1 - (i / (extraParticles - 1)) * 2;
      let ringRadius = sqrt(1 - ny * ny);
      let theta      = i * 2.399963;
      this.addPoint(cos(theta) * ringRadius, ny, sin(theta) * ringRadius, false, i);
    }
  }

  // Thêm 1 điểm vào mảng points
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

  // Đẩy xa các cầu khác
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

  // Cập nhật vị trí + xoay
  update() {
    const t     = frameCount * 0.0024;
    const homeT = frameCount * 0.0011;
    this.freeFlight = max(0, this.freeFlight - 0.018);

    // Home drift nhẹ theo noise
    this.home.x = constrain(
      this.homeBase.x + map(noise(this.homeOffsetX, homeT), 0, 1, -this.homeDriftRadius, this.homeDriftRadius),
      this.r + 90, width - this.r - 90
    );
    this.home.y = constrain(
      this.homeBase.y + map(noise(this.homeOffsetY, homeT), 0, 1, -this.homeDriftRadius * 0.8, this.homeDriftRadius * 0.8),
      this.r + 100, height - this.r - 100
    );

    // Roam xung quanh home
    const targetX = this.home.x + map(noise(this.driftOffsetX, t), 0, 1, -this.roamRadiusX, this.roamRadiusX);
    const targetY = this.home.y + map(noise(this.driftOffsetY, t), 0, 1, -this.roamRadiusY, this.roamRadiusY);
    const steer   = createVector(targetX - this.pos.x, targetY - this.pos.y)
      .mult(lerp(0.00015, 0.0006, 1 - this.freeFlight));

    this.vel.add(steer);
    this.vel.limit(this.maxSpeed + this.freeFlight * 2.4);
    this.pos.add(this.vel);

    // Giữ trong màn
    const padding = this.r * 0.95;
    if (this.pos.x < padding)            this.vel.x += (padding - this.pos.x) * 0.03;
    if (this.pos.x > width  - padding)   this.vel.x -= (this.pos.x - (width  - padding)) * 0.03;
    if (this.pos.y < padding)            this.vel.y += (padding - this.pos.y) * 0.03;
    if (this.pos.y > height - padding)   this.vel.y -= (this.pos.y - (height - padding)) * 0.03;

    this.vel.mult(0.999);

    // Xoay 3 trục
    this.rotY += this.rotYSpeed;
    this.rotX += this.rotXSpeed;
    this.rotZ += this.rotZSpeed;

    // Depth drift
    let targetDepth = map(noise(this.depthOffset, t * 0.8), 0, 1, -95, 120);
    this.depth      = lerp(this.depth, targetDepth, 0.035);
    this.screenRadius = this.r * (CAMERA_DISTANCE / (CAMERA_DISTANCE - this.depth));
  }

  // Đẩy các điểm ra khi hover chuột
  interact() {
    const mouseRadius = 50;
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

  // Render cầu
  display() {
    push();
    translate(this.pos.x, this.pos.y);

    const textFade     = constrain(map(morphRatio, 0, 0.5, 255, 0), 0, 255);
    const particleFade = constrain(map(morphRatio, 0.3, 1.0, 0, 255), 0, 255);

    const renderPoints = [];

    // Tính toán vị trí + phối cảnh
    for (let p of this.points) {
      let x = p.baseX, y = p.baseY, z = p.baseZ;
      let pulse = 1 + sin(frameCount * 0.018 + p.baseY * 0.03 + this.depthOffset) * 0.012;
      x *= pulse; y *= pulse; z *= pulse;

      p.x += (x - p.x) * 0.00001 + p.vx;
      p.y += (y - p.y) * 0.00001 + p.vy;
      p.z += (z - p.z) * 0.2;
      p.vx *= 0.92; p.vy *= 0.92;

      // Xoay 3 trục
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

    // Sắp xếp theo độ sâu
    renderPoints.sort((a, b) => a.worldZ - b.worldZ);

    // Text mode
    if (textFade > 0) {
      noStroke();
      const textItems = [];
      for (let item of renderPoints) {
        if (!item.point.textSlot) continue;
        const sz        = constrain(22 * item.perspective, 5, 24);
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

    // Particle mode
    if (particleFade > 0) {
      noStroke();
      for (let item of renderPoints) {
        fill(this.col[0], this.col[1], this.col[2], item.alpha * (particleFade / 255));
        circle(floor(item.mx), floor(item.my), constrain(2.3 * item.perspective, 1.7, 5.8));
      }
    }

    pop();
  }
}

// Cập nhật toàn bộ orbitals scene
function updateOrbitalScene() {
  updateMainText();
  updateFinalMainTextTyping();

  // Fade in nút NEXT
  if (nextAppear !== null) {
    const now = millis();
    if (now >= nextAppear) nextAlpha = min(255, nextAlpha + 5);
  }

  // Fade in bar
  if (barAppear !== null) {
    const now = millis();
    if (now >= barAppear) barAlpha = min(255, barAlpha + 8);
  }

  morphRatio = barValue / 100;

  for (let s of spheres) { s.separate(spheres); s.update(); }
  for (let s of spheres) s.interact();
}

// 5 quả cầu (sắp xếp từ xa đến gần)
function drawOrbitalScene() {
  let orderedSpheres = [...spheres].sort((a, b) => a.depth - b.depth);
  for (let s of orderedSpheres) s.display();
}

// PHẦN 10 — MAIN BOX
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

  // Chờ MAIN_TEXT_DELAY rồi chuyển đoạn tiếp
  if (mainTextTypingState.completedTime !== null &&
      now - mainTextTypingState.completedTime > MAIN_TEXT_DELAY) {
    if (mainTextTypingState.messageIndex < MAIN_TEXT_MESSAGES.length - 1) {
      mainTextTypingState.messageIndex++;
      mainTextTypingState.charCount      = 0;
      mainTextTypingState.lastType       = now;
      mainTextTypingState.completedTime  = null;
    } else {
      // Hết 3 đoạn → hiện bar
      mainTextTypingState.finishedAll  = true;
      mainTextTypingState.finishedTime = now - BAR_LEAD_TIME;
      barAppear = now + BAR_DELAY;
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
      nextAppear = now + NEXT_DELAY; // kích hoạt fade in nút NEXT
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

  // Tag text 
  fill(125, 32, 39);
  textAlign(CENTER, CENTER);
  textFont("Jersey 15");
  textSize(22);
  text("Orbitals", floor(x) + 63, floor(y) - 4);

  // Bar (TEXT ↔ PARTICLES)
  if (barAlpha > 0) {
    const barW = 130;
    const barH = 7;
    const barX = x + boxW - barW;
    const barY = y - 24;

    const hoveringBar =
      mouseX >= barX - 10 && mouseX <= barX + barW + 10 &&
      mouseY >= barY - 20 && mouseY <= barY + 20;
    if (hoveringBar && barAlpha > 200) cursor(HAND);

    // Label bar
    fill(125, 32, 39, barAlpha);
    noStroke();
    textAlign(CENTER, CENTER);
    textFont("Jersey 15");
    textSize(14);
    text("TEXT <-> PARTICLES", floor(barX + barW / 2), floor(barY - 16));

    // Track bar
    noFill();
    stroke(153, 148, 54, barAlpha);
    strokeWeight(1);
    rect(floor(barX), floor(barY), barW, barH, 10);

    // Handle bar
    noStroke();
    fill(125, 32, 39, barAlpha);
    const handleX = map(barValue, 0, 100, barX + 8, barX + barW - 8);
    circle(floor(handleX), floor(barY + barH / 2), 15);
  }

  // Main text / Final text
  fill(125, 32, 39);
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Jersey 15");
  textSize(20);
  if (mainTextAllowed) {
    text(typed, floor(x) + 28, floor(y) + boxH / 2, textAreaW);
  }

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
    text(NEXT_TEXT, floor(nextButX), floor(nextButY) - 1);
  }

  pop();
}

// PHẦN 11: UI ICONS
// Tính tâm 2 icon
function getIconRects() {
  const musicX = width - ICON_MARGIN - ICON_SIZE / 2;
  const camX   = width - ICON_MARGIN - ICON_SIZE - ICON_MARGIN - ICON_SIZE / 2;
  const iconY  = ICON_TOP + ICON_SIZE / 2;
  return {
    music: { x: musicX, y: iconY },
    cam:   { x: camX,   y: iconY }
  };
}

// Vẽ 2 icon 
function drawUIIcons() {
  if (currentScreen !== "orbitals") return;
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
  rect(camX, camY, 20, 14, 2);   // thân máy ảnh
  circle(camX, camY, 8);          // ống kính
  noFill(); stroke(125, 32, 39);
  rect(camX - 4, camY - 9, 8, 4, 1); // nóc máy ảnh

  // Icon music
  stroke(95, 168, 194); strokeWeight(1.5); fill(252, 235, 222);
  rectMode(CENTER);
  rect(floor(icons.music.x), floor(icons.music.y), ICON_SIZE, ICON_SIZE, 6);
  let musicX = floor(icons.music.x) - 5, musicY = floor(icons.music.y);
  noFill(); stroke(125, 32, 39); strokeWeight(1.4);
  // Hình loa
  beginShape();
  vertex(musicX-5, musicY-4); vertex(musicX, musicY-4); vertex(musicX+5, musicY-8);
  vertex(musicX+5, musicY+8); vertex(musicX, musicY+4); vertex(musicX-5, musicY+4);
  endShape(CLOSE);
  if (!isMuted) {
    // Sóng âm thanh
    noFill(); stroke(125, 32, 39); strokeWeight(1.2);
    arc(musicX+9, musicY, 8,  12, -PI*0.5, PI*0.5);
    arc(musicX+9, musicY, 14, 20, -PI*0.5, PI*0.5);
  } else {
    // Dấu X khi muted
    stroke(95, 168, 194); strokeWeight(1.8);
    line(musicX+7, musicY-7, musicX+14, musicY+7);
    line(musicX+14, musicY-7, musicX+7, musicY+7);
  }
  pop();
}

// Chụp ảnh màn hình và lưu file
function saveScreenshot() {
  saveCanvas("screenshot_" + day() + "_" + hour() + minute() + second(), "png");
}

// PHẦN 12: MOUSE EVENTS
function mousePressed() {

  // Click icon camera / music
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

  // Click nút NEXT → chuyển sang sketch2
  if (nextAlpha > 200) {
    const boxW      = min(width * 0.78, 820);
    const x         = width / 2 - boxW / 2;
    const padV      = 16;
    textFont("Jersey 15");
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
      goToNextScene(); return;
    }
  }

  // Click nút START
  if (transitionState === null && currentScreen === "landing" &&
      landingState.headphonesCount === LANDING_HEADPHONES.length) {
    const layout = landingLayout();
    if (hoverStartBut(getStartButRect(layout.buttonY))) { enterOrbitalScene(); return; }
  }

  // Click / drag bar
  if (mainTextTypingState.finishedAll && barAlpha > 200) {
    const boxW      = min(width * 0.78, 820);
    const x         = width / 2 - boxW / 2;
    const barW      = 130;
    const barX      = x + boxW - barW;
    const padV      = 16;
    textFont("Jersey 15"); textSize(20);
    const textAreaW  = boxW - 100 - 56 - 16;
    const lineH      = 20 * 1.4;
    const currentTyped = finalMainTextState.started
      ? FINAL_MAIN_TEXT.slice(0, finalMainTextState.charCount)
      : MAIN_TEXT_MESSAGES[mainTextTypingState.messageIndex].slice(0, mainTextTypingState.charCount);
    const lines = max(1, countMainTextLines(currentTyped, textAreaW));
    const boxH  = lines * lineH + padV * 2;
    const barY  = (height - 40 - boxH) - 24;
    if (mouseX >= barX - 30 && mouseX <= barX + barW + 30 &&
        mouseY >= barY - 30 && mouseY <= barY + 30) {
      barDragging = true; updateBar(); return;
    }
  }
}

function mouseReleased() {
  barDragging = false;
}

// Tính lại bar theo vị trí chuột X
function updateBar() {
  const boxW = min(width * 0.78, 820);
  const x    = width / 2 - boxW / 2;
  const barW = 130;
  const barX = x + boxW - barW;
  barValue   = constrain(map(mouseX, barX, barX + barW, 0, 100), 0, 100);
}
// PHẦN 13: UTILITIES
// Góc theo đường ngắn nhất (tránh flip)
function lerpAngle(start, end, amt) {
  let diff = ((end - start + PI) % TWO_PI) - PI;
  if (diff < -PI) diff += TWO_PI;
  return start + diff * amt;
}

// Easing: ease out
function easeOutCubic(t)   { return 1 - pow(1 - t, 3); }

// Easing: ease in-out
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - pow(-2*t+2, 3)/2; }

// Chuyển sang sketch2 qua loading screen
function goToNextScene() { goViaLoading("sketch2.html"); }

// Resize canvas
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  disableSmoothing();
  setupDustParticlesBg();
}
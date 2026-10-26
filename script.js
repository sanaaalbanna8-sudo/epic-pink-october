(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const progress = document.getElementById("progress");
  const counter = document.getElementById("counter");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const dotsWrap = document.getElementById("dots");
  const soundBtn = document.getElementById("soundBtn");
  const gate = document.getElementById("gate");
  const startBtn = document.getElementById("startBtn");
  const hint = document.getElementById("hint");
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");

  let index = 0;
  let muted = false;
  let audioCtx = null;
  let particles = [];
  let confettiRunning = false;
  let hintTimer = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function tone(freq, duration, type, gainValue, delay) {
    if (muted) return;
    const ctxA = ensureAudio();
    const t0 = ctxA.currentTime + (delay || 0);
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playWhoosh() {
    if (muted) return;
    const ctxA = ensureAudio();
    const t0 = ctxA.currentTime;
    const bufferSize = ctxA.sampleRate * 0.25;
    const buffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctxA.createBufferSource();
    noise.buffer = buffer;
    const filter = ctxA.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, t0);
    filter.frequency.exponentialRampToValueAtTime(2200, t0 + 0.2);
    const gain = ctxA.createGain();
    gain.gain.setValueAtTime(0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctxA.destination);
    noise.start(t0);
  }

  function playClick() {
    tone(880, 0.08, "triangle", 0.08);
    tone(1320, 0.1, "sine", 0.05, 0.03);
  }

  function playSlideChime() {
    playWhoosh();
    tone(523.25, 0.14, "sine", 0.1);
    tone(659.25, 0.14, "sine", 0.09, 0.07);
    tone(783.99, 0.18, "sine", 0.08, 0.14);
  }

  function playStartFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone(f, 0.22, "triangle", 0.1, i * 0.09));
  }

  function playPop() {
    tone(640, 0.07, "square", 0.04);
    tone(980, 0.1, "sine", 0.07, 0.04);
  }

  function playFinish() {
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    notes.forEach((f, i) => tone(f, 0.28, "sine", 0.09, i * 0.1));
  }

  function burstConfetti(extra) {
    const colors = ["#ff2d7a", "#ff6b9d", "#ffc857", "#7ec8ff", "#5ee0b5", "#ff9ec8", "#ffffff"];
    const count = extra || 48;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 80,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 90 + Math.random() * 50,
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(tickConfetti);
    }
  }

  function heartBurst() {
    const colors = ["#ff2d7a", "#ff6b9d", "#ffc857"];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        w: 8,
        h: 8,
        vx: Math.cos(angle) * (3 + Math.random() * 3),
        vy: Math.sin(angle) * (3 + Math.random() * 3),
        rot: angle,
        vr: 0.1,
        color: colors[i % colors.length],
        life: 70,
        heart: true,
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(tickConfetti);
    }
  }

  function tickConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life / 80);
      ctx.fillStyle = p.color;
      if (p.heart) {
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-8, -4, -8, -12, 0, -8);
        ctx.bezierCurveTo(8, -12, 8, -4, 0, 4);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (particles.length) {
      requestAnimationFrame(tickConfetti);
    } else {
      confettiRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function renderDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot" + (i === index ? " active" : "");
      b.setAttribute("aria-label", `Slide ${i + 1}`);
      b.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(b);
    });
  }

  function updateUI() {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
    progress.style.width = `${((index + 1) / total) * 100}%`;
    counter.textContent = `${index + 1} / ${total}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    renderDots();
  }

  function goTo(i, withSound) {
    if (i < 0 || i >= total || i === index) return;
    index = i;
    updateUI();
    if (withSound) playSlideChime();
    burstConfetti(28);
    if (index === total - 1) {
      playFinish();
      heartBurst();
      burstConfetti(70);
    }
    showHintBriefly();
  }

  function showHintBriefly() {
    if (!hint) return;
    hint.classList.add("show");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove("show"), 2200);
  }

  prevBtn.addEventListener("click", () => {
    playClick();
    goTo(index - 1, true);
  });

  nextBtn.addEventListener("click", () => {
    playClick();
    goTo(index + 1, true);
  });

  document.addEventListener("keydown", (e) => {
    if (gate && !gate.classList.contains("hide")) return;
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      goTo(index + 1, true);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goTo(index - 1, true);
    } else if (e.key === "Home") {
      goTo(0, true);
    } else if (e.key === "End") {
      goTo(total - 1, true);
    } else if (e.key.toLowerCase() === "m") {
      toggleMute();
    }
  });

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mouseenter", () => playPop());
    card.addEventListener("click", () => {
      playPop();
      burstConfetti(16);
    });
  });

  function toggleMute() {
    muted = !muted;
    soundBtn.textContent = muted ? "🔇" : "🔊";
    soundBtn.classList.toggle("muted", muted);
    if (!muted) playClick();
  }

  soundBtn.addEventListener("click", toggleMute);

  startBtn.addEventListener("click", () => {
    ensureAudio();
    playStartFanfare();
    burstConfetti(80);
    heartBurst();
    gate.classList.add("hide");
    showHintBriefly();
  });

  // Soft ambient sparkle loop (very quiet)
  let sparkleId = null;
  function ambientSparkle() {
    if (!muted && audioCtx && gate.classList.contains("hide")) {
      const freqs = [1046.5, 1174.66, 1318.51];
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      tone(f, 0.35, "sine", 0.018);
    }
    sparkleId = setTimeout(ambientSparkle, 2800 + Math.random() * 2200);
  }

  const observer = new MutationObserver(() => {
    if (gate.classList.contains("hide") && !sparkleId) {
      ambientSparkle();
    }
  });
  observer.observe(gate, { attributes: true, attributeFilter: ["class"] });

  updateUI();
})();

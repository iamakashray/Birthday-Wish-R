/* ====== CHANGE THESE TWO ====== */
const CONFIG = {
  crushName: "Her Name",   // appears in big script font
  senderName: "Your Name", // appears at the end of the letters
  formspreeUrl: "https://formspree.io/f/xeaavljd", // paste your Formspree endpoint here
  musicVolume: 0.7
};
/* ============================== */

document.querySelectorAll("[data-name]").forEach(e => e.textContent = CONFIG.crushName);
document.querySelectorAll("[data-sender]").forEach(e => e.textContent = CONFIG.senderName);
document.title = "Happy Birthday " + CONFIG.crushName;

const screens = [...document.querySelectorAll(".screen")];
const audio = document.getElementById("bgm");
const musicBtn = document.getElementById("musicBtn");
audio.volume = CONFIG.musicVolume;
let cur = 0, timers = [];

/* ---- music ---- */
let userPaused = false;
const musicTxt = document.getElementById("musicTxt");
function playMusic() {
  if (screens[cur].dataset.type === "reel" || userPaused) return;
  audio.play().catch(() => {});
}
audio.addEventListener("playing", () => musicTxt.textContent = "Pause Song");
audio.addEventListener("pause", () => musicTxt.textContent = "Play Song");
// Browsers block sound until the first touch, so we try now and again on the first tap.
playMusic();
const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"];
function unlock(e) { if (e && e.target.closest && e.target.closest("#musicBtn")) return; playMusic(); }
unlockEvents.forEach(ev => document.addEventListener(ev, unlock));
// stop retrying only once the song is really playing
audio.addEventListener("playing", () => unlockEvents.forEach(ev => document.removeEventListener(ev, unlock)));
audio.addEventListener("error", () => console.warn("song1.mp3 could not be loaded. Check the file name and that it is in the same folder as index.html."));

musicBtn.addEventListener("click", () => {
  if (audio.paused) {
    userPaused = false;
    audio.play().catch(() => console.warn("Song could not play. Check that song1.mp3 is in the same folder."));
  } else {
    userPaused = true;
    audio.pause();
  }
});

/* ---- sparkles ---- */
const sp = document.getElementById("sparkles");
for (let i = 0; i < 16; i++) {
  const s = document.createElement("span");
  s.textContent = i % 2 ? "\u2726" : "\u2661";
  s.style.left = Math.random() * 100 + "%";
  s.style.fontSize = 10 + Math.random() * 14 + "px";
  s.style.animationDuration = 9 + Math.random() * 10 + "s";
  s.style.animationDelay = -Math.random() * 14 + "s";
  sp.appendChild(s);
}

/* ---- screen navigation ---- */
function show(i) {
  timers.forEach(clearTimeout); timers = [];
  document.querySelectorAll("video").forEach(v => v.pause());
  cur = i;
  const s = screens[i];
  screens.forEach((el, k) => el.classList.toggle("active", k === i));
  s.scrollTop = 0;
  const paper = s.querySelector(".paper");
  if (paper) paper.scrollTop = 0;

  musicBtn.classList.toggle("gone", s.dataset.type === "reel");

  if (s.dataset.type === "reel") {
    audio.pause();
    const v = s.querySelector("video"), next = s.querySelector(".next");
    next.classList.add("hidden");
    v.controls = false;
    v.currentTime = 0;
    v.muted = false;
    v.play().catch(() => { v.controls = true; });
    v.onended = () => next.classList.remove("hidden");
    v.onerror = () => next.classList.remove("hidden");
  } else {
    playMusic();
  }

  if (s.dataset.type === "letter") {
    s.classList.remove("flap-open", "opened");
    timers.push(setTimeout(() => s.classList.add("flap-open"), 500));
    timers.push(setTimeout(() => s.classList.add("opened"), 1700));
  }
}

document.querySelectorAll("[data-next]").forEach(b =>
  b.addEventListener("click", () => show(Math.min(cur + 1, screens.length - 1))));
document.getElementById("backBtn").addEventListener("click", () => show(0));

/* ---- final question: Yes / No + message form (FormSubmit.co, no backend needed) ---- */
function sendToMe(data) {
  if (!CONFIG.formspreeUrl || CONFIG.formspreeUrl.indexOf("YOUR_FORM_ID") !== -1) {
    console.warn("Set CONFIG.formspreeUrl in script.js to receive answers.");
    return Promise.resolve(false);
  }
  return fetch(CONFIG.formspreeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(Object.assign({ _subject: "Birthday page response" }, data))
  }).then(r => r.ok).catch(() => false);
}

function screenIndex(type) { return screens.findIndex(s => s.dataset.type === type); }

document.getElementById("yesBtn").addEventListener("click", () => {
  sendToMe({ answer: "YES - she tapped Yes" });
  show(screenIndex("yes"));
});
document.getElementById("noBtn").addEventListener("click", () => {
  sendToMe({ answer: "NO - she tapped No" });
  show(screenIndex("no"));
});

document.querySelectorAll(".msgform").forEach(form => {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button"), status = form.querySelector(".status");
    const text = form.querySelector("textarea").value.trim();
    if (!text) return;
    btn.disabled = true; status.textContent = "Sending...";
    const ok = await sendToMe({ answer: form.dataset.answer, message: text });
    status.textContent = ok ? "Sent. Thank you for reading this far." : "Could not send right now. Please try again in a little while.";
    btn.disabled = false;
    if (ok) form.querySelector("textarea").value = "";
  });
});

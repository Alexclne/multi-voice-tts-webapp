let voices = [];
let voicesByLocale = {};

const textInput = document.getElementById("textInput");
const langSelect = document.getElementById("langSelect");
const voiceSelect = document.getElementById("voiceSelect");
const speedRange = document.getElementById("speedRange");
const pitchRange = document.getElementById("pitchRange");
const speedValue = document.getElementById("speedValue");
const pitchValue = document.getElementById("pitchValue");
const generateBtn = document.getElementById("generateBtn");
const player = document.getElementById("player");
const downloadLink = document.getElementById("downloadLink");
const themeToggle = document.getElementById("themeToggle");

// === CARICA VOCI DAL BACKEND ===
async function loadVoices() {
  const res = await fetch("/voices");
  voices = await res.json();

  voicesByLocale = {};
  for (const v of voices) {
    if (!voicesByLocale[v.locale]) voicesByLocale[v.locale] = [];
    voicesByLocale[v.locale].push(v);
  }

  for (const locale of Object.keys(voicesByLocale).sort()) {
    const opt = document.createElement("option");
    opt.value = locale;
    opt.textContent = locale;
    langSelect.appendChild(opt);
  }

  updateVoiceSelect();
}

function updateVoiceSelect() {
  const locale = langSelect.value;
  const list = voicesByLocale[locale] || [];

  voiceSelect.innerHTML = "";

  list.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.short_name;
    opt.textContent = `${v.short_name} (${v.gender})`;
    voiceSelect.appendChild(opt);
  });
}

langSelect.addEventListener("change", updateVoiceSelect);

// === SLIDER VISUAL UPDATE ===
speedRange.addEventListener("input", () => {
  speedValue.textContent = speedRange.value;
});

pitchRange.addEventListener("input", () => {
  pitchValue.textContent = pitchRange.value;
});

// === TEMA DARK/LIGHT ===
function applyTheme(theme) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
  themeToggle.checked = theme === "dark";
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

themeToggle.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "dark" : "light");
});

// === GENERA AUDIO ===
generateBtn.addEventListener("click", generateAudio);

async function generateAudio() {
  const text = textInput.value.trim();
  const voice = voiceSelect.value;
  const speed = parseFloat(speedRange.value);
  const pitch = parseFloat(pitchRange.value);

  if (!text) {
    alert("Inserisci del testo!");
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generazione...";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, speed, pitch })
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    player.src = url;
    player.style.display = "block";

    downloadLink.href = url;
    downloadLink.download = "tts_output_audio.mp3";
    downloadLink.style.display = "inline-block";

  } catch (e) {
    console.error(e);
    alert("Errore durante la generazione dell'audio.");
  }

  generateBtn.disabled = false;
  generateBtn.textContent = "Genera Audio";
}

// === AVVIO ===
loadVoices();
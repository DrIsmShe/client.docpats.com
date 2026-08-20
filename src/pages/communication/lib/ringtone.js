// client/src/pages/communication/lib/ringtone.js
//
// Звук входящего вызова.
//
// Почему не просто <audio src="/sounds/ringtone.mp3">: такого файла в
// public/sounds нет и никогда не было — вызов play() отваливался 404, ошибку
// глушил .catch(() => {}), и входящий звонок приходил молча. Экран видно
// только тому, кто в этот момент смотрит на вкладку.
//
// Поэтому мелодия синтезируется на месте (WebAudio): два тона по классической
// схеме «гудок — гудок — пауза», никакого ассета добавлять не нужно и нечему
// потеряться при деплое. Если файл /sounds/ringtone.mp3 когда-нибудь появится,
// он будет использован автоматически — синтез останется запасным вариантом.
//
// Про автозапуск: браузер запрещает звук на странице, где пользователь ещё ни
// разу ничего не нажал. Обойти это нельзя — там звонок останется беззвучным,
// но окно вызова покажется в любом случае.

const RINGTONE_URL = "/sounds/ringtone.mp3";

// Схема гудка: 0.4с тон, 0.2с тишина, 0.4с тон, затем пауза до 3с.
const BEEP_MS = 400;
const GAP_MS = 200;
const CYCLE_MS = 3000;
const TONE_HZ = [440, 480]; // два тона одновременно — «телефонное» звучание

let audioEl = null;
let ctx = null;
let cycleTimer = null;

function playBeep() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const schedule = (startOffset) => {
    const gain = ctx.createGain();
    // Плавные фронты: щелчок на резком старте/стопе слышен громче самого тона.
    gain.gain.setValueAtTime(0, now + startOffset);
    gain.gain.linearRampToValueAtTime(0.18, now + startOffset + 0.02);
    gain.gain.setValueAtTime(0.18, now + startOffset + BEEP_MS / 1000 - 0.02);
    gain.gain.linearRampToValueAtTime(0, now + startOffset + BEEP_MS / 1000);
    gain.connect(ctx.destination);

    TONE_HZ.forEach((hz) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = hz;
      osc.connect(gain);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + BEEP_MS / 1000);
    });
  };

  schedule(0);
  schedule((BEEP_MS + GAP_MS) / 1000);
}

function startSynth() {
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!ctx) ctx = new Ctor();
    // Контекст мог быть заморожен политикой автозапуска — просим разбудить.
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    playBeep();
    clearInterval(cycleTimer);
    cycleTimer = setInterval(playBeep, CYCLE_MS);
  } catch (_) {
    /* без звука, но звонок работает */
  }
}

export function startRingtone() {
  stopRingtone();
  try {
    const el = new Audio(RINGTONE_URL);
    el.loop = true;
    el.volume = 0.7;
    // Файла может не быть — тогда сразу переходим на синтез.
    el.addEventListener("error", () => {
      audioEl = null;
      startSynth();
    });
    el.play().then(
      () => {
        audioEl = el;
      },
      () => {
        // Отказ play() — либо нет файла, либо запрет автозапуска. Синтез
        // упрётся в тот же запрет, но при разрешённом звуке спасёт от 404.
        audioEl = null;
        startSynth();
      },
    );
  } catch (_) {
    startSynth();
  }
}

export function stopRingtone() {
  if (audioEl) {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (_) {}
    audioEl = null;
  }
  clearInterval(cycleTimer);
  cycleTimer = null;
}

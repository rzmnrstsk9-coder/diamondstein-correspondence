// ambient-audio.js — a portable, user-toggleable ambient music bed (2026-07-23).
//
// The second shared served .js (after modal.js). A page opts in by setting window.AMBIENT_AUDIO
// = { src, label } and including the toggle markup (a <button id="ambient-toggle">), BEFORE this
// file loads. Any page can add the bed with those two lines -- it is not index-specific.
//
// Design (agreed with Fernando 2026-07-23):
//   - The music is AI-generated and OPTIONAL. It is off until the reader's first interaction, and a
//     visible toggle turns it off (or back on) at any time. It is never a surprise blast of sound.
//   - Browsers block autoplay WITH sound until the user interacts, so we do not even try: the first
//     scroll / click / key press is what starts it (and only if the reader hasn't chosen "off").
//   - It LOOPS, and it PERSISTS ACROSS PAGES: the on/off choice and the rough playback position are
//     kept in localStorage, so navigating between pages continues the bed instead of restarting it.
//   - prefers-reduced-motion is NOT wired to this. Reduced MOTION is not reduced SOUND; conflating
//     them would assert a preference the reader didn't express. The audio toggle is its own control.
(function () {
  const cfg = window.AMBIENT_AUDIO;
  if (!cfg || !cfg.src) return;                       // page didn't opt in

  // Self-inject the toggle's CSS with LITERAL values (not design tokens): the index page is
  // self-contained and does not link components.css / tokens.css, so the module can't depend on
  // them. Injecting here makes the player portable to ANY page -- include the JS + the markup and it
  // is styled, regardless of which stylesheets that page links. Colours match the site's dark chrome
  // (#0f0d0a ground, warm gold #c9a84c focus) but are hard-coded so nothing external is required.
  if (!document.getElementById('ambient-audio-css')) {
    const css = document.createElement('style');
    css.id = 'ambient-audio-css';
    css.textContent = `
/* The control is one fixed cluster: the mute button + its volume slider side by side, sharing a
   single plate. The slider is reader-facing (Paul, 2026-07-23) and attached to the icon, so the
   affordance reads as one thing: "the music control". It stays collapsed at rest so it isn't visual
   noise over the archive imagery, and expands on hover/focus-within — but it is ALWAYS in the DOM and
   keyboard-reachable (width, not display, is what animates), so tabbing to it works even collapsed. */
.ambient-audio{position:fixed;right:1.25rem;bottom:1.25rem;z-index:50;display:inline-flex;
  align-items:center;gap:0.5rem;padding:0.5rem 0.8rem;border:1px solid rgba(255,255,255,0.18);
  background:rgba(15,13,10,0.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:0.75rem;letter-spacing:0.04em;
  transition:border-color 0.2s ease;}
.ambient-audio:hover,.ambient-audio:focus-within{border-color:#c9a84c;}
.ambient-toggle{display:inline-flex;align-items:center;gap:0.5rem;padding:0;border:0;background:none;
  color:rgba(255,255,255,0.72);cursor:pointer;font:inherit;letter-spacing:inherit;}
.ambient-toggle:hover{color:#fff;}
.ambient-toggle:focus-visible{outline:2px solid #c9a84c;outline-offset:3px;}
.ambient-toggle-icon{width:1rem;height:1rem;display:block;flex:none;}
.ambient-audio[data-on="false"] .ambient-wave{opacity:0.18;}
.ambient-audio[data-on="true"] .ambient-wave{opacity:1;}
/* Collapsed by default; opens on hover/focus-within. Width+opacity animate (never display:none, which
   would drop it out of the tab order). */
.ambient-volume{width:0;opacity:0;margin:0;-webkit-appearance:none;appearance:none;height:2px;
  background:rgba(255,255,255,0.3);outline:none;flex:none;cursor:pointer;
  transition:width 0.25s ease,opacity 0.25s ease;}
.ambient-audio:hover .ambient-volume,.ambient-audio:focus-within .ambient-volume{width:72px;opacity:1;}
.ambient-volume::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:11px;height:11px;
  border-radius:50%;background:#e8c98a;cursor:pointer;border:0;}
.ambient-volume::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:#e8c98a;
  cursor:pointer;border:0;}
.ambient-volume:focus-visible{outline:2px solid #c9a84c;outline-offset:4px;}
@media (max-width:640px){.ambient-audio{right:0.9rem;bottom:0.9rem;padding:0.45rem 0.6rem;}
  .ambient-toggle-text{display:none;}
  /* Touch has no hover: keep the slider permanently open (narrower) so it's usable at all. */
  .ambient-volume{width:56px;opacity:1;}}
`;
    document.head.appendChild(css);
  }

  const KEY_ON = 'ambient-audio-on';                  // 'on' | 'off' (the reader's explicit choice)
  const KEY_POS = 'ambient-audio-pos';                // seconds, so the loop roughly continues
  const KEY_VOL = 'ambient-audio-vol';                // the reader's slider setting, 0..1
  const FADE_MS = 1400;                               // gentle in/out, never a hard cut

  // DEFAULT VOLUME — the dial to change if it sits too loud/quiet out of the box. A plain 0..1
  // fraction. Halved 0.55 -> 0.28 (Paul, 2026-07-23): it should sit clearly UNDER the reading.
  // A page can override it per-page with window.AMBIENT_AUDIO = { …, volume: 0.4 } without editing
  // this shared module; the reader's own slider setting (remembered) wins over both.
  const VOLUME = 0.28;

  const toggle = document.getElementById('ambient-toggle');
  const slider = document.getElementById('ambient-volume');

  // Precedence: the reader's remembered slider setting > this page's `volume` config > VOLUME.
  function defaultVolume() {
    const v = parseFloat(cfg.volume);
    return (v >= 0 && v <= 1) ? v : VOLUME;
  }

  // localStorage can throw (private mode / disabled). Degrade to in-memory rather than break the page.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  // The reader has explicitly turned it OFF if the stored choice says so. Absent = not-yet-chosen,
  // which means "may start on first interaction" (the default-on-after-interaction behaviour).
  let mutedByUser = store.get(KEY_ON) === 'off';

  // The live target volume: the reader's remembered slider setting if they've moved it, else the
  // page/module default. Every fade aims at THIS, so a mid-playback slider move takes effect at once.
  const storedVol = parseFloat(store.get(KEY_VOL));
  let level = (storedVol >= 0 && storedVol <= 1) ? storedVol : defaultVolume();

  const audio = new Audio(cfg.src);
  audio.loop = true;
  audio.preload = 'none';                             // don't fetch 3.6MB until it's actually wanted
  audio.volume = 0;                                   // fade up from silence
  const startAt = parseFloat(store.get(KEY_POS));
  if (startAt > 0) audio.addEventListener('loadedmetadata', () => {
    if (startAt < audio.duration) audio.currentTime = startAt;
  }, { once: true });

  let fadeTimer = null;
  function fadeTo(target, after) {
    if (fadeTimer) cancelAnimationFrame(fadeTimer);
    const from = audio.volume, start = performance.now();
    function step(now) {
      const k = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (target - from) * k;
      if (k < 1) { fadeTimer = requestAnimationFrame(step); }
      else if (after) after();
    }
    fadeTimer = requestAnimationFrame(step);
  }

  let playing = false;
  function play() {
    if (playing || mutedByUser) return;
    playing = true;
    audio.play().then(() => fadeTo(level)).catch(() => { playing = false; });   // play() can reject
    reflect();
  }
  function stop(remember) {
    fadeTo(0, () => { audio.pause(); });
    playing = false;
    if (remember) { mutedByUser = true; store.set(KEY_ON, 'off'); }
    reflect();
  }

  // The toggle reflects state and is a real, keyboard-operable button with aria-pressed. "pressed"
  // = sound ON (the affordance is "sound is on, press to turn off" and vice-versa).
  function reflect() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    toggle.setAttribute('aria-label', playing ? 'Turn music off' : 'Turn music on');
    // The state lives on the WRAPPER so it can style both the icon and the slider.
    const wrap = toggle.closest('.ambient-audio') || toggle;
    wrap.dataset.on = playing ? 'true' : 'false';
    toggle.dataset.on = playing ? 'true' : 'false';   // kept for pages using the older markup
    const t = toggle.querySelector('.ambient-toggle-text');
    if (t) t.textContent = playing ? (cfg.label || 'Music') : 'Music off';
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      if (playing) stop(true);
      else { mutedByUser = false; store.set(KEY_ON, 'on'); play(); }
    });
  }

  // VOLUME SLIDER (Paul, 2026-07-23) — optional: present only if the page includes
  // <input type="range" id="ambient-volume">. Moving it sets the level LIVE (no fade — a fade would
  // fight the drag), remembers it across pages, and, if the reader nudges it up while the music is
  // off, treats that as "turn it on" so the control does what it looks like it does.
  if (slider) {
    slider.min = '0'; slider.max = '1'; slider.step = '0.01';
    slider.value = String(level);
    slider.setAttribute('aria-label', 'Music volume');
    slider.addEventListener('input', () => {
      level = parseFloat(slider.value);
      store.set(KEY_VOL, level.toFixed(2));
      if (fadeTimer) { cancelAnimationFrame(fadeTimer); fadeTimer = null; }  // drag wins over a fade
      if (playing) audio.volume = level;
      else if (level > 0 && mutedByUser === false) play();
    });
  }

  // Persist the position periodically so navigation continues the bed. (timeupdate fires ~4x/s.)
  audio.addEventListener('timeupdate', () => {
    if (playing) store.set(KEY_POS, audio.currentTime.toFixed(1));
  });

  // Start on the FIRST interaction of any kind, once, unless the reader has turned it off. This is
  // the autoplay-policy-compliant "on after first interaction" behaviour.
  function firstInteraction() {
    ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(
      ev => window.removeEventListener(ev, firstInteraction, { capture: true }));
    play();
  }
  if (!mutedByUser) {
    ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(
      ev => window.addEventListener(ev, firstInteraction, { capture: true, passive: true, once: false }));
  }
  reflect();
})();

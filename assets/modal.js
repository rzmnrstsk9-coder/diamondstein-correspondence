// modal.js — the shared modal shell's behavior (modal-dedup, 2026-07-14). Verbatim lift of
// letters.html's rich JS (the canonical source: En<->Yiddish toggle + prev/next + zoom +
// ?jump=). Every door sets window.MODAL_CONFIG + window.MODAL_LETTERS (+ window.MODAL_PEOPLE
// where used) in its own inline <script> BEFORE this file loads. The honesty core
// (formatBody/esc/escape-at-build) is UNCONDITIONAL — no config key disables it.
(function() {
  const CONFIG = Object.assign(
    {langToggle: true, prevNext: true, personPrevNext: false, imgPathMatch: "root"}, window.MODAL_CONFIG || {});
  const letters = window.MODAL_LETTERS || [];
  const titleIndex = window.MODAL_TITLE_INDEX || {};
  const people = window.MODAL_PEOPLE || {};
  const personOrder = Object.keys(people);
  let personIdx = 0;

  // person-card's no-real-photo placeholder (2026-07-20), mirrored from element.py's
  // _SILHOUETTE_SVGS -- the same two SVGs, picked by the person island's `silhouette` field.
  const SILHOUETTES = {
    male: '<svg class="pm-silhouette" viewBox="0 0 100 100"><circle cx="50" cy="36" r="20" fill="#1a1a1a"/><path d="M12,96 C12,64 28,52 50,52 C72,52 88,64 88,96 Z" fill="#1a1a1a"/></svg>',
    female: '<svg class="pm-silhouette" viewBox="0 0 100 100"><path d="M50,12 C66,12 76,26 74,42 C73,48 70,52 67,55 L67,58 C78,62 88,72 88,96 L12,96 C12,72 22,62 33,58 L33,55 C30,52 27,48 26,42 C24,26 34,12 50,12 Z" fill="#1a1a1a"/></svg>',
  };

  const zoomOverlay = document.getElementById('zoom-overlay');
  const zoomOverlayImg = document.getElementById('zoom-overlay-img');
  const zoomOverlayCap = document.getElementById('zoom-overlay-cap');
  const zoomCloseBtn = document.getElementById('zoom-close');
  const zoomModalBtn = document.getElementById('zoom-modal-btn');

  // modalTitle (optional, 2026-08-13): when a zoomed scan belongs to a letter with a full
  // transcription available, a "Read full text & transcriptions" button appears alongside the
  // zoomed image so the reader doesn't have to close the zoom and hunt for the card's own link —
  // the letters door's letter-card-grid passes its own title here on thumbnail click. Every
  // other openZoom caller (story-excerpt's inline-figure, the person-modal's source-doc pages)
  // passes nothing, so the button stays hidden for them, same as the existing caption param.
  function openZoom(src, alt, caption = '', modalTitle = '') {
    zoomOverlayImg.src = src;
    zoomOverlayImg.alt = alt || '';
    if (zoomOverlayCap) {
      zoomOverlayCap.textContent = caption || '';       // escape-at-the-sink
      zoomOverlayCap.style.display = caption ? 'block' : 'none';
    }
    if (zoomModalBtn) {
      zoomModalBtn.style.display = modalTitle ? 'block' : 'none';
      zoomModalBtn.dataset.title = modalTitle || '';
    }
    zoomOverlay.classList.add('open');
    zoomCloseBtn.style.display = 'flex';
  }
  function closeZoom() {
    zoomOverlay.classList.remove('open');
    zoomCloseBtn.style.display = 'none';
    if (zoomModalBtn) zoomModalBtn.style.display = 'none';
  }
  zoomOverlay.addEventListener('click', closeZoom);
  zoomCloseBtn.addEventListener('click', closeZoom);
  if (zoomModalBtn) {
    zoomModalBtn.addEventListener('click', (e) => {
      e.stopPropagation();          // don't let the click also fall through to zoomOverlay's closeZoom
      const title = zoomModalBtn.dataset.title;
      closeZoom();
      if (title) openLetterModal(title);
    });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeZoom(); });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // The reusable confidence/uncertainty pattern (spec §3, non-configurable): escape FIRST
  // (untrusted corpus text), then turn inline markers into styled spans + reusable .tip
  // tooltips. Never removes a marker's meaning (honesty). Every door gets this unconditionally
  // — THIS is how the dedup fixes pictures.html's dropped-confidence-marker bug by construction.
  const GAP_TIP = { '[illegible]': 'Illegible in the scan', '[unclear]': 'Unclear in the scan',
                    '[uncertain]': 'Uncertain reading' };

  function formatBody(text) {
    let h = esc(text);
    // [note]...[/note]: a standalone editorial/provenance aside, collapsed by default (native
    // <details>, no JS state needed). Distinct from [low-confidence] below, which stays inline —
    // a note is a paragraph-length aside, never a phrase inside a sentence.
    h = h.replace(/\[note\]([\s\S]*?)\[\/note\]/g,
      (_, inner) => `<details class="editorial-note"><summary>Editorial note</summary>${inner}</details>`);
    h = h.replace(/\[low-confidence\]([\s\S]*?)\[\/low-confidence\]/g,
      (_, inner) => `<span class="conf-low tip" data-tip="Low confidence translation">${inner}</span>`);
    h = h.replace(/\[(illegible|unclear|uncertain)\]/g, (m, kind) =>
      `<span class="conf-gap tip" data-tip="${GAP_TIP['[' + kind + ']']}">[${kind}]</span>`);
    return h;
  }

  const order = letters.map((_, i) => i);
  let modalIdx = 0;
  let modalLang = 'en';

  const overlay = document.getElementById('letter-overlay');
  const personOverlay = document.getElementById('person-overlay');

  // Non-configurable feature visibility: langToggle/prevNext hide the rich chrome for doors
  // that don't use it, rather than forking the shared partial into two shapes.
  const capsuleEl = document.getElementById('lm-capsule');
  if (capsuleEl && !CONFIG.langToggle) capsuleEl.style.display = 'none';
  const navRowEl = document.getElementById('modal-nav-row');
  if (navRowEl && !CONFIG.prevNext) navRowEl.style.display = 'none';
  const personNavRowEl = document.getElementById('person-modal-nav-row');
  if (personNavRowEl && !CONFIG.personPrevNext) personNavRowEl.style.display = 'none';

  function setLang(lang) {
    if (!CONFIG.langToggle) return;
    const l = letters[order[modalIdx]];
    const hasYiddish = !!(l.yiddish && l.yiddish.length);
    if (lang === 'yi' && !hasYiddish) return;         // guard: never switch to an absent original
    modalLang = lang;
    document.getElementById('lm-lang-en').classList.toggle('on', lang === 'en');
    document.getElementById('lm-lang-yi').classList.toggle('on', lang === 'yi');
    const body = document.getElementById('lm-body');
    // PROVENANCE STAMP: data-field tracks the VISIBLE content so a "fix this" routes to the
    // right field — Yiddish shows the transcription, English shows the translation.
    if (lang === 'yi') { body.setAttribute('dir', 'rtl'); body.setAttribute('data-field', 'transcription'); body.innerHTML = formatBody(l.yiddish); }
    else { body.setAttribute('dir', 'ltr'); body.setAttribute('data-field', 'translation'); body.innerHTML = formatBody(l.translation); }
    setNotice(lang === 'yi', l);
  }

  // The Yiddish-only transcription notice. Rides the SAME switch as data-field above rather
  // than a parallel condition: the claim is about machine handwriting recognition, so it is
  // true of the transcription and false of the translation.
  function setNotice(show, l) {
    const notice = document.getElementById('lm-notice');
    if (!notice) return;                                 // door built before this shipped
    notice.hidden = !show;
    if (!show) return;
    const btn = document.getElementById('lm-notice-btn');
    if (!btn) return;
    // Address assembled at runtime from data-u/data-d — never plain text in the source.
    const addr = btn.dataset.u + '@' + btn.dataset.d;
    const id = l.item_id || '';
    // TITLE first, id second. `item_id` is an internal manifest path
    // (`manifest:letter/<slug>`) and this subject line lands in a stranger's inbox —
    // integrity rule #6 (no internal jargon in reader-facing text) applies to outbound
    // mail too. We still need the id to route the correction, so it rides along in
    // parentheses rather than being the whole subject.
    const subject = encodeURIComponent(
      'Correction: ' + (l.title || 'a letter') + (id ? ' (' + id + ')' : ''));
    // Deep link via `?jump=<title>` — the route this file ALREADY implements at load
    // (see the jumpTitle handler at the bottom). Verified before use: there is no hash
    // route here, and linking to one would produce a URL nothing consumes, landing the
    // reader on the index with no letter open. A link that silently does nothing is worse
    // than no link, and it would be us shipping the exact "quietly wrong" failure the
    // notice above apologises for.
    //
    // ⚠️ SWITCH THIS when per-letter permalinks ship. `docs/research/incoming/
    // 2026-07-29-pinterest-plan.md` records Paul's decided fork: every published letter
    // gets a real crawlable page (`/letters/<slug>.html`, naming TBD), and `?jump=` is
    // named there as what it supersedes for sharing — it reopens the whole index with a
    // modal on top and carries no per-letter metadata. Harmless for a correction email
    // (the recipient is us and it does land on the right letter), but this is the line to
    // update, and nothing else would point at it.
    const link = l.title
      ? location.origin + location.pathname + '?jump=' + encodeURIComponent(l.title)
      : location.origin + location.pathname;
    // encodeURIComponent, NOT URLSearchParams: mailto: is RFC 6068 and needs %20 for a
    // space, while URLSearchParams form-encodes it as '+' and the subject arrives literal.
    // (Same bug the outreach tool hit in s88 — fixed there, so do not reintroduce it here.)
    const body = encodeURIComponent(
      (l.title ? l.title + '\n' : '') +
      (l.date ? l.date + '\n' : '') +
      link + '\n\n' +
      'What the transcription currently says:\n\n\n' +
      'What it should say:\n\n\n' +
      'Anything else worth knowing (optional):\n\n\n' +
      '--\nReference (please keep): ' + id + '\n');
    btn.href = 'mailto:' + addr + '?subject=' + subject + '&body=' + body;
  }

  function _matchesImgPath(img) {
    return CONFIG.imgPathMatch === "anywhere"
      ? img.indexOf('images/') !== -1
      : img.indexOf('images/') === 0;
  }

  function renderModalContent() {
    const l = letters[order[modalIdx]];
    const modalCard = document.getElementById('lm-card');
    modalCard.setAttribute('data-item', l.item_id);
    if (l.artifact) modalCard.setAttribute('data-artifact', l.artifact);
    else modalCard.removeAttribute('data-artifact');
    document.getElementById('lm-title').setAttribute('data-field', 'title');
    document.getElementById('lm-date').setAttribute('data-field', 'date');
    document.getElementById('lm-date').textContent = l.date;
    document.getElementById('lm-title').textContent = l.title;
    const scanEl = document.getElementById('lm-scan');
    scanEl.setAttribute('data-field', 'image');
    if (l.artifact) scanEl.setAttribute('data-artifact', l.artifact);
    else scanEl.removeAttribute('data-artifact');
    if (l.img_provenance) scanEl.setAttribute('data-provenance', l.img_provenance);
    else scanEl.removeAttribute('data-provenance');
    if (l.img && _matchesImgPath(l.img)) {
      scanEl.innerHTML = `<img src="${esc(l.img)}" alt="${esc(l.title)}">`;
      const scanImg = scanEl.querySelector('img');
      scanImg.addEventListener('click', () => openZoom(scanImg.src, scanImg.alt));
    } else {
      scanEl.innerHTML = `<div class="lm-scan-note">[scan on file, not included in this wireframe]</div>`;
    }
    if (CONFIG.langToggle) {
      const hasYiddish = !!(l.yiddish && l.yiddish.length);
      const yiBtn = document.getElementById('lm-lang-yi');
      yiBtn.disabled = !hasYiddish;
      yiBtn.title = hasYiddish ? '' : 'No Yiddish original on file';
      setLang('en');                                    // always default to English on open
    } else {
      // no toggle: render the translation unconditionally through the SAME honesty core
      // (formatBody) — this is the pictures/story honesty-bug fix, by construction.
      const body = document.getElementById('lm-body');
      body.setAttribute('dir', 'ltr');
      body.setAttribute('data-field', 'translation');
      body.innerHTML = formatBody(l.translation);
    }
    if (CONFIG.prevNext) {
      document.getElementById('modal-position').textContent = `${modalIdx + 1} / ${order.length}`;
    }
  }

  function openModal(i) {
    modalIdx = order.indexOf(i);
    renderModalContent();
    overlay.classList.add('open');
  }

  function openLetterModal(title) {
    const i = titleIndex[title];
    if (i === undefined) return;
    openModal(i);
  }

  function openPersonModal(nodeId) {
    const p = people[nodeId];
    if (!p) return;
    personIdx = personOrder.indexOf(nodeId);
    const photoEl = document.getElementById('pm-photo');
    const placeholderEl = document.getElementById('pm-photo-placeholder');
    if (p.img) {
      photoEl.src = p.img;
      photoEl.alt = p.canonical;
      photoEl.style.display = '';
      if (placeholderEl) { placeholderEl.style.display = 'none'; placeholderEl.innerHTML = ''; }
    } else {
      photoEl.style.display = 'none';
      if (placeholderEl) {
        placeholderEl.style.display = '';
        placeholderEl.innerHTML = (SILHOUETTES[p.silhouette] || '')
          + '<div class="pm-photo-label">No photograph survives</div>';
      }
    }
    document.getElementById('pm-name').textContent = p.canonical;
    document.getElementById('pm-dates').innerHTML = p.dates;
    document.getElementById('pm-role').innerHTML = p.role;
    document.getElementById('pm-bio').innerHTML = p.bio;
    const labelEl = document.getElementById('pm-letters-label');
    const listEl = document.getElementById('pm-letters-list');
    if (p.letters_total === 0) {
      labelEl.textContent = '';
      listEl.innerHTML = `<div class="pm-no-letters">No letters in this archive &mdash; see the <a href="letters.html" style="color:var(--rust);">full archive</a></div>`;
    } else {
      labelEl.textContent = `Appears in (${p.letters_total})`;
      const overflow = p.letters_total - p.letters.length;
      // p.letters titles are ALREADY html-escaped server-side (modal_island.py) — do NOT esc()
      // again here (the same double-escape trap fixed on the story door 2026-07-12).
      const overflowHtml = overflow > 0
        ? `<a class="pm-letter-item pm-more" href="${p.letters_page}">+${overflow} more &rarr;</a>`
        : '';
      listEl.innerHTML = p.letters.map(t =>
        `<button class="pm-letter-item" data-title="${t}">${t} &rarr;</button>`
      ).join('') + overflowHtml;
      listEl.querySelectorAll('.pm-letter-item[data-title]').forEach(btn => {
        btn.addEventListener('click', () => openLetterModal(btn.dataset.title));
      });
    }
    // source_doc (2026-07-25): honest-absent for everyone but the one person it's real for —
    // p.source_doc is undefined/null for every other node, so the section just stays hidden.
    // label/translation_note/translation are pre-escaped server-side (modal_island.py), same
    // innerHTML sink as p.bio/p.role above — NOT .textContent (that would show the raw
    // entities, e.g. "&#39;", literally).
    const sourceEl = document.getElementById('pm-source');
    if (p.source_doc) {
      document.getElementById('pm-source-label').innerHTML = p.source_doc.label;
      document.getElementById('pm-source-note').innerHTML = p.source_doc.translation_note;
      document.getElementById('pm-source-translation').innerHTML = p.source_doc.translation;
      const pagesEl = document.getElementById('pm-source-pages');
      pagesEl.innerHTML = p.source_doc.pages.map((src, i) =>
        `<button type="button" class="pm-source-page" data-src="${src}" data-alt="${esc(p.canonical)} — page ${i + 1}">Page ${i + 1}</button>`
      ).join('');
      pagesEl.querySelectorAll('.pm-source-page').forEach(btn => {
        btn.addEventListener('click', () => openZoom(btn.dataset.src, btn.dataset.alt));
      });
      sourceEl.style.display = '';
    } else {
      sourceEl.style.display = 'none';
    }
    if (CONFIG.personPrevNext) {
      document.getElementById('person-modal-position').textContent = `${personIdx + 1} / ${personOrder.length}`;
    }
    personOverlay.classList.add('open');
  }

  document.getElementById('modal-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  if (CONFIG.prevNext) {
    document.getElementById('modal-prev').addEventListener('click', () => {
      modalIdx = (modalIdx - 1 + order.length) % order.length;
      renderModalContent();
    });
    document.getElementById('modal-next').addEventListener('click', () => {
      modalIdx = (modalIdx + 1) % order.length;
      renderModalContent();
    });
  }
  if (CONFIG.langToggle) {
    document.getElementById('lm-lang-en').addEventListener('click', () => setLang('en'));
    document.getElementById('lm-lang-yi').addEventListener('click', () => setLang('yi'));
  }
  document.getElementById('person-modal-close').addEventListener('click', () => personOverlay.classList.remove('open'));
  personOverlay.addEventListener('click', (e) => { if (e.target === personOverlay) personOverlay.classList.remove('open'); });
  if (CONFIG.personPrevNext) {
    document.getElementById('person-modal-prev').addEventListener('click', () => {
      personIdx = (personIdx - 1 + personOrder.length) % personOrder.length;
      openPersonModal(personOrder[personIdx]);
    });
    document.getElementById('person-modal-next').addEventListener('click', () => {
      personIdx = (personIdx + 1) % personOrder.length;
      openPersonModal(personOrder[personIdx]);
    });
  }

  const jumpTitle = new URLSearchParams(window.location.search).get('jump');
  if (jumpTitle) openLetterModal(jumpTitle);

  // exposed for each door's own card-click wiring (kept local per the spec's Non-Goals)
  window.openModal = openModal;
  window.openLetterModal = openLetterModal;
  window.openPersonModal = openPersonModal;
  window.openZoom = openZoom;   // story-excerpt.html's inline-figure zoom already reuses this name
})();

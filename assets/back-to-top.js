// back-to-top.js — shared "scroll to top" button behavior (graduated from worth-knowing.html,
// 2026-07-25, once every scrolling door wanted the same button). A page opts in with
// <button class="back-to-top" id="back-to-top" type="button">&uarr; Top</button> anywhere in
// its body; this script finds it, no per-page config needed. Silently no-ops if the button
// isn't present (index.html's bespoke scroll hero deliberately doesn't use this pattern).
(function() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

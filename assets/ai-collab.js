// Click-to-expand for the "This site is a Human + AI Collaboration" note (2026-08-21, Paul's
// ask): the "Click to find out how this page was made." line is a real <button> that reveals
// this page's own .ai-collab-detail panel (the page-specific explanation + the "Read more"
// link to how-made.html), collapsed by default. One shared file, delegated to `document` so it
// works identically on every door regardless of how many notes a page has (today: exactly one).
document.addEventListener('click', function (e) {
  var trigger = e.target.closest('.ai-collab-trigger');
  if (!trigger) return;
  var detail = trigger.parentElement.querySelector('.ai-collab-detail');
  if (!detail) return;
  var expanded = trigger.getAttribute('aria-expanded') === 'true';
  trigger.setAttribute('aria-expanded', String(!expanded));
  detail.hidden = expanded;
});

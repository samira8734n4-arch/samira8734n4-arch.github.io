// Theme toggle. The no-flash read happens inline in <head>; this only wires
// the button. Tokens handle every colour, so nothing else changes.
(function () {
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  function current() {
    return document.documentElement.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) { /* file:// or blocked */ }
    var next = theme === 'dark' ? 'light' : 'dark';
    btn.textContent = next === 'dark' ? 'Dark' : 'Light';
    btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  apply(current());
  btn.addEventListener('click', function () {
    apply(current() === 'dark' ? 'light' : 'dark');
  });
})();

// Rotating headline roles. The visible rotator is aria-hidden and a static
// sr-only line carries the full text, so this never announces or re-announces.
(function () {
  var box = document.querySelector('[data-roles]');
  if (!box) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var items = box.querySelectorAll('.role');
  if (items.length < 2) return;

  var i = 0;
  var EXIT = 620; // must match the transform duration in base.css

  setInterval(function () {
    var outgoing = items[i];
    i = (i + 1) % items.length;

    // Outgoing leaves upward while the incoming rises into place, so the two
    // move together instead of both drifting the same way.
    outgoing.classList.remove('is-active');
    outgoing.classList.add('is-leaving');
    items[i].classList.add('is-active');

    setTimeout(function () {
      outgoing.classList.remove('is-leaving');
    }, EXIT);
  }, 3000);
})();

// Copy-to-clipboard for the email. Falls back to leaving the mailto link as the
// route if the clipboard API is unavailable or blocked.
(function () {
  document.querySelectorAll('[data-copy-email]').forEach(function (btn) {
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-copy-email');
      var done = function (ok) {
        btn.textContent = ok ? 'Copied ✓' : email;
        setTimeout(function () { btn.textContent = original; }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () { done(true); },
          function () { done(false); });
      } else {
        done(false);
      }
    });
  });
})();

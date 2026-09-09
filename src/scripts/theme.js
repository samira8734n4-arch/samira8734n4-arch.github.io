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

// Mark that JS is running. Reveal-on-scroll hides elements via `.js [data-reveal]`,
// so without this nothing is ever hidden and the page degrades to plain content.
document.documentElement.classList.add('js');

// Reveal on scroll. Reveals once, then stops observing — elements that re-hide
// when you scroll back up read as broken rather than lively.
(function () {
  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();

// On-this-page navigation. Built from the page's own section headings rather
// than hand-written per page, so it stays correct when sections change and
// works on any case study without touching its markup.
(function () {
  var main = document.getElementById('main');
  if (!main) return;

  // Section headings only — not the ones inside end cards or modals.
  var heads = [].slice.call(main.querySelectorAll('h2.rule'))
    .filter(function (h) { return !h.closest('.endcard'); });
  if (heads.length < 2) return;   // not enough to be worth a nav

  var nav = document.createElement('nav');
  nav.className = 'toc';
  nav.setAttribute('aria-label', 'On this page');
  var title = document.createElement('p');
  title.className = 'toc-title';
  title.textContent = 'On this page';
  nav.appendChild(title);

  var list = document.createElement('ul');
  var links = [];

  // "Overview" points at the top of the page — the hero and summary block,
  // which carry no heading of their own but are a section all the same.
  var top = main.querySelector('.hero') || main;
  if (!top.id) top.id = 'overview';
  var oli = document.createElement('li');
  var oa = document.createElement('a');
  oa.href = '#' + top.id;
  oa.textContent = 'Overview';
  oli.appendChild(oa);
  list.appendChild(oli);
  links.push({ a: oa, el: top });

  heads.forEach(function (h, i) {
    if (!h.id) h.id = 'section-' + (i + 1);
    // Drop a leading section number so the nav reads as words, not "01The...".
    var n = h.querySelector('.n');
    var label = (n ? h.textContent.replace(n.textContent, '') : h.textContent).trim();

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = label;
    li.appendChild(a);
    list.appendChild(li);
    links.push({ a: a, el: h });
  });

  nav.appendChild(list);
  document.body.appendChild(nav);
  document.documentElement.classList.add('has-toc');

  // Mark the section currently nearest the top of the viewport.
  function sync() {
    var best = links[0];
    for (var i = 0; i < links.length; i++) {
      if (links[i].el.getBoundingClientRect().top <= 120) best = links[i];
    }
    links.forEach(function (l) {
      l.a.classList.toggle('is-current', l === best);
      if (l === best) { l.a.setAttribute('aria-current', 'true'); }
      else { l.a.removeAttribute('aria-current'); }
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { sync(); ticking = false; });
  }, { passive: true });
  sync();
})();

// Feature modals. Native <dialog> so Escape, focus trapping and the inert
// background come from the browser. The whole card is the hit area via the
// button's ::after, but there is still only one real button per card.
(function () {
  var openers = document.querySelectorAll('[data-open]');
  if (!openers.length) return;

  openers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dlg = document.getElementById(btn.getAttribute('data-open'));
      if (!dlg) return;
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');   // very old browsers: inline, not modal
      }
    });
  });

  document.querySelectorAll('dialog.modal').forEach(function (dlg) {
    dlg.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { dlg.close(); });
    });
    // Click on the backdrop closes. Test the event target, not coordinates:
    // the dialog's children cover its content, so the dialog element itself
    // only receives backdrop clicks. Coordinates were wrong because keyboard
    // activation reports 0,0, which read as "outside" and closed the modal
    // whenever someone pressed Enter on a button inside it.
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  });
})();

// Screen gallery: the mouse wheel advances one screen at a time instead of
// scrolling the modal.
//
// Wheel hijacking traps people, so this releases the event at both edges — once
// you reach the last screen, the next scroll goes to the modal as normal. A
// gallery that swallows every wheel event is a gallery you cannot scroll past.
(function () {
  var galleries = document.querySelectorAll('.modal-gallery');
  if (!galleries.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  galleries.forEach(function (g) {
    var locked = false;

    g.addEventListener('wheel', function (e) {
      // A trackpad's horizontal gesture already scrolls this natively.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      var atStart = g.scrollLeft <= 1;
      var atEnd = g.scrollLeft >= g.scrollWidth - g.clientWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;

      e.preventDefault();
      if (locked) return;          // one gesture, one slide
      locked = true;

      var first = g.firstElementChild;
      var step = first ? first.getBoundingClientRect().width + 16 : g.clientWidth;
      g.scrollBy({
        left: e.deltaY > 0 ? step : -step,
        behavior: reduce ? 'auto' : 'smooth'
      });

      setTimeout(function () { locked = false; }, reduce ? 60 : 340);
    }, { passive: false });

    // Position counter — which screen you are on, out of how many.
    var counter = g.parentElement
      ? g.parentElement.querySelector('[data-count]')
      : null;
    if (!counter) return;

    var slides = g.children.length;
    var head = g.parentElement;
    var prev = head.querySelector('[data-prev]');
    var next = head.querySelector('[data-next]');

    function step() {
      var first = g.firstElementChild;
      return first ? first.getBoundingClientRect().width + 16 : g.clientWidth;
    }

    function updateCount() {
      var span = g.scrollWidth - g.clientWidth;
      var ratio = span > 0 ? g.scrollLeft / span : 0;
      var i = Math.round(ratio * (slides - 1)) + 1;
      counter.textContent = i + ' / ' + slides;
      // Disabling at the ends tells you where you are without a scrollbar.
      if (prev) prev.disabled = g.scrollLeft <= 1;
      if (next) next.disabled = g.scrollLeft >= span - 1;
    }

    function go(dir) {
      g.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    g.addEventListener('scroll', updateCount, { passive: true });

    // The gallery lives inside a closed <dialog>, so on load it measures zero
    // wide — which made updateCount believe it was already at the end and
    // disable the next button. Re-measure when it actually gets a size.
    if ('ResizeObserver' in window) {
      new ResizeObserver(updateCount).observe(g);
    }
    updateCount();
  });
})();

// Reading progress.
(function () {
  var bar = document.querySelector('[data-progress]');
  if (!bar) return;

  var ticking = false;
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    ticking = false;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
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

// Shuffle deck. Cards are absolutely stacked so they can overlap, which means
// the stack has no natural height — JS gives it the height of whichever card is
// currently in front, since the cards are not all the same size.
//
// The wheel steps through the cards one at a time, but only between the first
// and the last: at either end the event is left alone so the page scrolls on.
// A wheel handler that never releases traps the reader, which is worse than
// having no wheel handler at all.
(function () {
  var deck = document.querySelector('[data-deck]');
  if (!deck) return;

  var stack = deck.querySelector('.deck-stack');
  var cards = [].slice.call(stack.querySelectorAll('.deck-card'));
  var btn = deck.querySelector('[data-shuffle]');
  var dotWrap = deck.querySelector('[data-dots]');
  if (!cards.length) return;

  var n = cards.length;
  var idx = 0;

  var dots = [];
  if (dotWrap) {
    cards.forEach(function () {
      var d = document.createElement('span');
      d.className = 'deck-dot';
      dotWrap.appendChild(d);
      dots.push(d);
    });
  }

  function sizeStack() {
    var h = cards[idx].offsetHeight;
    // Guard the write: setting height changes the parent, which re-fires the
    // observer. Only writing on a real change stops that becoming a loop.
    if (h && stack.style.height !== h + 'px') stack.style.height = h + 'px';
  }

  function paint() {
    cards.forEach(function (el, i) {
      var pos = (i - idx + n) % n;
      el.setAttribute('data-pos', pos > 3 ? 3 : pos);
      // Cards behind are decorative: keep them off the tab order and out of
      // the accessibility tree, so only the front card is reachable.
      el.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      var link = el.querySelector('a');
      if (link) link.tabIndex = pos === 0 ? 0 : -1;
    });
    dots.forEach(function (d, i) { d.classList.toggle('is-on', i === idx); });
    sizeStack();
  }

  function go(next) {
    idx = (next + n) % n;
    paint();
  }

  if (btn) btn.addEventListener('click', function () { go(idx + 1); });

  // Wheel: one card per gesture, with a short lock so a single flick of an
  // inertial trackpad does not fly through the whole deck.
  var acc = 0, locked = false;
  deck.addEventListener('wheel', function (e) {
    var down = e.deltaY > 0;
    if ((down && idx === n - 1) || (!down && idx === 0)) return;   // release
    e.preventDefault();
    if (locked) return;
    acc += e.deltaY;
    if (Math.abs(acc) < 40) return;
    acc = 0;
    locked = true;
    go(idx + (down ? 1 : -1));
    setTimeout(function () { locked = false; }, 320);
  }, { passive: false });

  paint();
  window.addEventListener('resize', sizeStack);
  // Images arrive late and change the card height when they do.
  cards.forEach(function (c) {
    var img = c.querySelector('.deck-shot');
    if (img && !img.complete) img.addEventListener('load', sizeStack);
  });
  if ('ResizeObserver' in window) new ResizeObserver(sizeStack).observe(deck);
})();

// Journey timeline. The detail card opens on hover for a mouse, on focus for a
// keyboard, and on click for touch — hover alone would strand two of the three.
(function () {
  var list = document.querySelector('[data-journey]');
  if (!list) return;

  var items = [].slice.call(list.querySelectorAll('.journey-item'));
  var hoverable = window.matchMedia('(hover: hover)').matches;

  function open(item, on) {
    var btn = item.querySelector('.journey-pill');
    var card = item.querySelector('.journey-card');
    if (!btn || !card) return;
    card.hidden = !on;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  function closeAll(except) {
    items.forEach(function (i) { if (i !== except) open(i, false); });
  }

  items.forEach(function (item) {
    var btn = item.querySelector('.journey-pill');

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      closeAll(item);
      open(item, !isOpen);
    });

    // Focus opens it, so tabbing through the timeline reads the same as hovering.
    btn.addEventListener('focus', function () { closeAll(item); open(item, true); });

    if (hoverable) {
      item.addEventListener('mouseenter', function () { closeAll(item); open(item, true); });
      item.addEventListener('mouseleave', function () {
        // Leave it open if the keyboard is still inside it.
        if (!item.contains(document.activeElement)) open(item, false);
      });
    }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });
})();


// Hero constellation. Drifting points joined by lines when they come close,
// which lean toward the pointer. Written rather than pulled in from a library:
// the colours have to come from the theme tokens so it survives the dark
// toggle, and a dependency for one decoration is a poor trade.
(function () {
  var cv = document.querySelector('[data-particles]');
  if (!cv) return;
  var ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, pts = [], raf = null, visible = true;
  var LINK = 132, REACH = 170;
  var mx = -1e4, my = -1e4;

  // Colours are read from the cascade, so the theme toggle just works.
  var dot = '#0f5c4c', line = '#0f5c4c';
  function readTheme() {
    var s = getComputedStyle(document.documentElement);
    dot = (s.getPropertyValue('--color-action') || '#0f5c4c').trim();
    line = (s.getPropertyValue('--color-border-strong') || dot).trim();
  }

  function size() {
    var r = cv.getBoundingClientRect();
    w = r.width; h = r.height;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Density by area, so a phone does not get a desktop's worth of dots.
    var target = Math.max(26, Math.min(78, Math.round(w * h / 15000)));
    pts.length = 0;
    for (var i = 0; i < target; i++) {
      pts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: 1 + Math.random() * 1.4
      });
    }
  }

  function draw() {
    raf = null;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!still) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }
      ctx.globalAlpha = .5;
      ctx.fillStyle = dot;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();

      // Links to neighbours, fading out with distance.
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], dx = p.x - q.x, dy = p.y - q.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        ctx.globalAlpha = (1 - Math.sqrt(d2) / LINK) * .3;
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      // And to the pointer, brighter, so the field answers the cursor.
      var ex = p.x - mx, ey = p.y - my, e2 = ex * ex + ey * ey;
      if (e2 < REACH * REACH) {
        var e = Math.sqrt(e2);
        ctx.globalAlpha = (1 - e / REACH) * .55;
        ctx.strokeStyle = dot;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mx, my);
        ctx.stroke();
        // A nudge toward the cursor, capped so nothing gets flung.
        if (!still && e > 1) { p.x -= ex / e * .35; p.y -= ey / e * .35; }
      }
    }
    ctx.globalAlpha = 1;
    if (!still && visible) raf = requestAnimationFrame(draw);
  }

  function tick() { if (!raf) raf = requestAnimationFrame(draw); }

  readTheme();
  size();
  tick();

  window.addEventListener('resize', function () { size(); tick(); });

  window.addEventListener('mousemove', function (e) {
    var r = cv.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    if (still) tick();
  });

  // Off-screen it stops entirely — no point animating a hero nobody is looking at.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) tick();
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(cv);
  }

  // Re-read the tokens when the theme changes, so the dots recolour.
  new MutationObserver(function () { readTheme(); tick(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

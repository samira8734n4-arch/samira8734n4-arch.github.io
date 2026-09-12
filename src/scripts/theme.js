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
    var next = theme === "dark" ? "light" : "dark";
    // The button holds two icons now, so only the label changes -- writing
    // textContent here would wipe them out.
    btn.setAttribute("aria-label", "Switch to " + next + " theme");
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
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
  // A toggle rather than a static title: the panel can be folded away when it
  // is in the way, and the button says so to assistive tech via aria-expanded.
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toc-toggle";
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-controls", "toc-list");
  toggle.innerHTML = '<span class="toc-burger" aria-hidden="true"><span></span><span></span></span><span>Menu</span>';
  nav.appendChild(toggle);

  var list = document.createElement("ul");
  list.id = "toc-list";
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
    nav.classList.toggle("is-collapsed", open);
    // inert, not just opacity: a faded-out list is still in the tab order and
    // the accessibility tree, so keyboard users would land on invisible links.
    list.inert = open;
  });
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

  // The canvas is fixed now, so it is always on screen; what is worth stopping
  // for is a hidden tab. Browsers throttle rAF there anyway, but this makes it
  // a full stop rather than a slow trickle.
  document.addEventListener('visibilitychange', function () {
    visible = document.visibilityState === 'visible';
    if (visible) tick();
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
  });

  // Re-read the tokens when the theme changes, so the dots recolour.
  new MutationObserver(function () { readTheme(); tick(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();




// The signature writes itself, holds, fades, and writes again — but only while
// it is on screen.
//
// Driven with the Web Animations API rather than a CSS class. Restarting a CSS
// animation means removing the class, forcing a reflow and re-adding it, and
// the usual reflow trick (reading offsetWidth) silently does nothing on an SVG
// element — it has no offsetWidth, so the two class changes coalesce and the
// animation never runs a second time. cancel() and play() have no such trap.
(function () {
  var sig = document.querySelector('.sig');
  if (!sig) return;

  var paths = [].slice.call(sig.querySelectorAll('path'));
  var SPEED = 260;    // units per second
  var HOLD = 2600;    // how long the finished name sits there
  var plan = [], total = 0;

  paths.forEach(function (p) {
    var len = Math.max(p.getTotalLength(), 6);
    var dur = (len / SPEED) * 1000;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    plan.push({ el: p, len: len, dur: dur, delay: total });
    total += dur * 0.82;   // slight overlap, so it flows rather than stutters
  });
  var drawTime = total + plan[plan.length - 1].dur;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paths.forEach(function (p) { p.style.strokeDashoffset = 0; });
    return;
  }

  var anims = [], timer = null, running = false;

  function write() {
    anims = plan.map(function (s) {
      return s.el.animate(
        [{ strokeDashoffset: s.len }, { strokeDashoffset: 0 }],
        { duration: s.dur, delay: s.delay, easing: 'ease-in-out', fill: 'both' }
      );
    });
  }

  // Un-writes in reverse -- last letter first -- then writes again. Reusing the
  // stroke animation for the erase keeps it to one mechanism; an opacity fade on
  // the svg element did not take here.
  function erase() {
    var back = plan.slice().reverse();
    var at = 0;
    anims = back.map(function (s) {
      var d = s.dur * 0.55;
      var a = s.el.animate(
        [{ strokeDashoffset: 0 }, { strokeDashoffset: s.len }],
        { duration: d, delay: at, easing: "ease-in", fill: "forwards" }
      );
      at += d * 0.7;
      return a;
    });
    return at + back[back.length - 1].dur * 0.55;
  }

  function cycle() {
    write();
    timer = setTimeout(function () {
      var wipe = erase();
      timer = setTimeout(function () {
        anims.forEach(function (a) { a.cancel(); });
        if (running) cycle();
      }, wipe + 120);
    }, drawTime + HOLD);
  }

  function start() { if (!running) { running = true; cycle(); } }
  function stop() {
    running = false;
    clearTimeout(timer);
  }

  if (!('IntersectionObserver' in window)) { start(); return; }
  new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) start(); else stop();
  }, { threshold: 0.4 }).observe(sig);
})();

// "View more work". The older groups start collapsed. The markup carries the
// hidden attribute, and the CSS above forces them visible when JS never runs,
// so a no-JS reader still gets every project rather than a dead button.
(function () {
  var btn = document.querySelector('[data-work-toggle]');
  var more = document.querySelector('[data-work-more]');
  if (!btn || !more) return;
  var label = btn.querySelector('[data-work-label]');

  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    more.hidden = open;
    if (label) label.textContent = open ? 'View more work' : 'Show less';
    if (open) more.previousElementSibling && btn.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
})();

// Certifications: a provider mark pops up on hover, and the completed list
// shows its first few until asked for the rest.
//
// Four providers have official marks, taken from Simple Icons (CC0). The rest
// get an initials badge rather than an imitation of their logo, since a
// hand-drawn crest would misrepresent the institution.
(function () {
  var head = document.getElementById('certs-h');
  if (!head) return;
  var section = head.closest('section');

  var MARKS = [
    [/interaction design foundation/i, { img: 'org-idf.svg' }],
    [/^google/i, { img: 'org-google.svg' }],
    [/coursera/i, { img: 'org-coursera.svg' }],
    [/udemy/i, { img: 'org-udemy.svg' }],
    [/nextgen/i, { mono: 'NG' }],
    [/ostad/i, { mono: 'OS' }],
    [/michigan/i, { mono: 'UM' }],
    [/california institute of the arts/i, { mono: 'CA' }],
    [/national youth/i, { mono: 'NY' }]
  ];

  [].forEach.call(section.querySelectorAll('.certs-now li, .certs-list li'), function (li) {
    var by = li.querySelector('.certs-by');
    if (!by) return;
    var mark = null;
    for (var i = 0; i < MARKS.length; i++) {
      if (MARKS[i][0].test(by.textContent.trim())) { mark = MARKS[i][1]; break; }
    }
    if (!mark) return;
    var badge = document.createElement('span');
    badge.className = 'certs-logo';
    badge.setAttribute('aria-hidden', 'true');   // the provider is already written out
    if (mark.img) {
      var img = document.createElement('img');
      img.src = 'assets/icons/' + mark.img;
      img.alt = '';
      badge.appendChild(img);
    } else {
      badge.classList.add('is-mono');
      badge.textContent = mark.mono;
    }
    li.appendChild(badge);
  });

  // See more. Without JS every course stays visible; the script does the hiding.
  var list = section.querySelector('.certs-list');
  if (!list) return;
  var rows = [].slice.call(list.children);
  var SHOW = 6;
  if (rows.length <= SHOW) return;
  var extra = rows.slice(SHOW);
  extra.forEach(function (li) { li.hidden = true; });

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'work-toggle certs-more';
  btn.setAttribute('aria-expanded', 'false');
  var label = document.createElement('span');
  label.textContent = 'See all ' + rows.length + ' courses';
  btn.appendChild(label);
  btn.insertAdjacentHTML('beforeend',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>');
  list.insertAdjacentElement('afterend', btn);

  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    extra.forEach(function (li) { li.hidden = open; });
    label.textContent = open ? 'See all ' + rows.length + ' courses' : 'Show fewer';
    if (open) head.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
})();

// See more on long blocks. An element marked data-clamp is cut to that many
// rem, with a button to open it. A block that runs only a little past the cut
// is left open: hiding two lines behind a button costs more than it saves.
(function () {
  var blocks = [].slice.call(document.querySelectorAll('[data-clamp]'));
  if (!blocks.length) return;
  var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  blocks.forEach(function (el, i) {
    var cut = (parseFloat(el.getAttribute('data-clamp')) || 14) * rem;
    if (el.scrollHeight < cut * 1.35) return;
    if (!el.id) el.id = 'more-' + (i + 1);
    el.style.setProperty('--clamp', cut + 'px');
    el.classList.add('is-clamped');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'work-toggle clamp-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', el.id);
    var label = document.createElement('span');
    label.textContent = 'See more';
    btn.appendChild(label);
    btn.insertAdjacentHTML('beforeend',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>');
    el.insertAdjacentElement('afterend', btn);

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      el.classList.toggle('is-clamped', open);
      label.textContent = open ? 'See more' : 'See less';
      // Closing a long block can leave the reader below it; bring its top back.
      if (open && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    });
  });
})();

// Get in touch stickers: pop in when the block comes into view, and can be
// dragged around. Pointer events cover mouse, pen and touch in one path.
(function () {
  var board = document.querySelector('[data-stickers]');
  if (!board) return;

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { board.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(board);
  } else {
    board.classList.add('is-in');
  }

  var z = 2;
  [].forEach.call(board.querySelectorAll('.cta-sticker'), function (s) {
    var startX = 0, startY = 0, x = 0, y = 0, dragging = false;
    s.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { s.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
      s.classList.add('is-dragging');
      s.style.zIndex = ++z;
      startX = e.clientX - x;
      startY = e.clientY - y;
    });
    s.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      x = e.clientX - startX;
      y = e.clientY - startY;
      s.style.translate = x + 'px ' + y + 'px';
    });
    function end() { dragging = false; s.classList.remove('is-dragging'); }
    s.addEventListener('pointerup', end);
    s.addEventListener('pointercancel', end);
  });
})();

// Contact panel. Any link marked data-contact opens it. The link itself is a
// mailto, so without JS (or without <dialog>) it still does something useful.
// Messages go through FormSubmit (formsubmit.co), which emails them on to
// Samira; the very first message asks the inbox owner to confirm once.
(function () {
  var triggers = document.querySelectorAll('[data-contact]');
  if (!triggers.length || typeof HTMLDialogElement !== 'function') return;

  var ENDPOINT = 'https://formsubmit.co/ajax/samira0151521@gmail.com';
  var MAIL = 'samirabintehamid46@gmail.com';
  var ico = function (d) {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
  };
  var I_MAIL = 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z';
  var I_WA = 'M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.26.51-.29.68-.26h.47c.15 0 .36-.06.55.45l.69 1.87c.6.13.1.28.1.44l-.27.41-.39.42c-.12.12-.26.25-.12.5.12.26.62 1.09 1.32 1.78.91.88 1.71 1.17 1.95 1.29.24.14.39.12.54-.04l.81-.94c.19-.25.35-.19.58-.11l1.67.88M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10c-1.97 0-3.8-.57-5.35-1.55L2 22l1.55-4.65A9.969 9.969 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8c0 1.72.54 3.31 1.46 4.61L4.5 19.5l2.89-.96A7.95 7.95 0 0 0 12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8z';
  var I_IN = 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .92.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z';
  var I_PIN = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z';
  var I_X = 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

  var dlg = document.createElement('dialog');
  dlg.className = 'contact-dialog';
  dlg.setAttribute('aria-labelledby', 'contact-dialog-h');
  dlg.innerHTML =
    '<button class="contact-dialog-close" type="button" aria-label="Close">' + ico(I_X) + '</button>' +
    '<div class="contact-dialog-grid">' +
      '<div class="contact-dialog-info">' +
        '<p class="contact-dialog-kicker">Contact</p>' +
        '<h2 id="contact-dialog-h">Let&rsquo;s talk.</h2>' +
        '<p class="contact-dialog-lede">A project, a role or a question &mdash; send a note and I will get back to you.</p>' +
        '<ul class="contact-dialog-list">' +
          '<li><span class="cd-ico">' + ico(I_MAIL) + '</span><div><span class="cd-label">Email</span><a href="mailto:' + MAIL + '">' + MAIL + '</a></div></li>' +
          '<li><span class="cd-ico">' + ico(I_WA) + '</span><div><span class="cd-label">WhatsApp</span><a href="https://wa.me/8801515216636">+880 1515-216636</a></div></li>' +
          '<li><span class="cd-ico">' + ico(I_IN) + '</span><div><span class="cd-label">LinkedIn</span><a href="https://www.linkedin.com/in/samira-binte-hamid-b3a1a0119/">Samira Binte Hamid</a></div></li>' +
          '<li><span class="cd-ico">' + ico(I_PIN) + '</span><div><span class="cd-label">Based in</span><span>Dhaka, Bangladesh</span></div></li>' +
        '</ul>' +
      '</div>' +
      '<form class="contact-form" novalidate>' +
        '<h3>Send me a message</h3>' +
        '<label>Your name<input name="name" type="text" autocomplete="name" required maxlength="100"></label>' +
        '<label>Your email<input name="email" type="email" autocomplete="email" required maxlength="200"></label>' +
        '<label>Message<textarea name="message" rows="5" required maxlength="3000"></textarea></label>' +
        '<label class="contact-form-trap" aria-hidden="true">Leave this empty<input name="_honey" type="text" tabindex="-1" autocomplete="off"></label>' +
        '<button class="btn contact-form-send" type="submit">Send message</button>' +
        '<p class="contact-form-status" role="status" aria-live="polite"></p>' +
      '</form>' +
    '</div>';
  document.body.appendChild(dlg);

  var form = dlg.querySelector('form');
  var status = dlg.querySelector('.contact-form-status');
  var send = dlg.querySelector('.contact-form-send');

  function say(text, kind, mailto) {
    status.textContent = text;
    status.className = 'contact-form-status' + (kind ? ' is-' + kind : '');
    // On failure the address is offered as a link, not just as words to copy.
    if (mailto) {
      var a = document.createElement('a');
      a.href = 'mailto:' + MAIL;
      a.textContent = MAIL;
      status.appendChild(document.createTextNode(' '));
      status.appendChild(a);
      status.appendChild(document.createTextNode(' instead.'));
    }
  }

  [].forEach.call(triggers, function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      dlg.showModal();
      var first = form.querySelector('input[name="name"]');
      if (first) first.focus();
    });
  });
  dlg.querySelector('.contact-dialog-close').addEventListener('click', function () { dlg.close(); });
  // A click on the backdrop lands on the dialog element itself.
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      say('Please fill in your name, a valid email and a message.', 'error');
      return;
    }
    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      _subject: 'Portfolio message from ' + form.name.value.trim(),
      _template: 'table',
      _honey: form._honey.value
    };
    // A filled trap field means a bot; pretend it worked and send nothing.
    if (data._honey) { form.reset(); say('Thanks, your message is on its way.', 'ok'); return; }

    send.disabled = true;
    send.textContent = 'Sending...';
    say('');
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (res) {
        if (res && (res.success === true || res.success === 'true')) {
          form.reset();
          say('Thanks, your message is on its way. I will reply to you by email.', 'ok');
        } else {
          say('Your message could not be sent just now. Please email', 'error', true);
        }
      })
      .catch(function () {
        say('Your message could not be sent just now. Please email', 'error', true);
      })
      .then(function () { send.disabled = false; send.textContent = 'Send message'; });
  });
})();

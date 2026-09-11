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

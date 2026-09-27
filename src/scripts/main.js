/* Portfolio Book — JS is limited to: the gauge readout, jump-to-page links, the image lightbox,
   and a static fallback for browsers without scroll-driven animation (or reduced motion).
   All choreography itself is CSS (see src/styles/book.css). */
(function () {
  'use strict';

  var root = document.documentElement;
  var scroller = document.querySelector('.scroller');
  var ticksEl = document.getElementById('ticks');
  var pctEl = document.getElementById('pct');
  var lightbox = document.getElementById('lightbox');

  /* ---- gauge: build the tick ruler, then a clipped red copy that the CSS fills on scroll ---- */
  if (ticksEl) {
    var rows = '';
    for (var i = 0; i < 26; i++) {
      rows += '<i style="top:' + i * 10 + 'px;width:' + (i % 5 === 0 ? 22 : 12) + 'px"></i>';
    }
    ticksEl.innerHTML = rows + '<span class="gauge-fill">' + rows + '</span>';
  }

  /* ---- top-left clock: current time in Bangladesh (Asia/Dhaka) ---- */
  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: clock.dataset.tz || 'Asia/Dhaka' });
    } catch (e) { fmt = null; }
    var tick = function () { if (fmt) clock.textContent = fmt.format(new Date()).replace(/\s?([AP])M/, function (m, x) { return ' ' + x.toLowerCase() + 'm'; }); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---- auto-fit: shrink a page's content just enough to keep everything on the page
     (a long description, a full feature list, a 4-shot gallery, or the categorized index).
     Scaling is proportional, so type size / spacing ratios and colors never change — only the
     overall size does, and only on pages whose real content needs it. ---- */
  function fitPages() {
    document.querySelectorAll('.pg-fit').forEach(function (el) {
      var face = el.closest('.face');
      if (!face) return;
      el.style.setProperty('--fit', 1);
      var cs = getComputedStyle(face);
      var available = face.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var natural = el.scrollHeight;
      var fit = natural > 0 && natural > available ? available / natural : 1;
      el.style.setProperty('--fit', fit.toFixed(3));
    });
  }
  fitPages();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPages);
  window.addEventListener('load', fitPages);
  var fitResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(fitResizeTimer);
    fitResizeTimer = setTimeout(fitPages, 150);
  });

  if (!scroller) return;

  var queued = false;
  function render() {
    queued = false;
    if (!pctEl) return;
    var max = scroller.scrollHeight - scroller.clientHeight;
    pctEl.textContent = max > 0 ? Math.round((scroller.scrollTop / max) * 100) : 0;
  }
  function onScroll() {
    if (!queued) { queued = true; requestAnimationFrame(render); }
  }
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  render();

  /* ---- static mode: no scroll-driven animation, or the visitor prefers reduced motion ---- */
  var supportsSDA = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isStatic = !supportsSDA || reduced;
  var leafCount = Number(scroller.dataset.leaves) || 0;
  var spread = 0; // static mode: how many page leaves are turned

  function setSpread(n) {
    spread = Math.max(0, Math.min(leafCount, n));
    document.querySelector('.book').classList.toggle('is-closed', spread >= leafCount);
    document.querySelectorAll('.leaf').forEach(function (leaf) {
      leaf.classList.toggle('is-flipped', Number(leaf.dataset.leaf) <= spread);
    });
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      var d = Number(b.dataset.nav);
      b.disabled = (d < 0 && spread <= 0) || (d > 0 && spread >= leafCount);
    });
  }

  if (isStatic) {
    root.classList.add('is-static');
    setSpread(0);
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      b.addEventListener('click', function () { setSpread(spread + Number(b.dataset.nav)); });
    });
  }

  /* ---- jump-to-page links (index entries, "all projects" links) ---- */
  var units = Number(scroller.dataset.units) || 100;
  function goTo(link, smooth) {
    if (isStatic) { setSpread(Number(link.dataset.spread)); return; }
    var max = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTo({ top: (Number(link.dataset.stop) / units) * max, behavior: smooth ? 'smooth' : 'auto' });
  }
  document.querySelectorAll('a.goto').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      goTo(link, true);
      if (history.replaceState) history.replaceState(null, '', link.getAttribute('href'));
    });
  });
  // deep link: /#sample-two opens the book straight at that project
  if (location.hash && location.hash !== '#index') {
    var target = document.querySelector('a.goto[href="' + location.hash.replace(/"/g, '') + '"]');
    if (target) goTo(target, false);
  }

  /* ---- lightbox for project images ---- */
  if (lightbox && typeof lightbox.showModal === 'function') {
    var lbImg = lightbox.querySelector('img');
    var lbCap = lightbox.querySelector('p');
    document.querySelectorAll('img[data-zoom]').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = img.dataset.caption || '';
        lightbox.showModal();
      });
    });
    lightbox.addEventListener('click', function () { lightbox.close(); });
  }
})();

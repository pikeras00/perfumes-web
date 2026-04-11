/* ================================================
   Celebrity Perfumes — Visual Effects
   ================================================ */
'use strict';

// ── 1. Canvas floating particles ─────────────────
(function () {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '0'
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, pts = [];

  function Pt(init) {
    this.x  = Math.random() * W;
    this.y  = init ? Math.random() * H : H + 4;
    this.r  = Math.random() * 1.3 + 0.15;
    this.vx = (Math.random() - 0.5) * 0.1;
    this.vy = -(Math.random() * 0.2 + 0.04);
    this.life    = init ? Math.floor(Math.random() * 450) : 0;
    this.maxLife = Math.floor(Math.random() * 400 + 200);
    this.gold    = Math.random() > 0.5;
  }

  Pt.prototype.tick = function () {
    this.x += this.vx; this.y += this.vy; this.life++;
    if (this.life > this.maxLife) {
      Object.assign(this, new Pt(false));
    }
  };

  Pt.prototype.draw = function () {
    const a = Math.sin((this.life / this.maxLife) * Math.PI) * (this.gold ? 0.55 : 0.22);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.gold
      ? 'rgba(201,160,61,' + a + ')'
      : 'rgba(244,216,112,' + (a * 0.55) + ')';
    ctx.fill();
  };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  const N = Math.min(Math.floor((W * H) / 6000), 160);
  for (let i = 0; i < N; i++) pts.push(new Pt(true));

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) { pts[i].tick(); pts[i].draw(); }
    requestAnimationFrame(loop);
  })();
})();


// ── 2. Cursor spotlight on cards ─────────────────
(function () {
  const SEL = '.ccard,.scard,.qcard,.rcard,.tip,.sstat,.obtn';

  function attach() {
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el._sp) return;
      el._sp = true;
      el.addEventListener('mousemove', function (e) {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--sy', (e.clientY - r.top)  + 'px');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', attach);
  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
})();


// ── 3. Scroll-reveal with stagger ────────────────
(function () {
  var io;

  function setup() {
    if (!window.IntersectionObserver) return;
    if (io) io.disconnect();

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el  = entry.target;
        var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(idx * 0.06, 0.4) + 's';
        el.classList.add('sr-in');
        io.unobserve(el);
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll(
      '.shdr > *,.sintro,.sstat,.scard,.tip,.qcard'
    ).forEach(function (el) {
      if (!el.classList.contains('sr-out')) {
        el.classList.add('sr-out');
        io.observe(el);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', setup);
  new MutationObserver(function () { setTimeout(setup, 50); })
    .observe(document.body, { childList: true, subtree: false });
})();


// ── 4. Hero parallax on scroll ───────────────────
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', function () {
    hero.style.setProperty('--prl', window.scrollY * 0.22 + 'px');
  }, { passive: true });
})();


// ── 5. Animated count-up for stats ───────────────
(function () {
  function countUp(el) {
    var raw  = el.textContent.replace(/[^0-9.]+/, '');
    var num  = parseFloat(raw);
    if (!num || num < 2) return;
    var suffix = el.textContent.replace(raw, '').trim();
    var dur    = 1400;
    var start  = performance.now();
    function frame(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val   = Math.round(eased * num);
      el.textContent = val + (suffix || '');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var done = false;
  var statsObs = new IntersectionObserver(function (entries) {
    if (done) return;
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        done = true;
        document.querySelectorAll('.sstat-n').forEach(countUp);
        statsObs.disconnect();
      }
    });
  }, { threshold: 0.5 });

  document.addEventListener('DOMContentLoaded', function () {
    var first = document.querySelector('.sstat');
    if (first) statsObs.observe(first);
  });
})();


// ── 6. Background Paths (adaptado de 21st.dev BackgroundPaths) ──
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var NS = 'http://www.w3.org/2000/svg';
  var wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0';

  [1, -1].forEach(function (pos) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 696 316');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

    for (var i = 0; i < 36; i++) {
      var a = 380 - i * 5 * pos;
      var b = 189 + i * 6;
      var c = 312 - i * 5 * pos;
      var e = 216 - i * 6;
      var f = 152 - i * 5 * pos;
      var g = 343 - i * 6;
      var hh = 616 - i * 5 * pos;
      var jj = 470 - i * 6;
      var kk = 684 - i * 5 * pos;
      var ll = 875 - i * 6;

      var d = 'M' + (-a) + ' ' + (-b)
            + 'C' + (-a) + ' ' + (-b) + ' ' + (-c) + ' ' + e + ' ' + f + ' ' + g
            + 'C' + hh + ' ' + jj + ' ' + kk + ' ' + ll + ' ' + kk + ' ' + ll;

      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-width', String(0.5 + i * 0.03));

      var op = Math.min(0.04 + i * 0.013, 0.42);
      path.setAttribute('stroke', 'rgba(201,160,61,' + op + ')');

      var dur = (18 + Math.random() * 12).toFixed(2);
      var dly = (-Math.random() * parseFloat(dur)).toFixed(2);

      path.style.strokeDasharray = '0.3 0.7';
      path.style.strokeDashoffset = '0.3';
      path.style.animation = 'bgpath-flow ' + dur + 's linear ' + dly + 's infinite';

      svg.appendChild(path);
    }
    wrap.appendChild(svg);
  });

  hero.prepend(wrap);
})();


// ── 7. PERFUMITY: nube de spray → condensar → evaporar (bucle) ───
(function () {
  var titleEl = document.getElementById('hero-title');
  if (!titleEl) return;

  /* ── tiempos — menos partículas en móvil para no sobrecargar ── */
  var isMobile   = window.innerWidth < 600;
  var N_DROPS    = isMobile ? 90 : 320;
  var RAIN_START = 0.12;
  var RAIN_SPAN  = 1.4;
  var COND_START = 1.6;
  var STAGGER    = 0.07;
  var LETTER_DUR = 0.55;
  var HOLD       = 2.8;
  var EVAP_DUR   = 1.1;   // más lento = más fluido
  var EVAP_STG   = 0.03;  // stagger mínimo para no trabar
  var PAUSE      = 0.5;

  var letters = 'PERFUMITY'.split('');
  var spans   = [];
  var dropWrap  = null;
  var timers    = [];

  /* ── construir spans (solo una vez) ── */
  (function buildSpans() {
    titleEl.innerHTML = '';
    spans = letters.map(function (ch) {
      var s = document.createElement('span');
      s.className   = 'htl';
      s.textContent = ch;
      s.style.opacity = '0';
      titleEl.appendChild(s);
      return s;
    });
  })();

  /* ── crear nube de gotitas ── */
  function createDrops() {
    if (dropWrap) dropWrap.remove();
    dropWrap = document.createElement('div');
    dropWrap.setAttribute('aria-hidden', 'true');
    dropWrap.style.cssText =
      'position:absolute;inset:0;overflow:visible;pointer-events:none;z-index:1;';
    titleEl.insertBefore(dropWrap, titleEl.firstChild);

    for (var i = 0; i < N_DROPS; i++) {
      var dot  = document.createElement('div');

      var size   = (Math.pow(Math.random(), 1.8) * 2.5 + 0.8).toFixed(1);
      var left   = (Math.random() * 104 - 2).toFixed(1);
      var dly    = (Math.random() * RAIN_SPAN + RAIN_START).toFixed(2);

      /* duración larga = flotado lento; varía mucho para sensación orgánica */
      var dur    = (Math.random() * 1.1 + 0.85).toFixed(2);

      /* la mayoría caen, algunas suben levemente (spray real asciende) */
      var goingUp = Math.random() < 0.22;
      var fallY   = goingUp
        ? (-(Math.random() * 20 + 8)).toFixed(1)           // sube 8–28 px
        : (Math.random() * 38 + 14).toFixed(1);            // baja 14–52 px
      var driftX  = ((Math.random() - 0.5) * 40).toFixed(1);
      var startY  = (-(Math.random() * 55 + 45)).toFixed(1);
      var peakOp  = (Math.random() * 0.5 + 0.3).toFixed(2);

      /* tono dorado ligeramente variable */
      var r = 193 + Math.floor(Math.random() * 22);
      var g = 152 + Math.floor(Math.random() * 28);
      var b = 48  + Math.floor(Math.random() * 32);

      /* ease-out: rápido al salir del frasco, se frena al flotar */
      var easings = [
        'cubic-bezier(0.12,0.8,0.3,1)',
        'cubic-bezier(0.08,0.7,0.25,1)',
        'cubic-bezier(0.18,0.85,0.4,1)'
      ];
      var ease = easings[Math.floor(Math.random() * easings.length)];

      dot.style.cssText =
        'position:absolute;border-radius:50%;' +
        'background:rgb(' + r + ',' + g + ',' + b + ');' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'left:'  + left + '%;top:50%;' +
        '--sy:'     + startY + 'px;' +
        '--fallY:'  + fallY  + 'px;' +
        '--driftX:' + driftX + 'px;' +
        '--op:'     + peakOp + ';' +
        'animation:dropFall ' + dur + 's ' + ease + ' ' + dly + 's both;';
      dropWrap.appendChild(dot);
    }
  }

  /* ── ciclo ── */
  function runCycle() {
    timers.forEach(clearTimeout); timers = [];

    /* reset letras */
    spans.forEach(function (s) {
      s.style.animation = 'none';
      s.style.opacity   = '0';
    });
    titleEl.offsetHeight; /* reflow */

    /* fase 1: lluvia */
    createDrops();

    /* fase 2: condensar letras */
    spans.forEach(function (s, i) {
      s.style.animation =
        'letterCondense ' + LETTER_DUR + 's ease-out ' +
        (COND_START + i * STAGGER).toFixed(2) + 's both';
    });

    /* quitar gotitas cuando ya no hacen falta */
    var rainEnd = RAIN_START + RAIN_SPAN + 0.7 + 0.3;
    timers.push(setTimeout(function () {
      if (dropWrap) { dropWrap.remove(); dropWrap = null; }
    }, rainEnd * 1000));

    /* fase 3: evaporar tras HOLD */
    var lastLetter = COND_START + (letters.length - 1) * STAGGER + LETTER_DUR;
    timers.push(setTimeout(function () {
      spans.forEach(function (s, i) {
        s.style.setProperty('--drift', ((Math.random() - 0.5) * 28).toFixed(1) + 'px');
        s.style.animation =
          'evaporate ' + EVAP_DUR + 's ease-in ' +
          (i * EVAP_STG).toFixed(2) + 's both';
      });

      /* nuevo ciclo tras evaporación */
      var cycleEnd = EVAP_DUR + (letters.length - 1) * EVAP_STG + PAUSE;
      timers.push(setTimeout(runCycle, cycleEnd * 1000));

    }, (lastLetter + HOLD) * 1000));
  }

  /* ── init ── */
  function start() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(runCycle);
    } else {
      setTimeout(runCycle, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

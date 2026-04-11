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
  var SEL = '.shdr > *,.sintro,.sstat,.scard,.tip,.qcard';

  function revealEl(el) {
    var siblings = el.parentElement
      ? Array.prototype.slice.call(el.parentElement.children) : [];
    var idx = siblings.indexOf(el);
    el.style.transitionDelay = Math.min(idx * 0.06, 0.4) + 's';
    el.classList.add('sr-in');
    if (io) io.unobserve(el);
  }

  function setup() {
    if (!window.IntersectionObserver) {
      // Sin soporte: mostrar todo
      document.querySelectorAll(SEL).forEach(function (el) {
        el.classList.remove('sr-out');
        el.classList.add('sr-in');
      });
      return;
    }

    // Desconectar observer anterior sin perder elementos pendientes
    if (io) io.disconnect();

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) revealEl(entry.target);
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.classList.contains('sr-in')) return; // ya visible, no tocar
      if (!el.classList.contains('sr-out')) el.classList.add('sr-out');
      io.observe(el); // re-observar aunque ya tenga sr-out
    });
  }

  // Revelar todo lo que siga oculto (safety net tras 1.4 s)
  function forceRevealAll() {
    document.querySelectorAll(SEL + '.sr-out:not(.sr-in)').forEach(revealEl);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Esperar 2 frames para que el layout esté asentado
    requestAnimationFrame(function () {
      requestAnimationFrame(setup);
    });
    setTimeout(forceRevealAll, 1400);
  });

  // Bfcache restore: la página vuelve sin re-ejecutar JS
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.querySelectorAll(SEL + '.sr-out:not(.sr-in)').forEach(revealEl);
    }
  });

  new MutationObserver(function () { setTimeout(setup, 80); })
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


// ── 7. PERFUMITY: Magic Text Reveal — partículas canvas ─────────
(function () {
  var titleEl = document.getElementById('hero-title');
  if (!titleEl) return;

  /* El texto permanece en el DOM para SEO; se oculta visualmente */
  titleEl.innerHTML = 'PERFUMITY';
  titleEl.style.color = 'transparent';

  /* Canvas con padding vertical para que el glow no se recorte */
  var PAD    = 24;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    pointerEvents: 'none', zIndex: '2'
  });
  titleEl.appendChild(canvas);

  var ctx      = canvas.getContext('2d');
  var dpr      = Math.min(window.devicePixelRatio || 1, 2);
  var pts      = [];
  var cW = 0, cH = 0;
  var phase    = 'converging';
  var phaseT   = 0;
  var rafId;
  var firstRun = true;

  /* ── Muestrear píxeles del texto para obtener posiciones objetivo ── */
  function sample() {
    var rect = titleEl.getBoundingClientRect();
    cW = Math.max(rect.width, 120);
    cH = Math.max(rect.height + PAD * 2, 80);   // padding arriba y abajo

    canvas.width  = Math.round(cW * dpr);
    canvas.height = Math.round(cH * dpr);
    canvas.style.width  = cW + 'px';
    canvas.style.height = cH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Canvas offscreen: texto con fuente/tamaño/tracking idénticos al h1 */
    var off = document.createElement('canvas');
    var oW  = Math.round(cW), oH = Math.round(cH);
    off.width = oW; off.height = oH;
    var oc  = off.getContext('2d');

    var cs  = window.getComputedStyle(titleEl);
    var ls  = parseFloat(cs.letterSpacing) || 0;
    oc.font         = '600 ' + cs.fontSize + ' "Cormorant Garamond", serif';
    oc.textBaseline = 'middle';
    oc.fillStyle    = '#fff';

    /* Dibujamos letra a letra para respetar el letter-spacing exacto */
    var chars  = 'PERFUMITY'.split('');
    var widths = chars.map(function (c) { return oc.measureText(c).width; });
    var total  = widths.reduce(function (a, b) { return a + b; }, 0) + ls * (chars.length - 1);
    var cx     = (oW - total) / 2;
    chars.forEach(function (c, i) {
      oc.fillText(c, cx, oH / 2);    // centrado en el canvas con PAD incluido
      cx += widths[i] + ls;
    });

    var data   = oc.getImageData(0, 0, oW, oH).data;
    var mobile = window.innerWidth < 600;
    /* Radio fijo según dispositivo: garantiza cobertura sólida del texto */
    var step   = mobile ? 4 : 3;
    var R      = mobile ? 2.1 : 1.85;
    var out    = [];
    for (var y = 0; y < oH; y += step) {
      for (var x = 0; x < oW; x += step) {
        if (data[(y * oW + x) * 4 + 3] > 110) out.push([x, y, R]);
      }
    }
    return out;
  }

  /* ── Crear partículas desde posiciones dispersas ── */
  function build() {
    var targets = sample();
    if (!targets.length) return false;

    pts = targets.map(function (t) {
      var ang = Math.random() * Math.PI * 2;
      var d   = Math.random() * Math.max(cW, cH) * 1.1 + 60;
      return {
        x:  cW / 2 + Math.cos(ang) * d,
        y:  cH / 2 + Math.sin(ang) * d * 0.5,
        tx: t[0], ty: t[1], r: t[2],
        vx: 0, vy: 0,
        a:  0,
        fa: Math.random() * Math.PI * 2,    // ángulo de float
        fs: Math.random() * 0.014 + 0.006,  // velocidad angular float
        fr: Math.random() * 4 + 1.5,        // radio de float
        cr: 200 + (Math.random() * 16 | 0),
        cg: 160 + (Math.random() * 14 | 0),
        cb:  54 + (Math.random() * 20 | 0)
      };
    });
    return true;
  }

  /* ── Gradiente metálico dorado (mismo que el logo del nav) ── */
  var GRAD_STOPS = [
    [0.00, [74,  46,   5]],
    [0.10, [154, 110,  24]],
    [0.20, [201, 160,  61]],
    [0.32, [238, 217, 106]],
    [0.42, [255, 248, 176]],
    [0.50, [240, 204,  80]],
    [0.60, [201, 160,  61]],
    [0.72, [139,  94,  10]],
    [0.82, [192, 144,  48]],
    [0.92, [232, 200,  64]],
    [1.00, [154, 110,  24]]
  ];

  function sampleGrad(t) {
    t = Math.max(0, Math.min(1, t));
    for (var i = 1; i < GRAD_STOPS.length; i++) {
      if (t <= GRAD_STOPS[i][0]) {
        var t0 = GRAD_STOPS[i-1][0], t1 = GRAD_STOPS[i][0];
        var f  = (t - t0) / (t1 - t0);
        var c0 = GRAD_STOPS[i-1][1], c1 = GRAD_STOPS[i][1];
        return 'rgb(' +
          Math.round(c0[0] + (c1[0]-c0[0]) * f) + ',' +
          Math.round(c0[1] + (c1[1]-c0[1]) * f) + ',' +
          Math.round(c0[2] + (c1[2]-c0[2]) * f) + ')';
      }
    }
    return 'rgb(201,160,61)';
  }

  /* ── Renderizar — con o sin glow dorado ── */
  function draw(glow) {
    if (glow) {
      ctx.shadowBlur  = 7;
      ctx.shadowColor = 'rgba(212,175,55,0.5)';
    }
    var i, p;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.a < 0.005) continue;
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(' + p.cr + ',' + p.cg + ',' + p.cb + ')';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (glow) ctx.shadowBlur = 0;
  }

  /* ── Renderizar en modo "holding": gradiente metálico + shimmer ── */
  function drawGolden(now) {
    /* shimmer: desplazamiento que avanza en bucle cada ~5 s */
    var shift = ((now * 0.0002) % 1) * 2.5;  /* rango 0..2.5 (background-size 250%) */
    ctx.shadowBlur  = 10;
    ctx.shadowColor = 'rgba(212,185,70,0.55)';
    var i, p, pos;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.a < 0.005) continue;
      /* posición normalizada (0..1) dentro del ancho total + offset shimmer */
      pos = ((p.tx / cW) + shift) % 1;
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = sampleGrad(pos);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  /* ── Loop principal ── */
  function tick(now) {
    rafId = requestAnimationFrame(tick);
    var elapsed = now - phaseT;
    var i, p;

    ctx.clearRect(0, 0, cW, cH);

    /* ── FLOATING: niebla de partículas que pulsan suavemente ── */
    if (phase === 'floating') {
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.fa += p.fs;
        p.x  += Math.cos(p.fa) * p.fr * 0.055;
        p.y  += Math.sin(p.fa) * p.fr * 0.04;
        /* pulso de opacidad orgánico */
        var pulse = 0.10 + 0.09 * Math.sin(now * 0.0009 + p.fa * 2.5);
        p.a = p.a + (pulse - p.a) * 0.04;
      }
      draw(false);
      if (elapsed > 1300) { phase = 'converging'; phaseT = now; }

    /* ── CONVERGING: muelle críticamente amortiguado → sin oscilación ── */
    } else if (phase === 'converging') {
      var t      = Math.min(elapsed / 1900, 1);
      /* ease-in-out cúbico para que arranque suave y se frene al llegar */
      var ease   = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      var spring = 0.038 + ease * 0.052;  // 0.038 → 0.09, progresivo
      var damp   = 0.84;                  // alto amortiguamiento = sin rebote
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.vx += (p.tx - p.x) * spring;
        p.vy += (p.ty - p.y) * spring;
        p.vx *= damp; p.vy *= damp;
        p.x  += p.vx;  p.y += p.vy;
        /* alpha sigue la curva ease: arranque suave, llegada opaca */
        p.a = Math.min(p.a + 0.018 + ease * 0.022, 1);
      }
      draw(false);
      if (elapsed > 2100) { phase = 'holding'; phaseT = now; }

    /* ── HOLDING: texto formado con micro-float y gradiente metálico ── */
    } else if (phase === 'holding') {
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.fa += p.fs * 0.22;
        /* float prácticamente imperceptible: máx ~0.16 px en fr=4 */
        p.x   = p.tx + Math.cos(p.fa) * p.fr * 0.04;
        p.y   = p.ty + Math.sin(p.fa) * p.fr * 0.03;
        p.a   = Math.min(p.a + 0.1, 1);
      }
      drawGolden(now);   /* gradiente metálico + shimmer */
      if (elapsed > 3600) {
        /* Velocidad inicial de explosión radial desde su posición actual */
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          var ang = Math.atan2(p.y - cH / 2, p.x - cW / 2) + (Math.random() - 0.5) * 1.2;
          var spd = Math.random() * 2.8 + 0.8;
          p.vx = Math.cos(ang) * spd;
          p.vy = Math.sin(ang) * spd * 0.6;
        }
        phase = 'dispersing'; phaseT = now;
      }

    /* ── DISPERSING: explosión orgánica hacia afuera y desvanecimiento ── */
    } else if (phase === 'dispersing') {
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.vx *= 0.93; p.vy *= 0.93;
        p.x  += p.vx; p.y  += p.vy;
        p.a   = Math.max(p.a - 0.015, 0);
      }
      draw(false);
      if (elapsed > 1500) {
        /* Reposicionar para el siguiente ciclo (float) */
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          var ang2 = Math.random() * Math.PI * 2;
          var d2   = Math.random() * Math.max(cW, cH) * 0.9 + 60;
          p.x = cW / 2 + Math.cos(ang2) * d2;
          p.y = cH / 2 + Math.sin(ang2) * d2 * 0.5;
          p.vx = 0; p.vy = 0; p.a = 0;
        }
        phase = 'floating'; phaseT = now;
      }
    }
  }

  /* ── Inicializar ── */
  function init() {
    if (!build()) { setTimeout(init, 400); return; }
    /* Primera carga: ir directo a converging (más impacto visual) */
    phase    = firstRun ? 'converging' : 'floating';
    firstRun = false;
    phaseT   = performance.now();
    rafId    = requestAnimationFrame(tick);
  }

  var resizeTO;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(function () {
      cancelAnimationFrame(rafId);
      if (build()) {
        phase = 'floating'; phaseT = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }, 200);
  }, { passive: true });

  function start() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(init, 80); });
    } else {
      setTimeout(init, 800);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();


// ── 8. Carousel coverflow — Familias de Fragancia ────────────────
(function () {
  function init() {
    var stage = document.getElementById('catStage');
    if (!stage) return;

    var cards  = Array.prototype.slice.call(stage.querySelectorAll('.cat-card'));
    var dots   = Array.prototype.slice.call(document.querySelectorAll('#catCarousel .cat-dot'));
    var n      = cards.length;
    var active = 0;
    var timer;
    var dragStart = null;
    var dragged   = false;

    /* Calcula el ancho real de card para el offset de posición */
    function cardW() {
      return cards[0] ? cards[0].offsetWidth : 300;
    }

    /* Aplica posiciones coverflow a todas las cards */
    function set(idx) {
      active = ((idx % n) + n) % n;
      var cw   = cardW();
      var step = cw + 24;          /* separación entre cards: ancho + gap */

      cards.forEach(function (card, i) {
        var off = i - active;
        /* camino más corto en loop circular */
        if (off >  n / 2) off -= n;
        if (off < -n / 2) off += n;

        var abs  = Math.abs(off);
        var sign = off >= 0 ? 1 : -1;

        var tx      = off * step;
        var ry      = -sign * Math.min(abs, 2) * 30;   /* rotación lateral */
        var scale   = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.66;
        var opacity = abs === 0 ? 1 : abs === 1 ? 0.62 : abs === 2 ? 0.28 : 0;
        var zi      = Math.max(10 - abs, 0);

        card.style.transform   = 'translateX(' + tx + 'px) rotateY(' + ry + 'deg) scale(' + scale + ')';
        card.style.opacity     = opacity;
        card.style.zIndex      = zi;
        card.style.pointerEvents = abs > 1 ? 'none' : 'auto';
        card.classList.toggle('cat-active', abs === 0);
      });

      /* Dots */
      dots.forEach(function (d, i) { d.classList.toggle('active', i === active); });
    }

    function next() { set(active + 1); }
    function prev() { set(active - 1); }

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(next, 3400);
    }
    function stopAuto() { clearInterval(timer); }

    /* Init */
    set(0);
    startAuto();

    /* Botones */
    var btnP = document.querySelector('#catCarousel .cat-prev');
    var btnN = document.querySelector('#catCarousel .cat-next');
    if (btnP) btnP.addEventListener('click', function () { prev(); startAuto(); });
    if (btnN) btnN.addEventListener('click', function () { next(); startAuto(); });

    /* Dots */
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { set(i); startAuto(); });
    });

    /* Click en card lateral → navegar a esa card */
    cards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        if (!dragged && !card.classList.contains('cat-active')) {
          set(i); startAuto();
        }
      });
    });

    /* Pausa en hover */
    stage.addEventListener('mouseenter', stopAuto);
    stage.addEventListener('mouseleave', startAuto);

    /* Drag con ratón */
    stage.addEventListener('mousedown', function (e) {
      dragStart = e.clientX; dragged = false;
      stage.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function (e) {
      if (dragStart !== null && Math.abs(e.clientX - dragStart) > 5) dragged = true;
    });
    window.addEventListener('mouseup', function (e) {
      if (dragStart === null) return;
      var dx = e.clientX - dragStart;
      stage.style.cursor = '';
      if (Math.abs(dx) > 44) { dx < 0 ? next() : prev(); startAuto(); }
      dragStart = null;
    });

    /* Swipe táctil */
    var touchX = null;
    stage.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 44) { dx < 0 ? next() : prev(); startAuto(); }
      touchX = null;
    }, { passive: true });

    /* Recalcular offsets si cambia el tamaño de ventana */
    window.addEventListener('resize', function () { set(active); }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

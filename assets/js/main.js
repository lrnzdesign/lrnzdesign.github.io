/* LRNZ — comportamenti della home */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Caroselli: duplico le foto per un loop senza stacchi ---------- */
  document.querySelectorAll(".carousel-track").forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (img) {
      var copy = img.cloneNode(true);
      copy.alt = "";
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
  });

  /* ---------- "I love to do": le lettere tremano mentre scorri ----------
     Da fermi la scritta è identica a Figma. Lo scroll "carica" un'energia
     che fa oscillare ogni lettera su e giù (con una lieve rotazione),
     ognuna con il suo ritmo; quando ti fermi l'energia si scarica
     e le lettere tornano al loro posto. */
  var letters = Array.prototype.slice.call(document.querySelectorAll(".love path"));
  if (letters.length && !reduceMotion) {
    var MAX_Y = 4.5;       // spostamento massimo in px (a 1440 px di larghezza)
    var MAX_ROT = 3.5;     // rotazione massima in gradi
    var DECAY = 0.9;       // quanto velocemente si calmano (più basso = più veloce)

    // ritmi diversi e fissi per ogni lettera, così il tremolio sembra a mano
    var params = letters.map(function (_, i) {
      var seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
      var r = seed - Math.floor(seed);
      return {
        freq: 0.018 + r * 0.012,
        phase: i * 1.7 + r * 6.28,
        rotFreq: 0.014 + (1 - r) * 0.01,
        rotPhase: i * 2.3
      };
    });

    var energy = 0;
    var lastY = window.scrollY;
    var running = false;
    var svg = document.querySelector(".love");

    function scale() {
      // le misure dell'SVG scalano con la viewport: tengo il movimento proporzionato
      return svg.getBoundingClientRect().height / 78;
    }

    function frame(t) {
      var s = scale();
      for (var i = 0; i < letters.length; i++) {
        var p = params[i];
        var y = Math.sin(t * p.freq + p.phase) * MAX_Y * energy;
        var rot = Math.sin(t * p.rotFreq + p.rotPhase) * MAX_ROT * energy;
        letters[i].style.transform =
          "translate(0px," + (y / s).toFixed(2) + "px) rotate(" + rot.toFixed(2) + "deg)";
      }
      energy *= DECAY;
      if (energy > 0.004) {
        requestAnimationFrame(frame);
      } else {
        energy = 0;
        running = false;
        letters.forEach(function (l) { l.style.transform = ""; });
      }
    }

    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      var delta = Math.abs(y - lastY);
      lastY = y;
      energy = Math.min(1, energy + delta / 60);
      if (!running && energy > 0.004) {
        running = true;
        requestAnimationFrame(frame);
      }
    }, { passive: true });
  }

  /* ---------- Works: anteprima che segue il cursore ---------- */
  var preview = document.querySelector(".works-preview");
  var rows = Array.prototype.slice.call(document.querySelectorAll(".work-row a[data-preview]"));
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (preview && rows.length && canHover) {
    var pImg = preview.querySelector("img");
    var pVid = preview.querySelector("video");
    var OFFSET_X = 24;               // distanza dal cursore
    var mouse = { x: 0, y: 0 }, pos = { x: 0, y: 0 };
    var visible = false, rafId = null;

    // precarico le foto così il cambio è istantaneo
    rows.forEach(function (a) {
      var src = a.getAttribute("data-preview");
      if (!/\.mp4$/i.test(src)) { var i = new Image(); i.src = src; }
    });

    function target() {
      var w = preview.offsetWidth, h = preview.offsetHeight;
      var x = mouse.x + OFFSET_X, y = mouse.y - h / 2;
      // se esce a destra la metto a sinistra del cursore
      if (x + w > window.innerWidth - 8) x = mouse.x - OFFSET_X - w;
      y = Math.max(8, Math.min(y, window.innerHeight - h - 8));
      return { x: x, y: y };
    }

    function loop() {
      var t = target();
      var k = reduceMotion ? 1 : 0.22;     // morbidezza dell'inseguimento
      pos.x += (t.x - pos.x) * k;
      pos.y += (t.y - pos.y) * k;
      preview.style.transform = "translate3d(" + pos.x.toFixed(1) + "px," + pos.y.toFixed(1) + "px,0)";
      if (visible) rafId = requestAnimationFrame(loop); else rafId = null;
    }

    function show(src) {
      var isVideo = /\.mp4$/i.test(src);
      preview.classList.toggle("is-video", isVideo);
      if (isVideo) {
        if (pVid.getAttribute("src") !== src) pVid.setAttribute("src", src);
        var p = pVid.play(); if (p && p.catch) p.catch(function () {});
      } else {
        pVid.pause();
        pImg.src = src;
      }
      if (!visible) {
        // compare già nel punto giusto, senza "volare" da lontano
        var t = target(); pos.x = t.x; pos.y = t.y;
        visible = true;
        preview.classList.add("is-visible");
        if (!rafId) loop();
      }
    }

    function hide() {
      visible = false;
      preview.classList.remove("is-visible");
      pVid.pause();
    }

    rows.forEach(function (a) {
      a.addEventListener("mouseenter", function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
        show(a.getAttribute("data-preview"));
      });
      a.addEventListener("mouseleave", hide);
    });
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("scroll", function () {
      // se scorri e il cursore esce dalla riga, l'anteprima sparisce
      if (!visible) return;
      var el = document.elementFromPoint(mouse.x, mouse.y);
      if (!el || !el.closest(".work-row a")) hide();
    }, { passive: true });
  }

  /* ---------- Works mobile: il video parte quando entra nello schermo ---------- */
  var thumbVideos = document.querySelectorAll(".work-thumb video");
  if (thumbVideos.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target.offsetParent === null) return; // nascosto su desktop
        if (en.isIntersecting) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); }
        else en.target.pause();
      });
    }, { threshold: 0.3 });
    thumbVideos.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Video di apertura con audio al click ---------- */
  document.querySelectorAll(".sound-hero").forEach(function (box) {
    var v = box.querySelector("video");
    var label = box.querySelector(".sound-toggle span");
    function setLabel() { if (label) label.textContent = v.muted ? "Sound on" : "Sound off"; }
    function toggle(e) {
      e.preventDefault();
      v.muted = !v.muted;
      if (!v.muted) { v.currentTime = 0; }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      setLabel();
    }
    box.addEventListener("click", toggle);
    setLabel();
  });

  /* ---------- Carosello card: duplico per il loop ---------- */
  document.querySelectorAll(".cards-track, .poster-track").forEach(function (t) {
    Array.prototype.slice.call(t.children).forEach(function (c) {
      var k = c.cloneNode(true); k.alt = ""; k.setAttribute("aria-hidden", "true"); t.appendChild(k);
    });
  });

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    var setOpen = function (open) {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    var logo = document.querySelector(".site-header .logo");
    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("menu-open"));
      // a ogni tocco le lettere del logo traballano
      if (logo && !reduceMotion) {
        logo.classList.remove("wobble");
        void logo.offsetWidth;
        logo.classList.add("wobble");
      }
    });
    // al tocco di Works / About / Contact la bandina verde resta visibile
    // un istante, poi il menu si chiude e si va alla sezione
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (!document.body.classList.contains("menu-open") || a.target === "_blank" || /^(mailto|tel):/.test(a.getAttribute("href"))) {
          setOpen(false); return;
        }
        e.preventDefault();
        a.classList.add("is-tapped");
        setTimeout(function () {
          a.classList.remove("is-tapped");
          setOpen(false);
          window.location.href = a.href;
        }, 260);
      });
    });
  }
})();

/* LRNZ — effetti aggiunti */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Logo che traballa anche al passaggio del mouse ---------- */
  var logo = document.querySelector(".site-header .logo");
  if (logo && !reduce) {
    logo.addEventListener("mouseenter", function () {
      logo.classList.remove("wobble"); void logo.offsetWidth; logo.classList.add("wobble");
    });
  }

  /* ---------- Testi a comparsa allo scroll ---------- */
  var sel = ".about p, .project-text p, .project-meta, .award, .disciplines, .contact-links, .project-nav";
  var items = Array.prototype.slice.call(document.querySelectorAll(sel));
  if (items.length && "IntersectionObserver" in window && !reduce) {
    items.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Works: titoli lettera per lettera ---------- */
  if (!reduce) {
    document.querySelectorAll(".work-title").forEach(function (t, row) {
      var text = t.textContent;
      t.setAttribute("aria-label", text);
      t.textContent = "";
      Array.prototype.forEach.call(text, function (c, i) {
        var s = document.createElement("span");
        s.className = "ch"; s.setAttribute("aria-hidden", "true");
        s.textContent = c;
        s.style.animationDelay = (0.15 + row * 0.09 + i * 0.03).toFixed(2) + "s";
        t.appendChild(s);
      });
      t.classList.add("split");
    });
  }

  /* ---------- Cursore: pallino nero, verde sopra ciò che è cliccabile ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduce) {
    var dot = document.createElement("div");
    dot.className = "cursor-dot is-hidden";
    document.body.appendChild(dot);
    document.documentElement.classList.add("has-cursor");
    var clickable = "a, button, [role='button'], .sound-hero, label, select, summary";
    window.addEventListener("mousemove", function (e) {
      dot.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
      dot.classList.remove("is-hidden");
      var el = e.target && e.target.closest ? e.target.closest(clickable) : null;
      dot.classList.toggle("is-link", !!el);
    }, { passive: true });
    document.addEventListener("mouseleave", function () { dot.classList.add("is-hidden"); });
    document.addEventListener("mouseenter", function () { dot.classList.remove("is-hidden"); });
  }
})();

/* LRNZ — video in autoplay anche su iPhone */
(function () {
  "use strict";
  var vids = Array.prototype.slice.call(document.querySelectorAll("video[autoplay], .work-thumb video"));
  if (!vids.length) return;
  function prep(v) {
    v.muted = true; v.defaultMuted = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    v.playsInline = true;
  }
  function tryPlay(v) {
    if (!v.offsetParent && getComputedStyle(v).position !== "fixed") return;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  vids.forEach(function (v) {
    if (v.closest(".sound-hero")) { v.playsInline = true; v.setAttribute("playsinline", ""); }
    else prep(v);
    if (v.getAttribute("preload") === "metadata") v.setAttribute("preload", "auto");
  });
  // fa partire i video quando entrano nello schermo e li ferma quando escono
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) tryPlay(en.target);
        else if (!en.target.closest(".sound-hero")) en.target.pause();
      });
    }, { threshold: 0.15 });
    vids.forEach(function (v) { io.observe(v); });
  } else {
    vids.forEach(tryPlay);
  }
  // se il telefono blocca l'autoplay (es. risparmio energetico), partono al primo tocco
  function unlock() {
    vids.forEach(function (v) {
      var r = v.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) tryPlay(v);
    });
  }
  ["touchstart", "pointerdown", "scroll"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { passive: true });
  });
})();

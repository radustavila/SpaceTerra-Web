/* SpaceTerra — progressive enhancement only.
   Every page renders and reads fine with JavaScript disabled. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  /* --- Not-found notice -----------------------------------------------------
     404.html redirects unknown routes to `<site root>?notfound=<requested path>`.
     Show what was asked for, then clean the query out of the address bar.
     The path is untrusted input: it is only ever written with textContent. */
  var notice = document.getElementById('notfound');
  if (notice) {
    var requested = null;
    try {
      requested = new URLSearchParams(window.location.search).get('notfound');
    } catch (e) {}

    if (requested) {
      var pathEl = notice.querySelector('[data-notfound-path]');
      var clean = requested
        .replace(/[\u0000-\u001f\u007f]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (clean.charAt(0) !== '/') clean = '/' + clean;
      if (clean.length > 80) clean = clean.slice(0, 79) + '…';
      if (pathEl) pathEl.textContent = clean;
      notice.hidden = false;

      if (window.history && history.replaceState) {
        history.replaceState(null, '', window.location.pathname + window.location.hash);
      }
    }

    var dismiss = notice.querySelector('[data-notfound-dismiss]');
    if (dismiss) dismiss.addEventListener('click', function () { notice.hidden = true; });
  }

  /* --- Theme toggle (initial value is set by the inline script in <head>) --- */
  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    var sync = function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    sync();
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('spaceterra-theme', next); } catch (e) {}
      sync();
    });
  }

  /* --- Mobile navigation --- */
  var navBtn = document.querySelector('[data-nav-toggle]');
  var navPanel = document.getElementById('nav-panel');
  if (navBtn && navPanel) {
    var setNav = function (open) {
      navPanel.setAttribute('data-open', String(open));
      navBtn.setAttribute('aria-expanded', String(open));
      navBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    navBtn.addEventListener('click', function () {
      setNav(navPanel.getAttribute('data-open') !== 'true');
    });
    navPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navPanel.getAttribute('data-open') === 'true') {
        setNav(false);
        navBtn.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1120) setNav(false);
    });
  }

  /* --- Header border on scroll --- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.setAttribute('data-scrolled', String(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Screenshot showcase carousel --- */
  var showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    var track = showcase.querySelector('[data-showcase-track]');
    var slides = Array.prototype.slice.call(track.children);
    var dotsWrap = showcase.querySelector('[data-showcase-dots]');
    var prevBtn = showcase.querySelector('[data-showcase-prev]');
    var nextBtn = showcase.querySelector('[data-showcase-next]');
    var current = 0;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var desktopMQ = window.matchMedia ? window.matchMedia('(min-width: 941px)') : { matches: false };
    var AUTOPLAY_DELAY = 2000;
    var RESUME_DELAY = 15000;
    var autoplayTimer = null;
    var scrollSyncTimer = null;
    var snapReleaseTimer = null;
    var programmatic = false;

    function isStack() { return desktopMQ.matches; }

    /* Move the mobile strip to `current`.
       WebKit — iOS Safari, and iOS Chrome, which is WebKit too — will not run a
       programmatic scroll across a `scroll-snap-type: mandatory` container: it
       halts at the first snap point, so wrapping from the last slide back to the
       first never arrives. Turn snapping off for the length of our own scroll and
       hand it back once we have landed (we always land exactly on a snap point,
       so restoring it moves nothing). */
    function scrollToSlide(instant) {
      var left = current * track.clientWidth;
      var smooth = !instant && !reduceMotion;

      clearTimeout(snapReleaseTimer);
      programmatic = true;
      track.style.scrollSnapType = 'none';

      if (smooth) {
        try {
          track.scrollTo({ left: left, behavior: 'smooth' });
        } catch (e) {
          track.scrollLeft = left;
          smooth = false;
        }
      } else {
        /* `behavior: 'auto'` is not "jump" — it defers to the track's CSS
           `scroll-behavior: smooth`, so an unanimated move has to suppress that
           property for the assignment. */
        var prevBehavior = track.style.scrollBehavior;
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = left;
        track.style.scrollBehavior = prevBehavior;
      }

      if (smooth) snapReleaseTimer = setTimeout(releaseSnap, 700);
      else releaseSnap();
    }

    function releaseSnap() {
      clearTimeout(snapReleaseTimer);
      snapReleaseTimer = null;
      track.style.scrollSnapType = '';
      programmatic = false;
    }

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Go to screenshot ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { goTo(i); markInteraction(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function updateDots() {
      dots.forEach(function (d, di) { d.setAttribute('aria-selected', String(di === current)); });
    }

    function render(instant) {
      if (isStack()) {
        slides.forEach(function (s, i) {
          var offset = (i - current + slides.length) % slides.length;
          s.dataset.depth = offset === 0 ? '0' : offset === 1 ? '1' : offset === 2 ? '2' : 'hidden';
        });
      } else {
        slides.forEach(function (s) { s.removeAttribute('data-depth'); });
        scrollToSlide(instant);
      }
      updateDots();
    }

    function goTo(i) {
      current = ((i % slides.length) + slides.length) % slides.length;
      render();
    }

    function clearAutoplay() { if (autoplayTimer) { clearTimeout(autoplayTimer); autoplayTimer = null; } }
    function scheduleAutoplay(delay) {
      clearAutoplay();
      if (reduceMotion) return;
      autoplayTimer = setTimeout(function () {
        goTo(current + 1);
        scheduleAutoplay(AUTOPLAY_DELAY);
      }, delay);
    }
    function markInteraction() { scheduleAutoplay(RESUME_DELAY); }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); markInteraction(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); markInteraction(); });

    /* Clicking a peeking (stacked) card on desktop brings it to the front */
    track.addEventListener('click', function (e) {
      if (!isStack()) return;
      var slideEl = e.target.closest('.showcase-slide');
      if (!slideEl) return;
      var idx = slides.indexOf(slideEl);
      if (idx !== current) { goTo(idx); markInteraction(); }
    });

    /* A user grabbing the strip to swipe/drag counts as interaction, and hands
       snapping straight back so the swipe itself still snaps */
    track.addEventListener('pointerdown', function () {
      if (programmatic) releaseSnap();
      markInteraction();
    }, { passive: true });

    /* Keep `current` in sync with native swipe scrolling (mobile) without forcing a scroll ourselves */
    track.addEventListener('scroll', function () {
      if (isStack() || programmatic) return;
      clearTimeout(scrollSyncTimer);
      scrollSyncTimer = setTimeout(function () {
        var idx = Math.round(track.scrollLeft / track.clientWidth);
        if (idx !== current) { current = idx; updateDots(); }
      }, 100);
    }, { passive: true });

    /* Re-sync layout when crossing the desktop/mobile breakpoint */
    var onModeChange = function () { render(true); };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onModeChange);
    else if (desktopMQ.addListener) desktopMQ.addListener(onModeChange);

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (isStack()) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { render(true); }, 120);
    });

    render(true);
    scheduleAutoplay(AUTOPLAY_DELAY);
  }

  /* --- Reveal on scroll --- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (!('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }
})();

/* Maple Glen Tavern — interactions (no dependencies)
   Version 4 (Sep 26): green buttons, back to top, video settles on wide shot */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: solid after leaving the hero ---------- */
  const header = $("[data-header]");
  const hero = $(".hero");
  const quickBar = $(".quick-bar");
  const toTop = $("[data-to-top]");
  const onScroll = () => {
    const past = window.scrollY > 24;
    header.classList.toggle("is-solid", past || navOpen);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 1.5);
    if (quickBar && hero) quickBar.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.6);
  };

  /* ---------- Mobile nav ---------- */
  const toggle = $("[data-nav-toggle]");
  const links = $("[data-nav-links]");
  let navOpen = false;
  const setNav = (open) => {
    navOpen = open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".visually-hidden").textContent = open ? "Close menu" : "Open menu";
    links.classList.toggle("is-open", open);
    onScroll();
  };
  toggle.addEventListener("click", () => setNav(!navOpen));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && navOpen) { setNav(false); toggle.focus(); } });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Back to top ---------- */
  if (toTop) {
    toTop.hidden = false;
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      // Move keyboard/screen-reader focus to the top of the page too
      const h1 = $("#hero-title");
      if (h1) h1.focus({ preventScroll: true });
    });
  }

  /* ---------- Live hours (always Eastern time, whatever the visitor's timezone) ---------- */
  const rows = $$("[data-hours] tr[data-day]");
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmt = (t) => {
    let [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return m ? `${h}:${String(m).padStart(2, "0")} ${ap}` : `${h} ${ap}`;
  };
  const hours = {};
  rows.forEach((r) => { hours[r.dataset.day] = { open: r.dataset.open, close: r.dataset.close, row: r }; });

  function easternNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  }

  function status() {
    const { day, min } = easternNow();
    const today = hours[day];
    const yesterday = hours[(day + 6) % 7];
    // Still inside last night's hours (after midnight)?
    if (yesterday) {
      const o = toMin(yesterday.open), c = toMin(yesterday.close);
      if (c <= o && min < c) return { open: true, until: yesterday.close, day };
    }
    if (today) {
      const o = toMin(today.open), c = toMin(today.close);
      const end = c <= o ? c + 1440 : c;
      if (min >= o && min < end) return { open: true, until: today.close, day };
      if (min < o) return { open: false, next: `today at ${fmt(today.open)}`, day };
    }
    const tomorrow = hours[(day + 1) % 7];
    return { open: false, next: tomorrow ? `tomorrow at ${fmt(tomorrow.open)}` : "soon", day };
  }

  function renderStatus() {
    if (!rows.length) return;
    const s = status();
    rows.forEach((r) => r.classList.toggle("is-today", Number(r.dataset.day) === s.day));
    const badge = $("[data-status]");
    const quick = $("[data-quick-hours]");
    [badge, quick].forEach((el) => el && (el.dataset.state = s.open ? "open" : "closed"));
    if (badge) {
      $("[data-status-label]", badge).textContent = s.open ? "Open now" : "Closed now";
      $("[data-status-detail]", badge).textContent = s.open ? `Until ${fmt(s.until)} tonight` : `Opens ${s.next}`;
    }
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* ---------- Menu tabs (phones) ---------- */
  const tablist = $("[data-menu-tabs]");
  const board = $("[data-menu]");
  if (tablist && board) {
    tablist.hidden = false;
    board.classList.add("has-tabs");
    const tabs = $$('[role="tab"]', tablist);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      board.dataset.active = tab.id.replace("tab-", "");
      if (focus) tab.focus();
      // If we've scrolled into the list, jump back to the top of the new section (just under the sticky tabs)
      const offset = tablist.getBoundingClientRect().bottom + 8;
      const boardTop = board.getBoundingClientRect().top;
      if (boardTop < offset) {
        window.scrollTo({ top: window.scrollY + boardTop - offset, behavior: reduceMotion ? "auto" : "smooth" });
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  }

  /* ---------- Map loads on request ---------- */
  const loadBtn = $("[data-map-load]");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const map = $("[data-map]");
      const iframe = document.createElement("iframe");
      iframe.title = "Map to Maple Glen Tavern, 505 Limekiln Pike";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.src = "https://www.google.com/maps?q=Maple+Glen+Tavern,+505+Limekiln+Pike,+Maple+Glen,+PA+19002&z=16&output=embed";
      map.innerHTML = "";
      map.appendChild(iframe);
      iframe.focus();
    });
  }

  /* ---------- Hero video: play, rebound, then settle on the wide shot ----------
     The file is a boomerang: flies out to the wide shot (middle of the file),
     then back in (end of file). REBOUNDS = how many full out-and-back trips
     to play before stopping on the wide shot. 1 = out, back, out, stop.
     Set to 0 to stop the first time it reaches the wide shot.            */
  const REBOUNDS = 1;

  const video = $("[data-hero-video]");
  const vBtn = $("[data-video-toggle]");
  if (video && vBtn) {
    const conn = navigator.connection || {};
    let tripsDone = 0;
    let settled = false;
    const mid = () => (video.duration || 6.83) / 2;
    const hasFrameCb = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    const setButton = (paused) => {
      vBtn.setAttribute("aria-pressed", String(paused));
      vBtn.querySelector(".visually-hidden").textContent = paused ? "Replay background video" : "Pause background video";
    };

    const settle = () => {
      settled = true;
      hero.classList.add("is-settled");
      video.pause();
      video.currentTime = mid() - 0.03; // last frame of the fly-out
      setButton(true);
    };

    // Check each frame (or each timeupdate on older browsers) for the stop point
    const check = (t) => {
      if (!settled && tripsDone >= REBOUNDS && t >= mid() - 0.05) settle();
    };
    const watch = () => {
      if (!hasFrameCb) return;
      video.requestVideoFrameCallback((_, meta) => {
        check(meta.mediaTime);
        if (!settled) watch();
      });
    };
    if (!hasFrameCb) video.addEventListener("timeupdate", () => check(video.currentTime));

    video.addEventListener("ended", () => {
      tripsDone++;
      video.currentTime = 0;
      video.play().catch(() => {});
    });

    const start = () => {
      settled = false;
      hero.classList.remove("is-settled");
      tripsDone = 0;
      video.currentTime = 0;
      setButton(false);
      video.play().catch(() => {});
      watch();
    };

    if (reduceMotion || conn.saveData) {
      // No motion: show the wide shot as a still
      video.removeAttribute("autoplay");
      video.pause();
      const showStill = () => settle();
      video.readyState >= 1 ? showStill() : video.addEventListener("loadedmetadata", showStill, { once: true });
    } else {
      watch();
    }

    // Button: pause mid-flight, or replay from the start once it has settled
    vBtn.addEventListener("click", () => {
      if (settled) return start();
      if (video.paused) { setButton(false); video.play().catch(() => {}); }
      else { video.pause(); setButton(true); }
    });

    // Pause when off screen to save battery (never restarts a settled video)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (settled || vBtn.getAttribute("aria-pressed") === "true") return;
        entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
      }).observe(hero);
    }
  }

  /* ---------- Subtle scroll reveal ---------- */
  const revealEls = $$(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Footer year ---------- */
  const y = $("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();

/* =============================================================================
   app.js  —  the engine that ties everything together.
   -----------------------------------------------------------------------------
   Responsibilities:
     • Save & restore progress with localStorage (survives refresh)
     • Welcome screen → Begin
     • Show one chapter at a time with cinematic transitions
     • Navigation (prev / next / progress dots / chapter menu)
     • The full-screen letter "reader" overlay
     • Wire up music (audio.js) and petals (atmosphere.js)
   ========================================================================== */

(function () {
  "use strict";

  const STORE_KEY = "letterToSara_v1";
  const chapters = window.SaraChapters;

  /* ---- state ------------------------------------------------------------- */
  const defaultState = { begun: false, current: 0, unlocked: 0, opened: {}, musicWanted: false };
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return Object.assign({}, defaultState);
      const parsed = JSON.parse(raw);
      return Object.assign({}, defaultState, parsed, { opened: parsed.opened || {} });
    } catch (e) {
      return Object.assign({}, defaultState);
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked — fail quietly */ }
  }

  /* ---- element refs (created in build()) --------------------------------- */
  let elWelcome, elContainer, elNav, elPrev, elNext, elProgress, elMenuBtn, elMenu, elMenuList, elAudioBtn;
  const rendered = {};   // which chapters have had render() called

  /* ---- reader overlay ---------------------------------------------------- */
  const reader = (function () {
    let overlay, titleEl, bodyEl, signEl;
    function build() {
      overlay = document.createElement("div");
      overlay.id = "reader";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:80;overflow-y:auto;opacity:0;visibility:hidden;" +
        "background:rgba(255,249,244,0.98);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);" +
        "transition:opacity .6s ease, visibility .6s ease;padding:calc(2rem + env(safe-area-inset-top)) 1.2rem 4rem;";
      const inner = document.createElement("div");
      inner.className = "letter-paper";
      inner.style.cssText = "max-width:760px;margin:2rem auto 0;";
      titleEl = document.createElement("h2");
      titleEl.style.textAlign = "center";
      bodyEl = document.createElement("div");
      bodyEl.className = "letter-body";
      signEl = document.createElement("div");
      signEl.className = "signature";
      const close = document.createElement("button");
      close.className = "btn btn-ghost";
      close.textContent = "Close the letter";
      close.style.cssText = "display:block;margin:2rem auto 0;";
      close.addEventListener("click", hide);
      inner.appendChild(titleEl); inner.appendChild(bodyEl); inner.appendChild(signEl);
      const wrap = document.createElement("div"); wrap.style.maxWidth = "760px"; wrap.style.margin = "0 auto";
      wrap.appendChild(close);
      overlay.appendChild(inner); overlay.appendChild(wrap);
      overlay.addEventListener("click", e => { if (e.target === overlay) hide(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay.classList.contains("is-open")) hide(); });
      document.body.appendChild(overlay);
    }
    function show(title, body, sign) {
      if (!overlay) build();
      titleEl.textContent = title || "";
      bodyEl.innerHTML = "";
      String(body).split(/\n\n+/).forEach(p => {
        const par = document.createElement("p");
        par.textContent = p;
        bodyEl.appendChild(par);
      });
      signEl.textContent = sign || "";
      overlay.classList.add("is-open");
      overlay.style.opacity = "1";
      overlay.style.visibility = "visible";
      overlay.scrollTop = 0;
      document.body.style.overflow = "hidden";
    }
    function hide() {
      if (!overlay) return;
      overlay.classList.remove("is-open");
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
      document.body.style.overflow = "";
    }
    return { show, hide };
  })();

  /* ---- build the DOM scaffold for all chapters --------------------------- */
  function build() {
    elWelcome   = document.getElementById("welcome");
    elContainer = document.getElementById("chapter-container");
    elNav       = document.getElementById("nav");
    elPrev      = document.getElementById("prev");
    elNext      = document.getElementById("next");
    elProgress  = document.getElementById("progress");
    elMenuBtn   = document.getElementById("menu-btn");
    elMenu      = document.getElementById("menu");
    elMenuList  = document.getElementById("menu-list");
    elAudioBtn  = document.getElementById("audio-toggle");

    // one section per chapter
    chapters.forEach((def, i) => {
      const sec = document.createElement("section");
      sec.className = "chapter";
      sec.id = "chapter-" + i;
      const inner = document.createElement("div");
      inner.className = "chapter-inner";
      sec.appendChild(inner);
      elContainer.appendChild(sec);
    });

    // progress dots
    chapters.forEach((def, i) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.setAttribute("aria-label", "Go to chapter " + (i + 1));
      dot.addEventListener("click", () => { if (i <= state.unlocked) goTo(i); });
      elProgress.appendChild(dot);
    });

    // chapter menu
    chapters.forEach((def, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.className = "menu-item";
      const num = document.createElement("span"); num.className = "num"; num.textContent = (i + 1);
      const label = document.createElement("span");
      label.textContent = def.title || (def.id === "final" ? "The end" : def.id);
      b.appendChild(num); b.appendChild(label);
      const lock = document.createElement("span"); lock.className = "lock";
      b.appendChild(lock);
      b.addEventListener("click", () => { if (i <= state.unlocked) { closeMenu(); goTo(i); } });
      li.appendChild(b);
      elMenuList.appendChild(li);
    });

    // nav buttons
    elPrev.addEventListener("click", () => { if (state.current > 0) goTo(state.current - 1); });
    elNext.addEventListener("click", () => { if (state.current < state.unlocked) goTo(state.current + 1); });
    elMenuBtn.addEventListener("click", openMenu);
    document.getElementById("menu-close").addEventListener("click", closeMenu);

    // audio toggle
    elAudioBtn.addEventListener("click", () => {
      const on = SaraAudio.toggle();
      state.musicWanted = on;
      elAudioBtn.textContent = on ? "♪" : "♪̸";
      elAudioBtn.setAttribute("aria-label", on ? "Turn music off" : "Turn music on");
      save();
    });

    // begin
    document.getElementById("begin-btn").addEventListener("click", begin);
  }

  /* ---- rendering & navigation ------------------------------------------- */
  function ctxFor(i) {
    const def = chapters[i];
    const inner = document.querySelector("#chapter-" + i + " .chapter-inner");
    return {
      def, index: i, el,
      opened: key => !!state.opened[key],
      markOpened: key => { if (!state.opened[key]) { state.opened[key] = true; save(); } },
      openReader: (title, body, sign) => reader.show(title, body, sign),
      next: () => goTo(Math.min(i + 1, chapters.length - 1)),
      restart: () => { state.current = 0; state.opened = state.opened; save(); goTo(0); },
      addContinue: label => {
        const wrap = document.createElement("div");
        wrap.className = "continue-wrap";
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = label || "Continue";
        btn.addEventListener("click", () => {
          if (i + 1 < chapters.length) {
            state.unlocked = Math.max(state.unlocked, i + 1);
            save();
            goTo(i + 1);
          }
        });
        wrap.appendChild(btn);
        inner.appendChild(wrap);
      }
    };
  }

  function renderChapter(i) {
    if (rendered[i]) return;
    rendered[i] = true;
    const inner = document.querySelector("#chapter-" + i + " .chapter-inner");
    inner.innerHTML = "";
    try {
      chapters[i].render(inner, ctxFor(i));
    } catch (err) {
      console.error("Chapter render error", i, err);
      inner.appendChild(el("p", { class: "note-inline", text: "Something went wrong loading this chapter." }));
    }
  }

  function goTo(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(i, chapters.length - 1));
    const prevIndex = state.current;
    const prevSec = document.getElementById("chapter-" + prevIndex);
    const nextSec = document.getElementById("chapter-" + i);

    // atmosphere / music: calm only on the final chapter
    if (chapters[i].id !== "final") {
      if (window.SaraAtmosphere) SaraAtmosphere.normal();
      if (window.SaraAudio && state.musicWanted) SaraAudio.restore();
    }

    renderChapter(i);
    state.current = i;
    state.unlocked = Math.max(state.unlocked, i);
    save();

    const activate = () => {
      chapters.forEach((_, k) => {
        const s = document.getElementById("chapter-" + k);
        s.classList.toggle("is-active", k === i);
        s.classList.remove("is-leaving");
      });
      window.scrollTo({ top: 0, behavior: opts.instant ? "auto" : "smooth" });
      updateChrome();
    };

    if (opts.instant || prevIndex === i || !prevSec.classList.contains("is-active")) {
      activate();
    } else {
      prevSec.classList.add("is-leaving");
      setTimeout(activate, 550);
    }
  }

  function updateChrome() {
    // dots
    Array.from(elProgress.children).forEach((dot, k) => {
      dot.classList.toggle("is-current", k === state.current);
      dot.classList.toggle("is-done", k < state.current);
    });
    // nav enable/disable
    elPrev.disabled = state.current === 0;
    elNext.disabled = state.current >= state.unlocked;
    // menu locks
    Array.from(elMenuList.querySelectorAll(".menu-item")).forEach((b, k) => {
      const locked = k > state.unlocked;
      b.disabled = locked;
      b.classList.toggle("is-current", k === state.current);
      b.querySelector(".lock").textContent = locked ? "🔒" : (k === state.current ? "reading" : (k < state.current ? "✓" : ""));
    });
  }

  function openMenu() { elMenu.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  function closeMenu() { elMenu.classList.remove("is-open"); document.body.style.overflow = ""; }

  /* ---- begin / resume --------------------------------------------------- */
  function revealShell() {
    elNav.classList.remove("is-hidden");
    elMenuBtn.classList.remove("is-hidden");
    elAudioBtn.classList.remove("is-hidden");
  }

  function begin() {
    state.begun = true;
    state.musicWanted = true;
    save();
    elWelcome.classList.add("is-hidden");
    if (window.SaraAtmosphere) SaraAtmosphere.start();
    if (window.SaraAudio) { SaraAudio.init(); SaraAudio.start(); }
    elAudioBtn.textContent = "♪";
    revealShell();
    goTo(state.current || 0, { instant: true });
  }

  function resume() {
    // already begun in a previous visit — skip the welcome screen
    elWelcome.classList.add("is-hidden");
    if (window.SaraAtmosphere) SaraAtmosphere.start();
    revealShell();
    elAudioBtn.textContent = state.musicWanted ? "♪" : "♪̸";
    goTo(state.current || 0, { instant: true });

    // browsers block autoplay until a gesture — resume music on first tap if wanted
    if (state.musicWanted) {
      const kick = () => {
        SaraAudio.init(); SaraAudio.start();
        window.removeEventListener("pointerdown", kick);
      };
      window.addEventListener("pointerdown", kick, { once: true });
    }
  }

  /* ---- boot ------------------------------------------------------------- */
  let booted = false;
  function boot() {
    if (booted) return;            // never build the scaffold twice
    booted = true;
    build();
    if (state.begun) resume();     // continue from last chapter, opened letters preserved
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();                        // script loaded after DOM was already ready
  }

})();

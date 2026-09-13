/* =============================================================================
   chapters.js  —  one render function per chapter, in order.
   -----------------------------------------------------------------------------
   Each chapter is an object: { id, eyebrow, title, render(root, ctx) }.
   The engine (app.js) shows one chapter at a time and calls render() once.

   ctx helpers available to every chapter:
     ctx.opened(key)        -> has this letter/card been opened before?
     ctx.markOpened(key)    -> remember it was opened (persists to localStorage)
     ctx.addContinue(label) -> add the "continue" button that unlocks the next
     ctx.next()             -> go to the next chapter
     ctx.openReader(title, body, sign) -> open a full-screen letter reader
     ctx.el(...)            -> tiny DOM helper

   To add / edit words: open content.js. To change behaviour: edit here.
   ========================================================================== */

/* ---- tiny DOM helper -------------------------------------------------------*/
function el(tag, opts, kids) {
  opts = opts || {};
  const n = document.createElement(tag);
  if (opts.class) n.className = opts.class;
  if (opts.text != null) n.textContent = opts.text;
  if (opts.html != null) n.innerHTML = opts.html;
  if (opts.attrs) for (const k in opts.attrs) n.setAttribute(k, opts.attrs[k]);
  if (opts.style) n.setAttribute("style", opts.style);
  if (opts.on) for (const k in opts.on) n.addEventListener(k, opts.on[k]);
  const list = kids == null ? [] : (Array.isArray(kids) ? kids : [kids]);
  list.forEach(c => { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return n;
}

/* Standard chapter header (eyebrow + title + optional intro) */
function header(ctx, intro) {
  const frag = document.createDocumentFragment();
  frag.appendChild(el("div", { class: "chapter-eyebrow", text: ctx.def.eyebrow }));
  frag.appendChild(el("h2", { class: "chapter-title", text: ctx.def.title }));
  if (intro) frag.appendChild(el("p", { class: "chapter-intro", text: intro }));
  return frag;
}

const C = (typeof SARA_CONTENT !== "undefined") ? SARA_CONTENT : window.SARA_CONTENT;

const SaraChapters = [

  /* ===== CHAPTER 1 — OPENING ============================================== */
  {
    id: "c1", eyebrow: "Chapter One", title: "Where it begins",
    render(root, ctx) {
      const stage = el("div", { class: "opening-stage" });
      const line = el("p", { class: "opening-line" });
      stage.appendChild(line);
      root.appendChild(stage);

      const lines = C.opening;
      let i = 0;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      function show() {
        if (i >= lines.length) { finish(); return; }
        line.textContent = lines[i];
        line.classList.remove("show");
        void line.offsetWidth;                // restart animation
        line.classList.add("show");
        i++;
        setTimeout(show, reduce ? 2200 : 3600);
      }
      function finish() {
        line.textContent = lines[lines.length - 1];
        line.classList.add("show");
        ctx.addContinue("Continue");
      }
      // let people skip ahead by tapping
      stage.addEventListener("click", () => { if (i < lines.length) { i = lines.length; finish(); } });
      show();
    }
  },

  /* ===== CHAPTER 2 — THE GIRL I SEE ====================================== */
  {
    id: "c2", eyebrow: "Chapter Two", title: "The Girl I See",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter2.intro));

      // hero image (placeholder-aware)
      const hero = el("div", { class: "photo-frame", style: "aspect-ratio:4/3;margin-bottom:2rem;" });
      const img = new Image();
      img.alt = "A photo of you";
      img.onload = () => { hero.innerHTML = ""; hero.appendChild(img); };
      img.onerror = () => {
        hero.appendChild(el("div", { class: "photo-missing",
          text: "Your photo will live here — save it as assets/photos/hero.jpg" }));
      };
      img.src = "assets/photos/hero.jpg";
      root.appendChild(hero);

      const grid = el("div", { class: "card-grid" });
      C.chapter2.cards.forEach((card, i) => grid.appendChild(makeExpandCard(ctx, "c2:" + i, card.title, card.preview, card.body)));
      root.appendChild(grid);

      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 3 — THINGS I NOTICE (flip cards) ======================== */
  {
    id: "c3", eyebrow: "Chapter Three", title: "Things I Notice",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter3.intro));
      const grid = el("div", { class: "flip-grid" });
      C.chapter3.things.forEach((thing, i) => {
        const key = "c3:" + i;
        const front = el("div", { class: "flip-face flip-front", text: (i + 1) });
        const back = el("div", { class: "flip-face flip-back", text: thing });
        const inner = el("div", { class: "flip-inner" }, [front, back]);
        const card = el("div", { class: "flip", attrs: { role: "button", tabindex: "0", "aria-label": "Reveal thing " + (i + 1) } }, [inner]);
        if (ctx.opened(key)) card.classList.add("is-flipped");
        const flip = () => { card.classList.toggle("is-flipped"); if (card.classList.contains("is-flipped")) ctx.markOpened(key); };
        card.addEventListener("click", flip);
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
        grid.appendChild(card);
      });
      root.appendChild(grid);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 4 — MOMENTS YOU NEVER SAW (timeline) ==================== */
  {
    id: "c4", eyebrow: "Chapter Four", title: "The Moments You Never Saw",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter4.intro));
      const tl = el("div", { class: "timeline" });
      C.chapter4.moments.forEach((m, i) => {
        const key = "c4:" + i;
        const state = el("span", { class: "tl-sub", text: ctx.opened(key) ? "Opened — tap to read again" : "Tap to open" });
        const btn = el("button", { class: "tl-btn" }, [document.createTextNode(m.label), state]);
        btn.addEventListener("click", () => {
          ctx.markOpened(key);
          state.textContent = "Opened — tap to read again";
          ctx.openReader(m.label, m.letter, "— " + C.from);
        });
        const item = el("div", { class: "tl-item" }, [el("span", { class: "tl-dot" }), btn]);
        tl.appendChild(item);
      });
      root.appendChild(tl);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 5 — THE APOLOGY (unfolding letter) ====================== */
  {
    id: "c5", eyebrow: "Chapter Five", title: "The Apology",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter5.intro));
      const paper = el("div", { class: "letter-paper" });
      const stage = el("div", { class: "unfold-stage" });
      paper.appendChild(stage);
      root.appendChild(paper);

      const pages = C.chapter5.pages;
      let shown = 0;
      const moreWrap = el("div", { class: "continue-wrap" });
      const moreBtn = el("button", { class: "btn btn-ghost", text: "Unfold the next part" });
      moreWrap.appendChild(moreBtn);

      function reveal() {
        const p = el("div", { class: "unfold-page letter-body" });
        // split into paragraphs for nicer spacing
        pages[shown].split(/\n\n+/).forEach(par => p.appendChild(el("p", { text: par })));
        stage.appendChild(p);
        void p.offsetWidth;
        p.classList.add("show");
        ctx.markOpened("c5:" + shown);
        shown++;
        if (shown >= pages.length) {
          moreWrap.remove();
          ctx.addContinue("Continue");
        } else {
          p.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }
      moreBtn.addEventListener("click", reveal);
      root.appendChild(moreWrap);
      reveal();   // show the first page immediately
    }
  },

  /* ===== CHAPTER 6 — VIDEO =============================================== */
  {
    id: "c6", eyebrow: "Chapter Six", title: "From My Heart",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter6.intro));
      const frame = el("div", { class: "video-frame" });
      const after = el("p", { class: "after-video signature", text: C.chapter6.afterVideo });

      const video = el("video", { attrs: { controls: "", playsinline: "", preload: "metadata" } });
      video.appendChild(el("source", { attrs: { src: "assets/video/apology.mp4", type: "video/mp4" } }));
      video.addEventListener("ended", () => {
        ctx.markOpened("c6:watched");
        after.classList.add("show");
        floatHearts(root);
      });
      video.addEventListener("error", showMissing);
      // Some browsers fire error on the <source>, not the <video>
      video.querySelector("source").addEventListener("error", showMissing);

      let missingShown = false;
      function showMissing() {
        if (missingShown) return; missingShown = true;
        frame.innerHTML = "";
        frame.appendChild(el("div", { class: "video-missing" }, [
          el("div", { style: "font-size:2.4rem", text: "🎬" }),
          el("p", { text: C.chapter6.intro }),
          el("p", { class: "note-inline", style: "color:rgba(255,255,255,0.9)", text: C.chapter6.noVideoNote })
        ]));
        after.classList.add("show");
      }
      frame.appendChild(video);
      root.appendChild(frame);
      root.appendChild(after);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 7 — 100 REASONS ======================================== */
  {
    id: "c7", eyebrow: "Chapter Seven", title: "100 Reasons I Love You",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter7.intro));
      root.appendChild(makeRevealGrid(ctx, "c7", C.chapter7.reasons, "Reason"));
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 8 — OPEN WHEN (envelopes) ============================== */
  {
    id: "c8", eyebrow: "Chapter Eight", title: "Open When",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter8.intro));
      const grid = el("div", { class: "env-grid" });
      C.chapter8.envelopes.forEach((env, i) => {
        const key = "c8:" + i;
        const state = el("div", { class: "env-state", text: ctx.opened(key) ? "Opened" : "Sealed — tap to open" });
        const card = el("div", { class: "envelope" + (ctx.opened(key) ? " opened" : ""), attrs: { role: "button", tabindex: "0" } }, [
          el("span", { class: "flap", text: "✉" }),
          el("h3", { text: env.title }),
          state
        ]);
        const open = () => {
          card.classList.add("opened");
          state.textContent = "Opened";
          ctx.markOpened(key);
          ctx.openReader(env.title, env.letter, "— " + C.from);
        };
        card.addEventListener("click", open);
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
        grid.appendChild(card);
      });
      root.appendChild(grid);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 9 — DU'AS (night sky of stars) ========================= */
  {
    id: "c9", eyebrow: "Chapter Nine", title: "My Du'as For You",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter9.intro));
      const sky = el("div", { class: "sky" });
      const readout = el("div", { class: "dua-readout" });
      const prog = el("div", { class: "dua-progress" });
      const duas = C.chapter9.duas;

      let readCount = 0;
      function updateProgress() {
        readCount = duas.reduce((a, _, i) => a + (ctx.opened("c9:" + i) ? 1 : 0), 0);
        prog.textContent = readCount + " of " + duas.length + " prayers read";
      }

      // deterministic-ish scatter so stars don't overlap the hint area
      duas.forEach((dua, i) => {
        const key = "c9:" + i;
        const col = i % 10, row = Math.floor(i / 10);
        const x = 6 + col * 9 + (Math.sin(i * 12.9) * 3);
        const y = 10 + row * 16 + (Math.cos(i * 7.7) * 4);
        const star = el("button", { class: "star" + (ctx.opened(key) ? " read" : ""),
          style: `left:${x}%;top:${y}%`, attrs: { "aria-label": "A prayer for you" } });
        star.style.setProperty("animation-delay", (i % 7) * 0.4 + "s");
        star.addEventListener("click", () => {
          ctx.markOpened(key);
          star.classList.add("read");
          readout.classList.remove("show"); void readout.offsetWidth;
          readout.textContent = dua;
          readout.classList.add("show");
          updateProgress();
        });
        sky.appendChild(star);
      });
      sky.appendChild(el("div", { class: "sky-hint", text: "Touch a star" }));
      root.appendChild(sky);
      root.appendChild(readout);
      root.appendChild(prog);
      updateProgress();
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 10 — TO THE GIRL MISSING HER MOM ======================= */
  {
    id: "c10", eyebrow: "Chapter Ten", title: "To The Girl Missing Her Mom",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter10.intro));
      root.appendChild(makeLetterCard(ctx, "c10:opened", C.chapter10.letter));
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 11 — LETTER TO HER MOTHER ============================== */
  {
    id: "c11", eyebrow: "Chapter Eleven", title: "A Letter To Your Mother",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter11.intro));
      root.appendChild(makeLetterCard(ctx, "c11:opened", C.chapter11.letter));
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 12 — THROUGH MY EYES (photos) ========================== */
  {
    id: "c12", eyebrow: "Chapter Twelve", title: "Through My Eyes",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter12.intro));
      C.chapter12.photos.forEach((photo, i) => {
        const block = el("div", { class: "photo-block" });
        const frame = el("div", { class: "photo-frame" });
        const img = new Image();
        img.alt = "A photo of you";
        img.onload = () => { frame.innerHTML = ""; frame.appendChild(img); };
        img.onerror = () => frame.appendChild(el("div", { class: "photo-missing",
          text: "Save your photo as " + photo.src }));
        img.src = photo.src;
        block.appendChild(frame);

        const textEl = el("p", { class: "photo-text" });
        const btnYou = el("button", { class: "active", text: "What you see" });
        const btnMe = el("button", { text: "What I see" });
        const toggle = el("div", { class: "photo-toggle" }, [btnYou, btnMe]);
        function setView(mine) {
          textEl.textContent = mine ? photo.iSee : photo.youSee;
          btnMe.classList.toggle("active", mine);
          btnYou.classList.toggle("active", !mine);
          if (mine) ctx.markOpened("c12:" + i);
        }
        btnYou.addEventListener("click", () => setView(false));
        btnMe.addEventListener("click", () => setView(true));
        setView(false);
        block.appendChild(toggle);
        block.appendChild(textEl);
        root.appendChild(block);
      });
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 13 — VOICE NOTES ======================================= */
  {
    id: "c13", eyebrow: "Chapter Thirteen", title: "Voice Notes",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter13.intro));
      let anyMissingNoteShown = false;
      C.chapter13.notes.forEach((note, i) => {
        const key = "c13:" + i;
        const playBtn = el("button", { class: "voice-play", text: "▶", attrs: { "aria-label": "Play " + note.title } });
        const wave = el("div", { class: "voice-wave" });
        const meta = el("div", { class: "voice-meta" }, [
          el("h3", { text: note.title }),
          el("p", { text: note.caption })
        ]);
        const card = el("div", { class: "voice-card" }, [playBtn, meta]);
        meta.appendChild(wave);

        const audio = new Audio();
        audio.preload = "none";
        audio.src = note.file;
        let ready = true;
        audio.addEventListener("error", () => {
          ready = false;
          playBtn.textContent = "•";
          if (!anyMissingNoteShown) {
            anyMissingNoteShown = true;
            root.appendChild(el("p", { class: "note-inline", text: C.chapter13.noAudioNote }));
          }
        });
        audio.addEventListener("timeupdate", () => {
          if (audio.duration) wave.style.setProperty("--pct", (audio.currentTime / audio.duration * 100) + "%");
        });
        audio.addEventListener("ended", () => { playBtn.textContent = "▶"; wave.style.setProperty("--pct", "0%"); });
        playBtn.addEventListener("click", () => {
          if (!ready) return;
          if (audio.paused) {
            document.querySelectorAll("audio").forEach(a => { if (a !== audio) a.pause(); });
            audio.play().then(() => { playBtn.textContent = "❚❚"; ctx.markOpened(key); })
                        .catch(() => { ready = false; playBtn.textContent = "•"; });
          } else { audio.pause(); playBtn.textContent = "▶"; }
        });
        root.appendChild(card);
      });
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 14 — OUR FUTURE (dream board) ========================== */
  {
    id: "c14", eyebrow: "Chapter Fourteen", title: "Our Future",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter14.intro));
      const grid = el("div", { class: "card-grid" });
      C.chapter14.dreams.forEach((d, i) => grid.appendChild(makeExpandCard(ctx, "c14:" + i, d.title, "A future I keep imagining", d.body)));
      root.appendChild(grid);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 15 — PROMISES ========================================= */
  {
    id: "c15", eyebrow: "Chapter Fifteen", title: "Promises",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter15.intro));
      root.appendChild(makeRevealGrid(ctx, "c15", C.chapter15.promises, "Promise"));
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 16 — EMERGENCY LOVE BUTTON ============================= */
  {
    id: "c16", eyebrow: "Chapter Sixteen", title: "When You Need Me",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter16.intro));
      const stage = el("div", { class: "emergency-stage" });
      const msg = el("div", { class: "emergency-msg", attrs: { "aria-live": "polite" } });
      const btn = el("button", { class: "emergency-btn", text: C.chapter16.buttonText });
      const pool = C.chapter16.messages.slice();
      let bag = [];
      function pick() {
        if (!bag.length) bag = pool.slice();
        const idx = Math.floor(Math.random() * bag.length);
        return bag.splice(idx, 1)[0];     // no immediate repeats
      }
      btn.addEventListener("click", () => {
        ctx.markOpened("c16:pressed");
        msg.classList.remove("show");
        void msg.offsetWidth;
        msg.textContent = pick();
        msg.classList.add("show");
      });
      stage.appendChild(btn);
      stage.appendChild(msg);
      root.appendChild(stage);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 17 — PAGES FROM MY HEART (book) ======================= */
  {
    id: "c17", eyebrow: "Chapter Seventeen", title: "Pages From My Heart",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter17.intro));
      const grid = el("div", { class: "card-grid" });
      C.chapter17.pages.forEach((p, i) => grid.appendChild(makeExpandCard(ctx, "c17:" + i, p.title, "Turn the page", p.body)));
      root.appendChild(grid);
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 18 — YOU CHANGED ME =================================== */
  {
    id: "c18", eyebrow: "Chapter Eighteen", title: "You Changed Me",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter18.intro));
      C.chapter18.comparisons.forEach(cmp => {
        root.appendChild(el("div", { class: "compare-item" }, [
          el("div", { class: "compare-topic", text: cmp.topic }),
          el("div", { class: "compare-row" }, [
            el("div", { class: "compare-side before" }, [el("span", { class: "lbl", text: "Before" }), el("div", { text: cmp.before })]),
            el("div", { class: "compare-side after" }, [el("span", { class: "lbl", text: "Now" }), el("div", { text: cmp.after })])
          ])
        ]));
      });
      const paper = el("div", { class: "letter-paper mt-4" }, [
        el("div", { class: "letter-body" }, C.chapter18.reflection.split(/\n\n+/).map(p => el("p", { text: p })))
      ]);
      root.appendChild(paper);
      ctx.markOpened("c18:seen");
      ctx.addContinue("Continue");
    }
  },

  /* ===== CHAPTER 19 — LANTERN OF LOVE ================================== */
  {
    id: "c19", eyebrow: "Chapter Nineteen", title: "Lantern Of Love",
    render(root, ctx) {
      root.appendChild(header(ctx, C.chapter19.intro));
      const sky = el("div", { class: "lantern-sky" });
      const lantern = el("button", { class: "lantern", attrs: { "aria-label": "Release the lantern" } }, [
        el("span", { class: "glow" }), el("span", { class: "body" })
      ]);
      lantern.addEventListener("click", () => {
        ctx.markOpened("c19:opened");
        sky.classList.add("released");
        setTimeout(() => ctx.openReader("Lantern Of Love", C.chapter19.letter, "— " + C.from), 900);
      });
      sky.appendChild(lantern);
      sky.appendChild(el("div", { class: "lantern-hint", text: C.chapter19.tapHint }));
      root.appendChild(sky);
      ctx.addContinue("Continue");
    }
  },

  /* ===== FINAL CHAPTER ================================================= */
  {
    id: "final", eyebrow: "Finally", title: "",
    render(root, ctx) {
      // quiet everything down
      if (window.SaraAtmosphere) SaraAtmosphere.calm();
      if (window.SaraAudio) SaraAudio.soften();

      const stage = el("div", { class: "final-stage" });
      const line = el("p", { class: "final-line" });
      stage.appendChild(line);
      root.appendChild(stage);

      const lines = C.final.lines;
      let i = 0;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      function step() {
        if (i >= lines.length) { closing(); return; }
        line.textContent = lines[i];
        line.classList.remove("show"); void line.offsetWidth; line.classList.add("show");
        i++;
        setTimeout(step, reduce ? 2200 : 3800);
      }
      function closing() {
        stage.innerHTML = "";
        const thanks = el("p", { class: "final-thanks", text: C.final.thankYou });
        const sign = el("p", { class: "final-sign", text: C.final.signature });
        stage.appendChild(thanks); stage.appendChild(sign);
        void thanks.offsetWidth;
        thanks.classList.add("show"); sign.classList.add("show");

        // offer the final long letter + a way to relive it
        const wrap = el("div", { class: "continue-wrap", style: "flex-direction:column;gap:1rem;margin-top:3rem" });
        const readBtn = el("button", { class: "btn", text: "Read my last letter" });
        readBtn.addEventListener("click", () => {
          ctx.markOpened("final:read");
          ctx.openReader("One Last Letter", C.final.letter, C.final.signature);
        });
        const againBtn = el("button", { class: "btn btn-ghost", text: "Start again from the beginning" });
        againBtn.addEventListener("click", () => ctx.restart());
        wrap.appendChild(readBtn); wrap.appendChild(againBtn);
        root.appendChild(wrap);
        ctx.markOpened("final:reached");
      }
      stage.addEventListener("click", () => { if (i < lines.length) { i = lines.length; closing(); } });
      step();
    }
  }
];

/* =============================================================================
   Reusable component builders
   ========================================================================== */

/* Expandable card (Chapters 2, 14, 17) */
function makeExpandCard(ctx, key, title, preview, body) {
  const bodyInner = el("div", { class: "expand-body-inner" }, body.split(/\n\n+/).map(p => el("p", { text: p })));
  const bodyWrap = el("div", { class: "expand-body" }, [bodyInner]);
  const flag = el("span", { class: "opened-flag", text: ctx.opened(key) ? "opened" : "" });
  const head = el("button", { class: "expand-head", attrs: { "aria-expanded": "false" } }, [
    el("h3", {}, [document.createTextNode(title), flag]),
    el("span", { class: "expand-preview", text: preview }),
    el("span", { class: "chev", text: "⌄" })
  ]);
  const card = el("div", { class: "expand-card" }, [head, bodyWrap]);

  function setOpen(open) {
    card.classList.toggle("is-open", open);
    head.setAttribute("aria-expanded", open ? "true" : "false");
    bodyWrap.style.maxHeight = open ? bodyInner.scrollHeight + 40 + "px" : "0px";
    if (open) { ctx.markOpened(key); flag.textContent = "opened"; }
  }
  head.addEventListener("click", () => setOpen(!card.classList.contains("is-open")));
  // keep height correct on resize while open
  window.addEventListener("resize", () => { if (card.classList.contains("is-open")) bodyWrap.style.maxHeight = bodyInner.scrollHeight + 40 + "px"; });
  return card;
}

/* Letter card that expands to reveal a long letter inline (Chapters 10, 11) */
function makeLetterCard(ctx, key, body) {
  const paper = el("div", { class: "letter-paper" });
  const bodyEl = el("div", { class: "letter-body", style: "max-height:9.5em;overflow:hidden;position:relative;transition:max-height .9s cubic-bezier(.22,1,.36,1)" });
  body.split(/\n\n+/).forEach(p => bodyEl.appendChild(el("p", { text: p })));
  const fade = el("div", { style: "position:absolute;left:0;right:0;bottom:0;height:5em;background:linear-gradient(transparent,var(--white));pointer-events:none" });
  bodyEl.appendChild(fade);
  paper.appendChild(bodyEl);
  paper.appendChild(el("div", { class: "signature", text: "— " + C.from }));

  const wrap = el("div", { class: "continue-wrap", style: "margin-top:1.4rem" });
  const btn = el("button", { class: "btn btn-ghost", text: ctx.opened(key) ? "Read again" : "Open the letter" });
  wrap.appendChild(btn);
  let open = false;
  btn.addEventListener("click", () => {
    open = !open;
    ctx.markOpened(key);
    bodyEl.style.maxHeight = open ? bodyEl.scrollHeight + "px" : "9.5em";
    fade.style.opacity = open ? "0" : "1";
    btn.textContent = open ? "Fold the letter" : "Read again";
  });

  const container = document.createDocumentFragment();
  container.appendChild(paper);
  container.appendChild(wrap);
  const holder = el("div");
  holder.appendChild(container);
  return holder;
}

/* Grid of tap-to-reveal cards (Chapters 7 reasons, 15 promises) */
function makeRevealGrid(ctx, prefix, items, label) {
  const frag = el("div");
  const count = el("div", { class: "reveal-count" });
  function updateCount() {
    const opened = items.reduce((a, _, i) => a + (ctx.opened(prefix + ":" + i) ? 1 : 0), 0);
    count.textContent = opened + " of " + items.length + " revealed";
  }
  const grid = el("div", { class: "reveal-grid" });
  items.forEach((text, i) => {
    const key = prefix + ":" + i;
    const front = el("span", { class: "front", text: label + " " + (i + 1) });
    const back = el("span", { class: "back", text: text });
    const card = el("div", { class: "reveal-card" + (ctx.opened(key) ? " is-open" : ""), attrs: { role: "button", tabindex: "0" } }, [front, back]);
    const open = () => { card.classList.add("is-open"); ctx.markOpened(key); updateCount(); };
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    grid.appendChild(card);
  });
  frag.appendChild(count);
  frag.appendChild(grid);
  updateCount();
  return frag;
}

/* Little hearts that float up (after the video) */
function floatHearts(root) {
  for (let i = 0; i < 8; i++) {
    const h = el("div", { text: "❤", style:
      `position:fixed;left:${20 + Math.random() * 60}%;bottom:20%;z-index:5;color:var(--rose);` +
      `font-size:${1 + Math.random() * 1.5}rem;pointer-events:none;` +
      `animation:heart-float ${2 + Math.random() * 1.5}s ease-out ${i * 0.15}s forwards;opacity:0` });
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 4000);
  }
}

if (typeof window !== "undefined") window.SaraChapters = SaraChapters;

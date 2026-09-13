# A Letter To Sara 💌

A private, mobile-first website — an emotional, faith-centered apology and love
letter, told across 20 chapters. Pure **HTML, CSS, and JavaScript**. No backend,
no build step, no dependencies. It runs by just opening `index.html`, and it
deploys to **GitHub Pages** for free.

Progress (which chapters are unlocked, which letters/cards/stars you've opened,
and where you left off) is saved in the browser and **survives a refresh**.

---

## 1. Try it right now

Double-click `index.html` — that's it. It works offline. The only things that
need the internet are the Google Fonts (there are elegant serif fallbacks if
you're offline) and any media you host elsewhere.

> Tip: for the music to autoplay smoothly, the site waits for the first tap
> (the **Begin** button). This is a browser rule, not a bug.

---

## 2. Add your personal touches (optional but lovely)

Everything works **without** these — missing photos/videos/audio show a soft
placeholder instead of breaking. Drop your files in with these **exact names**:

### Music  →  `assets/music/`
| File | What it is |
|------|------------|
| `main.mp3` | Background music. Loops gently, fades in/out. |

### Photos  →  `assets/photos/`
| File | Where it appears |
|------|------------------|
| `hero.jpg`  | Chapter 2 ("The Girl I See") |
| `photo1.jpg` | Chapter 12 ("Through My Eyes") |
| `photo2.jpg` | Chapter 12 |
| `photo3.jpg` | Chapter 12 |
| `photo4.jpg` | Chapter 12 |

### Video  →  `assets/video/`
| File | Where it appears |
|------|------------------|
| `apology.mp4` | Chapter 6 ("From My Heart") |

### Voice notes  →  `assets/audio/`
| File | Card title |
|------|------------|
| `why-i-love-you.mp3` | Why I love you |
| `why-youre-beautiful.mp3` | Why you're beautiful |
| `what-you-mean-to-me.mp3` | What you mean to me |
| `what-i-learned.mp3` | What I've learned |
| `what-i-promise.mp3` | What I promise you |

(You can rename any of these — just update the matching name in
`js/content.js` too.)

---

## 3. Edit the words — it's all in ONE file

Open **`js/content.js`**. Every line of text lives there, clearly labelled by
chapter, inside a big object called `SARA_CONTENT`. To make a letter longer,
just keep typing inside the quote marks / backticks. For example:

```js
chapter5: {
  intro: "The apology you deserve...",
  pages: [
    `Sara,

    I've started this letter a hundred times...`,   // ← add as much as you want
  ]
}
```

- Text wrapped in **backticks** ` `` ` can span many lines — great for letters.
- Leave a **blank line** between paragraphs and they'll space out nicely.
- Her name and your name are set once at the top:
  `name: "Sara"` and `from: "Yaasir"`. Change those and they update everywhere.

You don't need to touch any other file to change what the site *says*.

Want to change how it *looks*? The entire colour palette is at the very top of
`css/styles.css` under `:root` — change a few hex codes and the whole site
re-themes.

---

## 4. Put it online with GitHub Pages (free)

1. Create a new repository on GitHub (e.g. `letter-to-sara`). You can make it
   **private** if you want, but note: GitHub Pages sites are publicly viewable
   by anyone with the link even from a private repo, so pick an
   unguessable repo/site name if privacy matters.
2. Upload **all** the files and folders here (keep the structure identical:
   `index.html` at the top, with `css/`, `js/`, and `assets/` beside it).
3. In the repo: **Settings → Pages**.
4. Under **Source**, choose **Deploy from a branch**, pick `main` and `/root`,
   then **Save**.
5. Wait ~1 minute. GitHub gives you a link like
   `https://yourname.github.io/letter-to-sara/`. Send it to her. 💗

To update anything later, just edit the file on GitHub (or re-upload) and the
site refreshes automatically.

---

## 5. What's in the box

```
index.html            The page shell
css/
  styles.css          All design + layout (palette lives at the top)
  animations.css      Every animation keyframe
js/
  content.js          ← ALL the words. This is the file you edit.
  audio.js            Background music with fades
  atmosphere.js       Floating rose petals + glow particles
  chapters.js         How each of the 20 chapters is built
  app.js              Navigation, saving progress, the letter reader
assets/
  music/  photos/  video/  audio/   ← drop your media here
```

---

## 6. The 20 chapters

1. Where it begins · 2. The Girl I See · 3. Things I Notice ·
4. The Moments You Never Saw · 5. The Apology · 6. From My Heart ·
7. 100 Reasons I Love You · 8. Open When · 9. My Du'as For You ·
10. To The Girl Missing Her Mom · 11. A Letter To Your Mother ·
12. Through My Eyes · 13. Voice Notes · 14. Our Future · 15. Promises ·
16. When You Need Me · 17. Pages From My Heart · 18. You Changed Me ·
19. Lantern Of Love · 20. The end.

---

Made with care. Take your time with it. — 💌
# A-letter-to-Sara

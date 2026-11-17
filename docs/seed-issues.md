# Seed issues

Draft text for the first batch of good-first issues. Copy each block into a new
GitHub issue and add the `good first issue` and `needs triage` labels (remove
`needs triage` once you have confirmed the scope).

Keep them small: each one should be doable in a single sitting by someone who
has never seen the codebase.

---

## 1. Add a visible focus ring to footer links

**Labels:** `a11y`, `good first issue`

Footer links currently rely on the browser default focus ring, which is hard to
see against the white footer background.

**What to do**

- Add a `:focus-visible` style for `.footer__col a` in `styles.css` that uses
  `--accent` and a 2 px offset.
- Confirm the ring is visible on both `index.html` and `contribute.html`.

**Done when**

- Tabbing through the footer shows a clear ring on every link.
- No layout shift when the ring appears.

---

## 2. Give the FAQ accordion a smooth height transition without layout shift

**Labels:** `good first issue`, `design`

The accordion already animates `grid-template-rows`, but opening a very long
answer can nudge the page. Check the animation on a narrow viewport.

**What to do**

- Reproduce the shift at 360 px with the longest answer open.
- Adjust `scroll-margin` or the panel padding so the page does not jump.
- Record a short before/after clip.

**Done when**

- Opening and closing any answer does not move the trigger above it.

---

## 3. Add `aria-current="page"` to the active docs table of contents item

**Labels:** `a11y`, `good first issue`

`script.js` toggles `.is-active` on the docs table of contents links but does
not expose the state to assistive technology.

**What to do**

- In `initDocsToc`, set `aria-current="location"` on the active link and remove
  it from the others.
- Confirm with a screen reader or the accessibility inspector.

**Done when**

- The active section is announced as the current location.

---

## 4. Document how to change the GitHub repository the site points at

**Labels:** `documentation`, `good first issue`

The repository name appears in several places: `CONFIG` in `script.js`, the
`href` attributes in both HTML files, and the JSON-LD block.

**What to do**

- Add a short "Point the site at your own repository" section to
  `CONTRIBUTING.md` and `contribute.html`.
- List every file that needs editing, with a `grep` command to find them.

**Done when**

- Someone can fork the site and repoint it in under five minutes.

---

## 5. Add a `prefers-contrast: more` style for muted text

**Labels:** `a11y`, `design`, `good first issue`

Muted body copy uses `rgba(20, 24, 31, 0.65)`. On low-contrast displays it can
be difficult to read.

**What to do**

- Add a `@media (prefers-contrast: more)` block that raises muted text to at
  least 7:1 against its background.
- Check every section, including the dark Contribute panel.
- Run Lighthouse accessibility before and after.

**Done when**

- Contrast is AA or better with `prefers-contrast: more` enabled.
- The default palette is unchanged.

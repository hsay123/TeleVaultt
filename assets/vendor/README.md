# Vendored browser libraries

These files are copied from npm by `npm run vendor` and committed so the site
works without a build step.

| Library | Version | License |
| --- | --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.27 | MIT |
| [GSAP](https://gsap.com/) | 3.15.1 | GSAP standard "no charge" license (see gsap/README.md) |
| [Lucide](https://lucide.dev/) | 1.73.0 | ISC |

`lucide/lucide-subset.js` is generated from the Lucide icon set and contains
only the icons this site references. It exposes the same `lucide.createIcons()`
API as the full bundle.

Do not edit these files by hand. Update the pinned version in `package.json`,
run `npm install && npm run vendor`, and commit the result.

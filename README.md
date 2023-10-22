# IteratorFuncs

## A tiny package to simplify working with iterators

It has become very common for me in places that I work in to need to be able to do the classic map/reduce/filter/etc
with iterators (but don't want to have to convert them into arrays first since that is bad for perf); while also not
being allowed to bring in a package to do so, say lodash or equivalent, due to company/security policy of not allowing
new outside packages without having to go through a formal review process.

So here is an MPL-2.0 licensed single file package that gives the ability to do just that.

MPL-2.0 was used so that if need be you can copy the `src/index.ts` or `dist/index.js` files as need be to use in your
projects. Since MPL-2.0 has so-called "file based copyleft" as long as you don't remove the license call out at the top
of the file and don't make changes to the file itself then you're fine to copy the file into your project as needed.

## Docs

Docs are auto generated and live at [https://drew887.github.io](https://drew887.github.io/iteratorFuncs/modules.html)

### Why not MIT?

TLDR, I Wanted to try out MPL-2.0 based things, and while the MIT license would also fit my use case quite well I want
to keep some level of copyleft to my work. This way anyone can use the file untouched so to speak but if they make any
changes to the file directly, they're required to distribute said changes.

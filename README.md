# IteratorFuncs

## A tiny package to simplify working with iterators

tldr: Provides a small set of tools for adding map/filter/reduce functionality to iterators without having to yield
their values.

```typescript
const set = new Set([1, 2, 3, 4, 5]);

const mappedAndFiltered = mapIterator(set, (item) => item * 2).filter((item) => item > 5);

console.log(Array.from(mappedAndFiltered)); // logs out [6, 8, 10]
```

These functions take an `IterableIterator` or an `Iterator`, a function of the appropriate type and will return
an `AugmentedIterator`:

- [mapIterator](https://drew887.github.io/iteratorFuncs/functions/mapIterator.html)
- [filterIterator](https://drew887.github.io/iteratorFuncs/functions/filterIterator.html)
- [reduceIterator](https://drew887.github.io/iteratorFuncs/functions/reduceIterator.html)

The `AugmentedIterator` class also provides `.map`, `.filter` and `.reduce` helper functions that are chainable.

#### Greedy Versions

We also provide small utility functions for if you want to just immediately yield all values from the iterator at the
same time but don't want to bother doing an `Array.from` first:

```typescript
const set = new Set([1, 2, 3, 4, 5]);

const mappedValues = mapIteratorToArray(set, (item: number): number => {
  return item * 2;
});

console.log(mappedValues); // logs out [2, 4, 6, 8, 10]
```

For these "greedy" utilities there are:

- [mapIteratorToArray](https://drew887.github.io/iteratorFuncs/functions/mapIteratorToArray.html)
- [filterIteratorToArray](https://drew887.github.io/iteratorFuncs/functions/filterIteratorToArray.html)
- \*[eagerlyReduceIterator](https://drew887.github.io/iteratorFuncs/functions/eagerlyReduceIterator.html)
  This one is named differently since you aren't limited to reducing to an array. But you can think of it as the
  equivalent to the above.

#### Async Iterators?

TODO: Talk about async?

## Docs

Docs are auto generated and live
at [https://drew887.github.io/iteratorFuncs](https://drew887.github.io/iteratorFuncs/modules.html)

## Why?

It has become very common for me in places that I work in to need to be able to do the classic map/reduce/filter/etc
with iterators (but don't want to have to convert them into arrays first since that is bad for perf, or I need to pass
the iterator to another package); while also not being allowed to bring in a package to do so due to company/security
policies of not allowing new outside packages without going through a formal review process for said package.

Currently, there is the very good [iterator-helper package](https://www.npmjs.com/package/iterator-helper) which aims to
match the [offical TC39 iterator-helpers proposal](https://github.com/tc39/proposal-iterator-helpers) and is what you
should **actually use** if you can; as this package doesn't aim to fulfill the full proposal at this time. The only
downsides it has for me is that it's:

- multiple files
  - sounds insane at first, but I've found it tends to ...slow down... the review process let's say.
- currently ~61kb for its dist folder (we're ~19kb, and ~9.5kb with just the index.js file as of 0.1.0)
  - They do implement way more than we do though, so the increased size is justified and worth it
- not officially licenced
  - npm lists it as ISC but there is no license text in the code or explicitly stated in its package.json
  - This is enough to reject it from including in some workplaces outright and a primary blocker to my use case

Rather this package aims to be a single file that I know I can bring into those jobs and use without having to go
worry about being rejected by review processes or having to worry about licenses changing or other nonsense or having to
re-implement myself. Publishing it as a package is mostly just for that sweet, sweet dev/interview cred and who knows
maybe someone else has the same blockers as me.

MPL-2.0 was used so that if need be you can copy the `src/index.ts` or `dist/index.js` files as need be to use in your
projects. Since MPL-2.0 has so-called "file based copyleft" as long as you don't remove the license call out at the top
of the file and don't make changes to the file itself then you're fine to copy the file into your project as needed.

#### Why not MIT?

TLDR, I Wanted to try out MPL-2.0 based things, and while the MIT license would also fit my use case quite well I want
to keep some level of copyleft to my work. This way anyone can use the file untouched so to speak but if they make any
changes to the file directly, they're encouraged to give back those changes.

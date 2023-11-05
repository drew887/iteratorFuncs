/**
 * IteratorFuncs a simple single file package to make working with JS iterators easier.
 *
 * The documentation lives online [here](https://drew887.github.io/iteratorFuncs/modules.html).
 *
 * If you've ever had a generator, or a Set, or a Map that you've needed to map/filter/reduce over in JS, you've been hit
 * by the pain of having to either convert to an Array with `Array.from` and then use the method you need, or write a
 * for...of loop and do your logic in there.
 *
 * While the for...of loop is almost certainly the "proper" or "js way" of doing things, and is what you normally get as
 * an answer when searching for this, it can be a little disappointing or jarring for those of us wanting a more fp like
 * approach that js normally lets you take.
 *
 * So this package is simply to help facilitate these patterns for IterableIterators.
 *
 * tldr:
```typescript
const set = new Set([1, 2, 3, 4, 5]);
const mapped = mapIterator(set, (item) => item * 2);

console.log(Array.from(mapped)); // logs out [2, 4, 6, 8, 10]
```
 *
 * @packageDocumentation
 */

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * We override the default Iterable interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
export interface Iterable<TValue, TReturn = any, TNext = any> {
  [Symbol.iterator](): Iterator<TValue, TReturn, TNext>;
}

/**
 * We override the default IterableIterator interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
export interface IterableIterator<TValue, TReturn = any, TNext = any> extends Iterator<TValue, TReturn, TNext> {
  [Symbol.iterator](): IterableIterator<TValue, TReturn, TNext>;
}

/**
 * Type alias to simplify this union
 * TODO: Come up with a better name
 */
export type IteratorArg<TIteratorValue, TIteratorReturn, TIteratorNext> =
  | Iterable<TIteratorValue, TIteratorReturn, TIteratorNext>
  | IterableIterator<TIteratorValue, TIteratorReturn, TIteratorNext>;

/**
 * Given an iterator, eagerly reduce over its results until it finishes and return the result
 * @param {Iterable} iterator - The iterator you wish to reduce over
 * @param {Function} reducer - A function to use to reduce the elements iterator produces
 * @param initial The initial value to pass to reducer with the first element. Also returned if iterator never yields a value
 * @typeParam TValue - The type of values that iterator will yield and that initial must be
 * @typeParam TReturn - The type of values that reducer will return
 *
 * @example
  ```typescript
const set: Set<number> = new Set([1, 2, 3, 4, 5]);

const sum = eagerlyReduceIterator(
  set.values(),
  (carry: number, item: number): number => {
    return carry + item;
  },
  0,
);
// sum is now 15
 * ```
 */
export function eagerlyReduceIterator<TValue, TReturn>(
  iterator: Iterable<TValue>,
  reducer: (carry: TReturn, arg: TValue) => TReturn,
  initial: TReturn,
): TReturn {
  let result: TReturn = initial;

  for (const a of iterator) {
    result = reducer(result, a);
  }

  return result;
}

/**
 * Eagerly Map over an iterator and return an array of results
 * @param {Iterable} iterator - The iterator you wish to map over
 * @param {Function} mapper - The function you want to use to process any elements yielded from iterator
 * @typeParam TValue - The type of values that iterator will yield
 * @typeParam TReturn - The type of values that mapper will return
 *
 * @example
```typescript
const set: Set<number> = new Set([1, 2, 3, 4, 5]);

const squaredValues = mapIteratorToArray(
  set.values(),
  (item: number): number => {
    return item * item;
  },
);
// squaredValues = [1, 4, 9, 16, 25];
```
 */
export function mapIteratorToArray<TValue, TReturn>(
  iterator: Iterable<TValue>,
  mapper: (arg: TValue) => TReturn,
): Array<TReturn> {
  return eagerlyReduceIterator(
    iterator,
    (carry, item): TReturn[] => {
      carry.push(mapper(item));

      return carry;
    },
    [] as TReturn[],
  );
}

/**
 * Eagerly Filter over an iterator and return an array of results
 * @param {Iterable} iterator - The iterator you wish to filter over
 * @param {Function} filter - Your filtering function
 * @typeParam TValue - The type of values that iterator will yield
 *
 * @example
```typescript
const set: Set<number> = new Set([1, 2, 3, 4, 5]);

const evenValues = filterIteratorToArray(
  set.values(),
  (item: number): boolean => {
    return item % 2 === 0;
  },
);
// evenValues = [2, 4];
```
 */
export function filterIteratorToArray<TValue>(
  iterator: Iterable<TValue>,
  filter: (arg: TValue) => boolean,
): Array<TValue> {
  return eagerlyReduceIterator(
    iterator,
    (carry, item) => {
      if (filter(item)) {
        carry.push(item);
      }

      return carry;
    },
    [] as Array<TValue>,
  );
}

//  =============      Non Eager Versions       ================

/**
 * An AugmentedIterator represents one of the IterableIterators we return.
 * Simply implement a next method that wraps up the logic for dealing with the values (ie calling the mapper function)
 * and we take care of the rest.
 *
 * Should be only implemented internally
 */
export abstract class AugmentedIterator<TValue, TReturn = any, TNext = any>
  implements IterableIterator<TValue, TReturn, TNext>
{
  [Symbol.iterator](): this {
    return this;
  }

  abstract next(...args: [] | [TNext]): IteratorResult<TValue, TReturn>;

  map<TMapperReturn>(mapper: (item: TValue) => TMapperReturn): AugmentedIterator<TMapperReturn, TReturn, TNext> {
    return mapIterator(this, mapper);
  }

  filter(filter: (item: TValue) => boolean): AugmentedIterator<TValue, TReturn, TNext> {
    return filterIterator(this, filter);
  }

  reduce<TReducerReturn>(
    reducer: (carry: TReducerReturn, item: TValue) => TReducerReturn,
    initial: TReducerReturn,
  ): AugmentedIterator<TReducerReturn, TReturn, TNext> {
    return reduceIterator(this, reducer, initial);
  }
}

/**
 * This is a private class for encapsulating the logic for reducing.
 */
class _ReducingIterator<TIteratorValue, TReducerReturn, TIteratorReturn, TIteratorNext> extends AugmentedIterator<
  TReducerReturn,
  TIteratorReturn,
  TIteratorNext
> {
  private iterable: Iterator<TIteratorValue, TIteratorReturn, TIteratorNext>;

  constructor(
    iterable: IteratorArg<TIteratorValue, TIteratorReturn, TIteratorNext>,
    private reducer: (carry: TReducerReturn, arg: TIteratorValue) => TReducerReturn,
    private state: TReducerReturn,
  ) {
    super();
    this.iterable = iterable[Symbol.iterator]();
  }

  next(...args: [] | [TIteratorNext]): IteratorResult<TReducerReturn, TIteratorReturn> {
    const result = this.iterable.next(...args);

    if (!result.done) {
      this.state = this.reducer(this.state, result.value);

      return {
        ...result,
        value: this.state,
      };
    }

    return result;
  }
}

/**
 * Given an Iterable or IterableIterator, a reducer, and an initial value, return a new IterableIterator that yields
 * values that are automatically piped through said reducer.
 * @param {Iterable} iterator - The iterator you wish to reduce over
 * @param {Function} reducer - A function to use to reduce the elements iterator produces
 * @param {TReducerReturn} initial The initial value to pass to reducer with the first element
 * @typeParam TIteratorValue - The value returned from the iterator
 * @typeParam TReducerReturn - The return type of your reducer function
 * @typeParam TIteratorReturn - If your iterator has a return type it must be the same as TIteratorValue, otherwise undefined
 * @typeParam TIteratorNext - The type your iterator is expecting as what's passed to its next function. For generators this is the type returned after a yield.
 *
 * @example
```typescript
const set: Set<number> = new Set([1, 2, 3, 4, 5]);

const summingIterator = reduceIterator(
  set.values(),
  (carry: number, item: number): number => {
    return carry + item;
  },
  0,
);
// summingIterator will now yield the sum for each value seen thus far

const finalValues = Array.from(summingIterator);
// finalValues will now be [1,3,6,10,15];
```
 */
export function reduceIterator<
  TIteratorValue,
  TReducerReturn,
  TIteratorReturn = TIteratorValue | undefined,
  TIteratorNext = any,
>(
  iterator: IteratorArg<TIteratorValue, TIteratorReturn, TIteratorNext>,
  reducer: (carry: TReducerReturn, arg: TIteratorValue) => TReducerReturn,
  initial: TReducerReturn,
): AugmentedIterator<TReducerReturn, TIteratorReturn, TIteratorNext> {
  return new _ReducingIterator(iterator, reducer, initial);
}

/**
 * Given an IteratorArg and a mapping function, returns a new IterableIterator that yields values from the initial iterator
 * but passed through the mapping function.
 * @param {Iterable} iterator - The iterator you wish to map elements from
 * @param {Function} mapper - A function to use to map the elements iterator produces
 * @typeParam TIteratorValue - The value returned from the iterator
 * @typeParam TMapperReturn - The return type of your reducer function
 * @typeParam TIteratorReturn - If your iterator has a return type it must be the same as TIteratorValue, otherwise undefined
 * @typeParam TIteratorNext - The type your iterator is expecting as what's passed to its next function. For generators this is the type returned after a yield.
 * @example
```typescript
const set = new Set([1, 2, 3, 4, 5]);

const mapped = mapIterator(set, (item) => item * 2);

console.log(Array.from(mapped)); // logs out [2, 4, 6, 8, 10]
```
 */
export function mapIterator<
  TIteratorValue,
  TMapperReturn,
  TIteratorReturn = TIteratorValue | undefined,
  TIteratorNext = any,
>(
  iterator: IteratorArg<TIteratorValue, TIteratorReturn, TIteratorNext>,
  mapper: (arg: TIteratorValue) => TMapperReturn,
): AugmentedIterator<TMapperReturn, TIteratorReturn, TIteratorNext> {
  // Because we can't guarantee a 0 value for the types, we can't just fall back to reduce.
  const iterable = iterator[Symbol.iterator]();

  return new (class extends AugmentedIterator<TMapperReturn, TIteratorReturn, TIteratorNext> {
    next(...args: [] | [TIteratorNext]): IteratorResult<TMapperReturn, TIteratorReturn> {
      const result = iterable.next(...args);

      if (!result.done) {
        return {
          ...result,
          value: mapper(result.value),
        };
      }

      return result;
    }
  })();
}

/**
 * Given an IteratorArg and a filtering function it will return a new IterableIterator that when polled will eagerly pull
 * values from iterator and pass them to filter until filter returns true for an item or we reach the end of iterator; it
 * will then yield this value itself.
 *
 * **NOTE:** if iterator relies on values being passed to next, the returned IterableIterator will re-use the same next
 * value until an item is raised that passes the filter. This can lead to strange behaviours.
 * @param {Iterable} iterator - The iterator you wish to map elements from
 * @param {Function} filter - A function to use to map the elements iterator produces
 * @typeParam TIteratorValue - The value returned from the iterator
 * @typeParam TIteratorReturn - If your iterator has a return type it must be the same as TIteratorValue, otherwise undefined
 * @typeParam TIteratorNext - The type your iterator is expecting as what's passed to its next function. For generators this is the type returned after a yield.
 *
 * @example
```typescript
const set = new Set([1, 2, 3, 4, 5]);

const filtered = filterIterator(set, (item) => item % 2 === 0);

console.log(Array.from(filtered)); // logs out [2, 4]
```
 */
export function filterIterator<TIteratorValue, TIteratorReturn = TIteratorValue | undefined, TIteratorNext = any>(
  iterator: IteratorArg<TIteratorValue, TIteratorReturn, TIteratorNext>,
  filter: (arg: TIteratorValue) => boolean,
): AugmentedIterator<TIteratorValue, TIteratorReturn, TIteratorNext> {
  const iterable = iterator[Symbol.iterator]();

  return new (class extends AugmentedIterator<TIteratorValue, TIteratorReturn, TIteratorNext> {
    next(...args: [] | [TIteratorNext]): IteratorResult<TIteratorValue, TIteratorReturn> {
      let result = iterable.next(...args);

      while (!result.done && !filter(result.value)) {
        result = iterable.next(...args);
      }

      return result;
    }
  })();
}

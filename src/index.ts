/**
 * IteratorFuncs a simple single file package to make working with JS iterators easier.
 *
 * For more information please see the documentation [here](https://drew887.github.io/iteratorFuncs/modules.html).
 * @packageDocumentation
 */

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

//TODO: Make non greedy versions

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
 */
export function reduceIterator<
  TIteratorValue,
  TReducerReturn,
  TIteratorReturn = TIteratorValue | undefined,
  TIteratorNext = any,
>(
  iterator:
    | Iterable<TIteratorValue, TIteratorReturn, TIteratorNext>
    | IterableIterator<TIteratorValue, TIteratorReturn, TIteratorNext>,
  reducer: (carry: TReducerReturn, arg: TIteratorValue) => TReducerReturn,
  initial: TReducerReturn,
): IterableIterator<TReducerReturn> {
  const iterable = iterator[Symbol.iterator]();

  let state = initial;

  const result: IterableIterator<TReducerReturn, TIteratorReturn, TIteratorNext> = {
    [Symbol.iterator](): IterableIterator<TReducerReturn, TIteratorReturn, TIteratorNext> {
      return result;
    },

    next(args: TIteratorNext): IteratorResult<TReducerReturn, any> {
      const result = iterable.next(args);

      if (!result.done) {
        state = reducer(state, result.value);
      }

      return {
        done: result.done,
        value: state,
      };
    },
    //TODO: Determine if we need to implement return and throw function
  };

  return result;
}

/**
 * We override the default Iterable interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
interface Iterable<TValue, TReturn = any, TNext = any> {
  [Symbol.iterator](): Iterator<TValue, TReturn, TNext>;
}

/**
 * We override the default IterableIterator interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
interface IterableIterator<TValue, TReturn = any, TNext = any> extends Iterator<TValue, TReturn, TNext> {
  [Symbol.iterator](): IterableIterator<TValue, TReturn, TNext>;
}

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

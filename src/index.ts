/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

//TODO: Make non greedy versions

/**
 * Given an iterator greedily reduce over its results until it finishes and return the result
 * @param iterator
 * @param reducer
 * @param initial
 */
export function reduceIterator<TValue, TReturn>(
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
 * Greedily Map over an iterator and return an array of results
 * @param iterator
 * @param mapper
 */
export function mapIterator<T, TReturn>(iterator: Iterable<T>, mapper: (arg: T) => TReturn): Array<TReturn> {
  return reduceIterator(
    iterator,
    (carry, item): TReturn[] => {
      carry.push(mapper(item));

      return carry;
    },
    [] as TReturn[],
  );
}

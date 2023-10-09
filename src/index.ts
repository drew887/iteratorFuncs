//TODO: Make non greedy versions

/**
 * Given an iterator greedily reduce over its results until it finishes and return the result
 * @param iterator
 * @param reducer
 * @param initial
 */
export function reduceIterator<T, TReturn>(
  iterator: Iterable<T>,
  reducer: (carry: TReturn, arg: T) => TReturn,
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
export function mapIterator<T, TReturn>(
  iterator: Iterable<T>,
  mapper: (arg: T) => TReturn,
): Array<TReturn> {
  return reduceIterator(
    iterator,
    (carry, item): TReturn[] => {
      carry.push(mapper(item));

      return carry;
    },
    [] as TReturn[],
  );
}

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

const mappedAndFiltered =
  mapIterator(set, (item) => item * 2)
  .filter((item) => item > 5);

console.log(Array.from(mappedAndFiltered)); // logs out [6, 8, 10]
```
 *
 * @packageDocumentation
 */

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyleft @drew887 <drew887121@gmail.com> <Andrew Mcdonald> 2023
 */

/**
 * We override the default Iterable interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
export interface Iterable<TValue, TReturn = any, TNext = any> {
  [Symbol.iterator](): Iterator<TValue, TReturn, TNext>;
}

/**
 * We override the default Iterable interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
export interface AsyncIterable<TValue, TReturn = any, TNext = any> {
  [Symbol.asyncIterator](): AsyncIterator<TValue, TReturn, TNext>;
}

/**
 * We override the default IterableIterator interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
export interface IterableIterator<TValue, TReturn = any, TNext = any> extends Iterator<TValue, TReturn, TNext> {
  [Symbol.iterator](): IterableIterator<TValue, TReturn, TNext>;
}

/**
 * We override the default IterableIterator interface since it doesn't allow forwarding of the other 2 type params that Iterator can take
 */
export interface AsyncIterableIterator<TValue, TReturn = any, TNext = any>
  extends AsyncIterator<TValue, TReturn, TNext> {
  [Symbol.asyncIterator](): AsyncIterableIterator<TValue, TReturn, TNext>;
}

/**
 * Type alias to simplify this union
 * TODO: Come up with a better name
 */
export type IteratorArg<TIteratorValue, TIteratorReturn, TIteratorNext> =
  | Iterable<TIteratorValue, TIteratorReturn, TIteratorNext>
  | IterableIterator<TIteratorValue, TIteratorReturn, TIteratorNext>;

function isIteratable<TValue, TReturn, TNext>(arg: any): arg is Iterable<TValue, TReturn, TNext> {
  return !!arg && typeof arg === 'object' && typeof arg[Symbol.iterator] === 'function';
}

//  =============      Non Greedy Versions       ================
/**
 * An AugmentedIterator represents one of the IterableIterators we return.
 * This abstract class is exported only to provide type/intellisense information,
 * and should be only implemented internally.
 */
export abstract class AugmentedIterator<TValue, TReturn = any, TNext = any>
  implements IterableIterator<TValue, TReturn, TNext>
{
  [Symbol.iterator](): this {
    return this;
  }

  abstract next(...args: [] | [TNext]): IteratorResult<TValue, TReturn>;

  /**
   * Returns a new AugmentedIterator that will run mapper over each item before yielding
   *
   * Because we return another AugmentedIterator instance, this call is chainable.
   * @param {Function} mapper the mapping function you want to be run over all values
   * @typeParam TMapperReturn the return type from mapper, will also become the new TValue type of the returned AugmentedIterator
   */
  map<TMapperReturn>(mapper: (item: TValue) => TMapperReturn): AugmentedIterator<TMapperReturn, TReturn, TNext> {
    return mapIterator(this, mapper);
  }

  /**
   * Returns a new AugmentedIterator that will only yield values for which filter returns true
   * @param {Function} filter The filtering function you wish to use
   */
  filter(filter: (item: TValue) => boolean): AugmentedIterator<TValue, TReturn, TNext> {
    return filterIterator(this, filter);
  }

  /**
   * Returns a new AugmentedIterator that has access to the last value yielded OR initial the same way a reduce would
   * normally work over say an array.
   * @param reducer the function you want to use as a reducer. Takes arguments in (carry,item) order. The first time we
   *   yield a value carry will be initial, after which it will be the previously returned value from reducer.
   * @param initial the value we should pass to reducer the first time we yield a value.
   * @typeParam TReducerReturn the return type of reducer, and of initial; will also become the TValue type of the returned AugmentedIterator
   */
  reduce<TReducerReturn>(
    reducer: (carry: TReducerReturn, item: TValue) => TReducerReturn,
    initial: TReducerReturn,
  ): AugmentedIterator<TReducerReturn, TReturn, TNext> {
    return reduceIterator(this, reducer, initial);
  }
}

namespace SyncAugmentedIterators {
  /**
   * This is a private class for encapsulating the logic for reducing.
   */
  export class _ReducingIterator<TValue, TReducerReturn, TReturn, TNext> extends AugmentedIterator<
    TReducerReturn,
    TReturn,
    TNext
  > {
    private iterable: Iterator<TValue, TReturn, TNext>;

    constructor(
      iterable: IteratorArg<TValue, TReturn, TNext>,
      private reducer: (carry: TReducerReturn, arg: TValue) => TReducerReturn,
      private state: TReducerReturn,
    ) {
      super();
      this.iterable = iterable[Symbol.iterator]();
    }

    next(...args: [] | [TNext]): IteratorResult<TReducerReturn, TReturn> {
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
   * This is a private class for encapsulating the logic for mapping.
   */
  export class _MappingIterator<TValue, TMapperReturn, TReturn, TNext> extends AugmentedIterator<
    TMapperReturn,
    TReturn,
    TNext
  > {
    private iterable: Iterator<TValue, TReturn, TNext>;

    constructor(
      iterable: IteratorArg<TValue, TReturn, TNext>,
      private mapper: (arg: TValue) => TMapperReturn,
    ) {
      super();
      this.iterable = iterable[Symbol.iterator]();
    }

    next(...args: [] | [TNext]): IteratorResult<TMapperReturn, TReturn> {
      const result = this.iterable.next(...args);

      if (!result.done) {
        return {
          ...result,
          value: this.mapper(result.value),
        };
      }

      return result;
    }
  }

  /**
   * This is a private class for encapsulating the logic for filtering.
   */
  export class _FilteringIterator<TValue, TReturn, TNext> extends AugmentedIterator<TValue, TReturn, TNext> {
    private iterable: Iterator<TValue, TReturn, TNext>;

    constructor(
      iterable: IteratorArg<TValue, TReturn, TNext>,
      private filterer: (arg: TValue) => boolean,
    ) {
      super();
      this.iterable = iterable[Symbol.iterator]();
    }

    next(...args: [] | [TNext]): IteratorResult<TValue, TReturn> {
      let result = this.iterable.next(...args);

      while (!result.done && !this.filterer(result.value)) {
        result = this.iterable.next(...args);
      }

      return result;
    }
  }
}

export abstract class AugmentedAsyncIterator<TValue, TReturn = any, TNext = any>
  implements AsyncIterableIterator<TValue, TReturn, TNext>
{
  [Symbol.asyncIterator](): this {
    return this;
  }

  abstract next(...args: [] | [TNext]): Promise<IteratorResult<TValue, TReturn>>;

  /**
   * Returns a new AugmentedIterator that will run mapper over each item before yielding
   *
   * Because we return another AugmentedIterator instance, this call is chainable.
   * @param {Function} mapper the mapping function you want to be run over all values
   * @typeParam TMapperReturn the return type from mapper, will also become the new TValue type of the returned AugmentedIterator
   */
  map<TMapperReturn>(
    mapper: (item: TValue) => Promise<TMapperReturn>,
  ): AugmentedAsyncIterator<TMapperReturn, TReturn, TNext> {
    throw new Error('TODO');
    // return mapAsyncIterator(this, mapper);
  }

  /**
   * Returns a new AugmentedIterator that will only yield values for which filter returns true
   * @param {Function} filter The filtering function you wish to use
   */
  filter(filter: (item: TValue) => Promise<boolean>): AugmentedAsyncIterator<TValue, TReturn, TNext> {
    throw new Error('TODO');
    // return filterAsyncIterator(this, filter);
  }

  /**
   * Returns a new AugmentedIterator that has access to the last value yielded OR initial the same way a reduce would
   * normally work over say an array.
   * @param reducer the function you want to use as a reducer. Takes arguments in (carry,item) order. The first time we
   *   yield a value carry will be initial, after which it will be the previously returned value from reducer.
   * @param initial the value we should pass to reducer the first time we yield a value.
   * @typeParam TReducerReturn the return type of reducer, and of initial; will also become the TValue type of the returned AugmentedIterator
   */
  reduce<TReducerReturn>(
    reducer: (carry: TReducerReturn, item: TValue) => Promise<TReducerReturn>,
    initial: TReducerReturn,
  ): AugmentedAsyncIterator<TReducerReturn, TReturn, TNext> {
    return reduceIterator(this, reducer, initial);
  }
}

namespace AsyncAugmentedIterators {
  /**
   * This is a private class for encapsulating the logic for reducing.
   */
  export class _ReducingIterator<TValue, TReducerReturn, TReturn, TNext> extends AugmentedAsyncIterator<
    TReducerReturn,
    TReturn,
    TNext
  > {
    private iterable: AsyncIterator<TValue, TReturn, TNext>;

    constructor(
      iterable: AsyncIterable<TValue, TReturn, TNext>,
      private reducer: (carry: TReducerReturn, arg: TValue) => Promise<TReducerReturn>,
      private state: TReducerReturn,
    ) {
      super();
      this.iterable = iterable[Symbol.asyncIterator]();
    }

    async next(...args: [] | [TNext]): Promise<IteratorResult<TReducerReturn, TReturn>> {
      const result = await this.iterable.next(...args);

      if (!result.done) {
        this.state = await this.reducer(this.state, result.value);

        return {
          ...result,
          value: this.state,
        };
      }

      return result;
    }
  }
}

/**
 * Given an Iterable or IterableIterator, a reducer, and an initial value, return a new IterableIterator that yields
 * values that are automatically piped through said reducer.
 * @param {Iterable} iterator - The iterator you wish to reduce over
 * @param {Function} reducer - A function to use to reduce the elements iterator produces
 * @param initial The initial value to pass to reducer with the first element
 * @typeParam TValue - The value returned from the iterator
 * @typeParam TReducerReturn - The return type of your reducer function
 * @typeParam TReturn - If your iterator has a return type it must be the same as TIteratorValue, otherwise undefined
 * @typeParam TNext - The type your iterator is expecting as what's passed to its next function. For generators this is the type returned after a yield.
 *
 * @example
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
 */
export function reduceIterator<TValue, TReducerReturn, TReturn = TValue | undefined, TNext = any>(
  iterator: IteratorArg<TValue, TReturn, TNext>,
  reducer: (carry: TReducerReturn, arg: TValue) => TReducerReturn,
  initial: TReducerReturn,
): AugmentedIterator<TReducerReturn, TReturn, TNext>;
export function reduceIterator<TValue, TReducerReturn, TReturn = TValue | undefined, TNext = any>(
  iterator: AsyncIterableIterator<TValue, TReturn, TNext>,
  reducer: (carry: TReducerReturn, arg: TValue) => Promise<TReducerReturn>,
  initial: TReducerReturn,
): AugmentedAsyncIterator<TReducerReturn, TReturn, TNext>;
export function reduceIterator<TValue, TReducerReturn, TReturn = TValue | undefined, TNext = any>(
  iterator: AsyncIterableIterator<TValue, TReturn, TNext> | IteratorArg<TValue, TReturn, TNext>,
  reducer:
    | ((carry: TReducerReturn, arg: TValue) => Promise<TReducerReturn>)
    | ((carry: TReducerReturn, arg: TValue) => TReducerReturn),
  initial: TReducerReturn,
): AugmentedIterator<TReducerReturn, TReturn, TNext> | AugmentedAsyncIterator<TReducerReturn, TReturn, TNext> {
  if (isIteratable(iterator)) {
    return new SyncAugmentedIterators._ReducingIterator(
      iterator,
      <(carry: TReducerReturn, arg: TValue) => TReducerReturn>reducer, // We force the type here due to ts overloads but ***technically*** this could be the wrong type
      initial,
    );
  }

  if (Symbol.asyncIterator in iterator) {
    return new AsyncAugmentedIterators._ReducingIterator(
      iterator,
      <(carry: TReducerReturn, arg: TValue) => Promise<TReducerReturn>>reducer,
      initial,
    );
  }
  throw new Error('iterator parameter was neither an IterableIterator or an AsyncIterableIterator!');
}

/**
 * Given an IteratorArg and a mapping function, returns a new IterableIterator that yields values from the initial iterator
 * but passed through the mapping function.
 * @param {Iterable} iterator - The iterator you wish to map elements from
 * @param {Function} mapper - A function to use to map the elements iterator produces
 * @typeParam TValue - The value returned from the iterator
 * @typeParam TMapperReturn - The return type of your reducer function
 * @typeParam TReturn - If your iterator has a return type it must be the same as TIteratorValue, otherwise undefined
 * @typeParam TNext - The type your iterator is expecting as what's passed to its next function. For generators this is the type returned after a yield.
 * @example
const set = new Set([1, 2, 3, 4, 5]);

const mapped = mapIterator(set, (item) => item * 2);

console.log(Array.from(mapped)); // logs out [2, 4, 6, 8, 10]
 */
export function mapIterator<TValue, TMapperReturn, TReturn = TValue | undefined, TNext = any>(
  iterator: IteratorArg<TValue, TReturn, TNext>,
  mapper: (arg: TValue) => TMapperReturn,
): AugmentedIterator<TMapperReturn, TReturn, TNext> {
  // Because we can't guarantee a 0 value for the types, we can't just fall back to reduce.
  return new SyncAugmentedIterators._MappingIterator(iterator, mapper);
}

/**
 * Given an IteratorArg and a filtering function it will return a new IterableIterator that when polled will eagerly pull
 * values from iterator and pass them to filterer until filterer returns true for an item, or we reach the end of iterator;
 * it will then yield this value itself.
 *
 * **NOTE:** if iterator relies on values being passed to next, the returned IterableIterator will re-use the same next
 * until a value passes the filterer.
 * value until an item is raised that passes the filterer. This can lead to strange behaviours.
 * @param {Iterable} iterator - The iterator you wish to map elements from
 * @param {Function} filterer - Only values for which this function returns true are yielded.
 * @typeParam TValue - The value returned from the iterator
 * @typeParam TReturn - If your iterator has a return type it must be the same as TIteratorValue, otherwise undefined
 * @typeParam TNext - The type your iterator is expecting as what's passed to its next function. For generators this is the type returned after a yield.
 *
 * @example
const set = new Set([1, 2, 3, 4, 5]);

const filtered = filterIterator(set, (item) => item % 2 === 0);

console.log(Array.from(filtered)); // logs out [2, 4]
 */
export function filterIterator<TValue, TReturn = TValue | undefined, TNext = any>(
  iterator: IteratorArg<TValue, TReturn, TNext>,
  filterer: (arg: TValue) => boolean,
): AugmentedIterator<TValue, TReturn, TNext> {
  return new SyncAugmentedIterators._FilteringIterator(iterator, filterer);
}

//  =============      Greedy Versions       ================

/**
 * Given an iterator, eagerly reduce over its results until it finishes and return the result
 * @param {Iterable} iterator - The iterator you wish to reduce over
 * @param {Function} reducer - A function to use to reduce the elements iterator produces
 * @param initial The initial value to pass to reducer with the first element. Also returned if iterator never yields a value
 * @typeParam TValue - The type of values that iterator will yield and that initial must be
 * @typeParam TReturn - The type of values that reducer will return
 *
 * @example
 const set: Set<number> = new Set([1, 2, 3, 4, 5]);

 const sum = eagerlyReduceIterator(
   set.values(),
   (carry: number, item: number): number => {
     return carry + item;
   },
   0,
 );
 // sum is now 15
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
 const set: Set<number> = new Set([1, 2, 3, 4, 5]);

 const squaredValues = mapIteratorToArray(
   set.values(),
   (item: number): number => {
     return item * item;
   },
 );
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
 const set: Set<number> = new Set([1, 2, 3, 4, 5]);

 const evenValues = filterIteratorToArray(
   set.values(),
   (item: number): boolean => {
     return item % 2 === 0;
   },
 );
 // evenValues = [2, 4];
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

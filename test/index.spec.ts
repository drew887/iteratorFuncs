/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { beforeEach, describe, it, mock, test } from 'node:test';
import assert from 'node:assert';
import {
  eagerlyReduceIterator,
  filterIterator,
  filterIteratorToArray,
  mapIterator,
  mapIteratorToArray,
  reduceIterator,
} from '../src/index.ts';

describe('composition versions', () => {
  describe('reduceIterator', () => {
    describe('over Generators', () => {
      const generator = function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }

        return;
      };

      let iter: Generator<number, void>;

      beforeEach(() => {
        iter = generator();
      });

      it('should return another iterator', () => {
        const actual = reduceIterator(iter, () => {}, undefined);

        assert.strictEqual(typeof actual[Symbol.iterator], 'function', 'returns another iterator');
      });

      it('should yield all reduced values', () => {
        const reducer = mock.fn((carry, item) => {
          return carry + item;
        });

        const actual = reduceIterator(iter, reducer, 0);
        const expected = [1, 3, 6, 10, 15];

        const results = [];
        for (const item of actual) {
          results.push(item);
        }

        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields the right numbers');
        assert.strictEqual(reducer.mock.callCount(), expected.length, 'reducer func gets called once for each item');
      });

      it('should pass back values to generator when a value is passed to next', () => {
        let done = false;
        const generator = function* (): Generator<number, any, number> {
          const result = yield 5;
          assert.strictEqual(result, 10, 'got passed back the value passed to next');
          done = true;
        };

        const actual = reduceIterator(
          generator(),
          (carry, arg) => {
            return carry + arg;
          },
          0,
        );

        const expected = [5];

        const results = [];
        let next = actual.next();
        while (!next.done) {
          results.push(next.value);
          next = actual.next(10);
        }

        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.strictEqual(done, true, 'got to the end of the generator function');
        assert.deepEqual(results, expected, 'yields all the right values');
      });

      it('should bail early if iterator throws', () => {
        const err = new Error('failed Generator!');
        const failingGenerator = function* () {
          yield 5;
          throw err;
        };

        const actual = reduceIterator(failingGenerator(), () => {}, undefined);

        assert.throws(() => {
          for (const a of actual) {
            //empty on purpose
          }
        }, err);
      });
    });
    it('should throw an error with a good message when passed a non iterable/iterator', () => {
      assert.throws(
        () => {
          // @ts-ignore
          reduceIterator(null, null, null);
        },
        { message: 'iterator parameter was neither an IterableIterator or an AsyncIterableIterator!' },
      );
    });
  });

  describe('mapIterator', () => {
    describe('generators', () => {
      let iter: Generator<number, void>;

      const generator = function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }

        return;
      };

      beforeEach(() => {
        iter = generator();
      });

      it('should return another iterator', () => {
        const actual = mapIterator(iter, () => {});

        assert.strictEqual(typeof actual[Symbol.iterator], 'function', 'returns another iterator');
      });

      it('should yield all mapped values', () => {
        const mapper = mock.fn((item: number) => {
          return item * 2;
        });

        const actual = mapIterator(iter, mapper);
        const expected = [2, 4, 6, 8, 10];

        const results = [];
        for (const item of actual) {
          results.push(item);
        }

        //TODO: add assert and a mock that closure passed is called the right number of times
        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields the mapped values');
        assert.strictEqual(mapper.mock.callCount(), expected.length, 'mapper func gets called only once for each item');
      });

      it('should pass back values to generator when a value is passed to next', () => {
        let done = false;
        const generator = function* (): Generator<number, any, number> {
          const result = yield 5;
          assert.strictEqual(result, 10, 'got passed back the value passed to next');
          done = true;
        };

        const actual = mapIterator(generator(), (arg) => {
          return arg + 1;
        });

        const expected = [6];

        const results = [];
        let next = actual.next();
        while (!next.done) {
          results.push(next.value);
          next = actual.next(10);
        }

        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.strictEqual(done, true, 'got to the end of the generator function');
        assert.deepEqual(results, expected, 'yields the expected value, still run through mapper function');
      });

      it('should bail early if iterator throws', () => {
        const err = new Error('failed Generator!');
        const failingGenerator = function* () {
          yield 5;
          throw err;
        };

        const actual = mapIterator(failingGenerator(), () => {});

        assert.throws(() => {
          for (const a of actual) {
            //empty on purpose
          }
        }, err);
      });
    });

    it('should throw an error with a good message when passed a non iterable/iterator', () => {
      assert.throws(
        () => {
          // @ts-ignore
          mapIterator(null, null, null);
        },
        { message: 'iterator parameter was neither an IterableIterator or an AsyncIterableIterator!' },
      );
    });
  });

  describe('filterIterator', () => {
    describe('generators', () => {
      let iter: Generator<number, void>;
      const iterLength = 5;

      const generator = function* () {
        for (let i = 1; i <= iterLength; i++) {
          yield i;
        }

        return;
      };

      beforeEach(() => {
        iter = generator();
      });

      it('should return another iterator', () => {
        const actual = filterIterator(iter, () => {
          return true;
        });

        assert.strictEqual(typeof actual[Symbol.iterator], 'function', 'returns another iterator');
      });

      it('should yield only values that pass the filter', () => {
        const filter = mock.fn((item: number) => {
          return item % 2 == 0;
        });

        const actual = filterIterator(iter, filter);
        const expected = [2, 4];

        const results = [];
        for (const item of actual) {
          results.push(item);
        }

        //TODO: add assert and a mock that closure passed is called the right number of times
        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields only the values that pass the filter');
        assert.strictEqual(filter.mock.callCount(), iterLength, 'filter func gets called only once for each item');
      });

      it('should pass back values to generator when a value is passed to next', () => {
        let done = false;
        const generator = function* (): Generator<number, any, number> {
          const result = yield 5;
          assert.strictEqual(result, 10, 'got passed back the value passed to next');
          done = true;
        };

        const actual = filterIterator(generator(), () => true);

        const expected = [5];

        const results = [];
        let next = actual.next();
        while (!next.done) {
          results.push(next.value);
          next = actual.next(10);
        }

        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.strictEqual(done, true, 'got to the end of the generator function');
        assert.deepEqual(results, expected, 'yields the expected value, still run through mapper function');
      });

      it('should bail early if iterator throws', () => {
        const err = new Error('failed Generator!');
        const failingGenerator = function* () {
          yield 5;
          throw err;
        };

        const actual = filterIterator(failingGenerator(), () => true);

        assert.throws(() => {
          for (const a of actual) {
            //empty on purpose
          }
        }, err);
      });
    });

    describe('Sets', () => {
      const set = new Set([1, 2, 3, 4, 5]);

      it('should yield only values that pass the filter', () => {
        const filter = mock.fn((item: number) => {
          return item % 2 == 0;
        });

        const actual = filterIterator(set, filter);
        const expected = [2, 4];
        const results = Array.from(actual);

        //TODO: add assert and a mock that closure passed is called the right number of times
        assert.strictEqual(actual.next().done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields only the values that pass the filter');
        assert.strictEqual(filter.mock.callCount(), set.size, 'filter func gets called once for each item');
      });
    });

    it('should throw an error with a good message when passed a non iterable/iterator', () => {
      assert.throws(
        () => {
          // @ts-ignore
          filterIterator(null, null, null);
        },
        { message: 'iterator parameter was neither an IterableIterator or an AsyncIterableIterator!' },
      );
    });
  });
});

describe('async iterators', () => {
  describe('reduceAsyncIterator', () => {
    describe('over Generators', () => {
      const generator = async function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }

        return;
      };

      let iter: AsyncGenerator<number, void>;

      beforeEach(() => {
        iter = generator();
      });

      it('should return another AsyncIterator', () => {
        const actual = reduceIterator(iter, async () => {}, undefined);

        assert.strictEqual(typeof actual[Symbol.asyncIterator], 'function', 'returns another AsyncIterator');
      });

      it('should yield all reduced values', async () => {
        const reducer = mock.fn((carry, item) => {
          return carry + item;
        });

        const actual = reduceIterator(iter, reducer, 0);
        const expected = [1, 3, 6, 10, 15];

        const results = [];
        for await (const item of actual) {
          results.push(item);
        }

        assert.strictEqual((await actual.next()).done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields the right numbers');
        assert.strictEqual(reducer.mock.callCount(), expected.length, 'reducer func gets called once for each item');
      });

      it('should pass back values to generator when a value is passed to next', async () => {
        let done = false;
        const generator = async function* (): AsyncGenerator<number, any, number> {
          const result = yield 5;
          assert.strictEqual(result, 10, 'got passed back the value passed to next');
          done = true;
        };

        const actual = reduceIterator(
          generator(),
          async (carry, arg) => {
            return carry + arg;
          },
          0,
        );

        const expected = [5];

        const results = [];
        let next = await actual.next();
        while (!next.done) {
          results.push(next.value);
          next = await actual.next(10);
        }

        assert.strictEqual((await actual.next()).done, true, 'iterator marks done');
        assert.strictEqual(done, true, 'got to the end of the generator function');
        assert.deepEqual(results, expected, 'yields all the right values');
      });

      it('should bail early if iterator throws', () => {
        const err = new Error('failed Generator!');
        const failingGenerator = async function* () {
          yield 5;
          throw err;
        };

        const actual = reduceIterator(failingGenerator(), async () => {}, undefined);

        assert.rejects(async () => {
          for await (const a of actual) {
            //empty on purpose
          }
        }, err);
      });
    });
  });

  describe('mapIterator', () => {
    describe('async generators', () => {
      let iter: AsyncGenerator<number, void>;

      const generator = async function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }

        return;
      };

      beforeEach(() => {
        iter = generator();
      });

      it('should return another iterator', () => {
        const actual = mapIterator(iter, async () => {});

        assert.strictEqual(typeof actual[Symbol.asyncIterator], 'function', 'returns another AsyncIterator');
      });

      it('should yield all mapped values', async () => {
        const mapper = mock.fn(async (item: number) => {
          return item * 2;
        });

        const actual = mapIterator(iter, mapper);
        const expected = [2, 4, 6, 8, 10];

        const results = [];
        for await (const item of actual) {
          results.push(item);
        }

        assert.strictEqual((await actual.next()).done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields the mapped values');
        assert.strictEqual(mapper.mock.callCount(), expected.length, 'mapper func gets called only once for each item');
      });

      it('should pass back values to generator when a value is passed to next', async () => {
        let done = false;
        const generator = async function* (): AsyncGenerator<number, any, number> {
          const result = yield 5;
          assert.strictEqual(result, 10, 'got passed back the value passed to next');
          done = true;
        };

        const actual = mapIterator(generator(), async (arg) => {
          return arg + 1;
        });

        const expected = [6];

        const results = [];
        let next = await actual.next();
        while (!next.done) {
          results.push(next.value);
          next = await actual.next(10);
        }

        assert.strictEqual((await actual.next()).done, true, 'iterator marks done');
        assert.strictEqual(done, true, 'got to the end of the generator function');
        assert.deepEqual(results, expected, 'yields the expected value, still run through mapper function');
      });

      it('should bail early if iterator throws', async () => {
        const err = new Error('failed Generator!');
        const failingGenerator = async function* () {
          yield 5;
          throw err;
        };

        const actual = mapIterator(failingGenerator(), async () => {});

        assert.rejects(async () => {
          for await (const a of actual) {
            //empty on purpose
          }
        }, err);
      });
    });
  });
  describe('filterIterator', () => {
    describe('async generators', () => {
      let iter: AsyncGenerator<number, void>;
      const iterLength = 5;

      const generator = async function* () {
        for (let i = 1; i <= iterLength; i++) {
          yield i;
        }

        return;
      };

      beforeEach(() => {
        iter = generator();
      });

      it('should return another async iterator', () => {
        const actual = filterIterator(iter, async () => {
          return true;
        });

        assert.strictEqual(typeof actual[Symbol.asyncIterator], 'function', 'returns another async iterator');
      });

      it('should yield only values that pass the filter', async () => {
        const filter = mock.fn(async (item: number) => {
          return item % 2 == 0;
        });

        const actual = filterIterator(iter, filter);
        const expected = [2, 4];

        const results = [];
        for await (const item of actual) {
          results.push(item);
        }

        assert.strictEqual((await actual.next()).done, true, 'iterator marks done');
        assert.deepEqual(results, expected, 'yields only the values that pass the filter');
        assert.strictEqual(filter.mock.callCount(), iterLength, 'filter func gets called only once for each item');
      });

      it('should pass back values to generator when a value is passed to next', async () => {
        let done = false;
        const generator = async function* (): AsyncGenerator<number, any, number> {
          const result = yield 5;
          assert.strictEqual(result, 10, 'got passed back the value passed to next');
          done = true;
        };

        const actual = filterIterator(generator(), async () => true);

        const expected = [5];

        const results = [];
        let next = await actual.next();
        while (!next.done) {
          results.push(next.value);
          next = await actual.next(10);
        }

        assert.strictEqual((await actual.next()).done, true, 'iterator marks done');
        assert.strictEqual(done, true, 'got to the end of the generator function');
        assert.deepEqual(results, expected, 'yields the expected value, still run through mapper function');
      });

      it('should bail early if iterator throws', async () => {
        const err = new Error('failed Generator!');
        const failingGenerator = function* () {
          yield 5;
          throw err;
        };

        const actual = filterIterator(failingGenerator(), () => true);

        assert.rejects(async () => {
          for await (const a of actual) {
            //empty on purpose
          }
        }, err);
      });
    });
  });
});

// TODO: we will benefit greatly from jests .each functionality to run whole suites over sets/maps/generators/etc

describe('combinations', () => {
  describe('returned instances have helper methods to chain', () => {
    describe('should have a .map method that chains a map call', () => {
      test('filterIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const mapper = mock.fn((item: number) => item * 2);
        const filter = mock.fn((item: number) => item > 2);

        const filteredAndMapped = filterIterator(set, filter).map(mapper);

        const expected = [6, 8, 10];
        const result = Array.from(filteredAndMapped);

        assert.strictEqual(filter.mock.callCount(), set.size, 'filter gets called once for every instance');
        assert.strictEqual(
          mapper.mock.callCount(),
          expected.length,
          'mapper only gets called once for the values that passed filter',
        );
        assert.deepEqual(result, expected, 'Final result is only the mapped values that pass the filter');
      });
      test('mapIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const mapper1 = mock.fn((item: number) => item * 2);
        const mapper2 = mock.fn((item: number) => `${item}`);

        //also subtly tests that TS enforces types here
        const doubleMapped = mapIterator(set, mapper1).map(mapper2);

        const expected = ['2', '4', '6', '8', '10'];
        const result = Array.from(doubleMapped);

        assert.strictEqual(doubleMapped.next().done, true, 'iterator is marked done');
        assert.strictEqual(mapper1.mock.callCount(), set.size, 'mapper1 gets called once for every instance');
        assert.strictEqual(mapper2.mock.callCount(), set.size, 'mapper2 gets called once for every instance');
        assert.deepEqual(result, expected, 'Final result is all values passed through both mappers');
      });
      test('reduceIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const reducer = mock.fn((carry, item) => {
          return carry + item;
        });
        const mapper = mock.fn((item: number) => `${item}`);

        const mappedReducer = reduceIterator(set, reducer, 0).map(mapper);

        const expected = ['1', '3', '6', '10', '15'];
        const result = Array.from(mappedReducer);

        assert.strictEqual(reducer.mock.callCount(), set.size, 'reducer gets called once for every instance');
        assert.strictEqual(mapper.mock.callCount(), set.size, 'mapper gets called once for every instance');
        assert.deepEqual(result, expected, 'Final result is all values passed through both functions');
      });
    });
    describe('should have a .filter method that chains a filter call', () => {
      test('reduceIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const reducer = mock.fn((carry, item) => {
          return carry + item;
        });
        const filter = mock.fn((item: number) => item > 5);

        const filteredReducer = reduceIterator(set, reducer, 0).filter(filter);

        const expected = [6, 10, 15];
        const result = Array.from(filteredReducer);

        assert.strictEqual(reducer.mock.callCount(), set.size, 'reducer gets called once for every instance');
        assert.strictEqual(filter.mock.callCount(), set.size, 'filter gets called once for every instance');
        assert.deepEqual(result, expected, 'Final result is the reduced values that pass the filter');
      });
      test('mapIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const mapper = mock.fn((item: number) => item * 2);
        const filter = mock.fn((item: number) => item > 5);

        //also subtly tests that TS enforces types here
        const doubleMapped = mapIterator(set, mapper).filter(filter);

        const expected = [6, 8, 10];
        const result = Array.from(doubleMapped);

        assert.strictEqual(doubleMapped.next().done, true, 'iterator is marked done');
        assert.strictEqual(mapper.mock.callCount(), set.size, 'mapper gets called once for every instance');
        assert.strictEqual(filter.mock.callCount(), set.size, 'filter gets called once for every instance');
        assert.deepEqual(result, expected, 'Final result is mapped values that pass the filter');
      });
      test('filterIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const filter2 = mock.fn((item: number) => item % 2 === 0);
        const filter1 = mock.fn((item: number) => item > 2);

        const doubleFiltered = filterIterator(set, filter1).filter(filter2);

        const expected = [4];
        const result = Array.from(doubleFiltered);

        assert.strictEqual(filter1.mock.callCount(), set.size, 'filter1 gets called once for every instance');
        assert.strictEqual(
          filter2.mock.callCount(),
          3,
          'filter2 only gets called once for the values that passed filter1',
        );
        assert.deepEqual(result, expected, 'Final result is only the values that passed both filters');
      });
    });
    describe('should have a .reduce method that chains a reduce call', () => {
      test('reduceIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const reducer1 = mock.fn((carry, item) => {
          return carry + item;
        });
        const reducer2 = mock.fn((carry: string, item: number): string => `${carry}-${item}`);

        const doubleReduced = reduceIterator(set, reducer1, 0).reduce(reducer2, '');

        const expected = ['-1', '-1-3', '-1-3-6', '-1-3-6-10', '-1-3-6-10-15'];
        const result = Array.from(doubleReduced);

        assert.strictEqual(reducer1.mock.callCount(), set.size, 'reducer1 gets called once for every instance');
        assert.strictEqual(reducer2.mock.callCount(), set.size, 'reducer2 gets called once for every instance');
        assert.deepEqual(result, expected, 'Final result is the values passed through both reducers');
      });
      test('mapIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const mapper = mock.fn((item: number) => item * 2);
        const reducer = mock.fn((carry: number, item: number) => (item > 5 ? carry : item));

        //also subtly tests that TS enforces types here
        const mappedAndReduced = mapIterator(set, mapper).reduce(reducer, 0);

        // After we're > 5 always return the last one
        const expected = [2, 4, 4, 4, 4];
        const result = Array.from(mappedAndReduced);

        assert.strictEqual(mappedAndReduced.next().done, true, 'iterator is marked done');
        assert.strictEqual(mapper.mock.callCount(), set.size, 'mapper gets called once for every instance');
        assert.strictEqual(reducer.mock.callCount(), set.size, 'reducer gets called once for every instance');
        assert.deepEqual(result, expected, 'Final result is mapped values that pass the reducer');
      });
      test('filterIterator', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const filter1 = mock.fn((item: number) => item > 2);
        const reducer = mock.fn((carry: string, item: number) => `${carry}-${item}`);

        const filteredAndReduced = filterIterator(set, filter1).reduce(reducer, '');

        const expected = ['-3', '-3-4', '-3-4-5'];
        const result = Array.from(filteredAndReduced);

        assert.strictEqual(filter1.mock.callCount(), set.size, 'filter1 gets called once for every instance');
        assert.strictEqual(
          reducer.mock.callCount(),
          3,
          'reducer only gets called once for the values that passed filter1',
        );
        assert.deepEqual(result, expected, 'Final result is only the values that passed the filter then the reducer');
      });
    });
  });
  describe.todo('multiple chained calls fuse', () => {
    it.todo(
      "should when called again on an instance we've made, then just add a ref to the fun, not make a new instance",
      () => {},
    );
  });
});

describe('greedy versions', () => {
  describe('eagerlyReduceIterator', () => {
    describe('over Generators', () => {
      describe('valid generator', () => {
        let iter: Generator<number, void>;

        const generator = function* () {
          for (let i = 1; i <= 5; i++) {
            yield i;
          }

          return;
        };

        beforeEach(() => {
          iter = generator();
        });

        it('should map the iterator to the end', () => {
          const actual = eagerlyReduceIterator(
            iter,
            (carry: number, item: number): number => {
              return carry + item;
            },
            0,
          );

          assert.strictEqual(iter.next().done, true, 'iterator marks done');
          assert.strictEqual(actual, 15, 'computes the right number');
        });

        it('should bail early if iterator throws', () => {
          const err = new Error('failed Generator!');
          const failingGenerator = function* () {
            yield 5;
            throw err;
          };

          const actual = () => {
            return eagerlyReduceIterator(
              failingGenerator(),
              (carry: number[], item: number): number[] => {
                carry.push(item);
                return carry;
              },
              [] as number[],
            );
          };

          assert.throws(actual, err);
        });
      });

      describe('generator that yields no values', () => {
        const generator = function* () {
          return;
        };

        it('should map the iterator to the end', (t) => {
          const iter: Generator<number, void> = generator();
          const reducer = t.mock.fn();

          const actual = eagerlyReduceIterator(iter, reducer, 10);

          assert.strictEqual(iter.next().done, true, 'iterator marks done');
          assert.strictEqual(reducer.mock.callCount(), 0, 'reducer should never be called');
          assert.strictEqual(actual, 10, 'gets back passed in initial value');
        });
      });
    });

    describe('over Sets', () => {
      it("should reduce over a Set's values", () => {
        const set: Set<number> = new Set([1, 2, 3, 4, 5]);
        const iter = set.values();
        const expected = 15;

        const actual = eagerlyReduceIterator(
          iter,
          (carry: number, item: number): number => {
            return carry + item;
          },
          0,
        );

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.strictEqual(actual, expected, "Reduces over the Set's values as expected");
      });
    });

    describe('over Maps', () => {
      const set: Map<string, number> = new Map(
        [1, 2, 3, 4, 5].map((item) => {
          return [`${item}`, item];
        }),
      );

      it('should reduce over values', () => {
        const iter = set.values();
        const expected = 15;

        const actual = eagerlyReduceIterator(
          iter,
          (carry: number, item: number): number => {
            return carry + item;
          },
          0,
        );

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.strictEqual(actual, expected, "Reduces over the Map's values as expected");
      });

      it('should reduce over keys', () => {
        const iter = set.keys();
        const expected = '12345';

        const actual = eagerlyReduceIterator(
          iter,
          (carry: string, item: string): string => {
            return carry + item;
          },
          '',
        );

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.strictEqual(actual, expected, "Reduces over the Map's keys as expected");
      });

      it('should reduce over entries', () => {
        const iter = set.entries();
        const expected = [
          ['1', 1],
          ['2', 2],
          ['3', 3],
          ['4', 4],
          ['5', 5],
        ];

        const actual = eagerlyReduceIterator(
          iter,
          (carry: Array<[string, number]>, item: [string, number]): Array<[string, number]> => {
            carry.push(item);

            return carry;
          },
          [] as Array<[string, number]>,
        );

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Reduces over the Map's entries as expected");
      });
    });
  });

  describe('mapIteratorToArray', () => {
    describe('Generator', () => {
      let iter: Generator<number, void>;

      const generator = function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }

        return;
      };

      beforeEach(() => {
        iter = generator();
      });

      it('should map all the elements as expected', () => {
        const expected = [2, 3, 4, 5, 6];

        const actual = mapIteratorToArray(iter, (num: number) => {
          return num + 1;
        });

        assert.strictEqual(iter.next().done, true, 'iterator marks done');
        assert.deepEqual(actual, expected, 'Gets all values and correctly maps them');
      });
    });

    describe('Sets', () => {
      it("should map over a Set's values", () => {
        const set: Set<number> = new Set([1, 2, 3, 4, 5]);
        const iter = set.values();
        const expected = ['1-a', '2-a', '3-a', '4-a', '5-a'];

        const actual = mapIteratorToArray(iter, (item: number): string => {
          return `${item}-a`;
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Maps over the Set's values as expected");
      });
    });

    describe('Maps', () => {
      const set: Map<string, number> = new Map(
        [1, 2, 3, 4, 5].map((item) => {
          return [`${item}`, item];
        }),
      );

      it('should map over values', () => {
        const iter = set.values();
        const expected = ['1-a', '2-a', '3-a', '4-a', '5-a'];

        const actual = mapIteratorToArray(iter, (item: number): string => {
          return `${item}-a`;
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Maps over the Map's values as expected");
      });

      it('should map over keys', () => {
        const iter = set.keys();
        const expected = ['1-a', '2-a', '3-a', '4-a', '5-a'];

        const actual = mapIteratorToArray(iter, (item: string): string => {
          return `${item}-a`;
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Maps over the Map's keys as expected");
      });

      it('should map over entries', () => {
        const iter = set.entries();
        const expected = ['1-1', '2-2', '3-3', '4-4', '5-5'];

        const actual = mapIteratorToArray(iter, ([key, item]: [string, number]): string => {
          return `${key}-${item}`;
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Maps over the Map's entries as expected");
      });
    });
  });

  describe('filterIteratorToArray', () => {
    describe('over Generators', () => {
      let iter: Generator<number, void>;

      const generator = function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }

        return;
      };

      beforeEach(() => {
        iter = generator();
      });

      it('should contain only filtered items', () => {
        const expected: number[] = [2, 4];

        const actual = filterIteratorToArray(iter, (item: number): boolean => {
          return item % 2 === 0;
        });

        assert.deepEqual(actual, expected, 'filters iterable as expected');
      });
    });

    describe('Sets', () => {
      it("should filter over a Set's values", () => {
        const set: Set<number> = new Set([1, 2, 3, 4, 5]);
        const iter = set.values();
        const expected = [2, 4];

        const actual = filterIteratorToArray(iter, (item: number): boolean => {
          return item % 2 == 0;
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Filters the Set's values as expected");
      });
    });

    describe('Maps', () => {
      const set: Map<string, number> = new Map(
        [1, 2, 3, 4, 5].map((item) => {
          return [`${item}`, item];
        }),
      );

      it('should filter over values', () => {
        const iter = set.values();
        const expected = [1, 3, 5];

        const actual = filterIteratorToArray(iter, (item: number): boolean => {
          return item % 2 == 1;
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Filters the Map's values as expected");
      });

      it('should map over keys', () => {
        const iter = set.keys();
        const expected = ['5'];

        const actual = filterIteratorToArray(iter, (item: string): boolean => {
          return item === '5';
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Filters over the Map's keys as expected");
      });

      it('should map over entries', () => {
        const iter = set.entries();
        const expected = [['1', 1]];

        const actual = filterIteratorToArray(iter, ([key, item]: [string, number]): boolean => {
          return key === '1';
        });

        assert.strictEqual(iter.next().done, true, 'marks as done');
        assert.deepEqual(actual, expected, "Filters over the Map's entries as expected");
      });
    });
  });
});

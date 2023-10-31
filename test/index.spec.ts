/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import {
  eagerlyReduceIterator,
  filterIterator,
  filterIteratorToArray,
  mapIterator,
  mapIteratorToArray,
  reduceIterator,
} from '../src/index.ts';

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
  });
});

describe.todo('async iterators', () => {});

describe('combinations', () => {
  describe.todo('multiple chained calls fuse', () => {
    it.todo(
      "should when called again on an instance we've made, then just add a ref to the fun, not make a new instance",
      () => {},
    );
  });

  it('chaining map into filter should work', () => {
    const set = new Set([1, 2, 3, 4, 5]);
    const mapper = mock.fn((item: number) => item * 2);
    const filter = mock.fn((item: number) => item > 5);

    const mapped = mapIterator(set, mapper);
    const filtered = filterIterator(mapped, filter);

    assert.strictEqual(mapper.mock.callCount(), 0, "mapper isn't called before values are yielded");
    assert.strictEqual(filter.mock.callCount(), 0, "filter isn't called before values are yielded");

    const expected = [6, 8, 10];
    const result = Array.from(filtered);

    assert.strictEqual(mapper.mock.callCount(), set.size, 'mapper gets called once for every instance');
    assert.strictEqual(filter.mock.callCount(), set.size, 'filter gets called once for every instance');
    assert.deepEqual(result, expected, 'Final result is only the mapped values that pass the filter');
  });
});

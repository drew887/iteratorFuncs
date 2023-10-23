/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { filterIteratorToArray, mapIteratorToArray, eagerlyReduceIterator } from '../src/index.ts';

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

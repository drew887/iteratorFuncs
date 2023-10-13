import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';

import { filterIterator, mapIterator, reduceIterator } from '../src';

describe('reduceIterator', () => {
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

    it('should map the iterator to the end', () => {
      const actual = reduceIterator(
        iter as IterableIterator<number>,
        (carry, item) => {
          return carry + item;
        },
        0,
      );

      assert.strictEqual(iter.next().done, true, 'iterator marks done');
      assert.strictEqual(actual, 15, 'computes the right number');
    });
  });

  describe('over Sets', () => {
    it("should reduce over a Set's values", () => {
      const set: Set<number> = new Set([1, 2, 3, 4, 5]);
      const iter = set.values();
      const expected = 15;

      const actual = reduceIterator(
        iter,
        (carry, item) => {
          return carry + item;
        },
        0,
      );

      assert.strictEqual(iter.next().done, true, 'marks as done');
      assert.strictEqual(actual, expected, "Reduces over the Set's values as expected");
    });
  });

  describe('Maps', () => {
    const set: Map<string, number> = new Map(
      [1, 2, 3, 4, 5].map((item) => {
        return [`${item}`, item];
      }),
    );

    it('should reduce over values', () => {
      const iter = set.values();
      const expected = 15;

      const actual = reduceIterator(
        iter,
        (carry, item) => {
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

      const actual = reduceIterator(
        iter,
        (carry, item) => {
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

      const actual = reduceIterator(
        iter,
        (carry, item) => {
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

describe('mapIterator', () => {
  describe('generator', () => {
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

      const actual = mapIterator(iter, (num) => {
        return num + 1;
      });

      assert.strictEqual(iter.next().done, true, 'iterator marks done');
      assert.deepEqual(actual, expected, 'Gets all values and correctly maps them');
    });
  });
});

describe('filterIterator', () => {
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
      const expected: Array<number> = [2, 4];

      const actual = filterIterator(iter, (item): boolean => {
        return item % 2 === 0;
      });

      assert.deepEqual(actual, expected, 'filters iterable as expected');
    });
  });
});

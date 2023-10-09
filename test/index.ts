import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import { mapIterator, reduceIterator } from "../src";

describe("reduce", () => {
  describe("Generator", () => {
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

    it("should map the iterator to the end", () => {
      const actual = reduceIterator(
        iter as IterableIterator<number>,
        (carry, item) => {
          return carry + item;
        },
        0,
      );

      assert.strictEqual(iter.next().done, true, "iterator marks done");
      assert.strictEqual(actual, 15, "computes the right number");
    });
  });

  describe("Iterable", () => {});

  describe("IterableIterator", () => {});
});

describe("map", () => {
  describe("generator", () => {
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

    it("should map all the elements as expected", () => {
      const mapped = mapIterator(iter, (num) => {
        return num + 1;
      });
      const expected = [2, 3, 4, 5, 6];

      assert.strictEqual(iter.next().done, true, "iterator marks done");
      assert.deepEqual(
        mapped,
        expected,
        "Gets all values and correctly maps them",
      );
    });
  });
});

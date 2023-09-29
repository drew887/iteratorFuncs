import {beforeEach, describe, it} from "node:test";
import assert from "node:assert";

import {reduceIterator} from "../src";


describe("reduce", () => {
    describe("plain", () => {
        let iter: Generator<number, void>;
        const generator = function* () {
            yield 2;
        };

        beforeEach(() => {
            iter = generator();
        });

        it("should map the iterator to the end", () => {
            const actual = reduceIterator(iter as IterableIterator<number>, (carry, item) => {
                return carry + item;
            }, 0);

            assert.strictEqual(iter.next().done, true, "iterator marks done");
        });
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const src_1 = require("../src");
(0, node_test_1.describe)("reduce", () => {
    (0, node_test_1.describe)("plain", () => {
        let iter;
        const generator = function* () {
            yield 2;
        };
        (0, node_test_1.beforeEach)(() => {
            iter = generator();
        });
        (0, node_test_1.it)("should map the iterator to the end", () => {
            const actual = (0, src_1.reduceIterator)(iter, (carry, item) => {
                return carry + item;
            }, 0);
            node_assert_1.default.strictEqual(iter.next().done, true, "iterator marks done");
        });
    });
});

[@drew887121/iteratorfuncs](README.md) / Exports

# @drew887121/iteratorfuncs

## Table of contents

### Functions

- [filterIterator](modules.md#filteriterator)
- [mapIterator](modules.md#mapiterator)
- [reduceIterator](modules.md#reduceiterator)

## Functions

### filterIterator

▸ **filterIterator**<`TValue`\>(`iterator`, `filter`): `TValue`[]

Greedily Filter over an iterator and return an array of results

#### Type parameters

| Name     |
| :------- |
| `TValue` |

#### Parameters

| Name       | Type                           |
| :--------- | :----------------------------- |
| `iterator` | `Iterable`<`TValue`\>          |
| `filter`   | (`arg`: `TValue`) => `boolean` |

#### Returns

`TValue`[]

#### Defined in

[index.ts:54](https://github.com/drew887/iteratorFuncs/blob/a41fdac/src/index.ts#L54)

---

### mapIterator

▸ **mapIterator**<`TValue`, `TReturn`\>(`iterator`, `mapper`): `TReturn`[]

Greedily Map over an iterator and return an array of results

#### Type parameters

| Name      |
| :-------- |
| `TValue`  |
| `TReturn` |

#### Parameters

| Name       | Type                           |
| :--------- | :----------------------------- |
| `iterator` | `Iterable`<`TValue`\>          |
| `mapper`   | (`arg`: `TValue`) => `TReturn` |

#### Returns

`TReturn`[]

#### Defined in

[index.ts:34](https://github.com/drew887/iteratorFuncs/blob/a41fdac/src/index.ts#L34)

---

### reduceIterator

▸ **reduceIterator**<`TValue`, `TReturn`\>(`iterator`, `reducer`, `initial`): `TReturn`

Given an iterator greedily reduce over its results until it finishes and return the result

#### Type parameters

| Name      |
| :-------- |
| `TValue`  |
| `TReturn` |

#### Parameters

| Name       | Type                                               |
| :--------- | :------------------------------------------------- |
| `iterator` | `Iterable`<`TValue`\>                              |
| `reducer`  | (`carry`: `TReturn`, `arg`: `TValue`) => `TReturn` |
| `initial`  | `TReturn`                                          |

#### Returns

`TReturn`

#### Defined in

[index.ts:15](https://github.com/drew887/iteratorFuncs/blob/a41fdac/src/index.ts#L15)




export function reduceIterator<T, C>(iterator: IterableIterator<T>, reducer: (carry: C, arg: T) => C, initial: C): C {
    let result: C = initial;

    for(const a of iterator){
        result = reducer(result, a);
    }

    return result;
}

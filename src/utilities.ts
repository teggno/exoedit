"use strict";

export function clone<T>(source: T): T {
    return JSON.parse(JSON.stringify(source));
}

export function concatWithSlash(part1: string, part2: string) {
    if (!part1)return part2;
    if (!part2)return part1;

    part1 = part1.endsWith("/")
            ? (part1.length === 1 ? "" : part1.substr(0, part1.length - 1))
            : part1;
    part2 = part2.startsWith("/")
        ? part2.length === 1 ? "" : part2.substr(1, part2.length - 1)
        : part2;

    return part1 + "/" + part2;
}

/**
 * Returns a map with the original array elements as values and the value returned by iteratee
 * as keys (see lodash's keyBy doc).
 */
export function keyBy<T extends {}>(array: Array<T>, iteratee: (item: T) => string) {
    return < { [key: string]: T}>array.reduce((prev, current) => {
        prev[iteratee(current)] = current;
        return prev;
    }, {});
}
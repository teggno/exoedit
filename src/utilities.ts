"use strict";

import { readFile } from "fs";
import { sep } from "path";

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

export function readFilePromise(filename: string) {
    return new Promise<Buffer>((resolve, reject) => {
        readFile(filename, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

export function arePathsEqual(path1: string, path2: string) {
    if (path1 === path2) return true;

    path1 = path1 || "";
    path2 = path2 || "";
    path1 = path1.indexOf(sep) === 0 && path1.length > sep.length ? path1.substr(sep.length) : path1;
    path2 = path2.indexOf(sep) === 0 && path2.length > sep.length ? path2.substr(sep.length) : path2;

    path1 = path1.replace(/\\/g, '/');
    path2 = path2.replace(/\\/g, '/');

    return path1 === path2;
}
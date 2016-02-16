import * as assert from "assert";

import * as sut from "../src/luaBasicMin";

suite("Basic Lua Minifier tests", () => {

    test("Removes single line comments", () => {
        assert.equal(sut.minify("before single line comment --single line comment \nafter the single line comment"),
            "before single line comment \nafter the single line comment");
    });

    test("Removes multi line comments in single lines", () => {
        assert.equal(sut.minify("before multi line comment --[[single line comment]] after the single line comment\n another line"),
            "before multi line comment  after the single line comment\n another line");
    });

    test("Removes multiple whitespace at the beginning of a line in the middle", () => {
        assert.equal(sut.minify(
            "first line\n     second line after white space\nthird line"),
            "first line\nsecond line after white space\nthird line");
    });

    test("Removes multiple whitespace at the beginning of the first line", () => {
        assert.equal(sut.minify(
            "     first line after white space\nsecond line"),
            "first line after white space\nsecond line");
    });

    test("Removes single whitespace at the beginning of a line in the middle", () => {
        assert.equal(sut.minify(
            "first line\n second line after white space\nthird line"),
            "first line\nsecond line after white space\nthird line");
    });

    test("Keeps single line comments in string literals", () => {
        const code = "before the string literal \" in the string --literal \n\" after the string literal";
        assert.equal(sut.minify(code), code);
    });

    test("Keeps multi line comments in string literals", () => {
        const code = "before the string literal \" in the string literal --[[multiline\ncomment ]] after the comment \" after the string literal";
        assert.equal(sut.minify(code), code);
    });

    test("Keeps single line comments in multiline string literals", () => {
        const code = "before the string literal [[ in the string --literal \n on a new line]] after the string literal";
        assert.equal(sut.minify(code), code);
    });

    test("Keeps multiline comments in multiline string literals", () => {
        const code = "before the string literal [[ in the string --[[literal \n on a new line]] after the string literal";
        assert.equal(sut.minify(code), code);
    });
});
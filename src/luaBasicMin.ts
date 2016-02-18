export function minify(luaCode: string): string {
    if (!luaCode) return luaCode;

    // lua comments can be: 
    // --single line comment
    // --[[multiline 
    // comment]]

    // removing single line comments: search for "--" but not "--[[" anywhere except in a string or regex literal or within a comment and remove the -- and everything following it
    // removing multiline comments: search for "--[[" anywhere except in a string or regex literal or within a comment and remove the whole string until "]]" 

    // removing white space at the beginning of a line: search for whitespace preceeded by a new line or whitespace but not inside string literals

    let isInStringLiteral = false;
    let stringLiteralStart: string;
    let isInMultilineStringLiteral = false;
    let isInSingleLineComment = false;
    let isInMultiLineComment = false;
    let isInRemovableWhiteSpace = false;

    const stringEscapeChar = "\\";
    const singleQuote = "'";
    const doubleQuote = "\"";
    const hyphen = "-";
    const multilineStringStart = "[[";
    const multilineStringEnd = "]]";
    const singleLineCommentStart = "--";
    const multilineCommentStart = "--[[";
    const multilineCommentEnd = "]]";
    const newLine = "\n";

    const length = luaCode.length;
    let index: number = 0;
    let result = [];
    for (; index < length; index++) {
        let skipThisChar = false;
        if (isStringLiteralStart()) {
            isInStringLiteral = true;
            stringLiteralStart = luaCode[index];
        }
        else if (isStringLiteralEnd()) {
            isInStringLiteral = false;
            stringLiteralStart = null;
        }
        else if (isMultilineStringLiteralStart()) {
            isInMultilineStringLiteral = true;
        }
        else if (isStringLiteralEnd()) {
            isInMultilineStringLiteral = false;
        }
        else if (isSingleLineCommentStart()) {
            isInSingleLineComment = true;
        }
        else if (isSingleLineCommentEnd()) {
            isInSingleLineComment = false;
        }
        else if (isMultiLineCommentStart()) {
            isInMultiLineComment = true;
        }
        else if (isMultiLineCommentEnd()) {
            isInMultiLineComment = false;
            skipThisChar = true;
        }
        else if (isRemovableWhiteSpaceStart()) {
            isInRemovableWhiteSpace = true;
            if (isRemovableWhiteSpaceEnd()) {
                isInRemovableWhiteSpace = false;
                skipThisChar = true;
            }
        }
        else if (isRemovableWhiteSpaceEnd()) {
            isInRemovableWhiteSpace = false;
            skipThisChar = true;
        }
        if (!skipThisChar && !isInSingleLineComment && (!isInMultiLineComment || luaCode[index] === newLine) && !isInRemovableWhiteSpace) {
            result.push(luaCode[index]);
        }
    }

    return result.join("");

    function isStringLiteralStart() {
        let char = luaCode[index];
        return (char === singleQuote || char === doubleQuote)
            && !(isInStringLiteral || isInSingleLineComment || isInSingleLineComment);
    }
    function isStringLiteralEnd() {
        let prevChar = index === 0 ? null : luaCode[index - 1];
        return isInStringLiteral && luaCode[index] === stringLiteralStart && prevChar !== stringEscapeChar;
    }
    function isMultilineStringLiteralStart() {
        let twoCharsForward = length - index > 1 ? luaCode[index] + luaCode[index + 1] : null;
        return twoCharsForward === multilineStringStart && isInNormalCode();
    }
    function isMultilineStringLiteralEnd() {
        return isInMultilineStringLiteral && index !== 0 && luaCode[index - 1] + luaCode[index] === multilineStringEnd;
    }
    function isSingleLineCommentStart() {
        let fourCharsForward = length - index > 3 ? luaCode[index] + luaCode[index + 1]  + luaCode[index + 2]  + luaCode[index + 3] : null;
        let twoCharsForward = length - index > 1 ? luaCode[index] + luaCode[index + 1] : null;
        return twoCharsForward === singleLineCommentStart && fourCharsForward !== multilineCommentStart
            && isInNormalCode();
    }
    function isSingleLineCommentEnd() {
        return isInSingleLineComment && luaCode[index] === newLine;
    }
    function isMultiLineCommentStart() {
        let fourCharsForward = length - index > 3 ? luaCode[index] + luaCode[index + 1]  + luaCode[index + 2]  + luaCode[index + 3] : null;
        return fourCharsForward === multilineCommentStart
            && isInNormalCode();
    }
    function isMultiLineCommentEnd() {
        return isInMultiLineComment && index !== 0 && luaCode[index - 1] + luaCode[index] === multilineCommentEnd;
    }
    function isRemovableWhiteSpaceStart() {
        return (index === 0 || luaCode[index - 1] === newLine) && luaCode[index] === " " && isInNormalCode();
    }
    function isRemovableWhiteSpaceEnd() {
        return isInRemovableWhiteSpace && luaCode[index] === " " && (index + 1 === length || luaCode[index + 1] !== " ");
    }
    function isInNormalCode() {
        return !(isInStringLiteral || isInMultilineStringLiteral || isInSingleLineComment || isInSingleLineComment);
    }
}
"use strict";

import * as fs from "fs";
import * as path from "path";
import log from "../log";

export default function getFakeData(widgetPath: string) {
    const fakeFilePath = getFakeFilePath(widgetPath);
    return new Promise<FakeData>((resolve, reject) => {
        fs.access(fakeFilePath, err => {
            if (err) {
                return reject(`Could not find fake data file ${fakeFilePath}. Original error message: ${err.message}`);
            }
            fs.readFile(fakeFilePath, (err, data) => {
                if (err) {
                    return reject(err.message);
                }
                try {
                    const fakeFileContent = JSON.parse(data.toString());
                    if (!fakeFileContent.portal) {
                        throw `The JSON in the fake data file "${fakeFilePath}" does not contain a "portal" field.`;
                    }
                    if (!fakeFileContent.read) {
                        throw `The JSON in the fake data file "${fakeFilePath}" does not contain a "portal" field.`;
                    }
                    resolve(<FakeData>fakeFileContent);
                }
                catch (error) {
                    return reject(error);
                }

            });
        });
    });
}

interface FakeData {
    portal: {};
    read: {};
}

function getFakeFilePath(widgetPath: string) {
    const extLength = path.extname(widgetPath).length;
    return (extLength === 0
        ? widgetPath
        : widgetPath.substr(0, widgetPath.length - extLength)) + ".json";
}
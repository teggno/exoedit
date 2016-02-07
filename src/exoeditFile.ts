"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { MappingDto, Mapping } from "./mappings";

export function getExoeditFile(): Thenable<ExoeditFile> {
    return getExoeditFileDto().then(exoeditFileDto => new ExoeditFileImpl(exoeditFileDto));
}

export interface ExoeditFile {
    mapping: Mapping;
    domain: string;
    save: () => Thenable<void>;
}

class ExoeditFileImpl implements ExoeditFile {
    private _mapping: Mapping;
    private _domain: string;

    constructor(exoeditFileDto?: ExoeditFileDto) {
        if (!exoeditFileDto) exoeditFileDto = {};

        this._mapping = exoeditFileDto.mapping
            ? new Mapping(exoeditFileDto.mapping)
            : new Mapping();

        this._domain = exoeditFileDto.domain;
    }

    get mapping() {
        return this._mapping;
    }

    get domain() {
        return this._domain;
    }

    save() {
        return getExoeditFileDto().then(dto => {
            if (!this._mapping.isEmpty) {
                dto.mapping = this._mapping.Serialize();
            }

            if (this._domain) {
                dto.domain = this._domain;
            }

            const json = JSON.stringify(dto, null, 2);
            const filePath = getFilePath();

            return new Promise<void>((resolve, reject) => {
                const saveCallback = err => {
                    if (err) return reject("Could not save exoedit.json file");
                    console.log("Saved exoedit.json file");
                    resolve();
                };

                if (json && json !== "{}") {
                    fs.writeFile(filePath, json, saveCallback);
                }
                else {
                    // nothing to write, check if file exists to not create it unnecessarily
                    fs.access(filePath, fs.R_OK, err => {
                        if (err) return resolve();
                        fs.writeFile(filePath, "{}", saveCallback);
                    });
                }
            });
        });
    }
}


function getExoeditFileDto() {
    const filePath = getFilePath();
    return new Promise<ExoeditFileDto>((resolve, reject) => {
        fs.access(filePath, fs.R_OK, err => {
            if (err) return resolve({});

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(`Could not read file "${filePath}"`);
                }

                const content = data.toString();
                try {
                    const json = JSON.parse(content);
                    resolve(json);
                }
                catch (error) {
                    console.error(error);
                    reject("Error parsing exoedit.json file");
                }
            });
        });
    });
}

function getFilePath() {
    return path.join(vscode.workspace.rootPath, "exoedit.json");
}

interface ExoeditFileDto {
    domain?: string;
    mapping?: MappingDto;
}


import { readFilePromise } from "./utilities";
import * as exopublish from "exopublish";
import { workspace } from "vscode";
import { join } from "path";

export function getExopublish() {
    return getConfig().then(config => exopublish.configure(config));
}

function getConfig() {
    return readFilePromise(getPath())
        .then(data => <exopublish.Config>JSON.parse(data.toString()));
}

function getPath() {
    return join(workspace.rootPath, "exoedit.json");
}

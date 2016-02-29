"use strict";

import { IncomingMessage, ServerResponse } from "http";
import { access } from "fs";
import { join } from "path";
import { getChangeWatcherForMultipleLocations } from "../vscodeUtilities";
import { workspace } from "vscode";
import { getExoeditFile } from "../exoeditFile";

// provides an endpoint for automatic reload of index.html when the widget has been changed
export default function factory(widgetPath: string) {
    return (request: IncomingMessage, response: ServerResponse) => {
        const locationsToWatch = [ widgetPath ];
        getExoeditFile(workspace.rootPath).then(file => {
            access(file.customFilesDirectory, function(err) {
                if (!err) locationsToWatch.push(join(workspace.rootPath, file.customFilesDirectory, "*.*"));

                const watcher = getChangeWatcherForMultipleLocations(locationsToWatch);
                const disposable = watcher.onDidChange(uri => {
                    disposable.dispose();
                    watcher.dispose();
                    response.statusCode = 200;
                    response.end();
                    clearTimeout(timeout);
                });
                const timeout = setTimeout(() => {
                    disposable.dispose();
                    watcher.dispose();
                    response.statusCode = 204;
                    response.end();
                }, 10000);
            });
        });
    };
}


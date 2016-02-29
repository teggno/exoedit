"use strict";

import { IncomingMessage, ServerResponse } from "http";
import { access } from "fs";
import { join } from "path";
import { getChangeWatcherForMultipleLocations } from "../vscodeUtilities";

// provides an endpoint for automatic reload of index.html when the widget has been changed
export default function factory(widgetPath: string, customFilesPath: string) {
    return (request: IncomingMessage, response: ServerResponse) => {
        const locationsToWatch = [ widgetPath ];
        access(customFilesPath, function(err) {
            if (!err) locationsToWatch.push(join(customFilesPath, "*.*"));

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
    };
}


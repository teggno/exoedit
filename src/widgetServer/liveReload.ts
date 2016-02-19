import { IncomingMessage, ServerResponse } from "http";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";
import { workspace } from "vscode";

// provides an endpoint for automatic reload of index.html when the widget has been changed
export default function factory(widgetPath: string) {
    const watcher = workspace.createFileSystemWatcher(widgetPath, true, false, true);

    return (request: IncomingMessage, response: ServerResponse) => {
        const timeout = setTimeout(() => {
            disposable.dispose();
            response.statusCode = 204;
            response.end();
        }, 10000);

        const disposable = watcher.onDidChange(uri => {
            disposable.dispose();
            response.statusCode = 200;
            response.end();
            clearTimeout(timeout);
        });
    };
}


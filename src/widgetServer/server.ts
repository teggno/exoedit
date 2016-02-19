import * as http from "http";
import { window, ExtensionContext } from "vscode";
import { readFile } from "fs";
import read from "./read";
import portal from "./portal";
import liveReload from "./liveReload";

export function runWidget(path: string, context: ExtensionContext ) {
    const handlers = getHandlers(path, context);
    let stopped = false;
    const server = http.createServer((request, response) => {
        if (stopped) {
            response.statusCode = 200;
            response.end("ServerStopped");
            return;
        }
        const handler = handlers.find(hnd => request.url === hnd.url);
        if (!handler) {
            response.statusCode = 404;
            response.end("Not found");
            return;
        }

        handler.handle(request, response);
    });

    server.listen("8080");

    const channel = window.createOutputChannel("Exoedit Widget Server");
    channel.show();
    channel.appendLine("Exoedit Widget Server started listeing on port 8080. Open the url http://localhost:8080");

    return {
        stop: () => {
            stopped = true;
            server.close();
            channel.appendLine("Exoedit Widget Server stopped");
        }
    };
}

const divContainerId = "container";

const fetchScript = "<script src=\"fetch\"></script>";
const promiseScript = "<script src=\"promise\"></script>";

const liveReloadLongPollScript = "<script src=\"liveReloadLongPoll\"></script>";

const exositeFakeScript = "<script src=\"exositeFake\"></script>";

const mainScript = `
<script src="requirejs"></script>
<script>
    document.addEventListener("DOMContentLoaded", function(event) { 
        require(['widget'], function(widget) {
            fetch('portal').then(function(response){
                response.json().then(function(portal){
                    widget(document.getElementById('${divContainerId}'), portal);
                });
            });
        });
    });
</script>`;

const indexHtml =
    `<!DOCTYPE html>
<html>
<head>${fetchScript}${promiseScript}${mainScript}${liveReloadLongPollScript}</head>
<body><div id="${divContainerId}"></div>
</body>
</html>`;

function getHandlers(widgetPath: string, context: ExtensionContext) {
    return [
        { url: "/", handle: (request: http.IncomingMessage, response: http.ServerResponse) => {
            response.setHeader("content-type", "text/html");
            response.end(indexHtml);
        }},
        { url: "/requirejs", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("node_modules/requirejs/require.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/fetch", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("node_modules/whatwg-fetch/fetch.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/promise", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("node_modules/es6-promise/dist/es6-promise.min.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/exositeFake.js", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("widgetDebugging/out/exositeFake.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/liveReloadLongPoll", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("widgetDebugging/out/liveReloadLongPoll.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/widget.js", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(widgetPath, (err, widgetScript) => {
            response.setHeader("content-type", "text/javascript");
            const newScript = `define('widget', ['require', 'exports', 'exositeFake'], function(require, exports, exositeFake){var read = exositeFake.read; return ${widgetScript.toString()};});`;
            response.end(newScript);
        })},
        { url: "/read", handle: read },
        { url: "/portal", handle: portal(widgetPath) },
        { url: "/liveReload", handle: liveReload(widgetPath) }
    ];
}
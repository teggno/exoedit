import * as http from "http";
import { window, ExtensionContext } from "vscode";
import { readFile } from "fs";
import rpcRead from "./rpcRead";

export function runWidget(path: string, context: ExtensionContext ) {
    const handlers = getHandlers(path, context);
    const server = http.createServer((request, response) => {
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
            server.close();
            channel.appendLine("Exoedit Widget Server stopped");
        }
    };
}

const divContainerId = "container";

const fetchScript = "<script src=\"fetch\"></script>";
const mainScript = "<script>var exports = { portal: {}};</script>";

const indexHtml =
    `<!DOCTYPE html><html><head>${fetchScript}${mainScript}<script src="exositeFake"></script><script src="widget"></script></head><body><div id="${divContainerId}"></div></body></html>`;

function getHandlers(widgetPath: string, context: ExtensionContext) {
    return [
        { url: "/", handle: (request: http.IncomingMessage, response: http.ServerResponse) => {
            response.setHeader("content-type", "text/html");
            response.end(indexHtml);
        }},
        { url: "/fetch", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("node_modukes/whatwg-fetch/fetch.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/exositeFake", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(context.asAbsolutePath("out/widgetDebugging/exositeFake.js"), (err, data) => {
            response.setHeader("content-type", "text/javascript");
            response.end(data);
        })},
        { url: "/widget", handle: (request: http.IncomingMessage, response: http.ServerResponse) => readFile(widgetPath, (err, data) => {
            response.setHeader("content-type", "text/javascript");
            const newScript =
                `document.addEventListener("DOMContentLoaded", function(event) { var read = exports.read; (${data.toString()})(document.getElementById("${divContainerId}"), exports.portal)});`;
            response.end(newScript);
        })},
        { url: "/read", handle: rpcRead }
    ];
}
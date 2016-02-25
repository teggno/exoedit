"use strict";

import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { window, ExtensionContext } from "vscode";
import { readFile } from "fs";
import log from "../log";
import read from "./read";
import portal from "./portal";
import liveReload from "./liveReload";

export function runWidget(path: string, context: ExtensionContext ) {
    const handlers = getHandlers(path, context);
    const server = createServer((request, response) => {
        const handler = handlers.find(hnd => request.url === hnd.url);
        if (!handler) {
            response.statusCode = 404;
            response.end("Not found");
            return;
        }

        handler.handle(request, response);
    });
    const stopper = getStopper(server);
    server.listen("8080");

    log("Exoedit Widget Server started listeing on port 8080. Open the url http://localhost:8080");

    return {
        stop: () => {
            server.close();
            stopper();
            log("Exoedit Widget Server stopped");
        }
    };
}

function getHandlers(widgetPath: string, context: ExtensionContext) {
    return [
        { url: "/", handle: serveStaticFile("widgetClient/index.html", "text/html") },
        { url: "/require.js", handle: serveScript("node_modules/requirejs/require.js") },
        { url: "/fetch.js", handle: serveScript("node_modules/whatwg-fetch/fetch.js") },
        { url: "/promise.js", handle: serveScript("node_modules/es6-promise/dist/es6-promise.min.js") },
        { url: "/exositeFake.js", handle: serveScript("widgetClient/out/exositeFake.js") },
        { url: "/liveReload.js", handle: serveScript("widgetClient/out/liveReload.js") },
        { url: "/widget.js", handle: (request: IncomingMessage, response: ServerResponse) => readFile(widgetPath, (err, widgetScript) => {
            response.setHeader("content-type", "text/javascript");
            const newScript = `define('widget', ['require', 'exports', 'exositeFake'], function(require, exports, exositeFake){var read = exositeFake.read; var exoedit_widget_fn = ${widgetScript.toString()};return exoedit_widget_fn;});`;
            response.end(newScript);
        })},
        { url: "/read", handle: read(widgetPath, context) },
        { url: "/portal", handle: portal(widgetPath, context) },
        { url: "/liveReload", handle: liveReload(widgetPath) }
    ];

    function serveScript(workspaceRelativePath: string) {
        return serveStaticFile(workspaceRelativePath, "text/javascript");
    }

    function serveStaticFile(workspaceRelativePath: string, contentType: string) {
        return (request: IncomingMessage, response: ServerResponse) => {
            readFile(context.asAbsolutePath(workspaceRelativePath), (err, file) => {
                response.setHeader("content-type", contentType);
                response.end(file);
            });
        };
    }
}

// When calling server.close(), node only prevents new connections. Therefore
// we must keep track of the sockets in order to be able to destroy them to have
// the server really stop immediately.
function getStopper(server: Server) {
    // taken from http://stackoverflow.com/questions/14626636/how-do-i-shutdown-a-node-js-https-server-immediately
    const sockets = {};
    let nextSocketId = 0;
    server.on("connection", function (socket) {
        const socketId = nextSocketId++;
        sockets[socketId] = socket;

        socket.on("close", function () {
            delete sockets[socketId];
        });
    });

    return () => {
        for (let socketId in sockets) {
            console.log("socket", socketId, "destroyed");
            sockets[socketId].destroy();
        }
    };
}
"use strict";

import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { window, ExtensionContext, workspace } from "vscode";
import { readFile, access } from "fs";
import { join } from "path";
import { parse } from "url";
import log from "../log";
import read from "./read";
import portal from "./portal";
import liveReload from "./liveReload";
import { getExoeditFile } from "../exoeditFile";
import proxy from "./proxy";

const mime = require("mime");

export function runWidget(path: string, context: ExtensionContext) {
    const handlers = getHandlers(path, context);
    const server = createServer((request, response) => {
        const handler = handlers.find(hnd => (typeof hnd.url === "string" && request.url === hnd.url) ||
            (typeof hnd.url !== "string" && (<RegExp>hnd.url).test(request.url)));
        let handle: (request: IncomingMessage, response: ServerResponse) => void;
        if (handler) {
            handle = handler.handle;
        }
        else {
            handle = handleUnknownRequest(context);
        }

        handle(request, response);
    });
    const stopper = getStopper(server);
    server.listen("8080");

    log("Exoedit Widget Server started listening on port 8080. Open the url http://localhost:8080", true);

    return {
        stop: () => {
            server.close();
            stopper();
            log("Exoedit Widget Server stopped");
        }
    };
}

function getHandlers(absoluteWidgetPath: string, context: ExtensionContext) {
    return [
        { url: new RegExp("^\/(\\?(.*)*)?$"), handle: serveStaticFileRelative("widgetClient/index.html", "text/html") },
        { url: "/jquery.js", handle: serveScript("vendor/jquery-1.5.1.js") },
        { url: "/require.js", handle: serveScript("node_modules/requirejs/require.js") },
        { url: "/fetch.js", handle: serveScript("node_modules/whatwg-fetch/fetch.js") },
        { url: "/promise.js", handle: serveScript("node_modules/es6-promise/dist/es6-promise.min.js") },
        { url: "/exositeFake.js", handle: serveScript("widgetClient/out/exositeFake.js") },
        { url: "/liveReload.js", handle: serveScript("widgetClient/out/liveReload.js") },
        { url: "/widget.js", handle: (request: IncomingMessage, response: ServerResponse) => readFile(absoluteWidgetPath, (err, widgetScript) => {
            response.setHeader("content-type", "text/javascript");
            const newScript = `define('widget', ['require', 'exports', 'exositeFake'], function(require, exports, exositeFake){var read = exositeFake.read; var write = exositeFake.write; var exoedit_widget_fn = ${widgetScript.toString()};return exoedit_widget_fn;});`;
            response.end(newScript);
        })},
        { url: "/read", handle: read(absoluteWidgetPath, context) },
        { url: "/portal", handle: portal(absoluteWidgetPath, context) },
        { url: "/liveReload", handle: liveReload(absoluteWidgetPath) }
    ];

    function serveScript(workspaceRelativePath: string) {
        return serveStaticFileRelative(workspaceRelativePath, "text/javascript");
    }

    function serveStaticFileRelative(workspaceRelativePath: string, contentType: string) {
        return serveStaticFile(context.asAbsolutePath(workspaceRelativePath), contentType);
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


function serveStaticFile(absolutePath: string, contentType: string) {
    return (request: IncomingMessage, response: ServerResponse) => {
        readFile(absolutePath, (err, file) => {
            response.setHeader("content-type", contentType);
            response.end(file);
        });
    };
}

function handleUnknownRequest(context: ExtensionContext) {
    return (request: IncomingMessage, response: ServerResponse) => {
        getExoeditFile(workspace.rootPath).then(file => {
            const pathName = parse(request.url).pathname;
            const filePath = join(workspace.rootPath, file.customFilesDirectory, pathName);
            if (access(filePath, err => {
                if (err) {
                    if (pathName.toLowerCase().indexOf("/api/portals/v1") === -1) {
                        response.statusCode = 404;
                        response.end("Not found");
                        return;
                    }
                    log(`forwarding unknown url to Exosite ${request.url}`);
                    return proxy(context).forwardToExositeApi(request, response);
                }

                const contentType = mime.lookup(filePath);
                return serveStaticFile(filePath, contentType)(request, response);
            }));
        });
    };
}

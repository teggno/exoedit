import { IncomingMessage, ServerResponse } from "http";
import * as fs from "fs";
import * as path from "path";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";
import { getExoeditFile } from "../exoeditFile";
import { workspace, ExtensionContext } from "vscode";
import Exosite from  "../exosite";
import * as api from  "../exosite";
import log from "./log";
import { getDomain } from "../prompts";

export default function factory(widgetPath: string, context: ExtensionContext) {
    return (request: IncomingMessage, response: ServerResponse) => {
        getExoeditFile(workspace.rootPath).then(file => {
            file.mappings.getWidgetPortalArg(
                workspace.asRelativePath(widgetPath),
                live(context, response),
                fake(widgetPath, response));
        });
    };
}

function live (context: ExtensionContext, response: ServerResponse) {
    return (dashboardId: string, widgetTitle: string) => {
        log("Getting live data for the widget's \"portal\" parameter");
        getDomain(context)
            .then(domain => domain.getPortalWidget(dashboardId, widgetTitle))
            .then(widget => widget.getPortalArgument())
            .then(portalArgument => {
                jsonResponse(response, portalArgument);
            });
    };
};

function fake (widgetPath: string, response: ServerResponse) {
    return () => {
        log("Getting fake data for the widget's \"portal\" parameter");
        const extLength = path.extname(widgetPath).length;
        const fakeFilePath = (extLength === 0
            ? widgetPath
            : widgetPath.substr(0, widgetPath.length - extLength)) + ".json";
        fs.access(fakeFilePath, err => {
            if (err) {
                const message = `Could not find fake data file ${fakeFilePath}`;
                log(message);
                log(err.message);
                response.statusCode = 404;
                response.end(message);
                return;
            }
            fs.readFile(fakeFilePath, (err, data) => {
                if (err) {
                    log(err.message);
                    response.statusCode = 500;
                    response.end(500);
                    return;
                }
                response.statusCode = 200;
                response.setHeader("content-type", "application/json");
                response.end(data.toString());
            });
        });
    };
}

interface ReadBody {
    targetResource: string[];
    options: {};
}

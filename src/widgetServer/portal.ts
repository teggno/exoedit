"use strict";

import { IncomingMessage, ServerResponse } from "http";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";
import { getExoeditFile } from "../exoeditFile";
import { workspace, ExtensionContext } from "vscode";
import Exosite from  "../exosite";
import * as api from  "../exosite";
import log from "./log";
import { getDomain } from "../prompts";
import { PortalWidgetScript } from "../domainModel/dashboards";
import getFakeData from "./fakeData";

export default function factory(widgetPath: string, context: ExtensionContext) {
    const cache: Cache = {};
    return (request: IncomingMessage, response: ServerResponse) => {
        getExoeditFile(workspace.rootPath).then(file => {
            file.mappings.getWidgetData(
                workspace.asRelativePath(widgetPath),
                live(response, context, cache),
                fake(response, widgetPath));
        });
    };
}

function live (response: ServerResponse, context: ExtensionContext, cache: Cache) {
    return (dashboardId: string, widgetTitle: string) => {
        log("Getting live data for the widget's \"portal\" parameter");
        const widgetPromise = cache.portalWidget
            ? Promise.resolve()
            : getDomain(context)
                .then(domain => domain.getPortalWidget(dashboardId, widgetTitle))
                .then(widget => {
                    cache.portalWidget = widget;
                });

        widgetPromise.then(() => cache.portalWidget.getPortalArgument())
            .then(portalArgument => {
                jsonResponse(response, portalArgument);
            });
    };
};

function fake (response: ServerResponse, widgetPath: string) {
    return () => {
        log("Getting fake data for the widget's \"portal\" parameter");
        getFakeData(widgetPath)
        .then(fakeData =>
            jsonResponse(response, fakeData.portal)
        )
        .catch(error => {
            log(error);
            response.statusCode = 404;
            response.end(error);
        });
    };
}

interface ReadBody {
    targetResource: string[];
    options: {};
}

interface Cache {
    portalWidget?: PortalWidgetScript;
}
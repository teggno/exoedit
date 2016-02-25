"use strict";

import { IncomingMessage, ServerResponse } from "http";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";
import settingsFactory from "../settings";
import { getExoeditFile } from "../exoeditFile";
import { workspace, ExtensionContext } from "vscode";
import getFakeData from "./fakeData";
import log from "../log";
import Exosite from "../exosite";
import rpcCallPromise from "../exositeRpc";

export default function factory(widgetPath: string, context: ExtensionContext) {
    const cache = {
        portalCik: ""
    };
    return (request: IncomingMessage, response: ServerResponse) => {
        if (!ensurePost(request, response)) return;

        readToEnd(request).then(content => {
            const readArgs = <ReadArgs>JSON.parse(content);
            if (!readArgs.targetResource || readArgs.targetResource.length !== 2) {
                response.statusCode = 400;
                response.end("posted json data must contain a targetResource field which needs to be an array containing 2 strings");
                return;
            }
            if (!readArgs.options) {
                response.statusCode = 400;
                response.end("posted json data must contain an options which needs to be an object");
                return;
            }

            log("Widget called read() function with arguments: targetResource = " + JSON.stringify(readArgs.targetResource) + ", options = " + JSON.stringify(readArgs.options));
            getExoeditFile(workspace.rootPath).then(file => {
                file.mappings.getWidgetData(
                    workspace.asRelativePath(widgetPath),
                    live(response, readArgs, file.domain, context, cache),
                    fake(response, readArgs, widgetPath));
            });
        });
    };
}

function live(response: ServerResponse, readArgs: ReadArgs, domain: string, context: ExtensionContext, cache: Cache) {
    return (dashboardId: string, widgetTitle: string) => {
        log("Getting live data as a result for the widget's call to read()");
        const account = settingsFactory(context).getCredentials();
        const exosite = new Exosite(domain, account.userName, account.password);
        const getPortalCik = cache.portalCik
            ? Promise.resolve()
            : exosite.getDashboard(dashboardId)
                .then(dashboard =>
                    exosite.getPortal(dashboard.portalId)
                )
                .then(portal => {
                    cache.portalCik = portal.info.key;
                });

        getPortalCik.then(() =>
            lookupDeviceRid(cache.portalCik, readArgs.targetResource[0])
        )
        .then(deviceRid =>
            getTimeSeriesData(cache.portalCik, deviceRid, readArgs.targetResource[1], readArgs.options)
        )
        .then(timeSeriesData =>
            jsonResponse(response, timeSeriesData)
        )
        .catch(error => {
            log(error);
            response.statusCode = 500;
            response.end(error);
        });
    };
}

function fake(response: ServerResponse, readArgs: ReadArgs, widgetPath: string) {
    return () => {
        log("Getting fake data as a result for the widget's call to read()");
        getFakeData(widgetPath)
        .then(fakeData => {
            const deviceAlias = readArgs.targetResource[0];
            const dataSourceAlias = readArgs.targetResource[1];
            const deviceData = fakeData.read[deviceAlias];
            if (!deviceData || !deviceData[dataSourceAlias]) {
                // return an error to be consistent with the live() function (above) 
                // which also returns an error if any of the aliases is invalid
                response.statusCode = 404;
                const message = `The fake data file for widget "${widgetPath}" does not contain any data for device alias "${deviceAlias}" and data source alias "${dataSourceAlias}".`;
                const expectedJson = {};
                expectedJson[deviceAlias] = {};
                expectedJson[deviceAlias][dataSourceAlias] = [[12345, "abcd"], [12346, "efgh"]];
                response.end(`${message} Example expected JSON ${JSON.stringify({ portal: {}, read: expectedJson })}` );
                return;
            }

            const dataSourceData = <[[number, string|number|boolean]]>deviceData[dataSourceAlias];
            const options = readArgs.options;
            const limit = options === null ? undefined : options.limit;
            const desc = options.sort === "desc";
            const result = dataSourceData
            .filter(item =>
                (!options.starttime || (item[0] >= options.starttime))
                    && (!options.endtime || (item[0] <= options.endtime))
            ).sort((a, b) => desc ? b[0] - a[0] : a[0] - b[0])
            .slice(0, limit);

            jsonResponse(response, result);
        })
        .catch(error => {
            log(error);
            response.statusCode = 500;
            response.end(error);
        });
    };
}

function lookupDeviceRid(portalCik: string, deviceAlias: string) {
    return rpcCallPromise<string>(
        portalCik,
        "lookup",
        [ {alias: deviceAlias}, "alias", "" ]
    );
}

function getTimeSeriesData(portalCik: string, deviceRid: string, dataSourceAlias: string, options: Options) {
    return rpcCallPromise<[number, string|number|boolean][]>(
        { cik: portalCik, client_id: deviceRid },
        "read",
        [
            { alias: dataSourceAlias },
            options
        ]
    );
}

interface Cache {
    portalCik?: string;
}

interface ReadArgs {
    targetResource: [ string, string ];
    options: Options;
}

interface Options {
    starttime?: number;
    endtime?: number;
    limit?: number;
    sort: string;
};
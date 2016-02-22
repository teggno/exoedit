"use strict";

const rpc = require("onep/rpc");

export function getWidgetPortalArg(portalCik: string, dataSourceRids: string[], widgetLimit: WidgetDataLimit) {
    return tree(portalCik, dataSourceRids)
    .then(prepare)
    .then(prepared => addDataSourceData(portalCik, prepared, widgetLimit));
}

function tree(portalCik: string, dataSourceRids: string[]) {
    return new Promise((resolve, reject) => {
        rpc.tree(
            portalCik,
            {
                depth: 2,
                types: [ "dataport", "client" ],
                info: (rid, type, depth): InfoOptions => {
                    if (type === "client") return { description: true, aliases: true };
                    if (type === "dataport") {
                        return dataSourceRids.indexOf(rid) === -1 && depth === 2
                            ? null
                            : { description: true }; // gets configured data sources of widget and all data sources of portal
                    }
                }
            },
            function (err, tree) {
                if (err) {
                    return reject(err);
                }
                resolve(tree);
            }
        );
    });
}

function prepare(tree) {
    let aliasesOfPortal;
    const result = {
        dataports: [],
        clients: []
    };
    rpc.walk(tree, function(resource, depth, parentRid) {
        if (depth === 0 /*portal*/) {
            aliasesOfPortal = resource.info.aliases;
        }
        else if (depth === 1 && resource.type === "client" /*device*/) {
            let dataPorts = resource.children.map(function (child) {
                if (child.type !== "dataport" || !child.info) return;

                const dataPort = createDataport(child, getAlias(resource.info.aliases, child.rid));
                return dataPort;
            });
            dataPorts = dataPorts.filter(function (dataPort) { return !!dataPort; });
            if (dataPorts.length !== 0) {
                const device = createDevice(resource, getAlias(aliasesOfPortal, resource.rid), dataPorts);
                result.clients.push(device);
            }
        }
        else if (depth === 1 && resource.type === "dataport" /*dataport beloning to a portal*/) {
            const dataPort = createDataport(resource, getAlias(aliasesOfPortal, resource.rid));
            result.dataports.push(dataPort);
        }
    });
    result.clients = result.clients.filter(function(client) {
        return client.dataports.length !== 0;
    });
    return result;
}

function addDataSourceData(portalCik: string, result, widgetLimit: WidgetDataLimit) {
        const allDataPorts = result.dataports.concat(result.clients.reduce(function(prev, current) {
            return prev.concat(current.dataports);
        }, []));
        const allDataPortRids = allDataPorts.map(function(dataPort) {
            return dataPort.rid;
        });
        return getDataPortData(portalCik, allDataPortRids, widgetLimit)
            .then(dataByRid => {
                allDataPorts.forEach(function(dataPort) {
                    const data = dataByRid[dataPort.rid];
                    if (data) {
                        dataPort.data = data;
                    }
                    delete dataPort.rid;
                });
                return result;
            });
}

function getAlias(aliases, rid) {
    const item = aliases[rid];
    return item && item.length !== 0 ? item[0] : null;
}

function createDevice(source, alias, dataPorts) {
    const description = source.info.description;
    delete description.limits;
    return {
        alias: alias,
        info: {
            description: description
        },
        dataports: dataPorts
    };
}

function createDataport(source, alias) {
    return {
        alias: alias,
        info: source.info,
        rid: source.rid
    };
}

function getDataPortData(portalCik: string, dataPortRids: string[], widgetLimit: WidgetDataLimit) {
    return new Promise((resolve, reject) => {
        const options = getRpcReadOptions(widgetLimit);
        rpc.callMulti(
            portalCik,
            dataPortRids.map(function(rid){
                return { procedure: "read", arguments: [rid, options] };
            }),
            function(err, response) {
                if (err) {
                    return reject(err);
                }
                resolve(response.reduce(function(prev, current) {
                    if (current.status === "ok") {
                        prev[dataPortRids[current.id]] = current.result;
                        return prev;
                    }
                }, {}));
            }
        );
    });
}

export interface WidgetDataLimit {
    /**
     * count|duration
     */
    type: string;
    /**
     * minute|hour|day|week
     */
    unit: string;
    value: number;
}

interface InfoOptions {
    description?: boolean;
    aliases?: boolean;
    subscribers?: boolean;
}

function getRpcReadOptions(limit: WidgetDataLimit): RpcReadOptions {
    if (limit.type === "count") {
        return { limit: limit.value };
    }
    else {
        return {
            starttime: Math.round(new Date().getTime() / 1000) - getSecondsByUnit(limit.unit) * limit.value,
            limit: 100000000000
        };
    }
}

interface RpcReadOptions {
    limit?: number;
    starttime?: number;
}

function getSecondsByUnit(unit: string) {
    switch (unit) {
        case "minute":
        return 60;
        case "hour":
        return 60 * 60;
        case "day":
        return 60 * 60 * 24;
        case "week":
        return 60 * 60 * 24 * 7;
    }
    throw new Error(`Unexpected unit "${unit}"`);
}

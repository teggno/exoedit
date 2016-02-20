import  Exosite, * as api from "../exosite";
import { ScriptSource, Mapper } from "./mapper";
import { keyBy } from  "../utilities";
import { getWidgetPortalArg, WidgetDataLimit } from "../widgetPortalArg";

export interface Dashboard {
    portalWidgets: PortalWidgetScript[];
    name: string;
    id: string;
    portalId: string;
}

interface WidgetConfig {
    title: string;
    script: string;
    dashboard: {
        id: string;
        portalId: string;
    };
    dataSourceRids: string[];
    limit: WidgetDataLimit;
}

export class PortalWidgetScript implements ScriptSource {
    constructor(private originDomain: string, private exosite: Exosite, private config: WidgetConfig) {
    }

    public getTitle() {
        return this.config.title;
    }

    public getScript() {
        return Promise.resolve(this.config.script);
    }

    public get domain() {
        return this.originDomain;
    }

    public setMapping(path: string, target: Mapper) {
        target.setPortalWidgetScriptMapping(path, this.config.dashboard.id, this.config.title);
    }

    public upload(newScript: string) {
        const uploader = PortalWidgetScript.getUploader(this.config.dashboard.id, this.config.title);
        return uploader(this.exosite, newScript);
    }

    /**
     * Gets the object that can be used as the argument "porta" for the client side widget function.
     */
    public getPortalArgument() {
        return this.exosite.getPortal(this.config.dashboard.portalId)
            .then(portal => {
                return getWidgetPortalArg(portal.info.key, this.config.dataSourceRids, this.config.limit);
            });
    }

    public getDataSources() {
        const getDataSources = this.exosite.getDataSources(this.config.dataSourceRids);
        const getDevices = this.exosite.getDevices(this.config.dashboard.portalId);
        return Promise.all(<any>[getDataSources, getDevices]).then(results => {
            const combined = combine(<api.DataSource[]>results[0], <api.Device[]>results[1]);
            const result: Device[] = [];
            for (let rid in combined) {
                result.push(combined[rid]);
            }
            return result;
        });

        function combine(dataSources: api.DataSource[], devices: api.Device[]) {
            const devicesByDataSourceRid = byDataSourceRid(devices);
            return dataSources.reduce((prev, current) => {
                const device = devicesByDataSourceRid[current.rid];
                const existing = prev[device.rid];
                const dataSource = createDataSource(current);
                if (existing) {
                    existing. dataSources.push(dataSource);
                }
                else {
                    let newDevice = createDevice(device);
                    newDevice.dataSources.push(dataSource);
                    prev[device.rid] = newDevice;
                }
                return prev;
            }, <{ [deviceRid: string]: Device }>{});
        }

        function createDevice(source: api.Device): Device {
            return {
                rid: source.rid,
                alias: "",
                name: source.info.description.name,
                meta: source.info.description.meta,
                public: source.info.description.public,
                dataSources: [],
            };
        }

        interface Device {
            rid: string;
            alias: string;
            name: string;
            meta: string;
            public: boolean;
            dataSources: DataSource[];
        }

        function createDataSource(source: api.DataSource): DataSource {
            return {
                rid: source.rid,
                alias: "",
                format: source.info.description.format,
                meta: source.info.description.meta,
                name: source.info.description.name,
                preprocess: source.info.description.preprocess,
                public: source.info.description.public,
                retention: source.info.description.retention,
                subscribe: source.info.description.subscribe,
                data: source.data
            };
        }

        interface DataSource {
            rid: string;
            alias: string;
            format: string;
            meta: string;
            name: string;
            preprocess: any[];
            public: boolean;
            retention: {
                count: string;
                duration: string;
            };
            subscribe: string;
            data: [
                [number, string]
            ];
        }

        function byDataSourceRid(devices: api.Device[]) {
            return devices.reduce((prev, current) => {
                current.dataSources.forEach(dataSourceRid => prev[dataSourceRid] = current);
                return prev;
            }, <{[dataSourceRid: string]: api.Device}>{});
        }
    }

    private static findWidgetIndexByTitle(dashboard: api.ExositeDashboard, title: string) {
        const widgets = dashboard.config.widgets;
        for (let id in widgets) {
            const widget = widgets[id];
            if (widget.title === title && !widget.WidgetScriptID) {
                return id;
            }
        }
        return -1;
    }

    public static getUploader(dashboardId: string, widgetTitle: string) {
        return (exosite: Exosite, newScript: string) => {
            return exosite.getDashboard(dashboardId)
                .then(dashboard => {
                    return new Promise<void>((resolve, reject) => {
                        const index = this.findWidgetIndexByTitle(dashboard,  widgetTitle);
                        if (index === -1) return reject(`Widget with Name "${widgetTitle}" not found in dashboard "${dashboard.name}"`);

                        dashboard.config.widgets[index].script = newScript;
                        exosite.updateDashboard(dashboard.id, { config: dashboard.config }).then(() => {
                            resolve();
                        });
                    });
            });
        };
    }
}
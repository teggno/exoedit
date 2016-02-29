"use strict";

import  Exosite, * as api from "../exosite";
import { ScriptSource, Mapper } from "./mapper";
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
     * Gets the object that can be used as the argument "portal" for the client side widget function.
     */
    public getPortalArgument() {
        return this.exosite.getPortal(this.config.dashboard.portalId)
            .then(portal => {
                return getWidgetPortalArg(portal.info.key, this.config.dataSourceRids, this.config.limit);
            });
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
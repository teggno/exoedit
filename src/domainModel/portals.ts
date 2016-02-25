"use strict";

import Exosite, { ExositeDashboard, DashboardWidget } from "../exosite";
import { PortalWidgetScript, Dashboard } from "./dashboards";
import { ScriptSource, Mapper } from "./mapper";

export class Domain {
    constructor(public name: string, private exosite: Exosite) {
    }

    getDomainWidgetScripts() {
        return this.exosite.getDomainWidgetScripts()
        .then(scripts => scripts.map(script => new DomainWidgetScript(this.name, script.name, script.id, this.exosite)));
    }

    getPortals() {
        return this.exosite.getExositeAccount()
        .then(exositeAccount => this.exosite.getPortals(exositeAccount.id))
        .then(portals => portals.map(portal => new Portal(this.name, portal.PortalID, portal.PortalName, this.exosite)));
    }

    getPortalWidget(dashboardId: string, widgetTitle: string) {
        return this.exosite.getDashboard(dashboardId).then(dashboard => {
            for (let id in dashboard.config.widgets) {
                const widget = dashboard.config.widgets[id];
                if (widget.title === widgetTitle) {
                    return new PortalWidgetScript(this.name, this.exosite, getPortalWidgetConfig(widget, dashboard));
                }
            }
        });
    }

    getPortalCik(portalId: string) {
        return this.exosite.getPortal(portalId).then(portal => portal.info.key);
    }
}

function getPortalWidgetConfig(widget: DashboardWidget, dashboard: ExositeDashboard) {
    return {
        title: widget.title,
        script: widget.script,
        dataSourceRids: widget.rids,
        dashboard: {
            id: dashboard.id,
            portalId: dashboard.portalId
        },
        limit: widget.limit
    };
}

export class Portal {
    constructor(private domain: string, private portalId: string, public name: string, private exosite: Exosite) {
    }

    getDashboardsContainingPortalWidget(): Thenable<Dashboard[]> {
        return this.exosite.getDashboards(this.portalId)
            .then(dashboards => {
                const result = dashboards.map(db => {
                const sourceWidgets = db.config.widgets;
                const portalWidgets: PortalWidgetScript[] = [];
                for (let id in sourceWidgets) {
                    const widget = db.config.widgets[id];
                    if (!widget.WidgetScriptID) {
                        portalWidgets.push(new PortalWidgetScript(this.domain, this.exosite, getPortalWidgetConfig(widget, db)));
                    }
                }
                if (portalWidgets.length !== 0) {
                    return {
                        portalWidgets: portalWidgets,
                        name: db.name,
                        id: db.id,
                        portalId: db.portalId
                    };
                }
            }).filter(i => !!i);
            return result;
        });
    }

    getDevices(): Thenable<Device[]> {
        return this.exosite.getDevices(this.portalId)
        .then(devices => devices.map(device => new Device(this.domain, this.portalId, device.info.description.name, device.rid, this.exosite)));
    }
}

export class Device {
    constructor(private domain: string, private portalId: string, public name: string, private rid: string, private exosite: Exosite) {}

    getLuaScripts() {
        return this.exosite.getDeviceLuaScripts(this.rid)
        .then(scripts =>
            scripts.map(script =>
                new LuaScript(this.domain, script.info.description.name, script.rid, this.portalId, script.info.description.rule.script, this.exosite)));
    }
}


export class DomainWidgetScript implements ScriptSource {
    constructor(private originDomain: string, private title: string, private id: string, private exosite: Exosite) {
    }

    public getTitle() {
        return this.title;
    }

    public getScript() {
        return this.exosite.getDomainWidgetScript(this.id).then(so => so.code);
    }

    public get domain() {
        return this.originDomain;
    }

    public setMapping(path: string, target: Mapper) {
        target.setDomainWidgetScriptMapping(path, this.id);
    }

    public upload(newScript: string) {
        const uploader = DomainWidgetScript.getUploader(this.id);
        return uploader(this.exosite, newScript);
    }

    public static getUploader(id: string) {
        return (exosite: Exosite, newScript: string) => {
            return exosite.getDomainWidgetScript(id)
            .then(so => {
                so.code = newScript;
                return exosite.updateDomainWidgetScript(id, so).then(() => { return; });
            });
        };
    }
}

export class LuaScript implements ScriptSource {
    constructor(private originDomain: string, private name: string, private rid: string, private portalId: string, private script: string, private exosite: Exosite) {
    }

    public getTitle() {
        return this.name;
    }

    public getScript() {
        return Promise.resolve(this.script);
    }

    public get domain() {
        return this.originDomain;
    }

    public setMapping(path: string, mappings: Mapper) {
        mappings.setLuaDeviceScriptMapping(path, this.portalId, this.rid);
    }

    public upload(newScript: string) {
        const uploader = LuaScript.getUploader(this.rid);
        return uploader(this.exosite, newScript);
    }

    public static getUploader(rid: string) {
        return (exosite: Exosite, newScript: string) => {
            return exosite.updateLuaScript(rid, newScript).then(() => { return; });
        };
    }
}
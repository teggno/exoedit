"use strict";

import * as api from "./exosite";
import Exosite from "./exosite";
import * as utilities from "./utilities";
import { DomainWidgetScript, PortalWidgetScript, LuaScript } from "./scriptSources";

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
                    if (widget.WidgetScriptID === null) {
                        portalWidgets.push(new PortalWidgetScript(this.domain, widget.title, widget.script, db.id, this.exosite));
                    }
                }
                if (portalWidgets.length !== 0) {
                    return {
                        portalWidgets: portalWidgets,
                        name: db.name,
                        id: db.id
                    };
                }
            }).filter(i => !!i);
            return result;
        });
    }

    getDevices(): Thenable<Device[]> {
        return this.exosite.getDevices(this.portalId)
        .then(devices => devices.map(device => new Device(this.domain, device.info.description.name, device.rid, this.exosite)));
    }
}

export interface Dashboard {
    portalWidgets: PortalWidgetScript[];
    name: string;
    id: string;
}

export class Device {
    constructor(private domain: string, public name: string, private rid: string, private exosite: Exosite) {}

    getLuaScripts() {
        return this.exosite.getDeviceLuaScripts(this.rid)
        .then(scripts =>
            scripts.map(script =>
                new LuaScript(this.domain, script.info.description.name, script.rid, script.info.description.rule.script, this.exosite)));
    }
}
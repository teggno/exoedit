import Exosite from "./exosite";
import * as api from "./exosite";

export interface ScriptSource {
    getScript: () => Thenable<string>;
    setMapping: (path: string, mappings: Mapper) => void;
    upload: (newScript: string) => Thenable<void>;
    getTitle(): string;
    domain: string;
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

export class PortalWidgetScript implements ScriptSource {
    constructor(private originDomain: string, private title: string, private script: string, private dashboardId: string, private exosite: Exosite) {
    }

    public getTitle() {
        return this.title;
    }

    public getScript() {
        return Promise.resolve(this.script);
    }

    public get domain() {
        return this.originDomain;
    }

    public setMapping(path: string, target: Mapper) {
        target.setPortalWidgetScriptMapping(path, this.dashboardId, this.title);
    }

    public upload(newScript: string) {
        const uploader = PortalWidgetScript.getUploader(this.dashboardId, this.title);
        return uploader(this.exosite, newScript);
    }

    private static findWidgetIndexByTitle(dashboard: api.Dashboard, title: string) {
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

export class LuaScript implements ScriptSource {
    constructor(private originDomain: string, private name: string, private rid: string, private script: string, private exosite: Exosite) {
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
        mappings.setLuaDeviceScriptMapping(path, this.rid);
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

export interface Mapper {
    setDomainWidgetScriptMapping: (path: string, id: string) => void;
    setPortalWidgetScriptMapping: (path: string, dashboardId: string, title: string) => void;
    setLuaDeviceScriptMapping: (path: string, rid: string) => void;
}
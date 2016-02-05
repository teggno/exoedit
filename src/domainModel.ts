import * as api from './exosite';
import Exosite from './exosite';

export class Domain{
    constructor(public name: string, private exosite: Exosite){
    }
    
    getDomainWidgetScripts(){
        return this.exosite.getDomainWidgetScripts()
        .then(scripts => scripts.map(script => new DomainWidgetScript(script, this.exosite)));
    }
    
    getPortalsByUserId(userId: number){
        return this.exosite.getPortals(userId)
        .then(portals => portals.map(portal => new Portal(portal.PortalID, portal.PortalName, this.exosite)));
    }
}

export class Portal{
    constructor(private portalId: string, public name: string, private exosite: Exosite){
    }
    
    getDashboardsContainingPortalWidget(): Thenable<Dashboard[]>{
        return this.exosite.getDashboards(this.portalId)
            .then(dashboards => {
                var result = dashboards.map(db => {
                var sourceWidgets = db.config.widgets;
                var portalWidgets: PortalWidgetScript[] = [];
                for(var id in sourceWidgets){
                    var widget = db.config.widgets[id];
                    if(widget.WidgetScriptID === null){
                        portalWidgets.push(new PortalWidgetScript(widget, db.id, this.exosite));
                    }
                }
                if(portalWidgets.length !== 0){
                    return {
                        portalWidgets: portalWidgets,
                        name: db.name,
                        id: db.id
                    }
                }
            }).filter(i => !!i);
            return result;
        });
    }
    
    getDevices(): Thenable<Device[]>{
        return this.exosite.getDevices(this.portalId)
        .then(devices => devices.map(device => new Device(device.info.description.name, device.rid, this.exosite)));
    }
}

export interface Dashboard{
    portalWidgets: PortalWidgetScript[],
    name: string;
    id: string;
}

export class Device{
    constructor(public name: string, private rid: string, private exosite: Exosite){}
    
    getLuaScripts(){
        return this.exosite.getDeviceLuaScripts(this.rid)
        .then(scripts => 
            scripts.map(script => 
                new LuaScript(script.info.description.name, script.rid, script.info.description.rule.script, this.exosite)));
    }
}


export interface ScriptSource{
    getScript: () => Thenable<string>,
    getExositeReference: () => string;
    upload: (newScript: string) => Thenable<void>;
    getTitle(): string;
}

export class DomainWidgetScript implements ScriptSource{
    constructor(private widget: api.DomainWidgetScript, private exosite: Exosite) {
    }
    
    public getTitle(){
        return this.widget.name;
    }

    public getScript(){
        return this.getWidgetScriptObject().then(so => so.code);
    }
    
    public getExositeReference(){
        return this.widget.id;
    }
    
    public upload(newScript: string){
        return this.getWidgetScriptObject()
            .then(so => {
                so.code = newScript;
                this.exosite.updateDomainWidgetScript(this.widget.id, so)
            });
    }
    
    private getWidgetScriptObject(){
        return this.exosite.getDomainWidgetScript(this.widget.id);        
    }
}

export class PortalWidgetScript implements ScriptSource{
    constructor(private widget: api.DashboardWidget, private dashboardId: string, private exosite: Exosite) {
    }
    
    public getTitle(){
        return this.widget.title;
    }
    
    public getScript(){
        return Promise.resolve(this.widget.script);
    }
    
    public getExositeReference(){
        return 'portal';
    }

    public upload(newScript: string){
        return this.exosite.getDashboard(this.dashboardId)
            .then(dashboard => {
                return new Promise<void>((resolve, reject) => {
                    var widgetTitle = this.widget.title;
                    var index = this.findWidgetIndexByTitle(dashboard,  widgetTitle);
                    if(index === -1) return reject('Widget with Name "' + widgetTitle +'" not found in dashboard "' + dashboard.name + '"');
                    
                    dashboard.config.widgets[index].script = newScript;
                    this.exosite.updateDashboard(dashboard.id, { config: dashboard.config }).then(() => resolve());            
                });
        });
    }

    private findWidgetIndexByTitle(dashboard: api.Dashboard, title: string){
        var widgets = dashboard.config.widgets;
        for(var id in widgets){
            var widget = widgets[id];
            if(widget.title === title && !widget.WidgetScriptID){
                return id;
            }
        }
        return -1;
    }
}

export class LuaScript implements ScriptSource{
    constructor(private name: string, private rid: string, private script: string, private exosite: Exosite) {
    }
    
    public getTitle(){
        return this.name;
    }
    
    public getScript(){
        return Promise.resolve(this.script);
    }
    
    public getExositeReference(){
        return this.rid;
    }

    public upload(newScript: string){
        return this.exosite.updateLuaScript(this.rid, newScript).then(() => {return;});
    }
}
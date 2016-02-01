import * as vscode from 'vscode'; 
import settings from './settings';
import {Account} from './settings';
import changeUser from './changeUser';
import {showObjectQuickPick} from './vscodeUtilities';
import Exosite from './exosite';
import * as api from './exosite';

export function promptForPortalWidget(context: vscode.ExtensionContext): Thenable<ScriptSource>{
    var sti = settings(context);
    var savedAccount = sti.getCredentials();
    var getAccount = savedAccount 
        ? Promise.resolve(savedAccount)
        : changeUser(context);
        
    var exosite: Exosite;
    var account: Account;
    var dashboard: api.Dashboard;
    
    return getAccount.then(acc => {
            account = acc;
            return getDomain(sti);
        })
        .then(domain => {
            return new Exosite(domain, account)
        })
        .then(exo => {
            exosite = exo;
            return exosite.getExositeAccount();
        })
        .then(exositeAccount => {
            return exosite.getPortals(exositeAccount.id);
        })
        .then(portals => {
            return showObjectQuickPick(portals, p => p.PortalName, {placeHolder: 'Portals'});
        })
        .then(portal => {
            return exosite.getDashboards(portal.PortalID);
        })
        .then(dashboards => {
            var dashboardsWithPortalWidgetsOnly = getDashboardsContainingPortalWidget(dashboards, exosite);
            return showObjectQuickPick(dashboardsWithPortalWidgetsOnly, d => d.name, {placeHolder: 'Dashboards'});
        })
        .then(db => {
            return showObjectQuickPick(db.portalWidgets, w => w.getWidgetTitle(), {placeHolder: 'Widgets'});
        });
}

function getDashboardsContainingPortalWidget(dashboards: api.Dashboard[], exosite: Exosite){
    var result = dashboards.map(db => {
        var sourceWidgets = db.config.widgets;
        var portalWidgets: PortalWidgetScript[] = [];
        for(var id in sourceWidgets){
            var widget = db.config.widgets[id];
            if(widget.WidgetScriptID === null){
                portalWidgets.push(new PortalWidgetScript(widget, db.id, exosite));
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
}

export function promptForDomainWidget(context: vscode.ExtensionContext): Thenable<ScriptSource>{
    var sti = settings(context);
    var savedAccount = sti.getCredentials();
    var getAccount = savedAccount 
        ? Promise.resolve(savedAccount)
        : changeUser(context);
        
    var exosite: Exosite;
    var account: Account;
    
    return getAccount.then(acc => {
            account = acc;
            return getDomain(sti);
        })
        .then(domain => {
            exosite = new Exosite(domain, account)
            return exosite.getDomainWidgetScripts();
        })
        .then(domainWidgetScripts => {
            return showObjectQuickPick(domainWidgetScripts, w => w.name, {placeHolder: 'Widgets'});
        })
        .then(domainWidgetScript => domainWidgetScript ? new DomainWidgetScript(domainWidgetScript, exosite) : null);
}

export interface ScriptSource{
    getScript: () => Thenable<string>,
    getExositeReference: () => string;
    upload: (newScript: string) => Thenable<void>;
    getWidgetTitle(): string;
}

class DomainWidgetScript implements ScriptSource{
    constructor(private widget: api.DomainWidgetScript, private exosite: Exosite) {
    }
    
    public getWidgetTitle(){
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

class PortalWidgetScript implements ScriptSource{
    constructor(private widget: api.DashboardWidget, private dashboardId: string, private exosite: Exosite) {
    }
    
    public getWidgetTitle(){
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
                    if(index === -1) return reject('Portal widget with Name "' + widgetTitle +'" not found in dashboard "' + dashboard.name + '"');
                    
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

interface DomainSettings{
    getDomain: () => string,
    saveDomain: (domain: string) => void
}

function getDomain(ds: DomainSettings){
    var domain = ds.getDomain();
    
    if(!domain){
        return vscode.window.showInputBox({prompt: 'Domain', value: '[something.]exosite.com'})
            .then(domain => {
                ds.saveDomain(domain);
                return domain;
            });
    }
    return Promise.resolve(ds.getDomain());
}
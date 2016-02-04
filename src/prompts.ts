import * as vscode from 'vscode'; 
import settings from './settings';
import {Account} from './settings';
import changeUser from './changeUser';
import {showObjectQuickPick} from './vscodeUtilities';
import Exosite from './exosite';
import * as domainModel from  './domainModel';

export function promptForPortalWidget(context: vscode.ExtensionContext): Thenable<domainModel.PortalWidgetScript>{
    return promptForPortal(context)
        .then(portal => portal.getDashboardsContainingPortalWidget())
        .then(dashboards => showObjectQuickPick(dashboards, d => d.name, {placeHolder: 'Dashboards'}))
        .then(dashboard => showObjectQuickPick(dashboard.portalWidgets, w => w.getWidgetTitle(), {placeHolder: 'Widgets'}));
}

export function promptForDomainWidget(context: vscode.ExtensionContext): Thenable<domainModel.DomainWidgetScript>{
    return promptForDomain(context)
        .then(domain => domain.getDomainWidgetScripts())
        .then(domainWidgetScripts => showObjectQuickPick(domainWidgetScripts, w => w.getWidgetTitle(), {placeHolder: 'Widgets'}));
}

export function promptForDeviceLuaScript(context: vscode.ExtensionContext): Thenable<domainModel.LuaScript>{
    return promptForPortal(context)
        .then(portal => portal.getDevices())
        .then(devices => showObjectQuickPick(devices, d => d.name, {placeHolder: 'Device'}))
        .then(device => device.getLuaScripts())
        .then(luaScripts => showObjectQuickPick(luaScripts, s=> s.name, {placeHolder: 'Widgets'}));
}

function promptForPortal(context: vscode.ExtensionContext): Thenable<domainModel.Portal>{
    var sti = settings(context);
    var savedAccount = sti.getCredentials();
    var getAccount = savedAccount 
        ? Promise.resolve(savedAccount)
        : changeUser(context);

    var domain: domainModel.Domain;
    
    return promptForDomain(context)
        .then(dom => {
            domain = dom;
            return getAccount;
        })
        .then(acc => new Exosite(domain.name, acc).getExositeAccount())
        .then(exositeAccount => domain.getPortalsByUserId(exositeAccount.id))
        .then(portals => showObjectQuickPick(portals, p => p.name, {placeHolder: 'Portals'}));
}

function promptForDomain(context: vscode.ExtensionContext){
    var sti = settings(context);
    var savedAccount = sti.getCredentials();
    var getAccount = savedAccount 
        ? Promise.resolve(savedAccount)
        : changeUser(context);
        
    var account: Account;
    
    return getAccount.then(acc => {
            account = acc;
            return getDomainName(sti);
        })
        .then(domainName => new domainModel.Domain(domainName, new Exosite(domainName, account)));
}

interface DomainSettings{
    getDomain: () => string,
    saveDomain: (domain: string) => void
}

function getDomainName(ds: DomainSettings){
    var domain = ds.getDomain();
    
    if(!domain){
        return vscode.window.showInputBox({prompt: 'Domain', value: '[something.]exosite.com'})
            .then(domain => {
                ds.saveDomain(domain);
                return domain;
            });
    }
    console.log('Using domain "' + domain + '"');
    return Promise.resolve(domain);
}
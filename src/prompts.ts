"use strict";

import * as vscode from "vscode";
import { showObjectQuickPick, hasWorkspace } from "./vscodeUtilities";
import settingsFactory, { Account } from "./settings";
import Exosite from "./exosite";
import { getExoeditFile } from "./exoeditFile";
import { Domain } from "./domainModel/portals";

export function promptForPortalWidget(context: vscode.ExtensionContext) {
    return promptForPortal(context)
        .then(portal => portal.getDashboardsContainingPortalWidget())
        .then(dashboards => showObjectQuickPick(dashboards, d => d.name, {placeHolder: "Dashboard"}))
        .then(dashboard => showObjectQuickPick(dashboard.portalWidgets, w => w.getTitle(), {placeHolder: "Widget"}));
}

export function promptForDomainWidget(context: vscode.ExtensionContext) {
    return getDomain(context)
        .then(domain => domain.getDomainWidgetScripts())
        .then(domainWidgetScripts => showObjectQuickPick(domainWidgetScripts, w => w.getTitle(), {placeHolder: "Widget"}));
}

export function promptForDeviceLuaScript(context: vscode.ExtensionContext) {
    return promptForPortal(context)
        .then(portal => portal.getDevices())
        .then(devices => showObjectQuickPick(devices, d => d.name, {placeHolder: "Device"}))
        .then(device => device.getLuaScripts())
        .then(luaScripts => showObjectQuickPick(luaScripts, s => s.getTitle(), {placeHolder: "Lua Script"}));
}

function promptForPortal(context: vscode.ExtensionContext) {
    return getDomain(context)
        .then(domain => domain.getPortals())
        .then(portals => showObjectQuickPick(portals, p => p.name, {placeHolder: "Portal"}));
}

export function getDomain(context: vscode.ExtensionContext) {
    let account: Account;

    return getAccount(context)
        .then(acc => {
            if (!acc) return undefined;
            account = acc;
            return getDomainName();
        })
        .then(domainName => {
            if (!domainName) return undefined;
            const exosite = new Exosite(domainName, account.userName, account.password);
            return new Domain(domainName, exosite);
        });
}

export function getAccount(context: vscode.ExtensionContext) {
    return hasWorkspace()
        ? Promise.resolve(settingsFactory(context).getCredentials()).then(account => {
            return account || promptForAccountAndSave(context);
        })
        : promptForAccountAndSave(context);
}

function getDomainName() {
    return hasWorkspace()
        ? getExoeditFile(vscode.workspace.rootPath).then(file => file.domain).then(domain => domain || promptForDomainName())
        : promptForDomainName();
}

function promptForDomainName() {
    return vscode.window.showInputBox({prompt: "Domain", value: "[something.]exosite.com"});
}

function promptForAccount() {
    let userName;
    return vscode.window.showInputBox({prompt: "Username", placeHolder: "your@email.com" })
        .then(name => {
            if (!name) return undefined;
            userName = name;
            return vscode.window.showInputBox({prompt: "Password", password: true });
        })
        .then(password => password ? { userName: userName, password: password } : undefined);
}

function promptForAccountAndSave(context: vscode.ExtensionContext) {
    return promptForAccount().then(account => {
        return account && hasWorkspace()
            ? settingsFactory(context).saveCredentials(account).then(() => account)
            : account;
    });
}
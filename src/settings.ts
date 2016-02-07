"use strict";

import * as vscode from "vscode";

export interface Account {
    userName: string;
    password: string;
}

export default function(context: vscode.ExtensionContext) {
    return {
        getCredentials: () => {
            return context.globalState.get("cred");
        },
        saveCredentials: (account: Account) => {
            context.globalState.update("cred", account);
        },
        getDomain: () => {
            const obj: any = context.globalState.get("domain");
            return obj ? <string>obj.domain : null;
        },
        saveDomain: (domain: string) => {
            context.globalState.update("domain", { domain: domain });
        },
        clearAll: () => {
            const clearCred = context.globalState.update("cred", undefined);
            const clearDomain = context.globalState.update("domain", undefined);
            return Promise.all([clearCred, clearDomain]);
        },
        getMappingPreference: () => {
            const obj: any = context.workspaceState.get("mappingPrefs");
            return obj ? <boolean>obj.always : null;
        },
        saveMappingPreference: (always: boolean) => {
            return context.workspaceState.update("mappingPrefs", { always: always} );
        }
    };
}
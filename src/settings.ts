"use strict";

import * as vscode from "vscode";
import { hasWorkspace } from "./vscodeUtilities";

export interface Account {
    userName: string;
    password: string;
}

export default function(context: vscode.ExtensionContext) {
    const credentialsStore = hasWorkspace() ? context.workspaceState : context.globalState;
    return {
        getCredentials: () => <Account>credentialsStore.get("cred"),
        saveCredentials: (account: Account) => credentialsStore.update("cred", account),
        clearCredentials: () => credentialsStore.update("cred", undefined),
        getMappingPreference: () => {
            const obj: any = context.workspaceState.get("mappingPrefs");
            return obj ? <boolean>obj.always : null;
        },
        saveMappingPreference: (always: boolean) => context.workspaceState.update("mappingPrefs", { always: always} )
    };
}
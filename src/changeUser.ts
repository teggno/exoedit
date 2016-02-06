"use strict";

import * as vscode from "vscode";
import settings from "./settings";

export default function changeUser(context: vscode.ExtensionContext) {
    const cred = settings(context);

    return promptForCredentials()
        .then(account => {
            cred.saveCredentials(account);
            return account;
        });
}

export function promptForCredentials() {
    return vscode.window.showInputBox({prompt: "User Name"})
        .then(userName => {
            if (!userName)return;
            return vscode.window.showInputBox({prompt: "Password", password: true})
                .then(password => password ? {userName: userName, password: password} : undefined);
        });
}


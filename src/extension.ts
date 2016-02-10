"use strict";

import * as vscode from "vscode";
import getMainActions from "./mainActions";
import {showObjectQuickPick} from "./vscodeUtilities";

// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log("Exoedit Extension has been activated");

    const disposable = vscode.commands.registerCommand("extension.listActions", () => {
        const actions = getMainActions();
        showObjectQuickPick(actions, action => action.title, {placeHolder: "Select an Action"})
            .then(action => {
                if (action) action.fn(context);
            });
    });

    context.subscriptions.push(disposable);
}

// this method is called when the extension is deactivated
export function deactivate() {
}
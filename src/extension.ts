"use strict";

import { commands, ExtensionContext } from "vscode";
import { getMainActions, isMapped, publishMapped } from "./mainActions";
import { showObjectQuickPick} from "./vscodeUtilities";

// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    console.log("Exoedit Extension has been activated");

    registerListActionsCommand(context);
    registerPublishCommand(context);
}

function registerListActionsCommand(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand("exoedit.listActions", () => {
        showObjectQuickPick(getMainActions(), action => action.title, { placeHolder: "Select an Action" })
            .then(action => {
                if (action) action.fn(context);
            });
    }));
}

function registerPublishCommand(context: ExtensionContext) {
    context.subscriptions.push(commands.registerTextEditorCommand("exoedit.publish", () => {
        isMapped().then(result => result ? publishMapped(context) : undefined);
    }));
}

// this method is called when the extension is deactivated
export function deactivate() {
}
"use strict";

import { commands, ExtensionContext, window } from "vscode";
import { getMainActions, isMapped, publishMapped } from "./mainActions";
import { showObjectQuickPick} from "./vscodeUtilities";
import { runWidget } from "./widgetServer/server";

// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    console.log("Exoedit Extension has been activated");

    registerListActionsCommand(context);
    registerPublishCommand(context);
    registerRunWidgetCommand(context);
    registerStopServerCommand(context);
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

let server: { stop: () => void };

function registerRunWidgetCommand(context: ExtensionContext) {
    context.subscriptions.push(commands.registerTextEditorCommand("exoedit.runWidget", () => {
        isMapped().then(result => {
            if (result){
                if (server) server.stop();
                server = runWidget(window.activeTextEditor.document.fileName, context);
            }
        });
    }));
}

function registerStopServerCommand(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand("exoedit.stopWidgetServer", () => {
        if (server) {
            const myServer = server;
            server = null;
            myServer.stop();
        }
    }));
}

// this method is called when the extension is deactivated
export function deactivate() {
    if (server) server.stop();
}
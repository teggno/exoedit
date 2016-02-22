"use strict";

import { commands, ExtensionContext, window, Position } from "vscode";
import { getMainActions, isMapped, publishMapped } from "./mainActions";
import { showObjectQuickPick, activateNewUntitledFile } from "./vscodeUtilities";
import { runWidget } from "./widgetServer/server";
import { promptForPortalWidget } from "./prompts";

// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    console.log("Exoedit Extension has been activated");

    registerListActionsCommand(context);
    registerPublishCommand(context);
    registerRunWidgetCommand(context);
    registerStopServerCommand(context);
    registerGenerateFakeDataCommand(context);
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
            if (result) {
                if (server) server.stop();
                server = runWidget(window.activeTextEditor.document.fileName, context);
            }
            else {
                window.showErrorMessage("Cannot run widget because the current file is not a widget file that has a mapping in exoedit.json.");
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

function registerGenerateFakeDataCommand(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand("exoedit.generateFakeData", () => {
        promptForPortalWidget(context)
            .then(widget => widget.getPortalArgument())
            .then(portalArg => {
                activateNewUntitledFile().then(() => {
                    window.activeTextEditor.edit(edit => {
                        const fakeData = {
                            portal: portalArg,
                            read: {}
                        };
                        edit.insert(new Position(0, 0), JSON.stringify(fakeData, null, 2));
                    });
                });
            });
    }));
}



// this method is called when the extension is deactivated
export function deactivate() {
    if (server) server.stop();
}
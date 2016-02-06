"use strict";

import * as vscode from "vscode";
import { showTextInEditor } from "./vscodeUtilities";
import { promptForPortalWidget, promptForDomainWidget, promptForDeviceLuaScript } from "./prompts";
import { ScriptSource } from "./domainModel";

export function downloadPortalWidgetScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForPortalWidget(context));
}

export function downloadDomainWidgetScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDomainWidget(context));
}

export function uploadDomainWidgetScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDomainWidget(context));
}

export function uploadPortalWidgetScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForPortalWidget(context));
}

export function downloadDeviceLuaScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDeviceLuaScript(context));
}

export function uploadDeviceLuaScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDeviceLuaScript(context));
}

function downloadScript(prompt: () => Thenable<ScriptSource>) {
    prompt()
        .then(scriptSource => scriptSource.getScript())
        .then(showTextInEditor)
        .then(null, error => { console.error(error); });
}

function uploadScript(prompt: () => Thenable<ScriptSource>) {
    if (vscode.window.activeTextEditor === null)
        return Promise.reject("No activeTextEditor");

    const ok = "OK";

    return prompt()
        .then<ScriptSource|Promise<void>>(scriptSource => scriptSource || Promise.reject("No script source selected"))
        .then((scriptSource: ScriptSource) => {
            return vscode.window.showWarningMessage(
                `The widget script of "${scriptSource.getTitle()}" will be overwritten on Exosite.`, ok)
            .then(action => new Promise<ScriptSource>((resolve, reject) =>  {
                if (action !== ok) {
                   return reject("User decided not to upload anything");
                }
                resolve(scriptSource);
            }));
        })
        .then(scriptSource => scriptSource.upload(vscode.window.activeTextEditor.document.getText()))
        .then(() => vscode.window.showInformationMessage("Upload completed"))
        .then(null, error => console.error(error));
}
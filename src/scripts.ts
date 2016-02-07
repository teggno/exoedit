"use strict";

import * as vscode from "vscode";
import { showTextInEditor, hasWorkspace, saveAs } from "./vscodeUtilities";
import { promptForPortalWidget, promptForDomainWidget, promptForDeviceLuaScript } from "./prompts";
import { ScriptSource } from "./domainModel";
import settingsFactory from "./settings";
import { Mapping } from "./mappings";
import { getExoeditFile } from "./exoeditFile";

export function downloadPortalWidgetScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForPortalWidget(context), context);
}

export function downloadDomainWidgetScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDomainWidget(context), context);
}

export function uploadDomainWidgetScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDomainWidget(context));
}

export function uploadPortalWidgetScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForPortalWidget(context));
}

export function downloadDeviceLuaScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDeviceLuaScript(context), context);
}

export function uploadDeviceLuaScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDeviceLuaScript(context));
}

function downloadScript(prompt: () => Thenable<ScriptSource>, context: vscode.ExtensionContext) {
    let scriptSource: ScriptSource;
    prompt()
        .then(scs => {
            scriptSource =  scs;
            return scriptSource.getScript();
        })
        .then(showTextInEditor)
        .then(() => promptForMappingIfEnabled(scriptSource, context))
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

function promptForMappingIfEnabled(scriptSource: ScriptSource, context: vscode.ExtensionContext) {
    if (!hasWorkspace()) return;

    const settings = settingsFactory(context);
    const mappingPreference = settings.getMappingPreference();
    if (mappingPreference === true) {
        saveAndMap(scriptSource);
    }
    else if (mappingPreference !== false) {
        promptForSaveAction(scriptSource)
            .then(newPreference => {
                if (newPreference === true || newPreference === false)
                    settings.saveMappingPreference(newPreference);
            });
    }
}

function promptForSaveAction(scriptSource: ScriptSource) {
    let preference: boolean;
    const actions = [
        { name: "No, never", fn: () => preference = false },
        {
            name: "Yes, always",
            fn: () => {
                preference = true;
                saveAndMap(scriptSource);
            }
        },
        { name: "No" },
        { name: "Yes", fn: () => saveAndMap(scriptSource) },
    ];

    return vscode.window.showInformationMessage(
        "Would you like to save the mapping of the newly created document to the script from Exosite?",
        ...actions.map(action => action.name)
    ).then(name => {
        const action = <any>actions.find(a => a.name === name);
        return action && action.fn
            ? action.fn()
            : Promise.reject("Close clicked");
    }).then(() => preference);
}

function saveAndMap(scriptSource: ScriptSource) {
    return saveAs().then(result => {
        if (!result) return;
        const relativeFilePath = vscode.workspace.asRelativePath(vscode.window.activeTextEditor.document.uri);
        saveMapping(relativeFilePath, scriptSource);
    });
}

function saveMapping(relativeFilePath: string, scriptSource: ScriptSource) {
    return getExoeditFile().then(exoeditFile => {
        scriptSource.setMapping(relativeFilePath, exoeditFile.mapping);
        return exoeditFile.save();
    });
}
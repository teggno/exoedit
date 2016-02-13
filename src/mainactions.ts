"use strict";

import * as vscode from "vscode";
import { showTextInEditor, hasWorkspace, saveAs, isDocumentEmpty } from "./vscodeUtilities";
import { promptForPortalWidget, promptForDomainWidget, promptForDeviceLuaScript, getAccount } from "./prompts";
import { ScriptSource } from "./scriptSources";
import settingsFactory from "./settings";
import { Mappings } from "./mappings";
import { getExoeditFile } from "./exoeditFile";
import Exosite from "./exosite";

export function getMainActions() {
    const actionPromises = [
        { title: "Edit Domain Widget Script", fn: downloadDomainWidgetScript },
        { title: "Edit Portal Widget Script", fn: downloadPortalWidgetScript },
        { title: "Edit Device Lua Script", fn: downloadDeviceLuaScript },
        hasActiveTextEditorWithContent() ? { title: "Upload Domain Widget Script", fn: uploadDomainWidgetScript } : undefined,
        hasActiveTextEditorWithContent() ? { title: "Upload Portal Widget Script", fn: uploadPortalWidgetScript } : undefined,
        hasActiveTextEditorWithContent() ? { title: "Upload Device Lua Script", fn: uploadDeviceLuaScript } : undefined,
        hasWorkspace() ? { title: "Clear Zser Information", fn: (context) => { settingsFactory(context).clearCredentials(); } } : undefined
    ];

    return Promise.all(actionPromises).then(actions => actions.filter(item => !!item));
}

function hasActiveTextEditorWithContent() {
    return !!vscode.window.activeTextEditor && !isDocumentEmpty(vscode.window.activeTextEditor.document);
}

function downloadPortalWidgetScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForPortalWidget(context), context);
}

function downloadDomainWidgetScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDomainWidget(context), context);
}

function uploadDomainWidgetScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDomainWidget(context));
}

function uploadPortalWidgetScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForPortalWidget(context));
}

function downloadDeviceLuaScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDeviceLuaScript(context), context);
}

function uploadDeviceLuaScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDeviceLuaScript(context));
}

export function publishMapped(context: vscode.ExtensionContext) {
    const path = vscode.window.activeTextEditor.document.fileName;
    const relativePath = vscode.workspace.asRelativePath(path);
    return getExoeditFile().then(file => file.mappings.getUploader(relativePath))
        .then(uploader => {
            getExoeditFile().then(file => {
                getAccount(context).then(account => {
                    const exosite = new Exosite(file.domain, account.userName, account.password);
                    uploader(exosite, vscode.window.activeTextEditor.document.getText());
                });
            });
        });
}

export function isMapped() {
    if (!hasWorkspace()) return Promise.resolve(false);

    const path = vscode.window.activeTextEditor.document.fileName;
    const relativePath = vscode.workspace.asRelativePath(path);
    return getExoeditFile().then(file => file.mappings.isMapped(relativePath));
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
        return saveMapping(relativeFilePath, scriptSource);
    });
}

function saveMapping(relativeFilePath: string, scriptSource: ScriptSource) {
    return getExoeditFile().then(exoeditFile => {
        scriptSource.setMapping(relativeFilePath, exoeditFile.mappings);
        if (!exoeditFile.domain) exoeditFile.domain = scriptSource.domain;
        return exoeditFile.save();
    })
    .then(null, error => {
        console.error(error);
    });
}
"use strict";

import * as vscode from "vscode";
import { Exopublish } from "exopublish";
import { arePathsEqual } from "./utilities";
import { showTextInEditor, hasWorkspace, saveAs, isDocumentEmpty } from "./vscodeUtilities";
import { promptForPortalWidget, promptForDomainWidget, promptForDeviceLuaScript, getAccount } from "./prompts";
import settingsFactory from "./settings";
import { getExoeditFile } from "./exoeditFile";
import { getExopublish } from "./exoeditFile2";
import Exosite from "./exosite";
import { ScriptSource } from "./domainModel/mapper";
import { Mappings } from "./domainModel/mappings";
import log from "./log";

export function getMainActions() {
    const actionPromises = [
        { title: "Import Domain Widget Script", fn: downloadDomainWidgetScript },
        { title: "Import Portal Widget Script", fn: downloadPortalWidgetScript },
        { title: "Import Device Lua Script", fn: downloadDeviceLuaScript },
        hasActiveTextEditorWithContent() ? { title: "Publish to Domain Widget", fn: publishToDomainWidget } : undefined,
        hasActiveTextEditorWithContent() ? { title: "Publish to Portal Widget", fn: publishToPortalWidget } : undefined,
        hasActiveTextEditorWithContent() ? { title: "Publish as Device Lua Script", fn: publishAsDeviceLuaScript } : undefined,
        hasWorkspace() ? { title: "Clear User Information", fn: (context) => {
            settingsFactory(context).clearCredentials().then(() => log("Cleared user information", true));
        } } : undefined
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

function publishToDomainWidget(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDomainWidget(context));
}

function publishToPortalWidget(context: vscode.ExtensionContext) {
    uploadScript(() => promptForPortalWidget(context));
}

function downloadDeviceLuaScript(context: vscode.ExtensionContext) {
    downloadScript(() => promptForDeviceLuaScript(context), context);
}

function publishAsDeviceLuaScript(context: vscode.ExtensionContext) {
    uploadScript(() => promptForDeviceLuaScript(context));
}

export function publishMapped(context: vscode.ExtensionContext) {
    const relativePath = vscode.workspace.asRelativePath(vscode.window.activeTextEditor.document.fileName);
    return Promise.all<Acount|Exopublish>([getAccount(context), getExopublish()])
        .then(([account, exopublish]: [Acount, Exopublish]) => {
            const pathAsOfExopublish = getAllPaths(exopublish).find(exopublishPath => arePathsEqual(exopublishPath, relativePath));
            exopublish.publishOne(pathAsOfExopublish, vscode.window.activeTextEditor.document.getText(), account.userName, account.password);
        })
        .then(() => showPublishCompleted(relativePath));
}

export function isMapped() {
    if (!hasWorkspace()) return Promise.resolve(false);

    const relativePath = vscode.workspace.asRelativePath(vscode.window.activeTextEditor.document.fileName);
    return getExopublish().then(exopublish => {
        const allPaths = getAllPaths(exopublish);
        return !!allPaths.find(path => arePathsEqual(path, relativePath));
    });
}

function getAllPaths(exopublish: Exopublish) {
    return [
        ...exopublish.getDeviceLuaScripts(),
        ...exopublish.getDomainWidgets(),
        ...exopublish.getPortalWidgets()
    ];
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
        .then(null, error => {
            log(error, true);
            console.error(error);
        });
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
        .then(() => showPublishCompleted())
        .then(null, error => {
            log(error, true);
            console.error(error);
        });
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
    const save = () => {
        return saveAs().then(result => {
            if (!result) return;
            const relativeFilePath = vscode.workspace.asRelativePath(vscode.window.activeTextEditor.document.uri);
            return saveMapping(relativeFilePath, scriptSource);
        });
    };

    if (isDocumentEmpty(vscode.window.activeTextEditor.document)) {
        // Add an empty line if the document is empty. This is because vscode will not save empty documents.
        return vscode.window.activeTextEditor.edit(builder => {
            builder.insert(new vscode.Position(0, 0), "\n");
        })
        .then(() => save());
    }
    else {
        save();
    }
}

function saveMapping(relativeFilePath: string, scriptSource: ScriptSource) {
    return getExoeditFile(vscode.workspace.rootPath).then(exoeditFile => {
        scriptSource.setMapping(relativeFilePath, exoeditFile.mappings);
        if (!exoeditFile.domain) exoeditFile.domain = scriptSource.domain;
        return exoeditFile.save();
    })
    .then(null, error => {
        console.error(error);
    });
}

function showPublishCompleted(path?: string) {
    log(`Publish ${(path ? path + " " : "")}completed (${new Date().toLocaleString() })`, true);
}

interface Acount {
    userName: string;
    password: string;
}
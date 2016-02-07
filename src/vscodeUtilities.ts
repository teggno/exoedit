"use strict";

import * as vscode from "vscode";

export function showObjectQuickPick<T>(items: T[], titleFn: (item: T) => string, options?: vscode.QuickPickOptions) {
    const titles = items.map(titleFn);
    return vscode.window.showQuickPick(titles, options)
        .then(title => {
            return items.find(item => titleFn(item) === title);
        });
}

export function hasWorkspace() {
    return !!vscode.workspace.rootPath;
}

export function activateNewUntitledFile() {
    return new Promise((resolve, reject) => {
        // if there is no active text editor before "workbench.action.files.newUntitledFile"
        // is executed, there will also be none immediately after. Therefore we have to continue
        // when onDidChangeActiveTextEditor().
        const disposable = vscode.window.onDidChangeActiveTextEditor(e => {
            if (vscode.window.activeTextEditor !== null) {
                disposable.dispose();
                resolve();
            }
        });
        vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
    });
}

// VS Code has the weird behavior to immediately close a file after it has been saved
// if it is has been a new untitled file prior to saving it. This method provides
// a shorthand for saving a new untitled file and keeping it open in the editor.
export function saveAs() {
    return new Promise((resolve, reject) => {
        // Would have preferred to use onDidSaveTextDocument instead of FileSystemWatcher.
        // However, that event doesn't get fired when new untitled files are saved.
        const handler = uri => {
                creteDisp.dispose();
                changeDisp.dispose();
                vscode.workspace.openTextDocument(uri).then(doc =>
                    vscode.window.showTextDocument(doc).then(() => resolve(true))
                );
            };
        const watcher = vscode.workspace.createFileSystemWatcher("**/*", false, false, true);
        const creteDisp = watcher.onDidCreate(handler);
        // needed in case an existing file will be overwritten
        const changeDisp = watcher.onDidChange(handler);
        vscode.window.activeTextEditor.document.save().then(saved => {
            if (!saved) {
                creteDisp.dispose();
                changeDisp.dispose();
                resolve(false);
            }
        });
    });
}

export function hasActiveTextEditorUntitledEmptyFile() {
    return vscode.window.activeTextEditor
        && vscode.window.activeTextEditor.document
        && vscode.window.activeTextEditor.document.isUntitled
        && isDocumentEmpty(vscode.window.activeTextEditor.document);
}

export function isDocumentEmpty(document: vscode.TextDocument) {
    return document.getText() === "";
}

export function showTextInEditor(text: string): Thenable<void> {
    const prepareEditor: any  = hasActiveTextEditorUntitledEmptyFile()
        ? Promise.resolve()
        : activateNewUntitledFile();

    return prepareEditor.then(() => {
        return vscode.window.activeTextEditor.edit(x => x.insert(new vscode.Position(0, 0), text));
    });
}
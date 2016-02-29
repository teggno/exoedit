"use strict";

import { window, workspace, commands, QuickPickOptions, TextDocument, Position, Uri } from "vscode";

export function showObjectQuickPick<T>(items: T[] | Thenable<T[]>, titleFn: (item: T) => string, options?: QuickPickOptions) {
    return Promise.resolve(items)
        .then(resolvedItems =>
            window.showQuickPick(resolvedItems.map(titleFn), options)
                .then(title => resolvedItems.find(item => titleFn(item) === title))
        );
}

export function hasWorkspace() {
    return !!workspace.rootPath;
}

export function activateNewUntitledFile() {
    return new Promise((resolve, reject) => {
        // if there is no active text editor before "workbench.action.files.newUntitledFile"
        // is executed, there will also be none immediately after. Therefore we have to continue
        // when onDidChangeActiveTextEditor().
        const disposable = window.onDidChangeActiveTextEditor(e => {
            if (window.activeTextEditor !== null) {
                disposable.dispose();
                resolve();
            }
        });
        commands.executeCommand("workbench.action.files.newUntitledFile");
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
                workspace.openTextDocument(uri).then(doc =>
                    window.showTextDocument(doc).then(() => resolve(true))
                );
            };
        const watcher = workspace.createFileSystemWatcher("**/*", false, false, true);
        const creteDisp = watcher.onDidCreate(handler);
        // needed in case an existing file will be overwritten
        const changeDisp = watcher.onDidChange(handler);
        window.activeTextEditor.document.save().then(saved => {
            if (!saved) {
                creteDisp.dispose();
                changeDisp.dispose();
                resolve(false);
            }
        });
    });
}

export function hasActiveTextEditorUntitledEmptyFile() {
    return window.activeTextEditor
        && window.activeTextEditor.document
        && window.activeTextEditor.document.isUntitled
        && isDocumentEmpty(window.activeTextEditor.document);
}

export function isDocumentEmpty(document: TextDocument) {
    return document.getText() === "";
}

export function showTextInEditor(text: string): Thenable<void> {
    const prepareEditor: any  = hasActiveTextEditorUntitledEmptyFile()
        ? Promise.resolve()
        : activateNewUntitledFile();

    return prepareEditor.then(() => {
        return window.activeTextEditor.edit(x => x.insert(new Position(0, 0), text));
    });
}

export function getChangeWatcherForMultipleLocations(locations: string[]) {
    const watchers = locations.map(location => workspace.createFileSystemWatcher(location, true, false, true));
    return {
        dispose: () => {
            watchers.forEach(watcher => watcher.dispose());
        },
        onDidChange: (listener: (uri: Uri) => void) => {
            const disposables = watchers.map(watcher => watcher.onDidChange(listener));
            return {
                dispose: () => {
                    disposables.forEach(disposable => disposable.dispose());
                }
            };
        }
    };
}

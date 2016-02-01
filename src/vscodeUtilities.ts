import * as vscode from 'vscode'; 

export function showObjectQuickPick<T>(items: T[], titleFn: (item:T) => string, options?: vscode.QuickPickOptions){
    var titles = items.map(titleFn);
    return vscode.window.showQuickPick(titles, options)
        .then(title => {
            return items.find(item => titleFn(item) === title);
        });
}

export function hasWorkspace(){
    return !!vscode.workspace.rootPath;
}

export function activateNewUntitledFile(){
    return new Promise((resolve, reject) => {
        //if there is no active text editor before "workbench.action.files.newUntitledFile"
        //is executed, there will also be none immediately after. Therefore we have to continue
        //when onDidChangeActiveTextEditor().
        var disposable = vscode.window.onDidChangeActiveTextEditor(e => {
            if(vscode.window.activeTextEditor !== null){
                disposable.dispose();
                resolve();                
            }
        });
        vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    });
}

export function hasActiveTextEditorUntitledEmptyFile(){
    return vscode.window.activeTextEditor
        && vscode.window.activeTextEditor.document
        && vscode.window.activeTextEditor.document.isUntitled
        && isDocumentEmpty(vscode.window.activeTextEditor.document);
}

export function isDocumentEmpty(document: vscode.TextDocument){
    return document.getText() === '';
}
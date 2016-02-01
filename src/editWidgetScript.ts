import * as vscode from 'vscode'; 
import { hasWorkspace, activateNewUntitledFile, hasActiveTextEditorUntitledEmptyFile } from './vscodeUtilities';
import { promptForPortalWidget, promptForDomainWidget } from './prompts';

export function downloadPortalWidgetScript(context: vscode.ExtensionContext){
    promptForPortalWidget(context)
        .then(scriptSource => {
            return scriptSource.getScript();
        })
        .then(showScriptInEditor)
        .then(null, error => { console.error(error)});
}

export function downloadDomainWidgetScript(context: vscode.ExtensionContext){
    promptForDomainWidget(context)
        .then(scriptSource => {
            return scriptSource.getScript();
        })
        .then(showScriptInEditor)
        .then(null, error => { console.error(error)});
}

function showScriptInEditor(script: string): Thenable<void>{
    var prepareEditor:any  = hasActiveTextEditorUntitledEmptyFile()
        ? Promise.resolve()
        : activateNewUntitledFile();
    
    return prepareEditor.then(() => {
        return vscode.window.activeTextEditor.edit(x => x.insert(new vscode.Position(0, 0), script));                           
    });
}
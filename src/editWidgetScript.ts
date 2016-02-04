import * as vscode from 'vscode'; 
import { showTextInEditor } from './vscodeUtilities';
import { promptForPortalWidget, promptForDomainWidget } from './prompts';
import { ScriptSource } from './domainModel';

export function downloadPortalWidgetScript(context: vscode.ExtensionContext){
    downloadScript(() => promptForPortalWidget(context));
}

export function downloadDomainWidgetScript(context: vscode.ExtensionContext){
    downloadScript(() => promptForDomainWidget(context));
}

function downloadScript(prompt: () => Thenable<ScriptSource>){
    prompt()
        .then(scriptSource => scriptSource.getScript())
        .then(showTextInEditor)
        .then(null, error => { console.error(error)});    
}
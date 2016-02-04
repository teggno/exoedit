import * as vscode from 'vscode'; 
import { promptForDomainWidget, promptForPortalWidget } from './prompts';
import { ScriptSource } from './foo';

export function uploadDomainWidgetScript(context: vscode.ExtensionContext){
    uploadScript(() => promptForDomainWidget(context));
}

export function uploadPortalWidgetScript(context: vscode.ExtensionContext){
    uploadScript(() => promptForPortalWidget(context));
}

function uploadScript(prompt: () => Thenable<ScriptSource>){
    if(vscode.window.activeTextEditor === null)
        return Promise.reject("No activeTextEditor");
    
    const ok = "OK";
    
    return prompt()
        .then<ScriptSource|Promise<void>>(widget => {
            if(!widget)return Promise.reject('');
            return widget;
        })
        .then((widget:ScriptSource) => {
            return vscode.window.showWarningMessage(
                'The widget script of widget "' + widget.getWidgetTitle() + '" will be overwritten on Exosite.', ok)
            .then(action => new Promise<ScriptSource>((resolve, reject) =>  {
                if(action !== ok){
                   return reject(null);
                }
                resolve(widget);
            }))
        })
        .then(widget => widget.upload(vscode.window.activeTextEditor.document.getText()))
        .then(() => vscode.window.showInformationMessage('Upload completed'))
        .then(null, error => console.error(error));
}
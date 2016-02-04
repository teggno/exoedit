import * as vscode from 'vscode'; 
import { showTextInEditor } from './vscodeUtilities';
import { promptForDeviceLuaScript } from './prompts';
import { LuaScript } from './domainModel';

export function downloadDeviceLuaScript(context: vscode.ExtensionContext){
    downloadScript(() => promptForDeviceLuaScript(context));
}

function downloadScript(prompt: () => Thenable<LuaScript>){
    prompt()
        .then(scriptSource => scriptSource.script )
        .then(showTextInEditor)
        .then(null, error => { console.error(error)});    
}
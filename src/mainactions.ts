import * as vscode from 'vscode'; 
import * as scripts from './scripts';
import settings from './settings';
import { isDocumentEmpty } from './vscodeUtilities';

export default function(context: vscode.ExtensionContext){
    var actions = [
        { title: 'Edit Domain Widget Script', fn: () => { scripts.downloadDomainWidgetScript(context);}},
        { title: 'Edit Portal Widget Script', fn: () => { scripts.downloadPortalWidgetScript(context);}},
        { title: 'Edit Device Lua Script', fn: () => { scripts.downloadDeviceLuaScript(context);}},
        { 
            title: 'Upload Domain Widget Script', 
            fn: () => { scripts.uploadDomainWidgetScript(context);}, 
            condition: hasActiveTextEditorWithContent 
        },
        { 
            title: 'Upload Portal Widget Script', 
            fn: () => { scripts.uploadPortalWidgetScript(context);}, 
            condition: hasActiveTextEditorWithContent 
        },
        { 
            title: 'Upload Device Lua Script', 
            fn: () => { scripts.uploadDeviceLuaScript(context);}, 
            condition: hasActiveTextEditorWithContent 
        },
        { 
            title: 'Clear User and Domain', 
            fn: () => { 
                settings(context).clearAll().then(() => vscode.window.showInformationMessage('Successfully cleared user and domain'));
            } 
        }
    ];
    
    return actions.filter((a: any) => !a.condition || a.condition());     
}

function hasActiveTextEditorWithContent(){
    return !!vscode.window.activeTextEditor && !isDocumentEmpty(vscode.window.activeTextEditor.document);
}
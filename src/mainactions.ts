import * as vscode from 'vscode'; 
import {downloadPortalWidgetScript, downloadDomainWidgetScript} from './editWidgetScript';
import settings from './settings';
import {uploadPortalWidgetScript, uploadDomainWidgetScript} from './uploadWidgetScript';
import { isDocumentEmpty } from './vscodeUtilities';

export default function(context: vscode.ExtensionContext){
    var actions = [
        { title: 'Edit Domain Widget Script', fn: () => { downloadDomainWidgetScript(context);}},
        { title: 'Edit Portal Widget Script', fn: () => { downloadPortalWidgetScript(context);}},
        { 
            title: 'Upload Domain Widget Script', 
            fn: () => { uploadDomainWidgetScript(context);}, 
            condition: hasActiveTextEditorWithContent 
        },
        { 
            title: 'Upload Portal Widget Script', 
            fn: () => { uploadPortalWidgetScript(context);}, 
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
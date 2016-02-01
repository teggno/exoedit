import * as vscode from 'vscode'; 

export interface Account{
    userName: string;
    password: string;
}

export default function(context: vscode.ExtensionContext){
    return {
        getCredentials: () => {
            return context.globalState.get('cred');           
        },
        saveCredentials: (account: Account) => {
            context.globalState.update('cred', account);           
        },
        getDomain: () => {
            var obj: any = context.globalState.get('domain');
            return obj ? <string>obj.domain : null;
        },
        saveDomain: (domain: string) => {
            context.globalState.update('domain', { domain: domain });
        },
        clearAll: () => {
            var clearCred = context.globalState.update('cred', undefined);
            var clearDomain = context.globalState.update('domain', undefined);
            return Promise.all([clearCred, clearDomain]);
        }
    }
}
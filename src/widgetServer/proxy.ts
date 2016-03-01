import { IncomingMessage, ServerResponse } from "http";
import * as requestApi from "request";
import { getExoeditFile } from "../exoeditFile";
import { ExtensionContext, workspace } from "vscode";
import settingsFactory from "../settings";

export default function factory(context: ExtensionContext) {

    return  {
        forwardToExositeApi: forwardToExositeApi
    };

    function forwardToExositeApi(originalRequest: IncomingMessage, response: ServerResponse) {
        getDomain().then(domain => {
            const account = getAccount();
            requestApi("https://" + domain + originalRequest.url, getProxyRequestOptions(originalRequest))
                .auth(account.userName, account.password)
                .pipe(response);
        });
    }

    function getDomain() {
        return getExoeditFile(workspace.rootPath).then(file => {
            return file.domain;
        });
    }

    function getAccount() {
        const account = settingsFactory(context).getCredentials();
        if (!account) throw new Error("Could not get account");
        return account;
    }

    function getProxyRequestOptions(originalRequest: IncomingMessage): requestApi.CoreOptions {
        return {
            method: originalRequest.method,
            headers: copyHeaders(originalRequest.headers)
        };
    }

    function copyHeaders(headers: any) {
        const result = {};
        for (let name in headers) {
            if (name !== "host" && name !== "referer") {
                result[name] = headers[name];
            }
        }
        return result;
    }
}
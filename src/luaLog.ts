import { getExoeditFile } from "./exoeditFile";
import { window, workspace, ExtensionContext } from "vscode";
import { getDomain } from "./prompts";
import rpc from "./exositeRpc";
import log from "./log";

export function getLuaLog(context: ExtensionContext) {
    let scriptRid: string;
    let portalId: string;
    const path = window.activeTextEditor.document.fileName;
    const relativePath = workspace.asRelativePath(path);
    getExoeditFile(workspace.rootPath).then(file => {
        const info = file.mappings.getLuaScriptInfo(relativePath);
        if (!info) return;

        scriptRid = info.rid;
        portalId = info.portalId;
        return getDomain(context);
    })
    .then(domain =>
        domain ? domain.getPortalCik(portalId) : undefined
    )
    .then(portalCik => {
        if (!portalCik) return;
        const now = new Date();
        const options = {
            limit: 10000, // it will only return one line by default but we want all lines of today
            starttime: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000,
            sort: "asc" // the log will be output on an output channel and it will scroll to the bottom automatically. Therefore, it's better to have the most recent entry at the bottom.
        };
        return <Promise<[ number, string ][]>>rpc(portalCik, "read", [ scriptRid, options ]);
    })
    .then(lines => {
        if (!lines) return;

        log(`----------------------------------`, true);
        log(`Lua Script log of ${relativePath}:`);
        const logMessages = lines.map(item => `${new Date(item[0] * 1000).toLocaleString()}\t${item[1] }`);
        log(logMessages.join("\n"));
    })
    .catch(error => {
        log("Error getting lua log", true);
        log(error);
    });
}

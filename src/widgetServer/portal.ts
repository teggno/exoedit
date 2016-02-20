import { IncomingMessage, ServerResponse } from "http";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";
import { getExoeditFile } from "../exoeditFile";
import { workspace, ExtensionContext } from "vscode";
import Exosite from  "../exosite";
import * as api from  "../exosite";
import log from "./log";
import { getDomain } from "../prompts";

export default function factory(widgetPath: string, context: ExtensionContext) {
    return (request: IncomingMessage, response: ServerResponse) => {
        getExoeditFile(workspace.rootPath).then(file => {
            file.mappings.getWidgetPortalArg(workspace.asRelativePath(widgetPath),
                (dashboardId: string, widgetTitle: string) => {
                    log("Getting live data for the widget's \"portal\" parameter");
                    getDomain(context)
                        .then(domain => domain.getPortalWidget(dashboardId, widgetTitle))
                        .then(widget => widget.getPortalArgument())
                        .then(portalArgument => {
                            jsonResponse(response, portalArgument);
                        });
                },
                () => {}
            );
        });
    };
}

interface ReadBody {
    targetResource: string[];
    options: {};
}

import { IncomingMessage, ServerResponse } from "http";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";
import { getExoeditFile } from "../exoeditFile";

export default function factory(widgetPath: string) {
    return (request: IncomingMessage, response: ServerResponse) => {
        getExoeditFile().then(file => {
            // get mapping for widgetPath
            // get dashboard
            // get widget
            // note: real data can only be fetched for portal widgets, not for domain widgets.
            // find out somehow what data to return

            // TODO: get stuff from exosite and write it to the response
            jsonResponse(response, { clients: [ { dataports: [ { alias: "foobar", data: [[123, "the value"]]} ] }]});
        });
    }
}

interface ReadBody {
    targetResource: string[];
    options: {};
}
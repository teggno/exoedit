import { IncomingMessage, ServerResponse } from "http";
import { readToEnd, jsonResponse, ensurePost } from "./widgetServerUtilities";

export default function (request: IncomingMessage, response: ServerResponse) {
    if (!ensurePost(request, response)) return;

    readToEnd(request).then(content => {
        const parsed = <ReadBody>JSON.parse(content);
        if (!parsed.targetResource || parsed.targetResource.length !== 2) {
            response.statusCode = 400;
            response.end("posted json data must contain a targetResource field which needs to be an array containing 2 strings");
            return;
        }
        if (!parsed.options) {
            response.statusCode = 400;
            response.end("posted json data must contain an options which needs to be an object");
            return;
        }

        jsonResponse(response, [[123, "Something from exosite"], [456, "another thing from exosite"]]);
        // TODO: get stuff from exosite and write it to the response
    });
}

interface ReadBody {
    targetResource: string[];
    options: {};
}
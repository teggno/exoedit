import { IncomingMessage, ServerResponse } from "http";

export default function (request: IncomingMessage, response: ServerResponse) {
    if (request.method !== "POST") {
        response.statusCode = 405;
        response.end("Only POST is supported");
        return;
    }

    let body = "";
    request.on("data",  chunk => {
        body += chunk.toString();
    });

    request.on("end", () => {
        const parsed = <ReadBody>JSON.parse(body);
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

        response.statusCode = 200;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify([[123, "Something from exosite"], [456, "another thing from exosite"]]));
    });
}

interface ReadBody {
    targetResource: string[];
    options: {};
}
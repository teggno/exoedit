"use strict";

import { OutputChannel, window } from "vscode";

let channel: OutputChannel;

export default function log(text: string) {
    if (!channel) {
        channel = window.createOutputChannel("Exoedit Widget Server");
        channel.show();
    }
    channel.appendLine(text);
}
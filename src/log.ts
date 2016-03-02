"use strict";

import { OutputChannel, window } from "vscode";

let channel: OutputChannel;

export default function log(text: string, bringToFront: boolean = false) {
    if (!channel) {
        channel = window.createOutputChannel("Exoedit");
        bringToFront = true;
    }
    channel.appendLine(text);
    if (bringToFront) channel.show();
}
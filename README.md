# Exoedit
A Visual Studio Code extension that helps you edit and manage scripts for Exosite.

## Usage
1. Open the command list (by pressing F1 or Ctrl+Shift+P)
2. Select `Exoedit`
3. Select one of the appearing main actions (each is explained below).

## Main Actions

### Edit Domain Widget Script
Use this action to get the JavaScript code from an Exosite Domain Widget into the Editor. 
When you have selected this command, you will be prompted for the Widget. 

### Edit Portal Widget Script
Use this action to get the JavaScript code from a Widget that only exists on a Portal Dashboard into the Editor. 
When you have selected this command, you will be prompted for the Portal, the Dashboard and the Widget. 

### Edit Device Lua Script
Use this action to get the Lua code from a Device Script into the Editor. 
When you have selected this command, you will be prompted for the Portal, the Device and the Script. 

### Upload Domain Widget Script
Use this action to upload the code of the current editor window to an existing Exosite Domain Widget. 
When you have selected this command, you will be prompted for the Domain Widget.

**NOTE: This command is only available if there is an active editor window that contains something.** 

### Upload Portal Widget Script
Use this action to upload the code in the current editor window to an existing Exosite Widget that
exists on a Portal Dashboard. 
When you have selected this command, you will be prompted for the Portal, the Dashboard and the Widget.

**NOTE: This command is only available if there is an active editor window that contains something.** 

### Upload Device Lua Script
Use this action to replace the Lua script of a Device with the one inside the current editor window.
When you have selected this command, you will be prompted for the Portal, the Device and the Script.

**NOTE: This command is only available if there is an active editor window that contains something.** 

### Clear User and Domain
When you use one of the commands mentioned above, you will be prompted for your credentials and a domain
which will be stored for subsequent use.
In case you need to change any of them, you can select the "Clear User and Domain" command.

## Script Mapping
If you have opened a folder (as opposed to just a file), the extension saves the mapping between an Exosite script and the corresponding file in a JSON document.

### JSON Example
```json
{
    "domain": "https://foodomain.exosite.com",
    "mappings":{
        "lua":{
            "device": [
                { "path": "abc/one.lua", "rid": "abcd1234" },
                { "path": "xy/def.lua", "rid": "ghij5678" }
            ]
        },
        "widget": {
            "domain": [
                { "path": "some/script1.js", "id": "1234567" },
                { "path": "script2.js", "id": "8474987" }
            ],
            "portal": [
                { "path": "foo/barscript.js", "dashboardId": "1234567", "widgetTitle": "This is the title" },
                { "path": "foo/bazscript.js", "dashboardId": "243242", "widgetTitle": "Another title" }
            ]
        }
    }
}
```

**NOTE: Portal Widget scripts are mapped using their title, so the mapping gets broken if you change the widget's title in Exosite.**
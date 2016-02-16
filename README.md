# Exoedit
A Visual Studio Code extension that helps you edit and manage scripts for Exosite.

## Usage Scenarios
### Edit a Script of a Widget or a Lua Script
1. Open the command list (by pressing F1 or Ctrl+Shift+P)
2. Select `Exoedit`
3. Select one of the three edit actions. This will prompt you for the source of the script, download it and display it in the editor.

### Upload the content of the current Editor Window to Exosite
As soon as you have an active editor window with content in it, you can use Exoedit to upload the content to Exosite. Depending on whether you have previously saved the mapping of the current file to the corresponding artifact on Exosite, there are two ways for uploading:

#### a) The Mapping of the Script to an Exosite artifact has been saved
1. Open the command list (by pressing F1 or Ctrl+Shift+P)
2. Select `Exoedit: Publish`
3. The status bar will indicate when the script has been published.

#### b) The Mapping of the Script to an Exosite artifact has not been saved
1. Open the command list (by pressing F1 or Ctrl+Shift+P)
2. Select `Exoedit`
3. Select one of the three upload actions. This will prompt you for the destination of the script, where the content of the editor will be uploaded.
4. The status bar will indicate when the script has been published.

## Usage Modes
Exoedit can be used in workspace mode and in single file mode. Some actions are only available in workspace mode.

### Workspace Mode
When a folder is opened in Visual Studio Code, you can use the extension in workspace mode. Workspace mode is entered automatically as soon as you download a script from exosite and choose to save the mapping of the online script to a local file.

Whenever you open that folder again, the extension will be in workspace mode.

#### Characteristics of Workspace Mode
* Domain is taken from exoedit.json, which implies that you can only work on Exosite artifacts of a single domain per folder.
* Credentials are taken from workspaceState.
* All 3 edit actions are available.
* All 3 upload actions are available.
* Publish command will publish the current file to the mapped artifact. You can set a keyboard shortcut for the publish command. The command's name is `exoedit.publish`.
* Download mapping decision (always/never) is taken from workspaceState.

#### Script Mapping
The mappings of your script files to the corresponding Exosite artifacts, as well as the Exosite domain, are stored in the file `exoedit.json`.

**JSON Example**
```json
{
    "domain": "foodomain.exosite.com",
    "mappings":{
        "lua":{
            "device": [
                { "path": "abc/one.lua", "rid": "abcd1234", "minify": "basic" },
                { "path": "abc/foo.lua", "rid": "foo123", "minify": "full" },
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

#### Lua script minification
You can choose to have lua scripts minified before they are published to Exosite. To do so, you can set the (optional) `minify` property
of the lua script's entry in exoedit.json to `basic` or `full` (see example above). 
* **`basic`** removes comments and white space at the beginning of lines. Does not remove any lines.
* **`full`** removes all comments, all unnecessary white space (including new line) and gives variables shorter names.

### Single File Mode
When you have not opened a folder in Visual Studio Code (i.e. you have just opened a file or nothing at all), the extension works in single file mode.

#### Characteristics of Single File Mode
* The domain always has to be entered.
* Credentials always have to be entered.
* All 3 download actions are available.
* All 3 upload actions are available.

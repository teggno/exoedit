# Exoedit Usage Modes
Exoedit can be used in workspace mode and in single file mode. Some actions are only available in workspace mode.

## Workspace Mode
When a folder is opened in Visual Studio Code, you can use the extension in workspace mode. Workspace mode is entered automatically as soon as you download a script from exosite and choose to save the mapping of the online script to a local file.

Whenever you open that folder again, the extension will be in workspace mode.

### Characteristics of Workspace Mode
* Domain is taken from exoedit.json, which implies that you can only work on Exosite artifacts of a single domain per folder.
* Credentials are taken from workspaceState.
* All 3 edit actions are available.
* All 3 upload actions are available.
* Publish command will publish the current file to the mapped artifact. You can set a keyboard shortcut for the publish command. The command's name is `exoedit.publish`.
* Download mapping decision (always/never) is taken from workspaceState.

## Single File Mode
When you have not opened a folder in Visual Studio Code (i.e. you have just opened a file or nothing at all), the extension works in single file mode.

#### Characteristics of Single File Mode
* The domain always has to be entered.
* Credentials always have to be entered.
* All 3 download actions are available.
* All 3 upload actions are available.

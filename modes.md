# Usage Modes
The extension can be used in single file mode and in workspace mode. Some actions are only available in workspace mode.

# Workspace Mode
When you have opened a folder in Visual Studio Code, you can use the extension in workspace mode. Workspace mode is entered automatically as soon as you download a script from exosite
and choose to save the mapping of the online script to a local file.

Whenever you open that folder again, the extension will be in workspace mode.

* **Domain is always taken from exoedit.json**
* **Credentials are taken from workspaceState**
* All 3 download actions are available.
* Download mapping decision (always/never) is taken from workspaceState
* All 3 upload actions are available.
    * If an unmapped file is being uploaded, the user is asked if a mapping should be saved (yes/no, but no never/always here)
    * If a mapped file is being uploaded and the user uploads it elswhere, she is asked if the mapping should be updated (yes/no, but no never/always here)
* Publish action will upload according to mapping. Action only appears if the current file is mapped
* Publish action will also be available as command

# Single File Mode
When you have not opened a folder in Visual Studio Code (i.e. you have just opened a file or nothing at all), the extension works in single file mode.

* **Domain always has to be entered**
* **Credentials always have to be entered**
* All 3 download actions are available.
* All 3 upload actions are available.




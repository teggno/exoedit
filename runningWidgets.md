# Running Widgets
Exoedit lets you run your widgets without having to publish them to Exosite. This might be helpful during development and testing.

## Providing Data to the Widget
According to the Exosite documentation, a widget's script must consist of a function that has **two arguments:**
* `container`: the html element to contain the widget's markup
* `portal`: an object containing contextual data for the widget

To be able to run a widget, Exoedit generates a page to contain it. This page will contain a `div` element that will be 
passed as the `container` argument.

What will be passed as the `portal` argument **depends on the type of widget**:
### Domain Widgets
Domain widgets are defined on domain level in Exosite.

Domain Widgets can only be run with fake data. This is because they cannot be configured with Dataports. See below how it works.

### Portal Widgets
Portal widgets are created on a dashboard.

Portal Widgets can be run with live and fake data. If you do not configure anything, they will display live data.

### Displaying Fake Data
If you want to display fake data, you can add the property `run` with the value `fake` to the widget's entry in the `exoedit.json` file.
```json
// Example for a Domain Widget
{ "path": "MyDomainWidget.js", "id": "8474987", "run": "fake" }
// Example for a Portal Widget
{ "path": "SomeFolder/MyPortalWidget.js", "dashboardId": "243242", "widgetTitle": "Awsome Widget", "run": "fake" }
```
The Widget then expects a file that is in the same folder and has the same name as the Widget's Script but the file extension `.json` instead of `.js`. This file needs to contain a JSON object that has the structure of the Widget's `portal` argument (see http://docs.exosite.com/widget/). Exoedit can help you creating such a file as follows:

1. Open the command list (by pressing F1 or Ctrl+Shift+P)
2. Select `Exoedit: Get data for a widget's "portal" argument`
3. You will have to select a portal, a dashboard and finally the widget that has the configuration that will result in the data you need.
4. A new editor window containing the JSON will be opened.

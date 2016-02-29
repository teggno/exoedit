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

Domain Widgets can only be run with fake data. This is because they cannot be configured with Dataports. See below how to display fake data.

### Portal Widgets
Portal widgets are created on a dashboard.

Portal Widgets can be run with live and fake data. If you do not configure anything, they will display live data.

### Displaying Fake Data
If you want to display fake data for a portal widget, you can add the property `fake` with the value `true` to the widget's entry in the `exoedit.json` file. (Domain widgets do not need this configuration because they can only display fake data.)
```json
{ "path": "SomeFolder/MyPortalWidget.js", "dashboardId": "243242", "widgetTitle": "Awsome Widget", "fake": true }
```
The Widget then expects a file that is in the same folder and has the same name as the Widget's Script but the file extension `.json` instead of `.js`.

#### Example fake data JSON file
```json
{
    "portal": {
        // ...
    },
    "read": {
        "deviceAlias1": {
            "dataPortAlias11": [
                [123456, "data value1"],
                [123457, "data value2"],
                [123458, "data value3"]
            ],
            "dataPortAlias12": [
                [123456, "data value4"],
                [123457, "data value5"]
            ]
        },
        "deviceAlias2": {
            "dataPortAlias21": [
                [123456, "data value1"],
            ],
            "dataPortAlias22": [
                [123456, "data value4"],
                [123457, "data value5"]
            ]
        }
    }
}
```
In the fake data JSON file, the value of the `portal` property must be an object with a structure like the object expected by the widget function's `portal` argument (see http://docs.exosite.com/widget/).

The `read` property's value is a map of device aliases. Each device alias has a map of data port aliases as value. The value for each data port alias is an array of data points. For the sample fake data above, when your widget code calls
```javascript
read([ "deviceAlias1", "dataPortAlias12" ], { starttime: 123457 })
``` 
the function will return 
```javascript
[[123457, "data value5"]]
```

#### Generating a fake data JSON file
Exoedit can help you generate a fake data JSON file as follows:

1. Open the command list (by pressing F1 or Ctrl+Shift+P)
2. Select `Exoedit: Generate Fake Data`
3. You will have to select a portal, a dashboard and finally the widget that has the configuration that will result in the data you need.
4. A new editor window containing the JSON will be opened. The JSON will contain the `portal` and the `read` property, but only the `portal` property will contain data wheraes the `read` property's value will be an empty object. 

### Serving additional files
In case your widgets need to load custom files (e.g. your css or js files), you can put them in a folder called `exoeditCustomFiles` directly in the folder you have opened with Visual Studio Code.
Note: jQuery 1.5.1 (which is the version provided by Exosite) is included by default.
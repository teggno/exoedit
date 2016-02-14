# Running Widget Scripts from Exoedit
With Exoedit you can run your widget scripts without having to publish them to Exosite. This might be helpful during development and testing.

## Providing Data to the Widget Scripts
Each widget script consists of a function that is called with **two arguments**: 
* `container`, the html element that will contain the widget's markup
* `portal`, an object containing contextual data for the widget

When running the widget script outside of Exosite, a page to contain the widget will be generated. This page will contain a `div` element that will be 
passed as the `container` argument, so you don't have to worry about that.

What will be passed as the portal argument **depends on the type of widget**:
### Domain Widgets
These are widgets that are globally defined in your Exosite domain.

#### What will be passed for Domain Widgets
This is configurable in the widget's entry in the Exoedit.json file:
* Content of a file that has the same name as the widget's script file but is suffixed with "TestData"

### Portal Widgets
These are widgets that only exist on a single dashboard. 

* Content of a file that has the same name as the widget's script file but is suffixed with "TestData"
* When defining portal widgets in Exosite, you can select the dataports the widget's script should
get. Exoedit can read the widget definition and pass the appropriate data.
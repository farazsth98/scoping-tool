# scope-tool

## Features

- Right click files in your workspace and choose the `Mark for Scoping` option.
- Use the new `Scope Tool` panel on the activity bar to provide estimations for each file.

![Marking a file for scoping](./media/markForScoping.png)

![Estimating a file](./media/estimatingFile.png)

## Requirements

This tool uses `cloc` to 

This tool has only been tested on Linux. It may work on MacOS and Windows.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## List of things TODO

- [ ] Implement functionality that allows marking entire directories for scoping.
- [ ] Implement functionality that allows estimating entire directories.
- [ ] Implement functionality tallies up estimations and LOC for each file in a directory, and cascades it up to parent directories.
# [BarnOwl 0.0.0](https://github.com/reelyactive/barnowl/)

All-in-one module that sustains reelyActive's better active RFID platform.

* [Documentation (N/A)]

## Quick Start

* Clone the repo: `git clone git@github.com:reelyactive/barnowl.git`
* Run the following to get all the dependancies: `[sudo] npm install`
* Make sure you have [Grunt](http://gruntjs.com/) CLI installed: `[sudo] npm install -g grunt-cli`

## Versioning

Releases will be numbered with the following format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backward compatibility bumps the major (and resets the minor and patch)
* New additions without breaking backward compatibility bumps the minor (and resets the patch)
* Bug fixes and misc changes bumps the patch

More details can be found on [reelyActive's TeamCentral versioning page](https://sites.google.com/a/reelyactive.com/teamcentral/collaboration/versioning).

## Contributing

### Dev workflow and branching model
The detailed workflow can be found on [reelyActive's TeamCentral development workflow page](https://sites.google.com/a/reelyactive.com/teamcentral/collaboration/developmentworkflow).

### Coding standards

Your code should conform to the JavaScript and Node.js coding standards as described on [reelyActive's TeamCentral coding standards page](https://sites.google.com/a/reelyactive.com/teamcentral/collaboration/codingstandards#TOC-Node-JavaScript-confirmed-). We use [JSHint](http://www.jshint.com/) to enforce coding conventions, and we've configured Grunt to wrap this task, so no need to install JSHint globally on your machine.  Simply run the following at the root of the source tree:

`grunt` OR `grunt jshint`

### Code documentation

TO BE COMPLETED

### Unit tests

Your code must include the relevant unit tests. We use [Mocha](http://visionmedia.github.com/mocha/), and again we've configured Grunt to wrap the tests, so no need to install Mocha globally on your machine. To run the tests, simply enter the following:

`grunt` OR `grunt tests`

More details can be found on [reelyActive's TeamCentral testing page](https://sites.google.com/a/reelyactive.com/teamcentral/collaboration/automatedtesting).

### Debugging

Use [node-inspector](https://github.com/dannycoates/node-inspector) to debug NodeJS code within the browser. To start a debug session, run (in a separate console):

`grunt debugServer`

To start debugging a specific file, run:

`grunt debug:pathToFile`

### Commits

Refer to the following [guidelines](https://sites.google.com/a/reelyactive.com/teamcentral/collaboration/committingchanges) when committing your changes.

### Bug Tracker

Use [github issue tracker](https://github.com/reelyactive/barnowl/issues). Please refer to [reelyActive's TeamCentral bug tracking guidelines](https://sites.google.com/a/reelyactive.com/teamcentral/collaboration/bugtracking).

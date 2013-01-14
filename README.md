# StrategyBlocks Light

## A light JavaScript framework for StrategyBlocks clients.

This is a work in progress. The code is currently being used by the StrategyBlocks Mobile iPhone client, but in a different form. This package isbeing created to unify the client-side interface to the server. The intention is that this package becomes the standard interface for all packages, including mobile, Flash/Flex, HTML5, and nodejs. 

There is no official support for this library at the moment, but feel free to raise issues and ask questions. I'll try to respond as soon as possible. 


### Usage

The built / optimized library is in the src/scripts/bin folder as sb_light.<version>.js


### Build

Install nodejs. 
Install requirejs node package: npm install requirejs
Build: r.js -o build.js

### Examples

**Node.js**
This framework supports nodejs (http://nodejs.org/) and an example is provides in the test folder. 

`node node_test.js` will prompt for authentication and fetch the blocks from the server. 


**Web Browser**
You can run this framework in the browser as well, but the test package provides some tools to make 3rd party-client development a bit easier on the browser. 

The file `web_test.html` requires several components to run properly:

1. The "connect" and "http-proxy" packages for nodejs. 
2. A valid account on a StrategyBlocks server. 
3. 3rd party libraries for the src/scripts/isv folder. Currently required are: "less" (less-1.3.1.min.js), require.js, and jquery (jquery-1.8.3.min.js).
4. If your browser doesn't support JSON, you also need to include the json2.js library. 
5. Any changes to the ISV files (version/name changes, additional files) need to be made in web_test.html. See the example "require" statement for how this works. Also see the requirejs documentation. 



# StrategyBlocks Light

## A light JavaScript framework for StrategyBlocks clients.

This is a work in progress. The code is currently being used by the StrategyBlocks Mobile iPhone client, but in a different form. This package isbeing created to unify the client-side interface to the server. The intention is that this package becomes the standard interface for all packages, including mobile, Flash/Flex, HTML5, and nodejs. 

There is no official support for this library at the moment, but feel free to raise issues and ask questions. I'll try to respond as soon as possible. 


### Usage

The built / optimized library is in the src/scripts/bin folder as sb_light.<version>.js. Each version appears there. 
The files are also copied to the root folder using version-less files so that the tests can have a consistent path. 


### Build

 - Install nodejs. 
 - Install requirejs node package: npm install requirejs
 - Build: node build/build.js

 
 
### Examples/Tests

All tests require an active account with StrategyBlocks. (30-day trials are available).
All tests do basically the same thing: check the server, prompt for login credentials, and fetch the blocks.
The node tests simply exit. The web_test.html changes the page type. Red is "unknown" state, green is the login page, and the blue page will notify you when the blocks have been fetched. 

They're pretty crude tests at the moment, but they handle a lot of the basic setup type things that you'll need when creating your own apps. 

**Pure Node (no requirejs)**

 - Install nodejs.
 - npm install commander
 - npm install superagent
 - npm install prompt
 - node test/node_test.js

** Nodejs + Requirejs **

 - Install nodejs.
 - npm install requirejs
 - npm install commander
 - npm install superagent
 - npm install prompt


** Web Browser Test **

The tests folder has a nodejs proxy server. (server.js). Run this, and then connect to your localhost:8888.

To run the server, you need:

 - nodejs
 - npm install connect 
 - npm install http-proxy

The server will proxy all the StrategyBlocks requests to the server listed in server.js, and fetch all other files from the local machine 
(any file located in "test,src,lib, or bin" folders).

The test file is located at: http://localhost:8888/test/web_test.js

You also need:

 - requirejs (http://requirejs.org/docs/release/2.1.2/minified/require.js)
 - jquery (http://code.jquery.com/jquery-1.8.3.min.js)
 - less (https://raw.github.com/cloudhead/less.js/master/dist/less-1.3.3.min.js)

(If any of the versions change, just update test/web_test.html)

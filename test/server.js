var connect = require('connect');
var http = require('http');
var httpProxy = require('http-proxy');

var SB_HOST = "app.strategyblocks.com";	//StrategyBlocks Server Domain
var SB_PORT= 443;						//StrategyBlocks Server Port
var SB_HTTPS = true;					//StrategyBlocks uses HTTPS?
var LOCAL_HOST = "localhost";			//Hostname of the local "src" web server (created here if CREATE_WEBSERVER=true)
var LOCAL_PORT = "8889";				//Port of the local "src" web server
var PROXY_PORT = "8888";				//Port of the proxy server running on this server
var CREATE_WEBSERVER = true;			// Creates a simple webserver to serve the content of the "src" and "test" folders

/*This is set to the default production StrategyBlocks address. If you want to use a different server,
//you need to update these settings. 
//e.g.,
		host: "my.internalserver.com"
		port: 80
		https: false

		Also note that the data will not be secure unless you run this proxy as an HTTP server.
		You can find some instructions for how to do this here:
				https://github.com/nodejitsu/node-http-proxy

		The scenario for this test is that you want to run an custom intranet-based client application for strategyblocks. 
		That is, maybe you want to combine StrategyBlocks data with internal data. Since SB is hosted outside your intranet, 
		it does not have access to your data. So you write a small client webpage /dashboard hosted internally that can mashup 
		SB data with yours. 

		Your custom client code would be stored in the "src" folder and the "sb_proxy" object handles all non-"src" requests by 
*/	

console.log("SB HOST: ", SB_HOST);
console.log("SB PORT: ", SB_PORT);
console.log("SB HTTPS: ", SB_HTTPS);
console.log("Listening on: ", PROXY_PORT);



var local_proxy = new httpProxy.HttpProxy({
	target: {
		host:LOCAL_HOST,
		port:LOCAL_PORT
	}
});



var server = http.createServer(function(req,res,proxy) {
	if(req.url.match(/^\/(test|src|lib|bin)/) === null) {
		console.log("Proxy to SB: ",req.url);
		var sb_proxy = new httpProxy.HttpProxy({
			target: {
				host:SB_HOST,
				port:SB_PORT,
				https:SB_HTTPS,
				buffer:httpProxy.buffer(req)
			}
		});
		sb_proxy.proxyRequest(req,res);
	} else {
		console.log("Proxy to: localhost:8889", req.url);
		local_proxy.proxyRequest(req,res);
	}


});



server.listen(PROXY_PORT);

if(CREATE_WEBSERVER) {
	console.log("DIRNAME: ", __dirname);
	var local = connect.createServer(
					connect.static(__dirname+"/..")
				).listen(LOCAL_PORT);
}


var program = require("commander")
var connect = require('connect');
var http = require('http');
var httpProxy = require('http-proxy');



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

program
  .version('0.0.1')
  .option('-h, --sb_host <sb_host>', 'specify the strategyblocks host [app.strategyblocks.com]', String, "app.strategyblocks.com")
  .option('-p, --sb_port <sb_port>', 'specify the port [443]', Number, 443)
  .option('-S, --no-ssl', 'disable ssl to strategyblocks')
  .option('-W, --no-webserver', 'disable creating a webserver to serve up non-strategyblocks files')
  .option('-w, --webserver_root <path>', 'create a webserver at a specific path [' + __dirname + "/..]", String, __dirname+"/.." )

  .option('-H, --localhost <localhost>', 'specify the host name of your webserver', String, "localhost")
  .option('-l, --localport <localport>', 'specify the host posrt of your webserver', Number, 8889)
  .option('-x, --proxyport <proxyport>', 'specify the port [8888]', Number, 8888)
  .parse(process.argv);



console.log("StrategyBlocks Host: ", program.sb_host);
console.log("StrategyBlocks Port: ", program.sb_port);
console.log("Using SSL?", program.ssl);
if(program.webserver) {
	console.log("Created Webserver", program.localhost, program.localport);	
} else {
	console.log("Proxy to webserver at: ", program.localhost, program.localport);
}

console.log("Proxy Server Listening on: ", program.proxyport);



var local_proxy = new httpProxy.HttpProxy({
	target: {
		host:program.localhost,
		port:program.localport
	}
});



var server = http.createServer(function(req,res,proxy) {
	if(req.url.match(/^\/(test|src|lib|bin)/) === null) {
		console.log("Proxy to SB: ",req.url);
		var sb_proxy = new httpProxy.HttpProxy({
			target: {
				host:program.sb_host,
				port:program.sb_port,
				https:program.ssl,
				buffer:httpProxy.buffer(req)
			}
		});
		sb_proxy.proxyRequest(req,res);
	} else {
		console.log("Proxy to Local: ", program.webserver_root + req.url);
		local_proxy.proxyRequest(req,res);
	}


});



server.listen(program.proxyport);

if(program.webserver) {
	console.log("DIRNAME: ", __dirname, program.webserver_root);
	var local = connect.createServer(
					connect.static(program.webserver_root)
				).listen(program.localport);
}


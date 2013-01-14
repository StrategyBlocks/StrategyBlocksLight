var requirejs = require('requirejs');
var program = require('commander');
var tty = require('tty');
var superAgent = require("superagent");


requirejs.config({
	nodeRequire: require,
	baseUrl:"../src/scripts",
	paths: {
		"sb_light": "bin/sb_light.0.0.1"
	}
});


//requirejs(["./bin/sb_light.0.0.1"], function(sb) { console.log("SB_BIN", sb?sb.state.host:"null"); });

requirejs(['sb_light'], function(sb) {


	program.version('0.0.1')
		.option('-u, --release [version string]', 'Release Number', '0.0.1')
		.option('-p, --output [name]', 'Output Name', 'sb_light.js') 	 
		.parse(process.argv);

	
	function handleSession(e) {
		if(sb.state.unauthorized()) {
			sb.ext.debug("Unauthorized. Prompting for authentication.");
			userLogin();	
		} else {
			sb.ext.debug("Authorized. Fetching blocks.");
			
			sb.models.subscribe("blocks", handleBlocks);
				
		}
		
		//console.log("Session: ", sb.state.authorized());	
	}
	
	
	function handleBlocks() {
		var blocks = sb.models.rawArray("blocks");
		sb.ext.debug("blocks: ", blocks ? blocks.length : "none");	
		
	}

	function userLogin() {
		var prompt = require("prompt");
		var properties = [
			{	name:"username", 
				validator: sb.ext.regEmail, 
				warning:"Must be a valid email address.",
				description: "Email address",
				"default":"glenn.murphy@strategyblocks.com"
			},
			{	name:"password", 
				required:true, 
				hidden:true,
				description:"Password"
			}
		];
		
		prompt.start();
		
		prompt.get(properties, function(err, result) {
			sb.state.login(result.username, result.password);
		});
	}
	
	sb.AJAX = sb.ajax.node();
	sb.requestAgent = superAgent.agent();
	
	sb.state.subscribe("session", handleSession);
	//sb.model.subscribe("blocks", handleBlocks);
	sb.state.login();
});
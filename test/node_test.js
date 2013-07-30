var program = require('commander');
var tty = require('tty');
var superAgent = require("superagent");
var sb = require("../bin/sb_light_commonjs.uncompressed");

var base  = __dirname + "/..";


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

	sb.state.host = "https://app.strategyblocks.com";	

	console.log("SB_MOMENT: ", sb.moment);


	
	sb.api.ajax = sb.ajax.node(superAgent.agent());
	sb.state.watchContext("session", handleSession);
	//sb.model.subscribe("blocks", handleBlocks);
	sb.state.login();





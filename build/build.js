
//This should be executed with node js. 
//     node build.js
//
//	Requires the requirejs npm, as well as "almond" from the build folder for the commonjs file. 


var fs = require('fs');
var rjs = require('requirejs');

var base  = __dirname+"/..";

fs.exists(base+'/version', function(exists) {
	if(!exists) { 
		throw "You're missing the version file. We collect the version information from a file called 'version' that contains a 3-part number (e.g., 1.1.1).";
	}

	optimize();
});	

function optimize() {

	var version = fs.readFileSync(base+'/version','utf8');
	



	var config = {
    	name:"sb_light",
    	baseUrl: (base+"/src/scripts"),
    	paths: {
        	sb:"sb_light"
    	},
    	out: (base+"/bin/sb_light."+version+".js"),
    	optimize:"uglify2",

		wrap:true,

//   		onBuildWrite: function(moduleName, path,contents) {
//	       return "\n\n /**\n * @version " + version + "\n */\n" + contents; 
 //  	 	}
	};

	var config_commonjs = {
    	name:"../../build/almond",
    	baseUrl: (base+"/src/scripts"),
    	include: "sb_light",
    	out: (base+"/bin/sb_light_commonjs."+version+".js"),
    	optimize:"uglify2",
    	namespace:"sb_light",
    	wrap:true,
   		onBuildWrite: function(moduleName, path,contents) {
			//we no longer need requirejs when using this, but we need to export the global class for commonjs / nodejs purposes.
	        //return "\n\n /**\n * @version " + version + "\n */\n" + contents + '\n\n ;module.exports = sb_light.require("sb_light");\n\n'; 
	        return  contents + '\n\n ;module.exports = sb_light.require("sb_light");\n\n'; 
   	 	}
	};	
	

	var curl = config.baseUrl + '/' + config.out;
	var cjsurl = config_commonjs.baseUrl + '/' + config_commonjs.out;
	
	//write the optimized output to config.out. This file requires requirejs to be loaded. 
	rjs.optimize(config, function(res) {
		fs.writeFileSync(base+'/bin/sb_light.min.js', fs.readFileSync(config.out, 'utf8'), 'utf8');
	});
	

	//write out the commonjs version. This file is standalone using commonjs format. (See onBuildWrite in the config_commonjs def.)
	rjs.optimize(config_commonjs, function(res) {
		fs.writeFileSync(base+'/bin/sb_light_commonjs.min.js', fs.readFileSync(config_commonjs.out, 'utf8'), 'utf8');
	});


};


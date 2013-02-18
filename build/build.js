//This should be executed with node js. 
//     node build.js
//
//	Requires the requirejs npm, as well as "almond" from the build folder for the commonjs file. 

var fs = require('fs');
var rjs = require('requirejs');

var base  = __dirname+"/..";

var version = "0.0.1";

var config = {
   	name:"sb_light",
   	baseUrl: (base+"/src"),
   	paths: {
       	sb:"sb_light",
		moment:"lib/moment"
   	},
   	optimize:"none",
	cjsTranslate: false,
	skipModuleInsertion:true
};

var config_commonjs = {
   	name:('../build/almond'),
   	baseUrl:(base+"/src"),
   	include: "sb_light",
   	optimize:"none",
   	namespace:"sb_light",
	paths: {
		moment: "lib/moment"
	},
   	wrap:true,
	onBuildWrite: function(moduleName, path,contents) {
		var expName = moduleName.split("/");
		expName = expName[expName.length-1];
		if(!expName.match(/(almond)/)) {
			return contents + "\n\n exports."+ expName + " = require('" + moduleName + "');\n\n";
		}
		return contents;
	},
	cjsTranslate: true,
	
	skipModuleInsertion:true
	
};

var types = [
	[config, "sb_light.%VERSION%.%COMPRESS%", "none"],
	[config, "sb_light.%VERSION%.%COMPRESS%", "uglify2"],
	[config_commonjs, "sb_light_commonjs.%VERSION%.%COMPRESS%", "none"],
	[config_commonjs, "sb_light_commonjs.%VERSION%.%COMPRESS%", "uglify2"],
];


function addVersion(f) {
	var output = fs.readFileSync(f, 'utf8');
	return "/**\n * @version " + version + "\n * \n */\n\n" + output;
}

var version = fs.readFileSync(base+'/version','utf8');


//chain all the types into a series of daisy-chained functions
var chain = types.reduceRight(function(prev,curr) {
	
	var c= Object.keys(curr[0]).reduce(function(prev,k) { prev = prev || {}; prev[k] = curr[0][k]; return prev; }, {}); 

	var f = curr[1];
	var o = curr[2];

	f = base + '/bin/' + f + '.js';

	f = f.replace(/%COMPRESS%/, o=="none"?"uncompressed":"min");
	c.out = f.replace(/%VERSION%/, version);
	f = f.replace(/\.%VERSION%/, "");

	c.optimize = o;
		
	console.log(c.out, f, o);
	
	return function(resp) {
		console.log("Optimizing: ", c.out);
		rjs.optimize(c, function(resp) {
			var output = addVersion(c.out);
			fs.writeFileSync(c.out, output, "utf8");
			fs.writeFileSync(f, output, "utf8");
			curr[3] = true;
			prev();
		}, function(err) {
			console.log(err);
		});
	}	

},	function(resp) { console.log("\n\n Your sb_light build has completed.\n\n"); }
);


chain();



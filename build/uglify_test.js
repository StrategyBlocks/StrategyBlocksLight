
//README: Require nodejs, uglify-js,  and the 'walk' package

var program = require('commander');

var walk = require('walk');
var ujs = require('uglify-js');
var fs = require('fs');

var files = [];


program.version('0.0.1')
	.option('-r, --release [version string]', 'Release Number', '0.0.1')
	.option('-o, --output [name]', 'Output Name', 'sb_light.js') 	 
	.parse(process.argv);

var output = program.output.split('.');
if(output[output.length-1] != 'js') { output.push('js'); }
output.splice(output.length-1, 0, program.release);
output = output.join('.');

console.log("Building: ", output);


function pushFile(root,stat,next) {
	files.push(root + '/' + stat.name);
    next();
};

function writeOutput() {
	console.log("About to minify " + files.length + " files: ");
	var res = ujs.minify(files, {outSourceMap:"sb_light.js.map"});
	fs.writeFileSync(output, res.code);	
	fs.writeFileSync("test/test_output.js", res.code);	
	fs.writeFileSync(output+'.map', res.map);	
};

var walker = walk.walk('./sb_light', {followLinks:false});
walker.on('file',pushFile); 
walker.on('end', writeOutput); 

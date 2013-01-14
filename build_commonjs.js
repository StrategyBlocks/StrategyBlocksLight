
({
	name:"isv/almond",
	baseUrl: "./src/scripts",
	include: "sb_light",	
	out: "./src/scripts/bin/sb_light_commonjs.0.0.1.js",
	optimize:"none",
	namespace:"sb_light",
	wrap:true,
	onBuildWrite: function(moduleName, path,contents) {
		return contents + "\n\n ; module.exports = sb_light;"; 
	}

})

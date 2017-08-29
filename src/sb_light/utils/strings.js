/* globals define */
define(['sb_light/globals', 'sb_light/utils/ext', 'sb_light/etc/pluralize'], function(sb, E, pluralize) {
	'use strict';

	var str = {};

	//Matches "sadasdadad   %(key:modifider:modifier) dljsdklfjskldfjslfk "

	var parseExpr = /\%\((.+?)\)/;
	str.getParserExpr = function() {
		return parseExpr;
	};

	str.parse = function(string) {
		var re =  new RegExp(parseExpr, "g");
		string = string || "";
		var match = re.exec(string);
		while (match) {
			//grab the captured group and split on ":"
			var opts = match[1].split(":");			
			//grab the first part as the key to the labels map
			var s = opts.shift();
			//fetch the label and replace the match with it
			var replace = str.label(s,opts);
			if (replace != s) {
				string = string.replace(match[0], replace);
			}
			var match = re.exec(string);
		}
		return string;
	};

	str.label = function(string, options) {
		var settings = sb.state.context("settings");
		if(!settings) { return string; }

		console.log("settings", settings)

		var labels = settings.labels;
		options = options || [];
		var  res = (labels && labels[string]) || string;

		E.each(options, function(o){
			if(str[o]) {
				res = str[o](res);
			}
		});

		console.log("GET LABEL", string, res);
		return res; 
	};


	str.titlecase = function(s) {
		return E.caps(s.split(" "));
	};

	str.lowercase = function(s) {
		return E.map(s.split(" "), function(v) {
			return v.toLowerCase();
		}).join(" ");
	};

	str.pluralize = function(s) {
		return pluralize(s)
	};


	return str; 
});			
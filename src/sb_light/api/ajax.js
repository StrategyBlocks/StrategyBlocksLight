
/*globals define, Ti */

define(['sb_light/globals'], function(sb) {
	
	var ajax = {};


	ajax.d3 = function(d3) { return function(opts) {
		// var url = opts.url.replace(/^(https?:\/\/)/, "//");
		var data =  sb.urls.o_to_params(opts.data);
		if(opts.type !== "POST" && data) {
			url += "?" + data;
		}
		var xhr = d3.json(url)
			.on("load", function(res) {
				//var resp = JSON.parse(res.responseText);
				opts.success(res);
			})
			.on("error", function(res) {
				//var resp = JSON.parse(res.responseText);
				opts.error(res);
			})
		;
		if(sb.state.host !== window.location.host) {
			xhr.header("Access-Control-Request-Method", opts.type);
		}


		if(opts.type !== "POST") {
			xhr.get();
		} else {
			xhr.header("Content-type", "application/x-www-form-urlencoded");
			xhr.post(data);
		}
	};};

	ajax.dojo = function(dojoRequest) { return function(opts) {
		opts.url = opts.url.replace(/^(https?:\/\/)/, "//");
		sb.ext.debug("dojo ajax", opts.type, opts.url);
		dojoRequest(opts.url, {
			method:opts.type,
			data:opts.data

		}).then(opts.success,opts.error);
	};};

	ajax.jquery = function(jquery) { return function(opts) {
		var cd = (sb.state.host != window.location.host);

		// opts.url = cd ? opts.url.replace(/^(https?:\/\/)/, "//") : opts.url.replace(/^(https?:\/\/)?.+?\//, "/");
		sb.ext.debug("jquery ajax", opts.type, opts.url, opts.dataType);
		

		jquery.ajax({
			type: 		opts.type,
			url: 		opts.url,
			data:		opts.data,
			dataType: 	opts.dataType,
			crossDomain: cd
		})
		.done(opts.success)
		.fail(opts.error);
	};};


	ajax.node = function(requestAgent) {  return function(opts) {
		sb.ext.debug("Request Agent: ", requestAgent);
		var _req = opts.type === "POST" ? requestAgent.post(opts.url).send(opts.data) :
										requestAgent.get(opts.url).query(opts.data);
		
		_req.set("Accept", "application/json")
			.end(function(res) {
				if(res.ok) {
					sb.ext.debug("Node Ajax success!", res.text);
					if(opts.success) {
						opts.success(JSON.parse(res.text));
					}
				} else {
					sb.ext.debug("Node Ajax Error", res.text);
					if(opts.error) { 
						opts.error(res.text);
					}
				}	
			})
		;
	};};
	


	
	return ajax;

});
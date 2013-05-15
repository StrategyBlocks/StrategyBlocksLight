
/*globals define, Ti */

define(['sb_light/globals'], function(sb) {
	
	var ajax = {};


	ajax.d3 = function(d3) { return function(opts) {
		var url = opts.url.replace(/^(https?:\/\/)/, "//");
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
		opts.url = opts.url.replace(/^(https?:\/\/)/, "//");
		sb.ext.debug("jquery ajax", opts.type, opts.url);
		

		jquery.ajax({
			type: 		opts.type,
			url: 		opts.url,
			data:		opts.data,
			dataType: 	opts.dataType,
			crossDomain: (sb.state.host !== window.location.host)
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
	

	ajax.titanium = function() {	return function(opts) {
		var p, str;
		if(!sb.ext.ti()) { return; }
		
	    // Merge with default props
	    var o = sb.ext.merge({
	        type: 'GET',
	        url: null,
	        data: false,
	        contentType: 'application/json',
	            // Ti API Options
	            async: true,
	            autoEncodeUrl: true,
	 
	            // Callbacks
	            success: null,
	            error: null,
	            beforeSend: null,
	            complete: null
        }, opts);
	 
       // Ti.API.info("XHR " + o.type + ": \n'" + o.url + "'...");
        var xhr = Ti.Network.createHTTPClient({ autoEncodeUrl: o.autoEncodeUrl,   async: o.async   });
 		if(o.type === "GET" && o.data) {
 			str = [];
 			for(p in o.data) {
 				str.put( p + "=" + encodeURIComponent(o.data[p]) );
 			}
 			o.url += "?" + str.join("&");
 			delete o.data;	
 		}
        // URL
        xhr.open(o.type, o.url);
	 
        // Request header
	    xhr.setRequestHeader('Content-Type', o.contentType);
	
        if(o.beforeSend) {
            o.beforeSend(xhr);
        }
	 
        // Errors
	    xhr.setTimeout(10000);
	    xhr.onerror = function() {
	       // Ti.API.info('XHR "onerror" ['+this.status+']: '+this.responseText+'');
	            if(null !== o.error) {
	                return o.error(this);
	            }
	        };
	    xhr.onload = function() {
	        // Success
	        // Log
	        //Ti.API.info('XHR "onload" ['+this.status+']: '+this.responseText.substr(200)  +'');
	 
            // Success = 1xx or 2xx (3xx = redirect)
	        if(this.status < 400) {
	            try {
	                if(null !== o.success) {
	                	var json = JSON.parse(this.responseText);
	                    return o.success(json);
	                }
	            } catch(e) {
	                Ti.API.error('XHR success function threw Exception: ' + e);
	                return;
	            }
	        // Error = 4xx or 5xx
	        } else {
	           //Ti.API.info('XHR error ['+this.status+']: '+this.responseText+'');
                if(null !== o.error) {
                    return o.error(this);
                }
            }
		};
	 
	    // Send
	    if(o.data) {
	        //Ti.API.info(o.data);
	        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(o.data);
		} else {
		    xhr.send();
		}
	 
        // Completed
	    if(null !== o.complete) {
	        return o.complete(this);
	    }
		
	};};
	
	

	
	return ajax;

});
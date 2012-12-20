


define(['../globals'], function(sb) {
	
	var ajax = {};



	ajax.jquery = function() { return function(opts) {
		//strip the host part of the url. Make this request server relative.  
		opts.url = opts.url.replace(/^(https?:\/\/)?.+?\//, "/");
		sb.ext.debug("jquery", opts.type, opts.url);
		

		sb.jquery.ajax({
			type: 		opts.type,
			url: 		opts.url,
			data:		opts.data,
			dataType: 	opts.dataType
		})
		.done(opts.success)
		.fail(opts.error);
	};};


	ajax.node = function() {  return function(opts) {
		var _req = opts.type == "POST" ? sb.requestAgent.post(opts.url).send(opts.data) :
										sb.requestAgent.get(opts.url).query(opts.data);
		
		_req.set("Accept", "application/json")
			.end(function(res) {
				if(res.ok) {
					sb.ext.debug("Sweet!", res.text);
					if(opts.success) {
						opts.success(JSON.parse(res.text));
					}
				} else {
					sb.ext.debug("Dam", res.text);
					if(opts.error) { 
						opts.error(res.text);
					}
				}	
			})
		;
	};};
	

	ajax.titanium = function() {	return function(opts) {
		if(!sb.ext.ti()) { return; }
		
	    // Merge with default props
	    var o = sb.ext.combine({
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
 		if(o.type == "GET" && o.data) {
 			var str = [];
 			for(var p in o.data) {
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
	                Ti.API.error('XHR success function threw Exception: ' + e + '');
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
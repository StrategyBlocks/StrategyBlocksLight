


define(['sb_light/globals'], function(sb) {
	var api = {};

	var _errorData = null;
	var _errorTimeout = 50;
	var _errorTimeoutDefault = 50;
	var _requestQueue =  [];

		
	api.get = function(url, params, success, failure, stateCheck, overrides) {
		api.request(url,params, false, success,failure,stateCheck, overrides);
	};
	
	api.post = function(url, params, success, failure, stateCheck, overrides) {
		api.request(url,params, true, success,failure,stateCheck, overrides);
	};

	api.request =  function(url, params, post, success,failure, stateCheck, overrides) {
		var stateFunc = (stateCheck || sb.state.authorized);
		if(stateFunc.call(sb.state)) {
			_request(url, params, post, success, failure, overrides); 
		} else if(failure) {
			failure(null);
		} else if (success) {
			success(null);
		}
	};
	
	function _request (url, params, post, success, failure, overrides) {
		sb.ext.debug("Sending request to ", url, post, JSON.stringify(params));
		if(!api.ajax) {
			throw "Error: sb.api.ajax has not been inititalized. Please set this value to one of the functions available in sb.ajax";
		}
		params = params || {};
		sb.state.addTimestamps(params);

		var opts = {
			url: url,
			type: (post ? "POST" : "GET"),
			data:params,
			dataType: 'json',
			context: api,
			success: _success.bind(null, sb.ext.slice(arguments)),
			error: _failure.bind(null, sb.ext.slice(arguments))
		};

		api.ajax(sb.ext.merge(opts, overrides||{}));
	}

	function _success(reqArray, data) {
		sb.ext.debug("SUCCESS: SB_Api", reqArray.join(" "));
		_errorTimeout = _errorTimeoutDefault;
		
		var wasValid = sb.state.authorized();
		
		var opts = reqArray && reqArray[5];

		//skip post-processing if we're dealing with non-json responses
		if(opts && opts.dataType != "json") {
			reqArray[3](data);
			_popQueue();
			return;
		}

		if (sb.state.update(data) ) {
			//success function in the original call
			var errors = sb.ext.getResultMessages(data).errors;
			
			if(!errors && reqArray[3]) {
				reqArray[3](data);
				_popQueue();
			}
			if(errors && reqArray[4]) {
				reqArray[4](data);
				_popQueue();
			}
		} else {
			if(wasValid) {
				//clear the queue
				_requestQueue.length = 0;
			}
			if(reqArray[4]) {
				reqArray[4](data);	
			}	
		}
	}
	
	function _failure (reqArray, data) {
		sb.ext.debug("FAILURE SB_Api", reqArray.join(" "), JSON.stringify(data));
		sb.state.context("session", sb.state.session_disconnected);
	}
	
	function _pushQueue (data) {
		var key = data.url + (JSON.stringify(data.params) || "");
		sb.ext.debug("Pushing request on the queue: ", key);
		if(_requestQueue.filter(function(el) { return el.key == key; } ).length == 0) {
			_requestQueue.push({key:key, data:data});
		}
	}
	
	function _popQueue () {
		if(_errorData) {
			sb.ext.debug("Running Error Request");
			_request.apply(this, this._errorData);
		} else if (_requestQueue.length > 0) {
			var r = _requestQueue.shift().data;
			if(r.state()) {
				_request.call(null, r.url, r.params, r.post, r.success, r.failure);
			} else {
				r.count += 1;
				if(r.count < this._maxRetries) {
					_pushQueue.bindDelay(null, _retryDelay, r);
				}
				_popQueue();
			}
		}
	}
	
	return api;
});


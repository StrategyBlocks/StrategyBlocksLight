
/*globals define */


//Subscription manager
//Created to help with D3 exit().remove(). 
//We need D3 element creation functions to be able to subscribe to SBLight events, but that
//means we need to unsubscribe when the remove() function is called. 
//sblight.svg now has subscribe() / cleanup() functions extended into d3 
//cleanup() will automatically call the subman.unsubscribe to remove the subscriptions.
//As long as the initial su

define(['sb_light/globals'], function(sb) {
	'use strict';

	var subs = {};
	var _subsCache = [];



	//opts:
	//	opts.type = model | state
	//	opts.group = state group
	//	opts.name = subscription name
	//	opts.handler = cb function 
	subs.subscribe = function(element, opts) {
		var match = _subsCache.find("element", element);
		if(!match.value) {
			_subsCache.push({element:element, subs:[]});
		}
		var elSubs = match.value || _subsCache.last();

		var found = false;
		if(opts.type == "model") {
			found= elSubs.subs.some(function(sub) {
				return sub.name == opts.name;
			});
			if(!found) {
				elSubs.subs.push({
					type:opts.type,
					name:opts.name,
					key: sb.models.subscribe(opts.type, opts.name, opts.handler)
				});
			}
		} else if (opts.type == "state") {
			found= elSubs.subs.some(function(sub) {
				return opts.group == sub.group && sub.name == opts.name;
			});
			if(!found) {
				elSubs.subs.push({
					type:opts.type,
					group:opts.group,
					name:opts.name,
					key:  sb.state.watch(opts.group, opts.name, opts.handler)
				});
			}

		}
	};

	subs.unsubscribe = function(element) {
		var elSubs = _subsCache.find("element", element).value;
		if(elSubs) {
			elSubs.subs.forEach(function(sub) {
				if(sub.type == "model") {
					sb.models.unsubscribe(sub.name, sub.key);
				} else 	if(sub.type == "state") {
					sb.state.unwatch(sub.group, sub.name, sub.key);
				}
			});
		}
	};


	return subs;
});


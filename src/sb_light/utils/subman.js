//Subscription manager
//Created to help with D3 exit().remove(). 
//We need D3 element creation functions to be able to subscribe to SBLight events, but that
//means we need to unsubscribe when the remove() function is called. 
//sblight.svg now has subscribe() / cleanup() functions extended into d3 
//cleanup() will automatically call the subman.unsubscribe to remove the subscriptions.
//As long as the initial su

define(['sb_light/globals'], function(sb) {
	var subs = {};

	var _subsCache = [];

	subs.subscribe = function(element, who, what, where) {
		var match = _subsCache.find("element", element);
		if(!match.value) {
			_subsCache.push({element:element, subs:[]});
		}
		var elSubs = match.value || _subsCache.last();
		var found = elSubs.subs.some(function(sub) {
			return sub.who == who && sub.what == what;
		});

		if(!found) {
			//sb.ext.debug("Subscribe", element, who, what)
			try {
			elSubs.subs.push({
				who:who,
				what:what,
				key: who.subscribe(what, where)
			})
			} catch(e) {
				sb.ext.debug("Capture error", e);
			}
			//sb.ext.debug("Done Subscribe");

		}
	};

	subs.unsubscribe = function(element) {
		var elSubs = _subsCache.find("element", element).value;
		if(elSubs) {
			elSubs.subs.forEach(function(sub) {
				//sb.ext.debug("Unsubscribe", element, sub.who, sub.what)
				sub.who.unsubscribe(sub.what, sub.key);
			});
		}
	};


	return subs;
});


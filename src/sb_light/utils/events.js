
define(['sb_light/globals'], function(sb) {

	var events = {};

	events.stop = function(e) {
		if(e && e.stopImmediatePropagation) {
			e.stopImmediatePropagation();
		}
		if(e && e.preventDefault) {
			e.preventDefault();
		}
	}

	return events;
	
});			
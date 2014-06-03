
define(['sb_light/globals'], function(sb) {

	var events = {};

	events.stop = function(e) {
		if(e && e.stopImmediatePropagation) {
			e.stopImmediatePropagation();
		}
		if(e && e.preventDefault) {
			e.preventDefault();
		}
	},

	events.locate = function(e, relativeTo, offsetX, offsetY) {
		var x = sb.ext.first(e.clientX, e.pageX);
		var y = sb.ext.first(e.clientY, e.pageY);

		if(relativeTo) {
			var rect = relativeTo.getBoundingClientRect();
			x -= sb.ext.first(rect.left, 0);
			y -= sb.ext.first(rect.top, 0);
		}
		x+= sb.ext.first(offsetX, 0);
		y+= sb.ext.first(offsetY, 0);
		
		return {x:x, y:y};
	}

	return events;
	
});			
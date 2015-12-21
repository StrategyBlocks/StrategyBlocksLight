

/*globals define,  moment, jQuery*/
/*jslint passfail: false */


define(["sb_light/globals", "sb_light/utils/ext", "jquery"], function(sb, E) {
	"use strict";

	(function ( $ ) {
		$.fn.rect = function() {
			var x =  E.merge(this.position(), {
				width:this.outerWidth(),
				height:this.outerHeight()
			});
			var offset = this.offset();

			x.x = x.left;
			x.y = x.top;

			x.screenX = offset.left;
			x.screenY = offset.top;

			return x;
		};

	}( jQuery ));

});
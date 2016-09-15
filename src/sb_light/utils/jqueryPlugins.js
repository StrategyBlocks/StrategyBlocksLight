

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

			x.screenX = offset ? offset.left : 0;
			x.screenY = offset ? offset.top : 0;


			x.scrollHeight = this.prop("scrollHeight");
			x.scrollWidth = this.prop("scrollWidth");

			return x;
		};

	}( jQuery ));

});
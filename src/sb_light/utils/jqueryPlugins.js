

/*globals define,  moment, jQuery*/
/*jslint passfail: false */


define(["sb_light/globals", "sb_light/utils/ext", "jquery"], function(sb, E) {
	"use strict";

	(function ( $ ) {
		$.fn.rect = function() {
			return E.merge(this.position, {
				width:this.outerWidth(),
				height:this.outerHeight()
			});
		};

	}( jQuery ));

});
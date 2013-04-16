
require(["dojo/_base/connect", "dojo/hash"], function(connect, hash){
    connect.subscribe("/dojo/hashchange", context, callback);
});

define(["dojo/_base/connect", "dojo/hash", "dojo/query"], function(connect,hash, q) {
	
	var sb = null;
	var app = {
		init: function(sb) {
			sb = sb;
			connect.subscribe("/dojo/hashchange", context, app.changeState);
			sb.state.subscribe("page", app.changePage)

			app.changeState();
		},

		changeState:function() {
			sb.state.url(hash())
		},


		handlePage:function() {
			
		}

	}

	return app;

});
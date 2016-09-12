
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			E = sb.ext;

			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("history", sb.urls.MODEL_HISTORY);
		},


		_processResponse:function(data) {
			var d = data && data.added;
			this._modelArray = d ? d.items: [];
			this._timestamp = d ? d.timestamp: 0;


 			this._model = E._.keyBy(this._modelArray, "created_at");

			this._massageUpdatedModel();
			//do this last because massage will cause changes			
			this._resetArrayCache();
			
			return true;

		},

		_massageUpdatedModel: function() {
			this._super();
			
			for(var i in this._model) {
				var h = this._model[i];
				h.fromNow = E.fromNow(h.created_at, E.unixFormat);
				h.date = E.moment(h.created_at, E.unixFormat);
				h.created_at = E.moment(h.created_at, E.unixFormat);
			}
		}

	});
	
	return Model;	
});



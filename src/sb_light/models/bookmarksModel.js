
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({

		init: function() {
			E = sb.ext;
		
			this._super("bookmarks", sb.urls.MODEL_BOOKMARKS);
		},

	/****************************

	bookmark: {
		page: The page we want to save
		block: current block ID
		metric: current metric ID
		risk: current Risk ID
		blockFilters: {
			search: 	
			tags: 		
			focus: 		
			owners: 	
			managers: 	
			groups: 	
			distance: 	
			levels: 	
			priority: 	
			ownership: 	
			status: 
		}
		blockSettings:  {
			"16179_16180_16188_16217" : {
				blockType: ""
				nodeType: ""
			}
			"16179" : {}
		}

		displaySettings:{
			nodeType:    //map node style
			blockType:	 //block view style
			mapLayoutType: //layout engine for blocks network
		}
	}




	*****************************/


		_massageUpdatedModel: function() {
			this._super();

			E.each(this._model, function(d) {
				d.state = JSON.parse(d.state);
				d.created_moment  = E.moment(d.created_at, E.unixFormat);
				d.created_str = E.serverDate(d.created_moment);

			});	

		}

		
		
	

	});



	return Model;
});

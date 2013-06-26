
define(['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "kpis", sb.urls.MODEL_KPIS);
		},

		_massageUpdatedModel: function() {
			this._super();
			var sb = this._sb;
			sb.ext.each(this._model, function(v,k) {
				sb.ext.massageKpi(v);
			});
		},

	});
	return Model;	
});


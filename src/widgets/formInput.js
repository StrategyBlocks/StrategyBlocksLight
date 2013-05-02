

define(['widgets/layoutWidget'], function( LW ) {

	var FormInput = LW.extend({


		create:function() {
			this._name = "layoutWidget::formInput"
			this._super();
		},

		_propertyOverrides: function() { 
			var po = this._super();
			po.type = this._setType.bind(this);
			po.value = this._setValue.bind(this);
			po.label = this._setLabel.bind(this);
			po.error = this._setError.bind(this);
			return po;
		},

		_setType: function(__ignore__, value) {
			this._layout.widgets[this.cid("input")].property("type", value);
		},
		_setLabel: function(__ignore__, value) {
			this._layout.widgets[this.cid("label")].text(null, value + ": ");
		},
		_setValue: function(__ignore__, value) {
			this._layout.widgets[this.cid("input")].property("value",value);
		},
		_setError: function(__ignore__, value) {
			this._layout.widgets[this.cid("error")].text(null,value);
		},

		childrenLayout:function() {
			return [
				{id:this.cid("label"), widget:"label", 	left:10, width:"24%", height:20, top:0, text:"Test Form Widget", style:"text-align:right"},
				{id:this.cid("input"), widget:"input", 	left:this.cidDim("label","right",20), width:"40%", height:20, top:0, value:"Test Input Widget"},
				{id:this.cid("error"), widget:"div", 	left:this.cidDim("input","right",20), width:"36%", height:20, top:0, text:"Error Widget"}
			]
		}
	});

	return FormInput;

});
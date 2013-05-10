

define(['widgets/layoutWidget'], function( LW ) {

	var FormInput = LW.extend({


		create:function() {
			this._name = "layoutWidget::formInput";
			this._super();
		},

		_propertyOverrides: function() { 
			var po = this._super();
			po.type = this.bind("type");
			po.value = this.bind("value");
			po.label = this.bind("label");
			po.error = this.bind("error");
			return po;
		},

		type: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "type" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("input")].property("type", value);	
				return this;
			}
			return this._layout.widgets[this.cid("input")].property("type");
		},
		label: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "label" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("label")].text(value);	
				return this;
			}
			return this._layout.widgets[this.cid("label")].text();
		},
		value: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "value" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("input")].dom().value = value;	
				return this;
			}
			return this._layout.widgets[this.cid("input")].dom().value;
		},
		error: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "error" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("error")].text(value);	
				return this;
			}
			return this._layout.widgets[this.cid("error")].text();
		},

		childrenLayout:function() {
			return [
				{id:this.cid("label"), widget:"label", left:10, width:"24%", height:20, top:0, text:"Test Form Widget", style:"text-align:right"},
				{id:this.cid("input"), widget:"input", left:this.cidDim("label","r",20), width:"40%", height:20, top:0, value:"Test Input Widget"},
				{id:this.cid("error"), widget:"div", left:this.cidDim("input","r",20), width:"36%", height:20, top:0, text:"Error Widget"}
			];
		}
	});

	return FormInput;

});
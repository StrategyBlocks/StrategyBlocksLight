

define(['widgets/widget'], function( W ) {

	var FormInput = W.extend({


		create:function() {
			this._name = "widget::formInput";
			this._super();
		},

		postCreate: function() {
			this.className("formInput");
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
				this._layout.widgets[this.cid("input")].dom.value = value;	
				return this;
			}
			return this._layout.widgets[this.cid("input")].dom.value;
		},
		error: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "error" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("error")].text(value);	
				return this;
			}
			return this._layout.widgets[this.cid("error")].text();
		},

		createLayout:function() {
			this._defaultLayout = [
				{id:this.cid("center_hack"), widget:"div", fringe:"49%" , style:"display:none;"},
				{id:this.cid("label"), widget:"label", left:0, right:this.cidDim("input","l"), height:40, top:0,
					text:"Test Form Widget", style:"text-align:right;padding:10px 8px;"},
				{id:this.cid("input"), widget:"input", left:this.cidDim("center_hack","l", -150), width:300, height:40, top:0, tabindex:1,
					value:"Test Input Widget", size:40, style:"padding:10px 8px"},
				{id:this.cid("error"), widget:"div", left:this.cidDim("input","r"), height:40, top:0, right:0,
					text:""}
			];
			this._super();
		}
	});

	return FormInput;

});
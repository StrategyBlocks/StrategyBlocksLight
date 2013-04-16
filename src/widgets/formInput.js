

define(['widgets/layoutWidget'], function( LW ) {

	var FormInput = LW.extend({

		_layout: null,
		_root: "div",

		init:function(sb, parentNode, def) {
			this._name = "layoutWidget::formInput"
			this._super(sb,parentNode,def);
		},

		childrenLayout:function() {
			var lid = this.id()+"_label";
			var iid = this.id()+"_input";
			var eid = this.id()+"_error";


			return [
				{id:lid, widget:"label", left:10, width:"24%", height:20, top:0, text:"Test Form Widget", style:"text-align:right"},
				{id:iid, widget:"input", left:("@"+lid+"#right#20"), width:"40%", height:20, top:0, value:"Test Input Widget"},
				{id:eid, widget:"error", left:("@"+iid+"#right#20"), width:"36%", height:20, top:0, text:"Error Widget"}
			]
		}
	});

	return FormInput;

});
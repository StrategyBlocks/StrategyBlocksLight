define([
	'widgets/widget', 
	'widgets/formInput', 
	
], function( W, FormInput) {

	var Login = W.extend({



		create:function() {
			this._name = "widget::loginPage";
			this._super();
		},

		postCreate: function() {
			this._super();
			this.dom().addEventListener("submit", this.bind("_handleSubmit"));
		},

		createLayout:function() {
			this._defaultLayout = [
				{id:this.cid("center_hack"), widget:"div", fringe:"49%" , style:"display:none;"},
				{id:this.cid("form"), widget:"form", left:this.cidDim("center_hack", -300), right:this.cidDim("center_hack", -300), 
					top:50, bottom:50, 
					children: [
						{id:this.cid("title"), widget:"h3", text:"Welcome to StrategyBlocks", left:20, right:20, top:40, height:30, style:"text-align:center"},
						{id:this.cid("error"), widget:"p", left:20, right:20, top:this.cidDim("title", "b", 20), height:30},
						{id:this.cid("username"), widget:FormInput, left:20, right:20, top:this.cidDim("error", "b", 20), height:30, value:"glenn.murphy@strategyblocks.com", label:"Email", error:""},
						{id:this.cid("password"), widget:FormInput, left:20, right:20,  top:this.cidDim("username", "b", 20), type:"password", value:"", height:30, label:"Password", error:""},
						{id:this.cid("submit"), widget:"button", type:"submit", width:80, left:"28%", height:25,  top:this.cidDim("password", "b", 50), text:"Sign-In"}
					]
				}
			];
			this._super();
		},

		_handleSubmit: function(e) {
			this._sb.events.stop(e);

			var uname = this.child("username").value();
			var pw = this.child("password").value();


			this._sb.state.login(uname,pw, this.bind("_handleSubmitResponse"),this.bind("_handleSubmitResponse"));
		},

		_handleSubmitResponse: function(res) {
			var rm = this._sb.ext.getResultMessages(res);
			if(rm.errors) {
				if(res && res.result && res.result.errors && result.errors.form) {
					this.cid("username").error(res.result.errors.form.username);
					this.cid("password").error(res.result.errors.form.password);
				}
			}
			this.child("error").text(rm.errors ? rm.errors.message : (rm.warnings || rm.notices || ""));
			this.child("error").className("error", !rm.errors );
			this.child("error").className("warning", rm.errors || !rm.warnings );
			this.child("error").className("notice", rm.errors || !rm.notices );
		}


	});

	return Login;
});
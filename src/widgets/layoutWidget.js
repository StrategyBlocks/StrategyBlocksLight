

define(['widgets/widget'], function( Widget ) {

	var LayoutWidget = Widget.extend({

		_layout: null,

		init:function(sb, parentNode, def) {
			this._rootElement = this._rootElement || "div";
			this._super(sb, parentNode, def		);
		},

		destroy: function() {
			this._sb.ext.each(this._layout.widgets, function(v,k) {
				v.destroy();
			});
			//parent nullifies all "_" "member" variables
			//parent removes all dom children
			this._super();
		},

		//create the 
		createDom:function(opts) {
			opts.widget = this._rootElement;
			this._dom = this._super(opts);
			this._layout = this._sb.layout.parse(this,this.childrenLayout(), true);
			return this._dom;
		},

		childrenLayout: function() {
			return [];
		},


		child: function(id) {
			return this._layout ? (this._layout.widgets[id] || this._layout.widgets[this.cid(id)]) : null;
		},

		//called by a high-level layout, but we need to apply these sizes to the root of our DOM
		//and run the resize/
		applyLayout:function() {
			if(this._created) {
				this._super();
				this._sb.queue.add(this.bind("handleResize"), "handleResize_"+this.id());
			}
		},

		handleResize: function(e) {
			if(this._created) {
				this._super(e);
				var rect = this._dom.getBoundingClientRect();
				this._layout.rootWidth = rect.width;
				this._layout.rootHeight = rect.height;
				this._sb.layout.resize(this._layout);
			}
		}

	});

	return LayoutWidget;

});
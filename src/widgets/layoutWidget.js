

define(['widgets/widget'], function( Widget ) {

	var LayoutWidget = Widget.extend({

		_layout: null,

		init:function(sb, parentNode, def) {
			this._rootElement = this._rootElement || "div";
			this._super(sb, parentNode, def		);
		},
		//create the 
		createDom:function(opts) {
			opts.widget = this._rootElement;
			this._dom = this._super(opts);
			this._layout = this._sb.layout.parse(this,this.childrenLayout(), true);
			return this._dom;
		},

		childrenLayout: function() {
			return null;
		},


		child: function(id) {
			return this._layout.widgets[this.cid(id)];
		},

		//called by a high-level layout, but we need to apply these sizes to the root of our DOM
		//and run the resize/
		applyLayout:function() {
			this._super();
			this._sb.queue.add(this.bind("handleResize"), "handleResize_"+this.id());
		},

		handleResize: function(e) {
			this._super(e);
			var rect = this._dom.getBoundingClientRect();
			this._layout.rootWidth = rect.width;
			this._layout.rootHeight = rect.height;
			this._sb.layout.resize(this._layout);
		}

	});

	return LayoutWidget;

});
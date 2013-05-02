

define(['widgets/layoutWidget'], function( LW ) {

	var R = LW.extend({
		_dragPos: null,
		_dragDim:"left",
		_min: 0,
		_max: 0,
		

		create: function() {
			this._name = "layoutWidget::resizer";
			this._provideEvents("resize");
			this._super();
		},

		postCreate:function() {
			this._super();
			this.dom().addEventListener("mousedown", this.bind("_startDrag"));
		},

		_propertyOverrides: function() { 
			var po = this._super();
			po.min = this.bind("prop");
			po.max = this.bind("prop");
			return po;
		},


		childrenLayout:function() {
			return [
				{id:this.cid("mainBar"), widget:"div", fringe:2,  style:"background-color:#FFF;border:solid 1px black;"},
				{id:this.cid("ghostBar"), widget:"div", fringe:3,  left:4, style:"background-color:#000"}
			];
		},


		applyLayout: function() {
			this._super();
		},

		applyProperties: function() {
			this._super();
			var rect = this.dom().getBoundingClientRect();
			this._dragDim = rect.width > rect.height ? "top" : "left";
			this.className(this._horizontal ? "resizer-v" : "resizer-h");
		},

		_startDrag: function(e) {
			this._sb.events.stop(e);
			this._dragging = this.dim(this._dragDim);
			this.className("dragging");
			this.dom().ownerDocument.body.addEventListener("mousemove", this.bind("_drag"));
			this.dom().ownerDocument.body.addEventListener("mouseup", this.bind("_stopDrag"));
		},
		_drag: function(e) {
			var prect = this._parent.getBoundingClientRect();
			var pos = (this._dragDim == "left" ? e.clientX : e.clientY) - prect[this._dragDim];


			pos = this._sb.ext.range(this._min, this._max, pos);

			this._sb.ext.debug("Resizer::Drag", this.id(), this._dragDim, this._min, this._max, pos, e.clientX, prect.left);



			this.dim(this._dragDim, pos);
		},
		_stopDrag:function(e) {
			this._sb.ext.debug("Resizer::DragDone", this.id(), this._dragDim)
			this.className("dragging", true);
			this.dom().ownerDocument.body.removeEventListener("mousemove", this.bind("_drag"));
			this.dom().ownerDocument.body.removeEventListener("mouseup", this.bind("_stopDrag"));

			this.trigger("resize");	
		}

	});

	return R;

});
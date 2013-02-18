
define(['../globals'], function(sb) {

	var svg =  {};
	
	//given a series of x points and y points, generate a
	//grid that fits the given dimension
	//returns an SVG path string
	svg.gridPath = function(x,y,w,h, xLinesOrStep, yLinesOrStep) {
		var p = [];
		var t= this;
		var xlines = (typeof xLinesOrStep == "number") ? d3.range(x+xLinesOrStep,x+w,xLinesOrStep) : xLinesOrStep;
		yLinesOrStep = yLinesOrStep || xLinesOrStep;
		var ylines = (typeof yLinesOrStep == "number") ? d3.range(y+yLinesOrStep,y+h,yLinesOrStep) : yLinesOrStep;
		
		xlines.forEach(function(el) {	p.put(t.M(el,y),t.v(h));	});
		ylines.forEach(function(el) {	p.put(t.M(x, el),t.h(w));	});
		return p.join("");
	};
		
		
		//Generate a path definition for a simple popup
		//pointerType supports 12 types (string): (Default is "TM")
		// TL, TM, TR: Top positions (left  middle  right)
		// LT, LM, LB: Left positions (top middle bottom)
		// BL, BM, BR: Bottom positions (left  middle  right)
		// RT, RM, RB: Right positions (top middle bottom)
		
	svg.popupPath = function(x,y, w,h, pointerType) {
		var cr = 10;
		var cr2 = cr*2;
		var pw = 15; //half pointer width
		var pw2 = pw*2;
		var ph = 15; //full pointer height
		var t = this;
		
		pointerType = pointerType || "TM";
		var path = [];
		if(pointerType.charAt(0) == "T") {
			path.put(t.M(x+cr,y));
			switch(pointerType.charAt(1)) {
				case "L": path.put(t.l(pw,-ph),t.l(pw,ph), t.h(w-pw2-cr2)); 	break;
				case "M": path.put(t.h( (w-cr2-pw2)/2), t.l(pw,-ph),t.l(pw,ph), t.h((w-cr2-pw2)/2 )); 	break;
				case "R": path.put(t.h(w-pw2-cr2), t.l(pw,-ph),t.l(pw,ph)); 	break;
			}
			
			path.put(	t.q(cr,0,cr,cr),		t.v(h-cr2));
			path.put(	t.q(0,cr,-cr, cr),		t.h(cr2-w));
			path.put(	t.q(-cr,0,-cr,-cr),		t.v(cr2-h));
			path.put(	t.q(0,-cr,cr,-cr));
		} else if(pointerType.charAt(0) == "R") {
			
		} else if(pointerType.charAt(0) == "B") {
		} else if(pointerType.charAt(0) == "L") {
		}
		
		return path.join("");
	};
		
	svg.transform = function(o) { 
		var t = [];
		
		if(o.r) { t.put(this.rotate.apply(this,o.r)); }
		if(o.s) { t.put(this.scale.apply(this,o.s)); }
		if(o.t) { t.put(this.translate.apply(this, o.t)); }
		return t.join(" "); 
	};
	
	svg.translate = 	function(x,y) { return (isNaN(y) ? ["translate(",x,")"] : ["translate(",x,", ",y,")"]).join("");  };
	svg.scale =  		function(x,y) { return (isNaN(y) ? ["scale(",x,")"] : ["scale(",x,", ",y,")"]).join(""); };
	svg.rotate =	 	function(x) { return "rotate("+x+")"; };
	svg.viewBox = 		function(x,y,w,h) { return [x,y,w,h].join(" "); };
	svg.l =				function(x,y) { return ["l",x,this._sep,y].join(""); };
	svg.L = 			function(x,y) { return ["L",x,this._sep,y].join(""); };
	svg.m =				function(x,y) { return ["m",x,this._sep,y].join(""); };
	svg.M =				function(x,y) { return ["M",x,this._sep,y].join(""); };
	svg.h = 			function(d) { return ["h",d].join(""); };
	svg.H =				function(d) { return ["H",d].join(""); };
	svg.v =				function(d) { return ["v",d].join(""); };
	svg.V = 			function(d) { return ["V",d].join(""); };
	svg.q = 			function(cx,cy,x,y) { var s= this._sep; return ["q",cx,s,cy,s,x,s,y].join(""); };
	svg.Q =				function(cx,cy,x,y) { var s= this._sep; return ["Q",cx,s,cy,s,x,s,y].join(""); };
		
		
		//utils for d3
		
		//takes "x.foo y.bar.stuff" and appends the nodes, returning the last node created (y) so we get
		//  src > x[class=foo] > y[class=bar stuff]
		// "src" needs to be a d3 object
		// "selector" needs to be a string
		// "func" takes the element to be returned and applies custom creation logic to it. 
	svg.append =  function(src, selector, func) {
		var res = src.select(selector);
		if(res.empty()) {
			res = src;
			var nodes = selector.split(" ");
			nodes.forEach(function(el) {
				//protect from extra spaces (or invalid elements)
				if(el && el.length > 0 ) {
					if( res.select(el).empty()) {
						var parts = el.split(".");
						res =res.append(parts.shift()).attr("class", parts.join(" "));
					} else {
						res = res.select(el);
					}
				}
			});
			//only execute when this is being created
			if(func != null) {
				func(res);
			}
		}
		return res;
	};
		
		//takes "x.foo y.bar.stuff" and removes only y.var.stuff
	svg.remove = function(src, selector) {
		var el = src.select(selector);
		if(!el.empty()) {
			el.remove();
		}
	};
		
		//selection comes last so you can bind the function with args first, then use it in the d3 selection "call"
		//e.g., svg.selectAll("rect").call(sb.svg.dims.bind(null, 0,0,100,100));
	svg.dims = function(x,y,w,h, selection) {
		selection.attr("x", x).attr("y", y).attr("width", w).attr("height", h);
		return selection;
	};

	return svg;
	
});
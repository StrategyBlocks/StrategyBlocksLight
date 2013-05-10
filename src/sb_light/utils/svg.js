
define(['sb_light/globals'], function(sb) {

	var svg =  {};

	svg.ZERO = 1e-6;

	svg.extendD3 = function(name, func) {
		//prototypes to extend
		d3.selection.prototype[name] = 
		d3.transition.prototype[name] = 
		d3.selection.enter.prototype[name] = 
		//the function
		func;
	}

	//extensions to d3
	//adds x,y,width,height to "rect" type SVG elements
	//skips any property that === null
	svg.extendD3("rect", function(x,y,width,height) {
		var sel = this;
		var args= sb.ext.slice(arguments);
		if(args.length) {
			["x","y","width","height"].forEach(function(dim,i){
				if(args[i] !== null) {
					sel.dim(dim, args[i]);
				}
			});
			return sel;
		}

		return ["x","y","width","height"].reduce(function(prev, el) {
			return sb.ext.set(prev, el, sel.dim(el));
		}, {});
	});

 	
	//basically gets/sets any numeric attribute (dimension).
	// on set:
	//		if the element isn't SVG and the value is not a function, add "px" to it
	// on get:
	//		parse a  float from the string.
	svg.extendD3("dim", function(name, value) {
		return arguments.length ? 
			this.attr(name, svg.isSvg(this.node() || sb.ext.isFunc(value)) ? value : sb.ext.px(value)) : 
			sb.ext.to_f(this.attr(name));
	});

	//get/set the corners on a rect, for instance. (rx/ry)
	svg.extendD3("corners", function(rx,ry) {
		if(arguments.length) {
			this.dim("rx", rx);
			this.dim("ry", ry);
			return this;
		}
		return {rx:this.dim("rx"), ry:this.dim("ry")};
	});
	//get/set the corners on a rect, for instance. (rx/ry)
	svg.extendD3("class", function(classA/*...*/) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			this.attr("class", args.join(" "));
			return this;
		}
		return this.attr("class");
	});

	//get/sets the size and position of a circle
	svg.extendD3("circle", function(r, cx,cy) {
		if(arguments.length) {
			this.dim("r", r);
			this.dim("cx", cx);
			this.dim("cy", cy);
			return this;
		}
		return {r:this.dim("r"), cx:this.dim("cx"), cy:this.dim("cy")};
	});
	//get/sets the points on a line
	svg.extendD3("line", function(x1,y1,x2,y2) {
		if(arguments.length) {
			this.dim("x1", x1);
			this.dim("x2", x2);
			this.dim("y1", y1);
			this.dim("y2", y2);
			return this;
		}
		return {x1:this.dim("x1"), y1:this.dim("y1"),x2:this.dim("x2"), y2:this.dim("y2")};
	});


	svg.isSvg = function(el) {
		return el.ownerSVGElement != null; 
	}

	svg.multiline = function(el, text, dx,dy) {
		if(!text) { return ; }
		el = d3.select(el);
		var width= el.attr("width");
		//var domEl = el.get(0);
		var words = text.split(' ');                        
		var tspan = el.append("tspan");
		tspan.text(words[0]);

		for(var i=1; i<words.length; i++){
			var tst = tspan.text();             // Find number of letters in string
			var len = tst.length;
			tspan.text(tst + " " + words[i]);

			if (tspan.node().getComputedTextLength() > width)	{
				tspan.text(tst);

				tspan = el.append("tspan").attr("x",  sb.ext.number(dx,10))
											.attr("dy", sb.ext.number(dy,18))
											.text(words[i])
				;
			}
		}
		return el;
	};	
	
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
				case "L": path.put(t.l(pw,-ph),t.l(pw,ph), t.h(w-pw2-cr2));
					break;
				case "M": path.put(t.h( (w-cr2-pw2)/2), t.l(pw,-ph),t.l(pw,ph), t.h((w-cr2-pw2)/2 ));
					break;
				case "R": path.put(t.h(w-pw2-cr2), t.l(pw,-ph),t.l(pw,ph));
					break;
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
		console.log("transform", t.join(" "));
		return t.join(" "); 
	};
	var sep = ",";
	svg.translate = 	function(x,y) { return (isNaN(y) ? ["translate(",x,")"] : ["translate(",x,", ",y,")"]).join("");  };
	svg.scale =  		function(x,y) { return (isNaN(y) ? ["scale(",x,")"] : ["scale(",x,", ",y,")"]).join(""); };
	svg.rotate =	 	function(x) { return "rotate("+x+")"; };
	svg.viewBox = 		function(x,y,w,h) { return [x,y,w,h].join(" "); };
	svg.l =				function(x,y) { return ["l",x,sep,y].join(""); };
	svg.L = 			function(x,y) { return ["L",x,sep,y].join(""); };
	svg.m =				function(x,y) { return ["m",x,sep,y].join(""); };
	svg.M =				function(x,y) { return ["M",x,sep,y].join(""); };
	svg.h = 			function(d) { return ["h",d].join(""); };
	svg.H =				function(d) { return ["H",d].join(""); };
	svg.v =				function(d) { return ["v",d].join(""); };
	svg.V = 			function(d) { return ["V",d].join(""); };
	svg.q = 			function(cx,cy,x,y) { var s= sep; return ["q",cx,s,cy,s,x,s,y].join(""); };
	svg.Q =				function(cx,cy,x,y) { var s= sep; return ["Q",cx,s,cy,s,x,s,y].join(""); };
		
	svg.path = function() {
		return sb.ext.slice(arguments).join("");
	}	

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
			if(func) {
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

	svg.dim = function(sel, dim, value) {
		if(arguments.length == 3) {
			return sel.attr(dim, value);
		}
		return sb.ext.to_f(sel.attr(dim));
	};


	//quick style
	svg.style = function(selection/*, arguments*/) {
		for(var i = 1; i < arguments.length; i+=2) {
			var prop = arguments[i];
			prop = styleMap[prop] || prop;
			selection.style(prop, arguments[i+1]);
		}
		return selection;
	};

	var styleMap = {
		t: "font",
		f:"fill",
		fo:"fill-opacity",
		s: "stroke",
		so:"stroke-opacity",
		sw:"stroke-width",
		slc: "stroke-linecap",
		slj: "stroke-linejoin",
		sda:"stroke-dasharray",
		ta:"text-anchor"
	};

	return svg;
	
});

/*globals define*/

define(['sb_light/globals', 'sb_light/utils/ext'], function(sb, ext) {

	'use strict';

	var svg =  {};

	var d3 = ext.global("d3") && d3 || {"__missing" : true};

	svg.ZERO = 1e-6;


	svg.initD3 = function(_d3) {		
		var c = d3.__cached || {};
		d3 = _d3;	
		//add the d3 extensions that were cached. 
		sb.ext.each(c, function(v,k) {
			svg.extendD3(k,v);
		});
	};

	svg.extendD3 = function(name, func) {
		//protection for the compiled files. d3 is not necessarily required for this library to work. 
		if(d3.__missing) { 
			//save the extensions in case D3 gets set  later. 
			d3.__cached = d3.__cached || {};
			d3.__cached[name] = func;
			return; 
		}
		//prototypes to extend
		d3.selection.prototype[name] = 
		d3.transition.prototype[name] = 
		d3.selection.enter.prototype[name] = 
		//the function
		func;
	};

	svg.extendD3("isD3", function() {
		return true;
	});


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

	//takes an object taking the subscribe call(who),
		//a string describing what to subscribe to (what), and
		//a cb function to handle the subscription (where)
	svg.extendD3("subscribe", function(opts) {
		var sel = this;
		sel.each(function(d,i) {
			sb.subman.subscribe(this, opts);
		});
		return sel;
	});

	svg.extendD3("cleanup", function() {
		var sel = this;
		sel.each(function(d,i) {
			sb.subman.unsubscribe(this);
		});
		sel.remove();
		return sel;
	});
 	
	//basically gets/sets any numeric attribute (dimension).
	// on set:
	//		if the element isn't SVG and the value is not a function, add "px" to it
	// on get:
	//		parse a  float from the string.
	svg.extendD3("dim", function(name, value) {
		if(arguments.length > 1) {
			if( svg.isSvg(this.node()) )  {
				this.attr(name, value);
			} else {
				if(name == "x") { name = "left"; }
				if(name == "y") { name = "top"; }
				this.style(name, (sb.ext.isFunc(value) || sb.ext.isString(value)) ? value : sb.ext.px(value));
			}
			//this.attr(name, svg.isSvg(this.node() || sb.ext.isFunc(value)) ? value : sb.ext.px(value)) 

			return this;
		} 
		return sb.ext.to_f( svg.isSvg(this.node()) ? this.attr(name) : this.style(name) );
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
	//set multiple classes on an svg item directly. 
	svg.extendD3("class", function(classA/*...*/) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			this.attr("class", args.join(" "));
			return this;
		}
		return this.attr("class");
	});


	//set the title on elements
	svg.extendD3("title", function(s) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			return this.attr("title", s);
		}
		return this.attr("title");
	});

	//set the rx/ry on elements. When "get" is done, returns only "rx" for the first selection item
	svg.extendD3("radius", function(r) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			return this.attr("rx", r).attr("ry", r);
		}
		return this.attr("rx");
	});

	//set the text anchor
	svg._anchorMap = {
		"left":"start", "start":"start", "l":"start", "s":"start",
		"center":"middle", "middle":"middle", "c":"middle", "m":"middle",
		"right":"end", "end":"end", "r":"end", "e":"end"
	};	

	//d3 uses this property as a "style" rather than an attribute in their SVG helpers.
	//keep this consistent. 
	svg.extendD3("align", function(a) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			return this.style("text-anchor", svg._anchorMap[a]);
		}
		return this.style("text-anchor");
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

	svg.d3 = function(el) {
		// console.log("Checking el", el);
		var isD3 = el && el.isD3 && el.isD3();
		return isD3 ? el : d3.select(el);
	};

	svg.isSvg = function(el) {
		return el && el.namespaceURI.match(/svg/); 
	};

	svg.multiline = function(el, text, dx,dy) {
		if(!text) { return ; }
		el = svg.d3(el);
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
		
	svg.transformMap = {"r": "rotate", "s":"scale", "t":"translate"};
	svg.transform = function(o) { 
		var order = o.order || ["r","s", "t"];
		var t = [];

		order.forEach(function(v) {
			if(o[v]) {
				var f = svg[svg.transformMap[v]];
				t.put(f.apply(svg, o[v]));
			}
		});
		
		// console.log("transform", t.join(" "));
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
	};	

		//utils for d3
		
		//takes "x.foo y.bar.stuff" and appends the nodes, returning the last node created (y) so we get
		//  src > x[class=foo] > y[class=bar stuff]
		// "src" needs to be a d3 object
		// "selector" needs to be a string
		// "func" takes the element to be returned and applies custom creation logic to it. 
	svg.append =  function(src, selector, func) {
		// console.log("svg append pre d3");
		src = svg.d3(src);
		var res = src.select(selector);

		// console.log("svg append");

		if(res.empty()) {
			res = src;
			var nodes = selector.split(" ");
			// console.log("svg append", nodes.length, nodes.forEach);
			nodes.forEach(function(el) {
				// console.log("here!");
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
		src = svg.d3(el);
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
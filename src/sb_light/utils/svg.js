
/*globals define*/

define(['sb_light/globals', 'sb_light/utils/ext', "d3"], function(sb, E, d3) {

	'use strict';

	var S =  {};

	//var d3 = ext.global("d3") && d3 || {"__missing" : true};

	S.ZERO = 1e-6;


	S.initD3 = function(_d3) {		
		var c = d3.__cached || {};
		d3 = _d3;	
		//add the d3 extensions that were cached. 
		E.each(c, function(v,k) {
			S.extendD3(k,v);
		});
	};

	S.extendD3 = function(name, func) {
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

	S.extendD3("isD3", function() {
		return true;
	});


	//extensions to d3
	//adds x,y,width,height to "rect" type SVG elements
	//skips any property that === null
	S.extendD3("rect", function(x,y,width,height) {
		var sel = this;
		var args= E.slice(arguments);
		if(args.length) {
			["x","y","width","height"].forEach(function(dim,i){
				if(args[i] !== null) {
					sel.dim(dim, args[i]);
				}
			});
			return sel;	
		}

		return ["x","y","width","height"].reduce(function(prev, el) {
			return E.set(prev, el, sel.dim(el));
		}, {});
	});

	S.extendD3("getBBox", function() {
		try {
			return this.node().getBBox();
		} catch(e) {
			return {left:0, right:0, top:0, bottom:0, width:0, height:0}
		}
	});

	//adds x1,x2,y1,y2 to "line" type SVG elements
	//skips any property that === null
	S.extendD3("line", function(x1,x2,y1,y2) {
		var sel = this;
		var args= E.slice(arguments);
		if(args.length) {
			["x1","x2","y1","y2"].forEach(function(dim,i){
				if(args[i] !== null) {
					sel.attr(dim, args[i]);
				}
			});
			return sel;
		}

		return ["x1","x2","y1","y2"].reduce(function(prev, el) {
			return E.set(prev, el, sel.attr(el));
		}, {});
	});

	//takes an object taking the subscribe call(who),
		//a string describing what to subscribe to (what), and
		//a cb function to handle the subscription (where)
	S.extendD3("subscribe", function(opts) {
		var sel = this;
		sel.each(function(d,i) {
			sb.subman.subscribe(this, opts);
		});
		return sel;
	});

	S.extendD3("transformMatrix", function(matrix) {
		if(arguments.length > 0) {
			var ms = "matrix(" + matrix + ")";
			if( S.isSvg(this.node()) ) {
				console.log("TransformSVG:", ms)
				this.attr("transform", ms);
			} else {
				console.log("TransformDIV:", ms)
				this.style("transform", ms);
				this.style("-moz-transform", ms);
				this.style("-webkit-transform", ms);
				this.style("-o-transform", ms);
				this.style("-ms-transform", ms);
			}
			return this;
		} 

		return S.isSvg(this.node()) ? this.attr("transform") : this.style("transform");
	});

	S.extendD3("cleanup", function() {
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

	var dim_map = {
		x: "left", left:"left", l:"left",
		y: "top", top:"top", t:"top",
		width:"width", w:"width",
		height:"height", h:"height"
	};

	S.extendD3("dim", function(name, value) {
		if(arguments.length > 1) {
			if( S.isSvg(this.node()) )  {
				this.attr(name, value);
			} else {
				name = dim_map[name];
				this.style(name, (E.isFunc(value) || E.isString(value)) ? value : E.px(value));
			}
			//this.attr(name, S.isSvg(this.node() || E.isFunc(value)) ? value : E.px(value)) 

			return this;
		}
		//return the value 
		if(S.isSvg(this.node())) {
			return this.attr(name);
		} else {
			name = dim_map[name];
			return E.to_f(this.style(name));
		}
	});

	//get/set the corners on a rect, for instance. (rx/ry)
	S.extendD3("corners", function(rx,ry) {
		if(arguments.length) {
			this.dim("rx", rx);
			this.dim("ry", ry);
			return this;
		}
		return {rx:this.dim("rx"), ry:this.dim("ry")};
	});
	//set multiple classes on an svg item directly. 
	S.extendD3("class", function(classA/*...*/) {
		var args = E.slice(arguments);
		if(args.length) {
			this.attr("class", args.join(" "));
			return this;
		}
		return this.attr("class");
	});


	//set the title on elements
	S.extendD3("title", function(s) {
		var args = E.slice(arguments);
		if(args.length) {
			return this.attr("title", s);
		}
		return this.attr("title");
	});

	//set the rx/ry on elements. When "get" is done, returns only "rx" for the first selection item
	S.extendD3("radius", function(r) {
		var args = E.slice(arguments);
		if(args.length) {
			return this.attr("rx", r).attr("ry", r);
		}
		return this.attr("rx");
	});

	//set the text anchor
	S._anchorMap = {
		"left":"start", "start":"start", "l":"start", "s":"start",
		"center":"middle", "middle":"middle", "c":"middle", "m":"middle",
		"right":"end", "end":"end", "r":"end", "e":"end"
	};	

	//d3 uses this property as a "style" rather than an attribute in their SVG helpers.
	//keep this consistent. 
	S.extendD3("align", function(a) {
		var args = E.slice(arguments);
		if(args.length) {
			return this.style("text-anchor", S._anchorMap[a]);
		}
		return this.style("text-anchor");
	});


	//get/sets the size and position of a circle
	S.extendD3("circle", function(r, cx,cy) {
		if(arguments.length) {
			this.dim("r", r);
			this.dim("cx", cx);
			this.dim("cy", cy);
			return this;
		}
		return {r:this.dim("r"), cx:this.dim("cx"), cy:this.dim("cy")};
	});

	S.d3 = function(el) {
		// console.log("Checking el", el);
		var isD3 = el && el.isD3 && el.isD3();
		return isD3 ? el : d3.select(el);
	};

	S.isSvg = function(el) {
		return el && el.namespaceURI.match(/svg/); 
	};

	S.multiline = function(el, text, dx,dy) {
		if(!text) { return ; }
		el = S.d3(el);
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

				tspan = el.append("tspan").attr("x",  E.number(dx,10))
											.attr("dy", E.number(dy,18))
											.text(words[i])
				;
			}
		}
		return el;
	};	
	
	//given a series of x points and y points, generate a
	//grid that fits the given dimension
	//returns an SVG path string
	S.gridPath = function(x,y,w,h, xLinesOrStep, yLinesOrStep) {
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
		
	S.popupPath = function(x,y, w,h, pointerType) {
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
		
	S.transformMap = {"r": "rotate", "s":"scale", "t":"translate"};
	S.transform = function(o) { 
		var order = o.order || ["r","s", "t"];
		var t = [];

		order.forEach(function(v) {
			if(o[v]) {
				var f = S[S.transformMap[v]];
				t.put(f.apply(S, o[v]));
			}
		});
		
		// console.log("transform", t.join(" "));
		return t.join(" "); 
	};
	var sep = ",";
	S.translate = 	function(x,y) { return (isNaN(y) ? ["translate(",x,")"] : ["translate(",x,", ",y,")"]).join("");  };
	S.scale =  		function(x,y) { return (isNaN(y) ? ["scale(",x,")"] : ["scale(",x,", ",y,")"]).join(""); };
	S.rotate =	 	function(x) { return "rotate("+x+")"; };
	S.viewBox = 		function(x,y,w,h) { return [x,y,w,h].join(" "); };
	S.l =				function(x,y) { return ["l",x,sep,y].join(""); };
	S.L = 			function(x,y) { return ["L",x,sep,y].join(""); };
	S.m =				function(x,y) { return ["m",x,sep,y].join(""); };
	S.M =				function(x,y) { return ["M",x,sep,y].join(""); };
	S.h = 			function(d) { return "h"+d; };
	S.H =				function(d) { return "H"+d; };
	S.v =				function(d) { return "v"+d; };
	S.V = 			function(d) { return "V"+d; };
	S.q = 			function(cx,cy,x,y) { return "q" + [cx,cy,x,y].join(sep); };
	S.Q =				function(cx,cy,x,y) { return "Q" + [cx,cy,x,y].join(sep); };
	S.a =				function(rx,ry, xr, laf,sf ,x,y) { return "a" + [rx,ry,xr,laf,sf,x,y].join(sep); };
	S.A =				function(rx,ry, xr, laf,sf ,x,y) { return "A" + [rx,ry,xr,laf,sf,x,y].join(sep); };
	S.c =				function(x1,y1,x2,y2,x,y) { return "c" + [x1,y1,x2,y2,x,y].join(sep); };
	S.C =				function(x1,y1,x2,y2,x,y) { return "C" + [x1,y1,x2,y2,x,y].join(sep); };
	S.s =				function(cx,cy,x,y) { return "s" + [cx,cy,x,y].join(sep); };
	S.S =				function(cx,cy,x,y) { return "S" + [cx,cy,x,y].join(sep); };
		
	S.path = function() {
		return E.slice(arguments).join("");
	};	

		//utils for d3
		
		//takes "x.foo y.bar.stuff" and appends the nodes, returning the last node created (y) so we get
		//  src > x[class=foo] > y[class=bar stuff]
		// "src" needs to be a d3 object
		// "selector" needs to be a string
		// "func" takes the element to be returned and applies custom creation logic to it. 
	S.append =  function(src, selector, func) {
		// console.log("svg append pre d3");
		src = S.d3(src);
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
	S.remove = function(src, selector) {
		src = S.d3(el);
		var el = src.select(selector);
		if(!el.empty()) {
			el.remove();
		}
	};
		


	//quick style
	S.style = function(selection/*, arguments*/) {
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

	S.utils = {
		pt: null,
		ctm:null,

		setRoot: function(root) {
			S.utils.pt = root.createSVGPoint();
			S.utils.ctm = root.getScreenCTM().inverse();
		},

		svgPoint: function(el, evt, offset) {
			var root= el.ownerSVGElement || el; 

			if(!S.utils.pt) { S.utils.setRoot(root); }
			var pt = S.utils.pt;
			var ctm = S.utils.ctm;

			var loc = evt.touches ? evt.touches[0] : evt;
			console.log(loc.clientX, loc.pageX);

			pt.x = E.first(loc.clientX,loc.pageX); 
			pt.y = E.first(loc.clientY, loc.pageY);
			var res = pt.matrixTransform(ctm);
			if(offset) {
				res.x -= ctm.e;
				res.y -= ctm.f;
			}
			return res;
		},

		//requires an _arc property on the data to keep track of the current arc definition,
		//and then do the interpolation.
		tweenArc: function tweenArc(arcs, b) {
			return function(a, i) {
				var d = b.call(this, a, i);
				var arc = arcs ? arcs[i] : a._prevArc;
				if(!arc) {
					console.log("wtf");
				}
				var interpolate = d3.interpolate(arc, d);
				E.mixin(arc,d);
				a._prevArc = arc;
				return function(t) { 
					return d3.svg.arc()(interpolate(t)); 
				};
			};
		},
		tweenBorder: function tweenBorder(borders, b) {
			return function(a, i) {
				var d = b.call(this, a, i);
				var border = borders ? borders[i] : a._prevBorder;
				var interpolate = d3.interpolate(border, d);
				E.mixin(border,d);
				a._prevBorder = border;
				return function(t) { 
					var pd = interpolate(t);
					var ma = (pd.startAngle + (pd.endAngle - pd.startAngle)/2)
					var invert = ma > (E.tau *0.25) && ma < (E.tau * 0.75);
					var sa = (invert ? pd.endAngle : pd.startAngle) - E.rad90;
					var ea = (invert ? pd.startAngle : pd.endAngle) - E.rad90;
					var dir = invert ? 0 : 1;
					var rad = pd.radius;
					var start = S.utils.arcPoint(rad, sa);
					var end = S.utils.arcPoint(rad, ea);
					//console.log(t, pd.endAngle);
					return S.M(start.x, start.y) + S.A(rad,rad,0,0,dir,end.x,end.y);
				};
			};
		},

		arcPoint: function(radius, radians) {
			return {
				x: (radius * Math.cos(radians)),
				y: (radius * Math.sin(radians))
			};
		},

		//points are in the form [x,y]
		distance: function(p1, p2) {
			var x = E.absDiff(p1[0], p2[0]);
			var y = E.absDiff(p1[1], p2[1]);
			return Math.sqrt( (x*x) + (y*y) );
		},



		//determine if the two lines overlap and where.
		overlap: function(a, b, c, d) {
			var ax = a[0], ay = a[1];
			var bx = b[0], by = b[1];
			var cx = c[0], cy = c[1];
			var dx = d[0], dy = d[1];

			var overlap = [];

			if(S.utils._overlapIntersect(ax,ay,bx,by,cx,cy)) {
				overlap.push(c);
			}
			if(S.utils._overlapIntersect(ax,ay,bx,by,dx,dy)) {
				overlap.push(d);
			}
			if(S.utils._overlapIntersect(cx,cy,dx,dy,bx,by)) {
				overlap.push(b);
			}
			if(S.utils._overlapIntersect(cx,cy,dx,dy,ax,ay)) {
				overlap.push(a);
			}
			return overlap;
		},
		//helper for overlap

		_overlapIntersect: function(ax,ay,bx,by,cx,cy) {
			var ex = (cx - ax);
			var ey = (cy - ay);
			var fx = (bx - ax);
			var fy = (by - ay);

			var cross = E.absDiff( (ex * fy), (ey * fx) );
			if(cross < 0.1) {
				if(Math.abs(fx) >= Math.abs(fy)) {
					return (fx > 0 ) ? 
						ax <= cx && cx <= bx :
						bx <= cx && cx <= ax;
				} else {
					return (fy > 0 ) ? 
						ay <= cy && cy <= by :
						by <= cy && cy <= ay;
				}
			}

			return false; 
		},


		findPoint: function(list,p) {
			if(!list || !list.length) { return null;}
			return list.find(function(v, i) {
				return v[0] == p[0] && v[1] == p[1] ? i : -1;
			}) || null;
		},

		id: function(prop, prefix, suffix) {
			var str = (prefix ? (prefix + "_") : "") + "%id%" +  (suffix ? ("_" + suffix) : "");
			return function(d,i) {
				return str.replace("%id%", d[prop ? prop : "id"]);
			};
		},

		slope: function(a,b) {
			return ( (a[1] - b[1]) / (a[0] - b[0]));
		},

		area: function(a) {
			if( (a || []).length == 0) { return 0; }
			return S.utils.poly(a).area() || 0;
		},

		poly: function(a) {
			a = a || [];
			return d3.geom.polygon(S.utils.removeDupes(a));
		},

		//returns true if different. a = [x,y], b=[x,y]
		pointsDiffer: function(a,b) {
			var res = a !=b  && !(a[0] == b[0]  && a[1] == b[1]);
			return res;
		},

		removeDupes: function(a) {
			if(!a || a.length == 1) { return a; }

			var pts = {};
			E.each(a, function(v) {
				v[0] = E.roundTo(v[0], 3);
				v[1] = E.roundTo(v[1], 3);
				pts[v.join("_")] = true;
			});
			return E.keys(pts).map(function(v) { 
				return v.split("_").map(function(k) {
					return E.to_f(k);
				});
			})
		},

		polyClip: function(target,clipper) {
			var tp = S.utils.poly(target);
			var cp = S.utils.poly(clipper);
			if(tp.length < 2 || cp.length < 2) { return []; }

			return S.utils.poly(tp.clip(cp));
		},

		//obolete elsewhere. saving here for posterity.
		//eventually make these functions that will draw based on specified dims
		icons: {
			//svg paths --- 16x16
			triangle: 	"M8,2 L2,14 L14,14 Z",
			diamond: 	"M8,0 L2,8 L8,16 L14,8 Z",
			fslash:		"M0,14 L14,0 L16,2 L2,16 Z",
			bslash:		"M0,2 L14,16 L16,14 L2,0 Z", 							
			plus:		"M6,0 V6 H0 V10 H6 V16 H10 V10 H16 V6 H10 V0 Z",
			semicircle: "M 16 8 a 8 8 0 1 0 -16 0 Z",
			square: 	"M2,2 h14 v14 h-14 Z",
			circle:		"M 8 0 a 8 8 0 1 0 0.0001 0",


			//arrow (50x40) was original
			rightArrow:	function(w,h) {
				return S.path(S.M(0,0), S.h(w*0.6), S.v(-h/4), S.l(w*0.4,h/2),
								S.l(-w*0.4, h/2), S.v(-h/4), S.h(-w*0.6), "Z")
			}, 		
			leftArrow:	function(w,h) {
				return S.path(S.M(w,0), S.h(-w*0.6), S.v(-h/4), S.l(ww*0.4,h/2),
								S.l(w*0.4, h/2), S.v(-h/4), S.h(w*0.6), "Z")
			},
			star:function(size) {
				return S.path(	S.M(0,0), S.h(size), 
								S.l(-0.761*size, 0.524*size), 
								S.l(0.301*size, -0.924*size), 
								S.l(0.301*size, 0.924*size), "Z");
			}
		

		},


		//angles for a tachometer (3/4 circle starting at 3/4PI)
		tachoAngles: [	{"startAngle":1.5707963267948966,"endAngle":3.9269908169872414},
						{"startAngle":3.9269908169872414,"endAngle":4.319689898685965},
						{"startAngle":4.319689898685965,"endAngle":4.71238898038469},
						{"startAngle":4.71238898038469,"endAngle":5.105088062083414},
						{"startAngle":5.105088062083414,"endAngle":5.497787143782138},
						{"startAngle":5.497787143782138,"endAngle":5.890486225480862},
						{"startAngle":5.890486225480862,"endAngle":6.283185307179586},
						{"startAngle":6.283185307179586,"endAngle":6.67588438887831},
						{"startAngle":6.67588438887831,"endAngle":7.0685834705770345},
						{"startAngle":7.0685834705770345,"endAngle":7.461282552275759},
						{"startAngle":7.461282552275759,"endAngle":7.853981633974483},
						{"startAngle":7.853981633974483,"endAngle":8.246680715673207},
						{"startAngle":8.246680715673207,"endAngle":8.63937979737193}
		]

	}

	return S;
	
});



define(['sb_light/globals', 'widgets/widget', "widgets/svg"], function(sb,Widget, SvgWidget) {
	var lo =  {};

	lo.init = function() {
	};


	lo.create = function(parent, def) {
		try {
			var el;
			if(sb.ext.isStr(def.widget)) {
				if(def.widget == "svg") {
					el = (new SvgWidget(sb,parent,def));
				} else {
					el = (new Widget(sb, parent, def));
				}
			} else {
				//widget -- needs to inherit from layout/widget.js
				var W = def.widget;
				el = new W(sb, parent, def);
			}
			return el;
		} catch(e) {
			console.log(["SB_Light::Layout::create ", JSON.stringify(e), def.id].join(" -- "));
			throw new Error(["SB_Light::Layout::create ", JSON.stringify(e), def.id].join(" -- "));
		}
	};






	//parse the def(inition) of the layout and inject the widgets into root.
	lo.parse = function(root, def, preventResize/*==false*/) {
		var rect = root.ownerDocument ?  root.getBoundingClientRect() : root.rect();
		var layout = {root: root, widgets:{}, rootWidth:rect.width, rootHeight:rect.height};
		_createWidgets(null, def, layout);
		if(!preventResize) {
			lo.resize(layout);
		}
		return layout;
	};

	lo.resize = function(layout) {
		_buildLayout(layout);
		_evalLayout(layout);
		_applyLayout(layout);
	};

	//change the layout def for a single item and relayout.
	//specify "true" if you want to prevent the re-layout -- this is useful when applying a bunch of changes (e.g., in a loop) and you 
	//		want to call resize manually. 
	lo.change = function(layout, key, dim, value, wait/*==false*/) {
		layout.widgets[key].source(dim, value);
		if(!wait) {
			lo.resize(layout);
		}
	};
	lo.uniqueId = function(def) {
		if(!def.id) { 
			def.id = "unknown_" + sb.ext.unique();
		}	
		return def.id;
	};

	var _createWidgets = function(parentId,def, layout) {
		var p = parentId ? layout.widgets[parentId] : layout.root;
		if(!p) { 
			throw new Error("Warning: missing parent id", parentId);
		}
		def = sb.ext.isArray(def) ? def : [def];
		def.forEach(function(d,i) {
			d.id = lo.uniqueId(d);
			d.style = d.style || "";
			d.style = d.style + (d.style.match("/z-index/") ? "" : ";z-index:"+i);	

			var widget = lo.create(p, d);
			layout.widgets[d.id] = widget; //{id:d.id, source:d, dom:obj, parentId:parentId};
			
			if(d.children && d.children.length) {
				if(d.widget == "svg") {
					//skip the layout engine and let the SVG widgets manage themselves. They don't have gimpy
					//positioning like HTML DOM / CSS (even before using d3 )
					widget.createChildren(d.children);
				} else {
					_createWidgets(d.id, d.children, layout);
				}
			}

		});
	};



	var _matchLink = /^@(.+?)(#(left|right|top|bottom|height|width))?(#(-?\d+))?$/;
	var _matchNum = /^(-?\d+)([^0-9]+)?$/;
	var _dimList = ["left","right", "top","bottom", "height","width"];
	var _vDimList = ["top","bottom", "height"];

	var _buildLayout = function( layout) {
		for(var wid in layout.widgets) {
			var w = layout.widgets[wid];
			var p = layout.widgets[w.parentId()] || null; //parent might be root


			var sz = w.sizeDefs.bind(w);//func
			var v = sb.ext.valid;
			
			_dimList.forEach(function(s){
				sz(s,w.source(s));
			});

			//remove conflicting "right"
			if(v(sz("left")) && v(sz("width")) && v(sz("right"))) {
				//console.log("sb_light::utils::layout Warning: ", wid, " has left/width/right all specified. Removing 'right'");
				sz("right", null);
			}
			//remove conflicting "bottom"
			if(v(sz("top")) && v(sz("bottom")) && v(sz("height"))) {
				// //console.log("sb_light::utils::layout Warning: ", wid, " has top/height/bottom all specified. Removing 'bottom'")		
				sz("bottom", null);
			}

			//apply the "fringe" setting to the left/right/bottom/top where appropriate
			var fringe = v(w.source("fringe")) ? w.source("fringe") : 0;
			if(!v(sz("left")) 		&& (!v(sz("width")) 	|| !v(sz("right")))) 		{ sz("left", fringe);}
			if(!v(sz("right")) 		&& (!v(sz("width")) 	|| !v(sz("left")))) 		{ sz("right", fringe);}
			if(!v(sz("top")) 		&& (!v(sz("height")) 	|| !v(sz("bottom")))) 		{ sz("top", fringe);}
			if(!v(sz("bottom")) 	&& (!v(sz("height")) 	|| !v(sz("top")))) 			{ sz("bottom", fringe);}
		}
	};

	var _isV = function(dim) { return _vDimList.indexOf(dim) > -1; };

	var _evalLayout = function( layout) {
		for(var wid in layout.widgets) {

			var w = layout.widgets[wid];
			var sz = w.sizeFuncs.bind(w);
			//all elements from here should have a parentId with sizes
			var p = layout.widgets[w.parentId()] || null; //parent might be root
			var pid = w.parentId() || "_root"; //parent might be root
			var pz = (p && p.sizeFuncs.bind(p)) || null;
			var pzw = pz ? [pz, "width", (pid+"@width") ] : layout.rootWidth;
			var pzh = pz ? [pz, "height", (pid+"@height") ] : layout.rootHeight;

			var v = sb.ext.valid;

			// if(wid == "infoResize"){
			// //	console.log("DivB");
			// }

			_dimList.forEach(function(s) {
				var dim = String(w.sizeDefs(s));
				var m = dim ? dim.match(_matchLink) : null;
				var mn = dim.match(_matchNum); 

				if(mn) {
					//25%, -45%, etc... 
					if(mn.length == 3 && mn[2] == "%") 	{ 
						mn = (sb.ext.to_f(mn[1])/100);
						//console.log("Fixed %: ", wid, s, mn);
						sz(s, _sizeFunc(wid, s, sb.ext.prod,  (_isV(s) ? pzh : pzw), mn));
					//50, 20, -23, ....
					} else if(mn.length == 2 || !v(mn[2])) { 
						//console.log("Fixed Num: ", wid, s, mn);
					 	mn = sb.ext.to_f(mn[1]);
						sz(s, _sizeFunc(wid, s, sb.ext.sum, mn));
					} else {
						// console.log("sb_light::utils::layout Warning: ", "Number is not a valid dimension", w.id, s, dim);
					}
				} else if (dim == "auto") {
					sz(s, _autoFunc(wid, s, w, layout));
				} else if (!m) {
					//console.log("Undefined: ", wid, s, w.parentId);
					//console.log("Undefined: ", pzw, pzh);

						 if(s == "width") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzw, [sz,"left", (wid+"@left")], 		[sz,"right", (wid+"@right")]))	;}	
					else if(s == "height") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzh, [sz,"top", (wid+"@top")], 		[sz,"bottom", (wid+"@bottom")]))	;}	
					else if(s == "left") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzw, [sz,"width", (wid+"@width")], 	[sz,"right", (wid+"@right")]))	;}	
					else if(s == "top") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzh, [sz,"height", (wid+"@height")],	[sz,"bottom", (wid+"@bottom")]))	;}	
					else if(s == "right") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzw, [sz,"width", (wid+"@width")], 	[sz,"left", (wid+"@left")]))	;}	
					else if(s == "bottom") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzh, [sz,"height", (wid+"@height")], 	[sz,"top", (wid+"@top")]))		;}	
					return;
				} else {

					var linkKey = m[1]  && layout.widgets[m[1]] ? m[1] : null;
					var linkDim = v(m[3]) ? m[3] : s;
					var linkAmt = v(m[5]) ? sb.ext.to_f(m[5],0) : 0;

					var lw = layout.widgets[linkKey];
					var lz = lw.sizeFuncs.bind(lw);
					if(linkDim == "right" && s == "left") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"left", (linkKey+"@left")], [lz,"width", (linkKey+"@width")],  linkAmt));
					} else if (linkDim == "left" && s == "right") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"right", (linkKey+"@right")], [lz,"width", (linkKey+"@width")],  linkAmt));
					} else if (linkDim == "bottom" && s == "top") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"top", (linkKey+"@top")], [lz,"height", (linkKey+"@height")],  linkAmt));
					} else if (linkDim == "top" && s == "bottom") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"bottom", (linkKey+"@bottom")], [lz,"height", (linkKey+"@height")],  linkAmt));
					} else {
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,linkDim, (linkKey+"@"+linkDim)], linkAmt));
					}
				}


			});

		}

	};

	var _sizeFunc = function(id, dim, op /*, list */ ) {
		var dimId = id + ":" + dim;

		var list = sb.ext.slice(arguments, 3);

		return function(chain) {
			chain = chain ||"Chain: ";
			if(chain.match(dimId)) { 
				throw new Error("sb_light::utils::layout Error -- Circular dependancy (" + chain + ") " + dimId);
			}
			var nl = list.map(function(el) {	
				return sb.ext.isArr(el) ? [el[0](el[1]), (chain+"_"+dimId + ( el[2] ? ("("+el[2]+")") :"" ))] : el;
			});
			
			var res = op.apply(op, nl);
			// if(id=="divB") {
			// 	console.log(id,dim,chain, res, nl);
			// }
			
			return res;
		}
	};

	var _autoFunc = function(id, dim, w, layout) {
		var dimId = id + ":" + dim;
		return function(chain) { 
			chain = chain || "Chain: ";
			if(chain.match(dimId)) { 
				throw new Error("sb_light::utils::layout Error -- Circular dependancy (" + chain + ") " + dimId);
			}

			var list = [];
			for(var wid in layout.widgets)  {
				var cw = layout.widgets[wid];
				var cz = cw.sizeFuncs.bind(cw)
				if(cw.parentId() == id) { 
					list.push(
						function() {
							if(dim == "width") {
								return  cz("left")(chain+"_"+dimId+"_"+ wid +"@"+dim) + cz("width")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							} else if (dim == "height") {
								return cz("top")(chain+"_"+dimId+"_"+ wid +"@"+dim) + cz("height")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							} else 	if(dim == "left") {
								return cz("left")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							} else if (dim == "top") {
								return cz("top")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							}
						}
						
					); 
				}
			}

			if(list.length) {
				return (dim == "width" || dim =="height") ? sb.ext.max.apply(null, list) : sb.ext.min.apply(null,list);
			} else {

				var pid = w.parentId();
				var p =  layout.widgets[pid] || null;
				var rect = w.dom().getBoundingClientRect();
				var prect = p ? p.dom().getBoundingClientRect() : layout.root.getBoundingClientRect();
				
				
				var ph = p ? p.sizeFuncs("height")(chain+"_"+dimId) : layout.rootHeight;
				var pw = p ? p.sizeFuncs("width")(chain+"_"+dimId) : layout.rootWidth;

				if(dim !== "bottom" && dim != "right") {
					return rect[dim];
				} else if(dim == "bottom"){
					return ph - rect.height - (rect.top- prect.top);
				} else {
					return pw - rect.width  - (rect.left - prect.left);
				}
			}
		}
	};

	var _applyLayout = function(layout) {
		for (var wid in layout.widgets) {
			var w = layout.widgets[wid];
			var sz = w.sizeFuncs.bind(w);
			var r = sb.ext.roundTo;
			// console.log(wid, 
			// 		"left",		r(sz("left")(wid),1),
			// 		"right",	r(sz("right")(wid),1),
			// 		"top",		r(sz("top")(wid),1),
			// 		"bottom",	r(sz("bottom")(wid),1),
			// 		"width", 	r(sz("width")(wid),1),
			// 		"height", 	r(sz("height")(wid),1)
			// );

			w.applyLayout();

		}

	};



	return lo;
});
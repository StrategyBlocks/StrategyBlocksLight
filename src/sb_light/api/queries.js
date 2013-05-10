





/*************************
	These functions assume that the models you need have been 
	fetched and are up to date in "sb.models"
	They're intended to be convenience functions that exploit the global
	nature of the models. 
************************/

define(['sb_light/globals'], function(sb) {
	
	
	var q = {};
	
	/********************************
		COMPANIES
	*********************************/
	q.company = function(cid) {
		var cs = sb.models.raw("companies");
		cid = cid || sb.state.value("companyId");
		return (cs && cid && cs[cid] ) || null; 
	};
	
	
	/********************************
		USERS
	*********************************/
	q.fullname = function(uid) {
		var us = sb.models.raw("users");
		return us && uid && us[uid] ? us[uid].name : null;
	};
	q.currentUser = function() {
		var us = sb.models.raw("users");
		return (us && us[sb.state.value("userId")] ) || null;
	};
	q.user = function(uid) {
		var us = sb.models.raw("users");
		return us[uid];	
	};
	q.companyMembership = function() {
		var u = q.currentUser();
		if(u.company_membership) {
			return u.company_membership;
		} else {
			//TODO: Remove this code - legacy api.
			var c = q.company();
			return u && c && u.companies[c.id] || null;
		}
	}; 
	q.userDate = function(date, opts) {
		var u = q.currentUser();
		return sb.moment(date, opts).format(u.date_format);	
	
	};
	var _serverDateFormat =  "YYYY/MM/DD";
	q.userToServerDate = function(date, opts) {
		var u = q.currentUser();
		var m = sb.moment(date, u.date_format);
		return m.format(_serverDateFormat);
	};
	
	q.authors  = function() {
		var cid = sb.state.value("companyId");
		return sb.models.rawArray("users").filter(function(el) {
			
												//TODO: Remove legacy API support
			var cm = el.company_membership || (el.companies && el.companies[cid] || null);
			return cm && cm.active && (cm.role == "Author" || cm.role =="Administrator");
		}).sort(sb.ext.sortUsers);
	};
	
	/********************************
		FOCUS AREAS
	*********************************/
	q.focusArea = function(fid) {
		var fs = sb.models.raw("focus");
		return fs && fs[fid] ? fs[fid].title : null;
	};
	q.focusAreaDesc = function(fid) {
		var fs = sb.models.raw("focus");
		return fs && fs[fid] ? fs[fid].description : null;
	};
	
	/********************************
		Levels
	*********************************/
	q.levelColor = function(id) {
		var ls = sb.models.raw("levels");
		var c = ls && ls[id] ? ls[id].color : null; 
		return c ? sb.ext.to_color(c) : null;
	};
	q.levelName = function(fid) {
		var ls = sb.models.raw("levels");
		return ls && ls[id] ? ls[id].title : null;
	};
	q.levelPos = function(fid) {
		var ls = sb.models.raw("levels");
		return ls && ls[id] ? ls[id].title : null;
	};
	


	/********************************
		NEWS
	*********************************/
	
	q.currentNewsItem = function() {
		var id = sb.state.value("news");
		var model = sb.models.raw("news");
		
		return model && id ? model[id] : null;	
	};
	
	var _newsMsgRE = /%(users|blocks)_(\d+)%/g;
	q.newsMessage = function(n) {
		var re= _newsMsgRE;
		var blocks = sb.models.raw("blocks");
		var users = sb.models.raw("users");
		
		return n.msg.replace(re, function(match,type, id) {
			if(type == "blocks") {
				return blocks[id] ? blocks[id].title : "(unknown block)"; 
			}
			if(type == "users") {
				return users[id] ? users[id].name : "(unknown user)";
			}
		});	
	};
	
	var _newsUsersRE = /%users_(\d+)%/g;
	q.newsUsers = function(n) {
		var re = _newsUsersRE;
		var users = [];
		var match = null;
		do {
			if(match) { users.push(match[1]); }
			match = re.exec(n.msg);
		} while(match);
		return users;
	};
	
	var _newsBlocksRE = /%blocks_(\d+)%/g;
	q.newsBlocks = function(n) {
		var re = _newsBlocksRE;
		var blocks = [];
		var match = null;
		do {
			if(match) { blocks.push(match[1]); }
			match = re.exec(n.msg);
		} while(match);
		return blocks;
	};
	
	

	/********************************
		BLOCKS
	*********************************/
	q.currentBlock = function() {
		return q.block(q.currentBlockId()); 
	};
	q.previousBlock = function() {
		return q.block(q.previousBlockId()); 
	};
	q.rootBlock = function() {
		var c= sb.state.value("company");
		return c ? q.block(c.root_block.id) : null; 
	};
	q.currentBlockId = function() {
		var p = q.currentBlockPath(); 
		return (p && p.length) ? p.last() : null;
	};
	q.previousBlockId = function() {
		var p = q.previousBlockPath(); 
		return (p && p.length) ? p.last() : null;
	};
	q.currentBlockPath = function(str/*==false*/) {
		return q.blockPath(sb.state.value("block"), str);
	};
	q.currentBlockLevel = function() {
		return q.blockLevel(q.currentBlockPath());		
	};
	q.previousBlockPath = function(str/*==false*/) {
		var pp = sb.state.value("previousBlock") || sb.state.value("company").root_block.id;
		return q.blockPath(pp, str);
	};
	q.previousBlockLevel = function() {
		return q.blockLevel(q.previousBlockPath());		
	};
	q.managedBlocks = function() {
		return sb.models.rawArray("blocks").reduce(function(pre, el) {
			if(el.is_manager) {
				return pre.put(el);
			} 
			return pre;
		}, []);
	};
	q.parentPath = function(bpath, str/*==false*/) {
		bpath = q.blockPath(bpath);
		return q.blockPath(bpath.slice(0,-1), str);
	};
	q.blockParentInfo = function(bpath) {
		bpath = q.blockPath(bpath);
		var b = q.block(bpath);
		if(b && b.parents && b.parents.length) {
			return b.parents.find("parent_id", bpath.last(1)).value;
		}
		return null;	
	};
	
	q.blockPath = function(bpath, str/*==false*/) {
		bpath = _pathToArray(bpath);
		var b = q.block(bpath);
		if(b && bpath.length < 2 && b.parents.length > 0) {
			bpath = b.default_path;
		}
		return str ? bpath.join("_") : bpath;
	};

	var _pathToArray = function(bpath) {
		if(typeof bpath == "array") { return bpath; }
		if(typeof bpath == "number") { return [String(bpath)]; }
		if(typeof bpath == "string") { return bpath.split("_"); }
		return bpath;
	};
	
	q.blockId = function(bpath) {
		bpath = _pathToArray(bpath);
		return (bpath && bpath.length) ? bpath.last() : null;
	};
	
	q.block = function(bpath) {
		var bid = q.blockId(bpath);
		var blocks = sb.models.raw("blocks");
		return bid && blocks && blocks[bid] ? blocks[bid] : null;
	};
	
	q.blockLevel = function(bpath) {
		var pinfo = q.blockParentInfo(bpath||q.currentBlockPath());
		return pinfo ? pinfo.level : 0;
	};
	
	q.childrenPaths = function(bpath, str/*==false*/) {
		//array, so we can concat
		bpath = q.blockPath(bpath);
		var b= q.block(bpath);
		//concat each child id to the bpath array and return using internal blockPath function, passing the "str" option. 
		return b ? 
				b.children.map(function(el) { return q.blockPath(bpath.concat([el]), str); }) :
				null; 
		
	};
	q.parentPaths = function(bpath, str/*==false*/) {
		var b= q.block(bpath);
		return b.paths.reduce(function(prev,el) {
					var pp =  sb.queries.parentPath(el, str);
					return pp && pp.length  ? prev.put(pp) : prev;
		}, []);
	};
	
	//includes siblings from *ALL* parents
	q.siblingPaths = function(bpath, str/*==false*/) {
		var b= q.block(bpath);
		return b.paths.reduce(function(prev,el) {
			var cp = sb.queries.childrenPaths(sb.queries.parentPath(el), str);
			if(cp) {
				cp = cp.filter(function(el) { 
					return sb.queries.blockPath(el,true) != sb.queries.blockPath(bpath,true); 
				});  
				return prev.concat(cp);
			} 
			return prev;
		}, []);
	};
	
	
	q.arePathsEqual = function(apath, bpath) {
		return q.blockPath(apath, true) == q.blockPath(bpath, true);
	};
	q.isCenterPath = function(apath) {
		return q.currentBlockPath(true).indexOf(q.blockPath(apath,true)) > -1;
	};
	q.isCurrentPath = function(apath) {
		return q.arePathsEqual(apath, q.currentBlockPath());
	};
	
	
	q.maxDate = function() {
		return sb.ext.parseDate(q.rootBlock().end_date);
	};
	q.minDate = function() {
		return sb.ext.parseDate(q.rootBlock().start_date);
	};

	//returns the available range of dates for the date picker on this block
	// 1. Block cannot START earlier than its parent blocks
	// 2. Block cannot START later than its earliest child start date, or the parent's end date
	// 3. Block cannot  END before its parent's start date or it's latest child's end date.
	// 4. Block cannot END after its parent unless that parent it floating
	q.dateRange = function(b) {
		var dates = {
			minStart: sb.moment(new Date(1980,1,1)),	
			maxStart: sb.moment(new Date(2038,12,31)),	
			minEnd: sb.moment(new Date(1980,1,1)),	
			maxEnd: sb.moment(new Date(2038,12,31))	
		};
		
		var p = q.block(b.default_parent);
		var maxsd = b.children.map(function(cid) { return q.block(cid).start_date; }).put(p ? p.end_date : dates.maxStart);
		var mined = b.children.map(function(cid) { return q.block(cid).end_date; }).put(p ? p.start_date : dates.minEnd);
		
		
		dates.maxStart = sb.ext.minDate.apply(null, maxsd);
		dates.minStart =  p ? p.start_date : dates.minStart;
		dates.maxEnd = p && !p.floating_end_date ? p.end_date : dates.maxEnd;
		dates.minEnd = sb.ext.maxDate.apply(null, mined);
		return dates;
	};
	
	
	q.is_link = function(parent_id, child_id) {
		return _parent_child_link(parent_id, child_id).linked_parent_id != null;
	};
	
	q.custom_progress_weight = function(parent_id, child_id) {
		return sb.ext.to_i(_parent_child_link(parent_id, child_id).custom_progress_weight);
	};
	
	var _parent_child_link = function(parent_id, child_id) {
		var blocks = sb.models.raw("blocks");
		var parent = blocks[parent_id]; 
		var child = blocks[child_id];
		
		if (parent.children.indexOf(child_id) == -1) {
			throw new Error("Block(" + child_id + ") is not a parent of block(" + parent_id + ")");
		}
		
		return child.parents.reduce(function(pre, mel) {return mel.parent_id == parent_id ? pre.put(mel) : pre;}, [])[0];
	};
	
	q.progressVariance = function(bpath) {
		var b = q.block(bpath);
		if(b) {
			var a = b.percent_progress || 100;
			var t = b.expected_progress || 0;
			return t > 0 ? Math.round((a-t)/t*100) : 100;
		}
		return 0;
	};
	
	//recursive function -- no arguments are required on initial call
	//1. If you supply arguments, you can build a subtree
	//2. This function is designed to build trees for the map layout using D3.js
	//3. Linked nodes are duplicated in the structure. 
	//4. If cpath is not passed, cpath is set to the actual root. 
	//5. If ppath is not passed, "cpath" is considered the current root: this is useful
	//			for re-orienting the tree around the currently selected block
	//6. If cpath and ppath is passsed on the initial call, the tree returned will be a branch
	//		
	//6. Blocks is only passed to simplify the recursion -- should never be necessary to pass it
	//			unless you want a tree using a subset of data (
			
	q.blockFullTree = function(cpath,ppath, blocks) {
		blocks = blocks || sb.models.raw("blocks");
		if(!blocks) { return; }
		
		cpath = q.blockPath(cpath || q.rootBlock().default_path);
		ppath = ppath ||[];
		//var ppath = ppath ||cpath.slice(0,-1);                                        
		var b = blocks[cpath.last()];
		
		var d = {
			name: b.title,
			data: b,
			path: cpath,
			children: []
		};

		var children = b.children.cloneExcept(ppath.last());
		children.map(function(el) { return cpath.concat([el]); });
		var rp = cpath.last(1);
		if( rp && ppath.last() != rp) {
			children.unshift(cpath.slice(0,-1));
		}
				
		var size = 1;
		var child;
		
		children.forEach(function(el) {
			var child = q.blockFullTree(el, cpath, blocks);
			size += child.size;
			d.children.put(child);
		});
		d.size  = size;
		return d;
	};


	//linear function that builds the center list from the current block to the root. 
	//1. takes the previous block id so that the position of the children can reflect
	//		where we've come from. 
	
	q.buildStrategyTree = function(prevBlockId) {
		var bpath = q.currentBlockPath();
		var b = q.currentBlock();
		var blocks = sb.models.raw("blocks"); 
		if(!bpath || !b || !blocks) { return null; }
		
		var centerList = bpath.reduce(function(prev, el) {
			var last  = prev.last() || [];
			prev.put(last.concat([el]));
			return prev;
		},[]);
		
		var dy = -(centerList.length-1);
		
		if(b.children.length) {
			var cidx = b.children.indexOf(prevBlockId);
			var cid = b.children[cidx < 0 ? 0 : cidx];
			centerList.push(centerList.last().concat([cid]));
		}
		
		//temp super parent to our root object to simplify the special cases
		var superRoot = {};
		var pnode = superRoot;
		

		//walk down the center
		centerList.forEach(function(cpath) {
			var ppath = sb.ext.slice(cpath,0,-1);
			var pid = ppath.last();
			var cid  = cpath.last();
			
			var siblings = pid ? blocks[pid].children : [cid];
			var cidx = siblings.indexOf(cid);
			
			pnode.children = siblings.map(function(el, idx) {
				var path = ppath.concat([el]).join("_");
				var defaultType = sb.state.value(sb.consts.STATE.BLOCKS_TREE_VIEW);
				var localType = sb.state.getValueKey(sb.consts.STATE.BLOCK_SETTINGS_VIEW, path);
				
				return {
					path:path,
					dy:dy,
					dx:(idx - cidx),
					data: blocks[el],
					viewType: (localType || defaultType)
				};
			});
			
			dy += 1;
			pnode = pnode.children[cidx];
		});
		return superRoot.children[0];
	};
	
	return q;
});


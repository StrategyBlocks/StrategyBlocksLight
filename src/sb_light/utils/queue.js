define(['sb_light/globals'], function(sb) {

	var queue = {};
	var low_list = [];
	var high_list = [];
	var interval = 0;

	var start = function() {
		queue.next();
		start = function() {}; //remove the function
	}

	queue.interval = function(value) {
		if(arguments.length) {
			interval = value;
		}
		return interval;
	}



	//add a function with an optional unique name. 
	//if the queue already contains an item with the same name, it's ignored. 
	//delay will make sure the function isn't executed before the time has passed, but could take much longer...
	queue.add = function(func, name, delay) {
		delay = sb.ext.number(delay, 0)
		name = name || "queued_" + sb.ext.unique();
		var val = low_list.find("name", name).value;
		if(!val) {
			sb.ext.debug("QUEUE: Adding: ", name);
			low_list.push({name:name, func:func, time:sb.ext.time(), delay:delay});
			start();
		}
	};
	queue.high = function(func,name, delay) {
		delay = sb.ext.number(delay,0);
		name = name || "queued_" + sb.ext.unique();
		var val = high_list.find("name", name).value;
		if(!val) {
			sb.ext.debug("QUEUE: Adding HIGH: ", name);
			high_list.push({name:name, func:func,  time:sb.ext.time(), delay:delay});
			start();
		}
	};

	queue.next = function() {
		if(!_next(high_list)) { 
			_next(low_list);
		}		
		queue.next.bindDelay(queue, interval);
	};

	var _next = function(list) {
		var t = sb.ext.time();
		var len = list.length;
		var i = 0;
		var called = false;
		var wait = [];
		while(i < len && !called) {
			var n = list.shift();
			if(t - n.time > n.delay) {
				sb.ext.debug("QUEUE: Calling: ", n.name);
				n.func();
				called = true;
			} else {
				wait.push(n);
			}
			i = i + 1;
		}
		//waiting items are inserted at the front
		list.unshift.apply(list, wait);
		return called;
	};

	queue.report = function() {
		var hi = high_list.map(function(el) {return el.name;}).join(" ");
		var lo = low_list.map(function(el) {return el.name;}).join(" ");

		console.log("Current Queue:", (high_list.length ? (" High: " + hi) : "" ),   (low_list.length ? (" Normal: " + lo) : "" ) );
	};

	return queue;

});
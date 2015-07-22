define(['sb_light/globals', "sb_light/utils/ext"], function(sb, E) {

	'use strict';


	var queue = {};
	var low_list = [];
	var high_list = [];
	var buffer_list = {};
	var interval = 0;
	var minEmptyWait = 200;

	var start = function() {
		queue.next();
		start = function() {}; //remove the function
	};

	queue.interval = function(value) {
		if(arguments.length) {
			interval = value;
		}
		return interval;
	};


	//This function buffers calls with the same name so that we don't run the same layout loops
	//over and over too often. 
	//If 0 delay is passed, the function will execute immediately, but will still be in the buffer for its
	// execution time
	//If update is true, unstarted functions will be reset and started functions will have to be run a 2nd time.   
	queue.buffer = function queue_buffer(func, name, delay, update) {
		update = update || false;
//console.log("QUEUE: Buffering: ", name, func);
		var b = buffer_list[name];
		if(!b) {
			//create the initial entry
			b = buffer_list[name] = {};
			b.func = (function() {
				//console.log("Executing:", name);
				var cb = buffer_list[name];
				if(!cb) { return; }

				cb.started = true;
				func();
				delete buffer_list[name];
				if(cb.queued) {
					var args = [cb.queued.func, name, cb.queued.delay, true];
					//call the buffer command again. 
					queue.buffer.apply(queue, args);
				}
			});
			b.delay = delay;
			if(delay) {
				//set the id so we can clear it if necessary
				//console.log("Set timeout:", name);
				b.id = setTimeout(b.func, delay);
			} else {
				//run immediately
				b.func();
			}
		} else if(!b.started && update) {
			//console.log("Clear timeout:", name);
			clearTimeout(b.id);
			delete buffer_list[name];
			queue.buffer.apply(queue, [func, name, delay, update]);
		} else if(update) {
			//console.log("Queueing :", name);
			//function is currently running. We will need to run it again.
			b.queued = {func:func, delay:delay};
		}
	};





	//add a function with an optional unique name. 
	//if the queue already contains an item with the same name, it's ignored. 
	//delay will make sure the function isn't executed before the time has passed, but could take much longer...
	queue.add = function queue_add(func, name, delay, update) {
		delay = sb.ext.number(delay, 0)
		name = name || ("queued_" + sb.ext.unique());
		var val = low_list.findKey("name", name).value;
		if(!val) {
// console.log("QUEUE: Adding: ", name, func);
			low_list.push({name:name, func:func, time:sb.ext.time(), delay:delay});
			start();
		} else if (update) {
			val.time = sb.ext.time();
			val.delay = delay;
		}
	};
	queue.high = function queue_high(func,name, delay, update) {
		delay = sb.ext.number(delay,0);
		name = name || "queued_" + sb.ext.unique();
		var val = high_list.findKey("name", name).value;
		if(!val) {
			//sb.ext.debug("QUEUE: Adding HIGH: ", name);
			high_list.push({name:name, func:func,  time:sb.ext.time(), delay:delay});
			start();
		} else if (update) {
			val.time = sb.ext.time();
			val.delay = delay;
		}

	};

	queue.cancel = function(name) {
		if(buffer_list[name]) {
			delete buffer_list[name];
			return;
		}

		var lidx = low_list.findKey("name", name).index;
		if(lidx >= 0) {
			low_list.splice(lidx,1);
			return;
		}
		var hidx = high_list.findKey("name", name).index;
		if(hidx >= 0) {
			high_list.splice(hidx,1);
			return;
		}



	};

	queue.next = function queue_next() {
		if(!_next(high_list)) { 
			_next(low_list);
		}
		queue.next.bindDelay(queue, sb.ext.max(minEmptyWait, interval));
	};

	var _next = function queue_next_internal(list) {
		if(!list.length) { return false; }

		var t = sb.ext.time();
		var len = list.length;
		var i = 0;
		var called = false;
		var wait = [];
		while(i < len && !called) {
			var n = list.shift();
			if(t - n.time > n.delay) {
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

	queue.report = function queue_report() {
		var hi = E.map(high_list, function(el) {return el.name;}).join(" ");
		var lo = E.map(low_list, function(el) {return el.name;}).join(" ");
		var buff = E.map(buffer_list, function(el) {return el.name;}).join(" ");

		console.log("Current Queue:", 
			(high_list.length ? (" High: " + hi) : "" ),   
			(low_list.length ? (" Normal: " + lo) : "" ),
			(buffer_list.length ? (" Buffered: " + buff) : "" )
		);
	};

	return queue;

});
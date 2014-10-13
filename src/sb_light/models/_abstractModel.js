/*globals define*/

define(['sb_light/utils/Class','sb_light/globals'], function( Class , sb) {

	'use strict';

	var E, ST;

	var Abstract = Class.extend({
		name: null,
		_model: null,
		_modelArray: null,
		_urlDef: null,
		_selectQueue: null,
		_subscriptions:null,
		_timestamp:null,
		_sb:null,
		_authStateCheck:null,
	
		init: function(name, urlDef) {
			if(!name) { 
				throw new Error("AbstractModel: Model name must be declared"); 
			}
			if(!urlDef) { 
				console.log("wtf", arguments);
				throw new Error("AbstractModel: Model urlDef must be declared"); 
			}
			
			E = sb.ext;
			ST = sb.state;

			this._authStateCheck = this._authStateCheck || ST.normal;
			this.name = name;
			this._urlDef = urlDef;
			this._selectQueue = [];
			this._subscriptions = {};
			
			ST.registerModel(this, this._urlDef, this._handleUpdate.bind(this));
			ST.watchContext("session", this._handleSession.bind(this));
		},
	
		reset: function(publish) {
			this._model = null;
			this._modelArray = null;
			ST.resetTimestamp(this.name);
			if(publish) {
				this._publish();
			}
		},

		timestamp: function() {
			return this._timestamp;
		},
		
		isValid: function() {
			//coerce into a boolean
			return !!this.get();
		},
	
		get: function() {
			if(!this._model) {
				// E.debug("Getting the " + this.name + " model.");
				if(this._authStateCheck() ) {
					E.debug("Forcing the update");
					ST.forceModelUpdate(this);
				} else {
					var me = this;
					var subid = ST.watchContext("session", function() {
						ST.unwatchContext("session", subid);
						me.get();
					});
				}
				return null;
			} 
			return this.rawArray()
		},
		
		raw: function() {
			return this._model;
		},
		rawArray: function() {
			return this._modelArray;
		},

		//find a single element
		find:function(id) {
			if(E.isStr(id)) {
				return this._model ? this._model[id] : null;
			} else {
				//if ID is an object
				return id.id ? this._model[id.id] : null; 
			}
		},


		subscribe: function(cb, domNode/*=null*/) {
			var id = "Sub_" + this.name + "_" + E.unique();
			this._subscriptions[id] = cb;
			var m = this.get();
			if(m) {
				sb.queue.add(cb, id, 50);
			}
			return id;
		},
	
		//unsubnscribe unsing a callback or an id
		unsubscribe:function(remove) {
			var ext = E;
			var del = [];
			var subs= this._subscriptions;
			//collect matches
			ext.each(subs, function(v,k, subs) {
				if(v == remove || k == remove) { 
					del.push(k);
				}
			});
			del.forEach(function(el) {
				delete subs[el];
			});
		},
		
		_publish: function() {
			var m = this.get();
			var q = sb.queue;

			console.log("MODEL IS BEING PUBLISHED: ", this.name);
			E.each(this._subscriptions, function(cb,k) {
				q.add(cb, k, 0);
			});	
		},
		
		//one-off selection that will wait until the model is available.
		select: function(type, cb, func) {
			this._selectQueue.push({type:type, cb:cb, func:func});
			this._processQueue();
		},	

		_handleSession: function() {
			if(this._authStateCheck()) {
				//force model to fetch itself
				this.get();
			} else {
				//clear the model
				this.reset();
			}
		},
		
		/*************************************************************
			This is expecting the response to be a map with the following keys: {
				"deleted": Array of ids that have been deleted since the last request. They do not have to exist the our
							view of the model.
				"added":  Map of objects that have been added to the company since our last update
				"updated": Map of objects that have been changed since our last update. 
				"timestamp": ms since epoch that the model was changed.
				NOTE: most of the time added/updated are effectively the same result, but the intention was
						to be able to treat the objects differently if we wanted to.
		
		**************************************************************/
		_handleUpdate: function(response) {
			var processed = this._processResponse(response);
			if(!this._model || !processed) {
				//don't trigger the update if there's no model or we didn't do anything 
				return;
			} 
			this._publish();
			this._processQueue();
		},
		
		_processQueue: function() {
			var data = this.get();
			if(!data) { return; }
			
			while(this._selectQueue.length) {
				var sel = this._selectQueue.pop();
				switch(sel.type) {
					case "map": 	sel.cb(this._model); break;					//raw map
					case "all": 	sel.cb(data); break;						//array -- unsorted
					case "filter": 	sel.cb( data.filter(sel.func) ); break; 	//run array through a filter
				} 
			}
			
		},	
		
		_processResponse: function(data) {
			this._model = this._model || {};
			
			
			//The following order assumes a faulty server and ensures we don't update  or delete missing
			//items.
			var ae = E.length(data.added) === 0;
			var ue = E.length(data.updated) === 0;
			var de = E.length(data.deleted) === 0;

			//cover ass because sever sometimes sends me empty stuff. This should get fixed,
			//but in the meantime, don't touch the model if there's nothing here, especially the 
			//timestamp and arraycache
			if(ae && ue && de) { 
				// console.log("MODEL: ", this.name, " has an empty HLM");
				if(!this._modelArray) {
					this._modelArray = [];
				}
				return false; 
			}
			E.debug("Processing Model", this.name, ae, ue, de);

			if(!ae) { 
				this._addItems(data.added);
			}
			if(!ue) {
				this._updateItems(data.updated);
			}

			if(!de) {
				this._deleteItems(data.deleted);
			}			
			
			
			this._massageUpdatedModel();

			//do this last because massage will cause changes			
			this._resetArrayCache();


			return true;
		},
	
		
		_addItems: function(added) {
			added = added || {};
			for (var k in added) {
				this._model[k] = added[k];
			}
		},
		
		_updateItems: function(updated) {
			updated  = updated || {};
			for (var k in updated) {
				this._model[k] = updated[k];
			}
		},	
		
		_deleteItems:function(deleted) {
			var model = this._model;
			deleted = deleted || [];
			var self =this;
			deleted.forEach(function(v) {
				if(model[v]) {
					self._sb.ext.debug("Deleting Model", self.name, v);
				}
				delete model[v];
			});
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._addTimestamp();
		},
		
		//build an array cache of the model to make list-fetches / iterations / sorting quicker. 
		//but preserve the model as a map for key-value queries
		_resetArrayCache:function() {
			this._modelArray =E.values(this._model);
			//E.debug(this.name, this._modelArray.length);
		},
		
		_addTimestamp: function() {
			var ts = ST.getTimestamp(this.name);

			this._timestamp = ts;

			// console.log("Model Timestamp", this.name, this._timestamp);
			E.map(this._model, (function(v) {
				if(!v) {
					console.log("wtf?");
				}
				//this can be used for performance reasons to check whether a model has been updated
				v.__timestamp = ts;
			}));
		}

	});
	return Abstract;
});


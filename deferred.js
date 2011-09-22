function Deferred() {
	this._callback = null;
	this._errback = null;
	this.state = "initial"; // initial, set, fired
}

Deferred.prototype = {
	callback: function (value) {
		this._toFired();
		if (this._callback) this._callback(value);
	},
	errback: function (value) {
		this._toFired();
		if (this._errback)
			this._errback(value);
		else
			throw value;
	},
	_toFired: function () {
		if (this.state === "fired") throw new Error("double fire");
		this.state = "fired";
	},
	then: function(callback, errback) {
		if (this.state === "set") throw new Error("double then");
		if (this.state === "fired") throw new Error("then after fire");
		this.state = "set";
		this._callback = callback;
		this._errback = errback;
	},
};

function generatorToDeferred(func) {
	return function () {
		var deferred = new Deferred();
		var generator = func.apply(this, arguments);
		var callback = function (val) loop(val, false);
		var errback = function (val) loop(val, true);
		function loop(val, isError) {
			try {
				if (isError) {
					generator.throw(val);
				} else {
					var waitTask = generator.send(val);
					waitTask.then(callback, errback);
				}
			} catch (e if e instanceof StopIteration) {
				deferred.callback();
			} catch (e) {
				deferred.errback(e);
			}
		}
		loop(undefined, false);
		return deferred;
	};
}


function Deferred() {
	this._callbackFunc = null;
	this._errbackFunc = null;
	this.state = "initial"; // initial, set, fired
}

Deferred.prototype = {
	callback: function (value) {
		setTimeout(this._callback.bind(this, value));
	},
	errback: function (value) {
		setTimeout(this._errback.bind(this, value));
	},
	_callback: function (value) {
		this._toFired();
		if (this._callbackFunc) this._callbackFunc(value);
	},
	_errback: function (value) {
		this._toFired();
		if (this._errbackFunc)
			this._errbackFunc(value);
		else
			throw value;
	},
	_toFired: function () {
		if (this.state === "fired") throw new Error("double fire");
		this.state = "fired";
	},
	then: function(callbackFunc, errbackFunc) {
		if (this.state === "set") throw new Error("double then");
		if (this.state === "fired") throw new Error("then after fire");
		this.state = "set";
		this._callbackFunc = callbackFunc;
		this._errbackFunc = errbackFunc;
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


function Deferred() {
	this._callbackFunc = null;
	this._errbackFunc = null;
	this._state = "initial"; // initial, set, fired
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
		if (this._state === "fired") throw new Error("double fire");
		this._state = "fired";
	},
	then: function(callbackFunc, errbackFunc) {
		if (this._state === "set") throw new Error("double then");
		if (this._state === "fired") throw new Error("then after fire");
		this._state = "set";
		this._callbackFunc = callbackFunc;
		this._errbackFunc = errbackFunc;
	},
};

function returnValue(value) {
	return {value: value, __proto__: returnValue.prototype};
}

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
					var ret = generator.send(val);
					if (ret instanceof returnValue)
						deferred.callback(ret.value);
					else
						ret.then(callback, errback);
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


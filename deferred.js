function Deferred() {
	this.listener = null;
}

Deferred.prototype = {
	callback: function(value) {
		if (this.listener) this.listener(value);
	},
	then: function(callback) {
		this.listener = callback;
	},
};

function generatorToDeferred(func) {
	return function () {
		var deferred = new Deferred();
		var generator = func.apply(this, arguments);
		function loop(val) {
			try {
				var waitTask = generator.send(val);
				waitTask.then(loop);
			} catch (e if e instanceof StopIteration) {
				deferred.callback();
			}
		}
		loop(undefined);
		return deferred;
	};
}


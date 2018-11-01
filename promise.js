function Promise(executor) {
  var resolve;
  var reject;

  if (this.Promise) {
    throw new Error("You can not call Promise like function.");
  }

  if (typeof executor !== "function") {
    throw new TypeError("You must pass a function to the executor argument.");
  }

  this.status = {};

  if (!Promise.length) {
    Promise.length = 1;
  }

  if (!Promise.all) {
    Promise.all = function(iteratable) {
      return new Promise(function(resolve, reject) {
        var values = Array(iteratable.length);
        var count = 0;
        var done = false;
        var i;
        var fn;

        for (i = 0; i < iteratable.length; i++) {
          fn = function(value) {
            values[arguments.callee.index] = value;
            count++;
            if (!done && count === values.length) {
              done = true;
              resolve(values);
            }
          };
          fn.index = i;
          iteratable[i].then(fn).catch(function(reason) {
            if (!done) {
              done = true;
              reject(reason);
            }
          });
        }
      });
    };
  }

  if (!Promise.race) {
    Promise.race = function(iteratable) {
      return new Promise(function(resolve, reject) {
        var done = false;
        var i;

        for (i = 0; i < iteratable.length; i++) {
          iteratable[i].then(function(value) {
            if (!done) {
              done = true;
              resolve(value);
            }
          }).catch(function(reason) {
            if (!done) {
              done = true;
              reject(reason);
            }
          });
        }
      });
    };
  }

  if (!Promise.reject) {
    Promise.reject = function(reason) {
      return new Promise(function(resolve, reject) {
        reject(reason);
      });
    };
  }

  if (!Promise.resolve) {
    Promise.resolve = function(value) {
      var promise;

      if (value instanceof Promise) {
        return value;
      }
      if ((typeof value === "object" || typeof value === "function") && typeof value.then === "function") {
        try {
          return new Promise(value.then.bind(value));
        } catch (e) {
          return new Promise(function(resolve, reject) {
            reject(e);
          });
        }
      }
      promise = new Promise(function() {});
      promise.status.resolveCalled = true;
      promise.status.value = value;
      return promise;
    };
  }

  if (!Promise.prototype.catch) {
    Promise.prototype.catch = function(onRejected) {
      return this.then(null, onRejected);
    };
  }

  if (!Promise.prototype.then) {
    Promise.prototype.then = function(onFulfilled, onRejected) {
      var promise;

      if (onFulfilled) {
        if (this.status.resolveCalled) {
          this.status.value = onFulfilled(this.status.value);
        } else {
          this.status.onFulfilled = onFulfilled;
        }
      }
      if (onRejected) {
        if (this.status.rejectCalled) {
          this.status.reason = onRejected(this.status.reason);
        } else {
          this.status.onRejected = onRejected;
        }
      }
      promise = new Promise(function() {});
      promise.status = this.status;
      return promise;
    };
  }

  resolve = function(value) {
    var self = arguments.callee.promise;

    self.status.resolveCalled = true;
    self.status.value = value;
    if (self.status.onFulfilled) {
      self.status.onFulfilled(value);
    }
  };
  resolve.promise = this;

  reject = function(reason) {
    var self = arguments.callee.promise;

    self.status.rejectCalled = true;
    self.status.reason = reason;
    if (self.status.onRejected) {
      self.status.onRejected(reason);
    }
  };
  reject.promise = this;

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

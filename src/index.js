(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * adt-simple
 * ----------
 * author: Nathan Faubion <nathan@n-son.com>
 * version: 0.1.3
 * license: MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('adt-simple', factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.adt = exports;
  }
})(this, function () {

  var Eq = {
    nativeEquals: function(a, b) {
      return a === b;
    },
    derive: eachVariant(function(v) {
      if (v.fields) {
        v.prototype.equals = function(that) {
          if (this === that) return true;
          if (!(that instanceof v.constructor)) return false;
          for (var i = 0, len = v.fields.length; i < len; i++) {
            var f = v.fields[i];
            var vala = this[f];
            var valb = that[f];
            if (vala && vala.equals) {
              if (!vala.equals(valb)) return false;
            } else if (!Eq.nativeEquals(vala, valb)) {
              return false;
            }
          }
          return true;
        };
      } else {
        v.prototype.equals = function(that) {
          return this === that;
        }
      }
    })
  };

  var Clone = {
    nativeClone: function(a) {
      return a;
    },
    derive: eachVariant(function(v) {
      if (v.fields) {
        v.prototype.clone = function() {
          var self = this;
          var args = map(v.fields, function(f) {
            var val = self[f];
            return val && val.clone ? val.clone() : Clone.nativeClone(val);
          });
          return unrollApply(v.constructor, args);
        };
      } else {
        v.prototype.clone = function() {
          return this;
        };
      }
    })
  };

  var Setter = {
    derive: eachVariant(function(v, adt) {
      if (v.fields) {
        v.constructor.create = function(obj) {
          var args = map(v.fields, function(f) {
            if (!obj.hasOwnProperty(f)) {
              throw new TypeError('Missing field: ' + [adt.name, v.name, f].join('.'));
            }
            return obj[f];
          });
          return unrollApply(v.constructor, args);
        };
        v.prototype.set = function(obj) {
          var self = this;
          var args = map(v.fields, function(f) {
            return obj.hasOwnProperty(f) ? obj[f] : self[f];
          });
          return unrollApply(v.constructor, args);
        };
      }
    })
  };

  var ToString = {
    toString: function(x) {
      if (x === null) return 'null';
      if (x === void 0) return 'undefined';
      if (Object.prototype.toString.call(x) === '[object Array]') {
        return '[' + map(x, function(v) {
          return ToString.toString(v);
        }).join(', ') + ']';
      }
      return x.toString();
    },
    derive: eachVariant(function(v) {
      if (v.fields) {
        v.prototype.toString = function() {
          var self = this;
          return v.name + '(' + map(v.fields, function(f) {
            return ToString.toString(self[f]);
          }).join(', ') + ')';
        };
      } else {
        v.prototype.toString = function() {
          return v.name;
        };
      }
    })
  };

  var ToJSON = {
    toJSONValue: function(x) {
      return x && typeof x === 'object' && x.toJSON ? x.toJSON() : x;
    },
    derive: eachVariant(function(v) {
      if (v.fields) {
        v.prototype.toJSON = function() {
          var res = {};
          var self = this;
          each(v.fields, function(f) {
            res[f] = ToJSON.toJSONValue(self[f]);
          });
          return res;
        }
      } else {
        v.prototype.toJSON = function() {
          return this.hasOwnProperty('value') ? this.value : v.name
        };
      }
    })
  };

  var Curry = {
    derive: eachVariant(function(v, adt) {
      if (v.fields && v.fields.length) {
        var ctr = v.constructor;
        function curried() {
          var args = arguments;
          if (args.length < v.fields.length) {
            return function() {
              return unrollApply(curried, concat(args, arguments));
            };
          }
          var res = unrollApply(ctr, args);
          return res;
        };

        v.constructor = curried;
        v.constructor.prototype = ctr.prototype;
        v.prototype.constructor = curried;

        if (adt.constructor === ctr) {
          adt.constructor = v.constructor;
          for (var k in ctr) {
            if (ctr.hasOwnProperty(k)) {
              adt.constructor[k] = ctr[k];
            }
          }
        }
      }
    })
  };

  var Extractor = {
    derive: eachVariant(function(v) {
      if (v.fields) {
        v.constructor.hasInstance = function(x) {
          return x && x.constructor === v.constructor;
        };
        v.constructor.unapply = function(x) {
          if (v.constructor.hasInstance(x)) {
            return map(v.fields, function(f) {
              return x[f];
            });
          }
        };
        v.constructor.unapplyObject = function(x) {
          if (v.constructor.hasInstance(x)) {
            var res = {};
            each(v.fields, function(f) { res[f] = x[f] });
            return res;
          }
        };
      } else {
        v.prototype.hasInstance = function(x) {
          return x === this;
        };
      }
    })
  };

  var Reflect = {
    derive: function(adt) {
      adt.constructor.__names__ = map(adt.variants, function(v) {
        v.prototype['is' + v.name] = true;
        v.constructor.__fields__ = v.fields ? v.fields.slice() : null;
        return v.name;
      });
      return adt;
    }
  };
  
  var Cata = {
    derive: eachVariant(function(v, adt) {
      v.prototype.cata = function(dispatch) {
        if (!dispatch.hasOwnProperty(v.name)) {
          throw new TypeError('No branch for: ' + [adt.name, v.name].join('.'));
        }
        var self = this;
        var args = v.fields
          ? map(v.fields, function(f) { return self[f] })
          : [];
        return dispatch[v.name].apply(this, args);
      };
    })
  };

  var LateDeriving = {
    derive: function(adt) {
      // Singleton data constructors need it on the prototype
      var ctr = adt.variants && adt.variants[0] &&
                adt.variants[0].constructor === adt.constructor &&
                !adt.variants[0].fields
        ? adt.prototype
        : adt.constructor

      ctr.deriving = function() {
        var res = adt;
        for (var i = 0, c; c = arguments[i]; i++) {
          res = c.derive(res);
        }
      }
      return adt;
    }
  };

  var Base = composeDeriving(Eq, Clone, Setter, ToString, Reflect, Extractor);

  // Export
  // ------

  return {
    eachVariant: eachVariant,
    composeDeriving: composeDeriving,
    Eq: Eq,
    Clone: Clone,
    Setter: Setter,
    ToString: ToString,
    ToJSON: ToJSON,
    Curry: Curry,
    Extractor: Extractor,
    Reflect: Reflect,
    Cata: Cata,
    LateDeriving: LateDeriving,
    Base: Base
  };

  // Utilities
  // ---------

  function each(arr, fn) {
    for (var i = 0, len = arr.length; i < len; i++) {
      fn(arr[i], i, arr);
    }
  }

  function map(arr, fn) {
    var res = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      res[res.length] = fn(arr[i], i, arr);
    }
    return res;
  }

  function eachVariant(fn) {
    return function(adt) {
      each(adt.variants, function(v) {
        fn(v, adt);
      });
      return adt;
    }
  }

  function composeDeriving() {
    var classes = arguments;
    return {
      derive: function(adt) {
        var res = adt;
        for (var i = 0, len = classes.length; i < len; i++) {
          res = classes[i].derive(res);
        }
        return res;
      }
    };
  }

  function unrollApply(fn, a) {
    switch (a.length) {
      case 0:  return fn();
      case 1:  return fn(a[0]);
      case 2:  return fn(a[0], a[1]);
      case 3:  return fn(a[0], a[1], a[2]);
      case 4:  return fn(a[0], a[1], a[2], a[3]);
      default: return fn.apply(null, a);
    }
  }

  function concat(a, b) {
    var res = [], i, len;
    for (i = 0, len = a.length; i < len; i++) res[res.length] = a[i];
    for (i = 0, len = b.length; i < len; i++) res[res.length] = b[i];
    return res;
  }
});

},{}],2:[function(require,module,exports){
// microKanren, (c) Jason Hemann and Dan Friedman
// JS implementation and tracing support by Adam Solove
var Clone$2458 = require('adt-simple').Clone;
var Eq$2459 = require('adt-simple').Eq;
var Extractor$2460 = require('adt-simple').Extractor;
var Setter$2461 = require('adt-simple').Setter;
var ToString$2462 = require('adt-simple').ToString;
var Variable$2468 = function () {
        function Variable$2577(i$2579) {
            if (!(this instanceof Variable$2577)) {
                return new Variable$2577(i$2579);
            }
            if (typeof i$2579 === 'number' || Object.prototype.toString.call(i$2579) === '[object Number]') {
                this.i = i$2579;
            } else {
                throw new TypeError('Unexpected type for field: Variable.i');
            }
        }
        var derived$2578 = Extractor$2460.derive(ToString$2462.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'Variable',
                constructor: Variable$2577,
                prototype: Variable$2577.prototype,
                variants: [{
                        name: 'Variable',
                        constructor: Variable$2577,
                        prototype: Variable$2577.prototype,
                        fields: ['i']
                    }]
            }))));
        return derived$2578.constructor;
    }();
Variable$2468.prototype.toString = function () {
    return '_.' + this.i;
};
var Cons$2473 = function () {
        function Cons$2580() {
        }
        function Nil$2581() {
        }
        Nil$2581.prototype = new Cons$2580();
        Nil$2581.prototype.constructor = Nil$2581;
        function Pair$2582(a$2584, d$2585) {
            if (!(this instanceof Pair$2582)) {
                return new Pair$2582(a$2584, d$2585);
            }
            this.a = a$2584;
            this.d = d$2585;
        }
        Pair$2582.prototype = new Cons$2580();
        Pair$2582.prototype.constructor = Pair$2582;
        var derived$2583 = Extractor$2460.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'Cons',
                constructor: Cons$2580,
                prototype: Cons$2580.prototype,
                variants: [
                    {
                        name: 'Nil',
                        constructor: Nil$2581,
                        prototype: Nil$2581.prototype
                    },
                    {
                        name: 'Pair',
                        constructor: Pair$2582,
                        prototype: Pair$2582.prototype,
                        fields: [
                            'a',
                            'd'
                        ]
                    }
                ]
            })));
        Cons$2580.Nil = new derived$2583.variants[0].constructor();
        Cons$2580.Pair = derived$2583.variants[1].constructor;
        return Cons$2580;
    }();
var Nil$2474 = Cons$2473.Nil;
var Pair$2475 = Cons$2473.Pair;
var Substitutions$2479 = function () {
        function Substitutions$2586(variables$2588) {
            if (!(this instanceof Substitutions$2586)) {
                return new Substitutions$2586(variables$2588);
            }
            if (Array.isArray ? Array.isArray(variables$2588) : Object.prototype.toString.call(variables$2588) === '[object Array]') {
                this.variables = variables$2588;
            } else {
                throw new TypeError('Unexpected type for field: Substitutions.variables');
            }
        }
        var derived$2587 = Extractor$2460.derive(ToString$2462.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'Substitutions',
                constructor: Substitutions$2586,
                prototype: Substitutions$2586.prototype,
                variants: [{
                        name: 'Substitutions',
                        constructor: Substitutions$2586,
                        prototype: Substitutions$2586.prototype,
                        fields: ['variables']
                    }]
            }))));
        return derived$2587.constructor;
    }();
Substitutions$2479.prototype.extend = function (v$2589, value$2590) {
    var variables$2592 = this.variables.map(function (x$2593) {
            return x$2593;
        });
    variables$2592[v$2589.i] = value$2590;
    return Substitutions$2479(variables$2592);
};
var State$2484 = function () {
        function State$2594() {
        }
        function Success$2595(s$2598, c$2599, t$2600) {
            if (!(this instanceof Success$2595)) {
                return new Success$2595(s$2598, c$2599, t$2600);
            }
            if (s$2598 instanceof Substitutions$2479) {
                this.s = s$2598;
            } else {
                throw new TypeError('Unexpected type for field: State.Success.s');
            }
            if (typeof c$2599 === 'number' || Object.prototype.toString.call(c$2599) === '[object Number]') {
                this.c = c$2599;
            } else {
                throw new TypeError('Unexpected type for field: State.Success.c');
            }
            if (Array.isArray ? Array.isArray(t$2600) : Object.prototype.toString.call(t$2600) === '[object Array]') {
                this.t = t$2600;
            } else {
                throw new TypeError('Unexpected type for field: State.Success.t');
            }
        }
        Success$2595.prototype = new State$2594();
        Success$2595.prototype.constructor = Success$2595;
        function Failure$2596(t$2601) {
            if (!(this instanceof Failure$2596)) {
                return new Failure$2596(t$2601);
            }
            if (Array.isArray ? Array.isArray(t$2601) : Object.prototype.toString.call(t$2601) === '[object Array]') {
                this.t = t$2601;
            } else {
                throw new TypeError('Unexpected type for field: State.Failure.t');
            }
        }
        Failure$2596.prototype = new State$2594();
        Failure$2596.prototype.constructor = Failure$2596;
        var derived$2597 = Setter$2461.derive(Extractor$2460.derive(ToString$2462.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'State',
                constructor: State$2594,
                prototype: State$2594.prototype,
                variants: [
                    {
                        name: 'Success',
                        constructor: Success$2595,
                        prototype: Success$2595.prototype,
                        fields: [
                            's',
                            'c',
                            't'
                        ]
                    },
                    {
                        name: 'Failure',
                        constructor: Failure$2596,
                        prototype: Failure$2596.prototype,
                        fields: ['t']
                    }
                ]
            })))));
        State$2594.Success = derived$2597.variants[0].constructor;
        State$2594.Failure = derived$2597.variants[1].constructor;
        return State$2594;
    }();
var Success$2485 = State$2484.Success;
var Failure$2486 = State$2484.Failure;
State$2484.prototype.addTrace = function (a0$2602) {
    if (TraceFrame$2493.hasInstance ? TraceFrame$2493.hasInstance(a0$2602) : a0$2602 instanceof TraceFrame$2493) {
        var t$2603 = a0$2602;
        return this.set({ t: this.t.concat([t$2603]) });
    }
    throw new TypeError('No match');
};
var TraceFrame$2493 = function () {
        function TraceFrame$2604() {
        }
        function Push$2605(name$2608, subs$2609) {
            if (!(this instanceof Push$2605)) {
                return new Push$2605(name$2608, subs$2609);
            }
            if (typeof name$2608 === 'string' || Object.prototype.toString.call(name$2608) === '[object String]') {
                this.name = name$2608;
            } else {
                throw new TypeError('Unexpected type for field: TraceFrame.Push.name');
            }
            if (subs$2609 instanceof Substitutions$2479) {
                this.subs = subs$2609;
            } else {
                throw new TypeError('Unexpected type for field: TraceFrame.Push.subs');
            }
        }
        Push$2605.prototype = new TraceFrame$2604();
        Push$2605.prototype.constructor = Push$2605;
        function Pop$2606(subs$2610) {
            if (!(this instanceof Pop$2606)) {
                return new Pop$2606(subs$2610);
            }
            if (subs$2610 instanceof Substitutions$2479) {
                this.subs = subs$2610;
            } else {
                throw new TypeError('Unexpected type for field: TraceFrame.Pop.subs');
            }
        }
        Pop$2606.prototype = new TraceFrame$2604();
        Pop$2606.prototype.constructor = Pop$2606;
        var derived$2607 = Extractor$2460.derive(ToString$2462.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'TraceFrame',
                constructor: TraceFrame$2604,
                prototype: TraceFrame$2604.prototype,
                variants: [
                    {
                        name: 'Push',
                        constructor: Push$2605,
                        prototype: Push$2605.prototype,
                        fields: [
                            'name',
                            'subs'
                        ]
                    },
                    {
                        name: 'Pop',
                        constructor: Pop$2606,
                        prototype: Pop$2606.prototype,
                        fields: ['subs']
                    }
                ]
            }))));
        TraceFrame$2604.Push = derived$2607.variants[0].constructor;
        TraceFrame$2604.Pop = derived$2607.variants[1].constructor;
        return TraceFrame$2604;
    }();
var Push$2494 = TraceFrame$2493.Push;
var Pop$2495 = TraceFrame$2493.Pop;
var Stream$2499 = function () {
        function Stream$2611() {
        }
        function Done$2612() {
        }
        Done$2612.prototype = new Stream$2611();
        Done$2612.prototype.constructor = Done$2612;
        function Thunk$2613(fn$2616) {
            if (!(this instanceof Thunk$2613)) {
                return new Thunk$2613(fn$2616);
            }
            if (Object.prototype.toString.call(fn$2616) === '[object Function]') {
                this.fn = fn$2616;
            } else {
                throw new TypeError('Unexpected type for field: Stream.Thunk.fn');
            }
        }
        Thunk$2613.prototype = new Stream$2611();
        Thunk$2613.prototype.constructor = Thunk$2613;
        function Value$2614(v$2617, r$2618) {
            if (!(this instanceof Value$2614)) {
                return new Value$2614(v$2617, r$2618);
            }
            if (v$2617 instanceof State$2484) {
                this.v = v$2617;
            } else {
                throw new TypeError('Unexpected type for field: Stream.Value.v');
            }
            if (r$2618 instanceof Stream$2499) {
                this.r = r$2618;
            } else {
                throw new TypeError('Unexpected type for field: Stream.Value.r');
            }
        }
        Value$2614.prototype = new Stream$2611();
        Value$2614.prototype.constructor = Value$2614;
        var derived$2615 = Extractor$2460.derive(ToString$2462.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'Stream',
                constructor: Stream$2611,
                prototype: Stream$2611.prototype,
                variants: [
                    {
                        name: 'Done',
                        constructor: Done$2612,
                        prototype: Done$2612.prototype
                    },
                    {
                        name: 'Thunk',
                        constructor: Thunk$2613,
                        prototype: Thunk$2613.prototype,
                        fields: ['fn']
                    },
                    {
                        name: 'Value',
                        constructor: Value$2614,
                        prototype: Value$2614.prototype,
                        fields: [
                            'v',
                            'r'
                        ]
                    }
                ]
            }))));
        Stream$2611.Done = new derived$2615.variants[0].constructor();
        Stream$2611.Thunk = derived$2615.variants[1].constructor;
        Stream$2611.Value = derived$2615.variants[2].constructor;
        return Stream$2611;
    }();
var Done$2500 = Stream$2499.Done;
var Thunk$2501 = Stream$2499.Thunk;
var Value$2502 = Stream$2499.Value;
function step$2509(a0$2619, a1$2620) {
    var r0$2621 = Variable$2468.unapply(a0$2619);
    if (r0$2621 != null && r0$2621.length === 1) {
        var r1$2622 = Substitutions$2479.unapply(a1$2620);
        if (r1$2622 != null && r1$2622.length === 1) {
            var v$2623 = r0$2621[0];
            var s$2624 = r1$2622[0];
            return s$2624[v$2623] || false;
        }
    }
    throw new TypeError('No match');
}
function walk$2511(a0$2625, a1$2626) {
    if ((Variable$2468.hasInstance ? Variable$2468.hasInstance(a0$2625) : a0$2625 instanceof Variable$2468) && (Substitutions$2479.hasInstance ? Substitutions$2479.hasInstance(a1$2626) : a1$2626 instanceof Substitutions$2479)) {
        var v$2627 = a0$2625;
        var s$2629 = a1$2626;
        return function (a0$2633) {
            if (a0$2633 === false) {
                return v$2627;
            }
            if (Variable$2468.hasInstance ? Variable$2468.hasInstance(a0$2633) : a0$2633 instanceof Variable$2468) {
                var v2$2635 = a0$2633;
                return walk$2511(v2$2635, s$2629);
            }
            var other$2634 = a0$2633;
            return other$2634;
        }.call(this, step$2509(v$2627, s$2629));
    }
    var v$2627 = a0$2625;
    var _$2628 = a1$2626;
    return v$2627;
}
function equal$2515(u$2636, v$2637) {
    return function (st$2639) {
        return function (a0$2643) {
            if (a0$2643 === false) {
                return Value$2502(Failure$2486(st$2639.t), Done$2500);
            }
            var s$2644 = a0$2643;
            return Value$2502(Success$2485(s$2644, st$2639.c, st$2639.t), Done$2500);
        }.call(this, unify$2517(u$2636, v$2637, st$2639.s));
    };
}
function unify$2517(a0$2645, a1$2646, a2$2647) {
    if (Substitutions$2479.hasInstance ? Substitutions$2479.hasInstance(a2$2647) : a2$2647 instanceof Substitutions$2479) {
        var u$2648 = a0$2645;
        var v$2649 = a1$2646;
        var s$2650 = a2$2647;
        return function (a0$2654, a1$2655) {
            var r0$2656 = Variable$2468.unapply(a0$2654);
            if (r0$2656 != null && r0$2656.length === 1) {
                var r1$2658 = Variable$2468.unapply(a1$2655);
                if (r1$2658 != null && (r1$2658.length === 1 && r0$2656[0] == r1$2658[0])) {
                    var v$2659 = r0$2656[0];
                    var u$2660 = r1$2658[0];
                    return s$2650;
                }
            }
            if (Variable$2468.hasInstance ? Variable$2468.hasInstance(a0$2654) : a0$2654 instanceof Variable$2468) {
                var u$2660 = a0$2654;
                var v$2659 = a1$2655;
                return s$2650.extend(u$2660, v$2659);
            }
            if (Variable$2468.hasInstance ? Variable$2468.hasInstance(a1$2655) : a1$2655 instanceof Variable$2468) {
                var u$2660 = a0$2654;
                var v$2659 = a1$2655;
                return s$2650.extend(v$2659, u$2660);
            }
            var r2$2657 = Pair$2475.unapply(a1$2655);
            if (r2$2657 != null && r2$2657.length === 2) {
                var r3$2661 = Pair$2475.unapply(a0$2654);
                if (r3$2661 != null && r3$2661.length === 2) {
                    var a1$2662 = r3$2661[0];
                    var d1$2663 = r3$2661[1];
                    var a2$2664 = r2$2657[0];
                    var d2$2665 = r2$2657[1];
                    return unify$2517(d1$2663, d2$2665, unify$2517(a1$2662, a2$2664, s$2650));
                }
            }
            if (a0$2654 == a1$2655) {
                var u$2660 = a0$2654;
                var v$2659 = a1$2655;
                return s$2650;
            }
            return false;
        }.call(this, walk$2511(u$2648, s$2650), walk$2511(v$2649, s$2650));
    }
    return false;
}
function call_fresh$2519(fn$2666) {
    return function (a0$2670) {
        if (Failure$2486.hasInstance ? Failure$2486.hasInstance(a0$2670) : a0$2670 instanceof Failure$2486) {
            var f$2672 = a0$2670;
            return Value$2502(f$2672, Done$2500);
        }
        var r0$2671 = Success$2485.unapply(a0$2670);
        if (r0$2671 != null && r0$2671.length === 3) {
            var s$2673 = r0$2671[0];
            var c$2674 = r0$2671[1];
            var t$2675 = r0$2671[2];
            return fn$2666(Variable$2468(c$2674))(Success$2485(s$2673, c$2674 + 1, t$2675));
        }
        throw new TypeError('No match');
    };
}
function disj$2521(g1$2676, g2$2677) {
    return function (st$2679) {
        return mplus$2529(g1$2676(st$2679), g2$2677(st$2679));
    };
}
function conj$2525(g1$2680, g2$2681) {
    return function (st$2683) {
        return bind$2533(g1$2680(st$2683), g2$2681);
    };
}
function mplus$2529(a0$2684, a1$2685) {
    if (Done$2500.hasInstance ? Done$2500.hasInstance(a0$2684) : a0$2684 instanceof Done$2500) {
        var s$2688 = a1$2685;
        return s$2688;
    }
    var r0$2686 = Thunk$2501.unapply(a0$2684);
    if (r0$2686 != null && (r0$2686.length === 1 && (Stream$2499.hasInstance ? Stream$2499.hasInstance(a1$2685) : a1$2685 instanceof Stream$2499))) {
        var fn$2689 = r0$2686[0];
        var s$2688 = a1$2685;
        return Thunk$2501(function () {
            return mplus$2529(s$2688, fn$2689);
        });
    }
    var r1$2687 = Value$2502.unapply(a0$2684);
    if (r1$2687 != null && (r1$2687.length === 2 && (Stream$2499.hasInstance ? Stream$2499.hasInstance(a1$2685) : a1$2685 instanceof Stream$2499))) {
        var v$2691 = r1$2687[0];
        var rest$2692 = r1$2687[1];
        var s2$2693 = a1$2685;
        return Value$2502(v$2691, mplus$2529(rest$2692, s2$2693));
    }
    throw new TypeError('No match');
}
function bind$2533(a0$2694, a1$2695) {
    if (Done$2500.hasInstance ? Done$2500.hasInstance(a0$2694) : a0$2694 instanceof Done$2500) {
        var _$2698 = a1$2695;
        return Done$2500;
    }
    var r0$2696 = Thunk$2501.unapply(a0$2694);
    if (r0$2696 != null && r0$2696.length === 1) {
        var fn$2699 = r0$2696[0];
        var g$2700 = a1$2695;
        return Thunk$2501(function () {
            return bind$2533(fn$2699(), g$2700);
        });
    }
    var r1$2697 = Value$2502.unapply(a0$2694);
    if (r1$2697 != null && r1$2697.length === 2) {
        var v$2702 = r1$2697[0];
        var rest$2703 = r1$2697[1];
        var g$2700 = a1$2695;
        return mplus$2529(g$2700(v$2702), bind$2533(rest$2703, g$2700));
    }
    throw new TypeError('No match');
}
/* Runner */
function take$2534(a0$2704, a1$2705) {
    if (a0$2704 === 0) {
        var _$2708 = a1$2705;
        return [];
    }
    if (Done$2500.hasInstance ? Done$2500.hasInstance(a1$2705) : a1$2705 instanceof Done$2500) {
        var n$2709 = a0$2704;
        return [];
    }
    var r0$2706 = Thunk$2501.unapply(a1$2705);
    if (r0$2706 != null && r0$2706.length === 1) {
        var n$2709 = a0$2704;
        var fn$2710 = r0$2706[0];
        return take$2534(n$2709, fn$2710());
    }
    var r1$2707 = Value$2502.unapply(a1$2705);
    if (r1$2707 != null && r1$2707.length === 2) {
        var r2$2711 = r1$2707[0];
        if (Success$2485.hasInstance ? Success$2485.hasInstance(r2$2711) : r2$2711 instanceof Success$2485) {
            var n$2709 = a0$2704;
            var s$2712 = r2$2711;
            var rest$2713 = r1$2707[1];
            return [s$2712].concat(take$2534(n$2709 - 1, rest$2713));
        }
        if (Failure$2486.hasInstance ? Failure$2486.hasInstance(r2$2711) : r2$2711 instanceof Failure$2486) {
            var n$2709 = a0$2704;
            var f$2714 = r2$2711;
            var rest$2713 = r1$2707[1];
            return take$2534(n$2709, rest$2713);
        }
    }
    throw new TypeError('No match');
}
var emptyState$2536 = Success$2485(Substitutions$2479([]), 0, []);
function call_goal$2537(g$2715) {
    return g$2715(emptyState$2536);
}
/* Convenience methods for inspecting the results */
Cons$2473.prototype.toString = function () {
    return '(' + this.toArray().join(',') + ')';
};
Cons$2473.prototype.toArray = function () {
    return function (a0$2719) {
        if (Nil$2474.hasInstance ? Nil$2474.hasInstance(a0$2719) : a0$2719 instanceof Nil$2474) {
            return [];
        }
        var r0$2720 = Pair$2475.unapply(a0$2719);
        if (r0$2720 != null && r0$2720.length === 2) {
            var r1$2721 = r0$2720[1];
            if (Cons$2473.hasInstance ? Cons$2473.hasInstance(r1$2721) : r1$2721 instanceof Cons$2473) {
                var a$2722 = r0$2720[0];
                var d$2723 = r1$2721;
                return [a$2722].concat(d$2723.toArray());
            }
            var a$2722 = r0$2720[0];
            var d$2723 = r1$2721;
            return [a$2722].concat([d$2723]);
        }
        throw new TypeError('No match');
    }.call(this, this);
};
Substitutions$2479.prototype.toObject = function () {
    return this.variables.map(function (i$2725) {
        return walkStar$2551(i$2725, this).toString();
    }.bind(this));
};
// fixme: actual push/pop handling with indentation
function inspectTraceFrame$2545(a0$2726) {
    if (TraceFrame$2493.hasInstance ? TraceFrame$2493.hasInstance(a0$2726) : a0$2726 instanceof TraceFrame$2493) {
        var t$2727 = a0$2726;
        return t$2727.toString();
    }
    throw new TypeError('No match');
}
function inspectTrace$2547(states$2728) {
    return states$2728.map(function (a0$2732) {
        var r0$2733 = Success$2485.unapply(a0$2732);
        if (r0$2733 != null && r0$2733.length === 3) {
            var s$2734 = r0$2733[0];
            var c$2735 = r0$2733[1];
            var t$2736 = r0$2733[2];
            return 'Found: ' + reifyFirst$2549(s$2734) + ' via \n' + t$2736.map(inspectTraceFrame$2545).join('\n');
        }
        throw new TypeError('No match');
    }).join('\n\n');
}
function reifyFirst$2549(state$2737) {
    return walkStar$2551(Variable$2468(0), state$2737);
}
function walkStar$2551(v$2738, s$2739) {
    return function (a0$2743) {
        if (Variable$2468.hasInstance ? Variable$2468.hasInstance(a0$2743) : a0$2743 instanceof Variable$2468) {
            var v$2746 = a0$2743;
            return v$2746;
        }
        var r0$2744 = Pair$2475.unapply(a0$2743);
        if (r0$2744 != null && r0$2744.length === 2) {
            var a$2747 = r0$2744[0];
            var d$2748 = r0$2744[1];
            return Pair$2475(walkStar$2551(a$2747, s$2739), walkStar$2551(d$2748, s$2739));
        }
        var other$2745 = a0$2743;
        return other$2745;
    }.call(this, walk$2511(v$2738, s$2739));
}
function run$2553(n$2749, goal$2750) {
    return take$2534(n$2749, call_goal$2537(call_fresh$2519(goal$2750))).map(function (state$2752) {
        return reifyFirst$2549(state$2752.s);
    });
}
function runTrace$2555(n$2753, goal$2754) {
    return take$2534(n$2753, call_goal$2537(call_fresh$2519(goal$2754)));
}
/* Tracing goals */
function trace$2559(name$2755, goal$2756) {
    return function (a0$2760) {
        if (Failure$2486.hasInstance ? Failure$2486.hasInstance(a0$2760) : a0$2760 instanceof Failure$2486) {
            var f$2761 = a0$2760;
            return goal$2756(f$2761);
        }
        if (Success$2485.hasInstance ? Success$2485.hasInstance(a0$2760) : a0$2760 instanceof Success$2485) {
            var s$2762 = a0$2760;
            return traceStream$2561(goal$2756(s$2762.addTrace(Push$2494(name$2755, s$2762.s))));
        }
        throw new TypeError('No match');
    };
}
function traceStream$2561(a0$2763) {
    if (Done$2500.hasInstance ? Done$2500.hasInstance(a0$2763) : a0$2763 instanceof Done$2500) {
        return Done$2500;
    }
    var r0$2764 = Thunk$2501.unapply(a0$2763);
    if (r0$2764 != null && r0$2764.length === 1) {
        var t$2766 = r0$2764[0];
        return Thunk$2501(function () {
            return traceStream$2561(t$2766());
        });
    }
    var r1$2765 = Value$2502.unapply(a0$2763);
    if (r1$2765 != null && r1$2765.length === 2) {
        var r2$2768 = r1$2765[0];
        if (Failure$2486.hasInstance ? Failure$2486.hasInstance(r2$2768) : r2$2768 instanceof Failure$2486) {
            var f$2769 = r2$2768;
            var rest$2770 = r1$2765[1];
            return Value$2502(f$2769, Done$2500);
        }
        if (State$2484.hasInstance ? State$2484.hasInstance(r2$2768) : r2$2768 instanceof State$2484) {
            var s$2771 = r2$2768;
            var rest$2770 = r1$2765[1];
            return Value$2502(s$2771.addTrace(Pop$2495(s$2771.s)), traceStream$2561(rest$2770));
        }
    }
    throw new TypeError('No match');
}
/* Let's try it out! */
function appendo$2562(l$2772, s$2773, out$2774) {
    return disj$2521(conj$2525(equal$2515(Nil$2474, l$2772), equal$2515(s$2773, out$2774)), call_fresh$2519(function (a$2776) {
        return call_fresh$2519(function (d$2778) {
            return conj$2525(trace$2559('equal(Pair(a, d), l)', equal$2515(Pair$2475(a$2776, d$2778), l$2772)), call_fresh$2519(function (res$2780) {
                return conj$2525(trace$2559('equal(Pair(a, res), out)', equal$2515(Pair$2475(a$2776, res$2780), out$2774)), function (st$2782) {
                    return trace$2559('appendo(d, s, res)', appendo$2562(d$2778, s$2773, res$2780))(st$2782);
                });
            }));
        });
    }));
}
console.log('(appendo \'(1 2) \'(3) q): ', run$2553(1, function (q$2783) {
    return appendo$2562(Pair$2475(1, Pair$2475(2, Nil$2474)), Pair$2475(3, Nil$2474), q$2783);
}).toString());
console.log('(appendo \'(1 2) q \'(1 2 3 4)): ', run$2553(1, function (q$2784) {
    return appendo$2562(Pair$2475(1, Pair$2475(2, Nil$2474)), q$2784, Pair$2475(1, Pair$2475(2, Pair$2475(3, Pair$2475(4, Nil$2474)))));
}).toString());
console.log('(appendo q r \'(1 2 3)) for q: ', run$2553(10, function (q$2785) {
    return call_fresh$2519(function (r$2787) {
        return appendo$2562(q$2785, r$2787, Pair$2475(1, Pair$2475(2, Pair$2475(3, Nil$2474))));
    });
}).toString());
var appendoTrace$2567 = runTrace$2555(5, function (q$2788) {
        return call_fresh$2519(function (r$2790) {
            return appendo$2562(q$2788, r$2790, Pair$2475(1, Pair$2475(2, Pair$2475(3, Pair$2475(4, Nil$2474)))));
        });
    });
console.log('How did we find answer to (appendo q r \'(1 2 3 4)): ', inspectTrace$2547(appendoTrace$2567));
/* Let's visualize it! */
var TraceStack$2571 = function () {
        function TraceStack$2791(name$2793, children$2794, before$2795, after$2796) {
            if (!(this instanceof TraceStack$2791)) {
                return new TraceStack$2791(name$2793, children$2794, before$2795, after$2796);
            }
            if (typeof name$2793 === 'string' || Object.prototype.toString.call(name$2793) === '[object String]') {
                this.name = name$2793;
            } else {
                throw new TypeError('Unexpected type for field: TraceStack.name');
            }
            if (Array.isArray ? Array.isArray(children$2794) : Object.prototype.toString.call(children$2794) === '[object Array]') {
                this.children = children$2794;
            } else {
                throw new TypeError('Unexpected type for field: TraceStack.children');
            }
            if (before$2795 instanceof Substitutions$2479) {
                this.before = before$2795;
            } else {
                throw new TypeError('Unexpected type for field: TraceStack.before');
            }
            if (after$2796 instanceof Substitutions$2479) {
                this.after = after$2796;
            } else {
                throw new TypeError('Unexpected type for field: TraceStack.after');
            }
        }
        var derived$2792 = Setter$2461.derive(Extractor$2460.derive(ToString$2462.derive(Clone$2458.derive(Eq$2459.derive({
                name: 'TraceStack',
                constructor: TraceStack$2791,
                prototype: TraceStack$2791.prototype,
                variants: [{
                        name: 'TraceStack',
                        constructor: TraceStack$2791,
                        prototype: TraceStack$2791.prototype,
                        fields: [
                            'name',
                            'children',
                            'before',
                            'after'
                        ]
                    }]
            })))));
        return derived$2792.constructor;
    }();
function traceToStack$2573(frames$2797) {
    var stack$2798 = [];
    var lastFrame$2799;
    frames$2797.forEach(function (a0$2803) {
        var r0$2804 = Push$2494.unapply(a0$2803);
        if (r0$2804 != null && r0$2804.length === 2) {
            var name$2806 = r0$2804[0];
            var subs$2807 = r0$2804[1];
            console.log('push');
            var trace$2808 = TraceStack$2571(name$2806, [], subs$2807, Substitutions$2479([]));
            if (stack$2798[0]) {
                var current$2809 = stack$2798[0];
                stack$2798[0] = current$2809.set({ children: current$2809.children.concat(trace$2808) });
                console.log('adding trace to ', current$2809);
            }    //stack[0] = stack[0].set({children: stack[0].children.concat([trace])});
            else {
                console.log('stack is empty');
            }
            stack$2798.push(trace$2808);
            return;
        }
        var r1$2805 = Pop$2495.unapply(a0$2803);
        if (r1$2805 != null && r1$2805.length === 1) {
            var subs$2807 = r1$2805[0];
            console.log('pop');
            lastFrame$2799 = stack$2798.pop().set({ after: subs$2807 });
            return;
        }
        throw new TypeError('No match');
    });
    return lastFrame$2799;
}
var AnswerInspector$2574 = React.createClass({
        displayName: 'AnswerInspector',
        render: function () {
            return this.props.answers.map(function (state$2812) {
                return React.DOM.div(null, React.DOM.h2(null, 'Answer: ', reifyFirst$2549(state$2812)), TraceStackInspector$2575({ stack: traceToStack$2573(state$2812.t) }));
            });
        }
    });
var TraceStackInspector$2575 = React.createClass({
        displayName: 'TraceStackInspector',
        render: function () {
            var children$2814 = this.props.stack.children.map(TrackStackInspector);
            return React.DOM.div({ className: 'stack' }, React.DOM.span({ class: 'name' }, this.props.stack.name), React.DOM.div({ className: 'before' }, SubstitutionTable$2576({ subs: this.props.stack.before })), React.DOM.div({ className: 'after' }, SubstitutionTable$2576({ subs: this.props.stack.after })), React.DOM.div({ className: 'children' }, children$2814));
        }
    });
var SubstitutionTable$2576 = React.createClass({
        displayName: 'SubstitutionTable',
        render: function () {
            rows = this.props.subs.variables.map(function (value$2817, i$2818) {
                return React.DOM.tr(null, React.DOM.th(null, i$2818), React.DOM.td(null, walkStar$2551(Variable$2468(i$2818), subs)));
            });
            return React.DOM.table({ class: 'substitutions' }, rows);
        }
    });
React.renderComponent(AnswerInspector$2574, { answers: appendoTrace$2567 });

},{"adt-simple":1}]},{},[2]);

// microKanren, (c) Jason Hemann and Dan Friedman
// JS implementation and tracing support by Adam Solove
var Clone = require('adt-simple').Clone;
var Eq = require('adt-simple').Eq;
var Extractor = require('adt-simple').Extractor;
var Setter = require('adt-simple').Setter;
var ToString = require('adt-simple').ToString;
var Variable = function () {
        function Variable$2(i) {
            if (!(this instanceof Variable$2)) {
                return new Variable$2(i);
            }
            if (typeof i === 'number' || Object.prototype.toString.call(i) === '[object Number]') {
                this.i = i;
            } else {
                throw new TypeError('Unexpected type for field: Variable.i');
            }
        }
        var derived = Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'Variable',
                constructor: Variable$2,
                prototype: Variable$2.prototype,
                variants: [{
                        name: 'Variable',
                        constructor: Variable$2,
                        prototype: Variable$2.prototype,
                        fields: ['i']
                    }]
            }))));
        return derived.constructor;
    }();
Variable.prototype.toString = function () {
    return '_.' + this.i;
};
var Cons = function () {
        function Cons$2() {
        }
        function Nil$2() {
        }
        Nil$2.prototype = new Cons$2();
        Nil$2.prototype.constructor = Nil$2;
        function Pair$2(a, d) {
            if (!(this instanceof Pair$2)) {
                return new Pair$2(a, d);
            }
            this.a = a;
            this.d = d;
        }
        Pair$2.prototype = new Cons$2();
        Pair$2.prototype.constructor = Pair$2;
        var derived = Extractor.derive(Clone.derive(Eq.derive({
                name: 'Cons',
                constructor: Cons$2,
                prototype: Cons$2.prototype,
                variants: [
                    {
                        name: 'Nil',
                        constructor: Nil$2,
                        prototype: Nil$2.prototype
                    },
                    {
                        name: 'Pair',
                        constructor: Pair$2,
                        prototype: Pair$2.prototype,
                        fields: [
                            'a',
                            'd'
                        ]
                    }
                ]
            })));
        Cons$2.Nil = new derived.variants[0].constructor();
        Cons$2.Pair = derived.variants[1].constructor;
        return Cons$2;
    }();
var Nil = Cons.Nil;
var Pair = Cons.Pair;
var Substitutions = function () {
        function Substitutions$2(variables) {
            if (!(this instanceof Substitutions$2)) {
                return new Substitutions$2(variables);
            }
            if (Array.isArray ? Array.isArray(variables) : Object.prototype.toString.call(variables) === '[object Array]') {
                this.variables = variables;
            } else {
                throw new TypeError('Unexpected type for field: Substitutions.variables');
            }
        }
        var derived = Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'Substitutions',
                constructor: Substitutions$2,
                prototype: Substitutions$2.prototype,
                variants: [{
                        name: 'Substitutions',
                        constructor: Substitutions$2,
                        prototype: Substitutions$2.prototype,
                        fields: ['variables']
                    }]
            }))));
        return derived.constructor;
    }();
Substitutions.prototype.extend = function (v, value) {
    var variables = this.variables.map(function (x) {
            return x;
        });
    variables[v.i] = value;
    return Substitutions(variables);
};
var State = function () {
        function State$2() {
        }
        function Success$2(s, c, t) {
            if (!(this instanceof Success$2)) {
                return new Success$2(s, c, t);
            }
            if (s instanceof Substitutions) {
                this.s = s;
            } else {
                throw new TypeError('Unexpected type for field: State.Success.s');
            }
            if (typeof c === 'number' || Object.prototype.toString.call(c) === '[object Number]') {
                this.c = c;
            } else {
                throw new TypeError('Unexpected type for field: State.Success.c');
            }
            if (Array.isArray ? Array.isArray(t) : Object.prototype.toString.call(t) === '[object Array]') {
                this.t = t;
            } else {
                throw new TypeError('Unexpected type for field: State.Success.t');
            }
        }
        Success$2.prototype = new State$2();
        Success$2.prototype.constructor = Success$2;
        function Failure$2(t) {
            if (!(this instanceof Failure$2)) {
                return new Failure$2(t);
            }
            if (Array.isArray ? Array.isArray(t) : Object.prototype.toString.call(t) === '[object Array]') {
                this.t = t;
            } else {
                throw new TypeError('Unexpected type for field: State.Failure.t');
            }
        }
        Failure$2.prototype = new State$2();
        Failure$2.prototype.constructor = Failure$2;
        var derived = Setter.derive(Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'State',
                constructor: State$2,
                prototype: State$2.prototype,
                variants: [
                    {
                        name: 'Success',
                        constructor: Success$2,
                        prototype: Success$2.prototype,
                        fields: [
                            's',
                            'c',
                            't'
                        ]
                    },
                    {
                        name: 'Failure',
                        constructor: Failure$2,
                        prototype: Failure$2.prototype,
                        fields: ['t']
                    }
                ]
            })))));
        State$2.Success = derived.variants[0].constructor;
        State$2.Failure = derived.variants[1].constructor;
        return State$2;
    }();
var Success = State.Success;
var Failure = State.Failure;
State.prototype.addTrace = function (a0) {
    if (TraceFrame.hasInstance ? TraceFrame.hasInstance(a0) : a0 instanceof TraceFrame) {
        var t = a0;
        return this.set({ t: this.t.concat([t]) });
    }
    throw new TypeError('No match');
};
var TraceFrame = function () {
        function TraceFrame$2() {
        }
        function Push$2(name, subs) {
            if (!(this instanceof Push$2)) {
                return new Push$2(name, subs);
            }
            if (typeof name === 'string' || Object.prototype.toString.call(name) === '[object String]') {
                this.name = name;
            } else {
                throw new TypeError('Unexpected type for field: TraceFrame.Push.name');
            }
            if (subs instanceof Substitutions) {
                this.subs = subs;
            } else {
                throw new TypeError('Unexpected type for field: TraceFrame.Push.subs');
            }
        }
        Push$2.prototype = new TraceFrame$2();
        Push$2.prototype.constructor = Push$2;
        function Pop$2(subs) {
            if (!(this instanceof Pop$2)) {
                return new Pop$2(subs);
            }
            if (subs instanceof Substitutions) {
                this.subs = subs;
            } else {
                throw new TypeError('Unexpected type for field: TraceFrame.Pop.subs');
            }
        }
        Pop$2.prototype = new TraceFrame$2();
        Pop$2.prototype.constructor = Pop$2;
        var derived = Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'TraceFrame',
                constructor: TraceFrame$2,
                prototype: TraceFrame$2.prototype,
                variants: [
                    {
                        name: 'Push',
                        constructor: Push$2,
                        prototype: Push$2.prototype,
                        fields: [
                            'name',
                            'subs'
                        ]
                    },
                    {
                        name: 'Pop',
                        constructor: Pop$2,
                        prototype: Pop$2.prototype,
                        fields: ['subs']
                    }
                ]
            }))));
        TraceFrame$2.Push = derived.variants[0].constructor;
        TraceFrame$2.Pop = derived.variants[1].constructor;
        return TraceFrame$2;
    }();
var Push = TraceFrame.Push;
var Pop = TraceFrame.Pop;
var Stream = function () {
        function Stream$2() {
        }
        function Done$2() {
        }
        Done$2.prototype = new Stream$2();
        Done$2.prototype.constructor = Done$2;
        function Thunk$2(fn) {
            if (!(this instanceof Thunk$2)) {
                return new Thunk$2(fn);
            }
            if (Object.prototype.toString.call(fn) === '[object Function]') {
                this.fn = fn;
            } else {
                throw new TypeError('Unexpected type for field: Stream.Thunk.fn');
            }
        }
        Thunk$2.prototype = new Stream$2();
        Thunk$2.prototype.constructor = Thunk$2;
        function Value$2(v, r) {
            if (!(this instanceof Value$2)) {
                return new Value$2(v, r);
            }
            if (v instanceof State) {
                this.v = v;
            } else {
                throw new TypeError('Unexpected type for field: Stream.Value.v');
            }
            if (r instanceof Stream) {
                this.r = r;
            } else {
                throw new TypeError('Unexpected type for field: Stream.Value.r');
            }
        }
        Value$2.prototype = new Stream$2();
        Value$2.prototype.constructor = Value$2;
        var derived = Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'Stream',
                constructor: Stream$2,
                prototype: Stream$2.prototype,
                variants: [
                    {
                        name: 'Done',
                        constructor: Done$2,
                        prototype: Done$2.prototype
                    },
                    {
                        name: 'Thunk',
                        constructor: Thunk$2,
                        prototype: Thunk$2.prototype,
                        fields: ['fn']
                    },
                    {
                        name: 'Value',
                        constructor: Value$2,
                        prototype: Value$2.prototype,
                        fields: [
                            'v',
                            'r'
                        ]
                    }
                ]
            }))));
        Stream$2.Done = new derived.variants[0].constructor();
        Stream$2.Thunk = derived.variants[1].constructor;
        Stream$2.Value = derived.variants[2].constructor;
        return Stream$2;
    }();
var Done = Stream.Done;
var Thunk = Stream.Thunk;
var Value = Stream.Value;
function step(a0, a1) {
    var r0 = Variable.unapply(a0);
    if (r0 != null && r0.length === 1) {
        var r1 = Substitutions.unapply(a1);
        if (r1 != null && r1.length === 1) {
            var v = r0[0];
            var s = r1[0];
            return s[v] || false;
        }
    }
    throw new TypeError('No match');
}
function walk(a0, a1) {
    if ((Variable.hasInstance ? Variable.hasInstance(a0) : a0 instanceof Variable) && (Substitutions.hasInstance ? Substitutions.hasInstance(a1) : a1 instanceof Substitutions)) {
        var v = a0;
        var s = a1;
        return function (a0$2) {
            if (a0$2 === false) {
                return v;
            }
            if (Variable.hasInstance ? Variable.hasInstance(a0$2) : a0$2 instanceof Variable) {
                var v2 = a0$2;
                return walk(v2, s);
            }
            var other = a0$2;
            return other;
        }.call(this, step(v, s));
    }
    var v = a0;
    var _ = a1;
    return v;
}
function equal(u, v) {
    return function (st) {
        return function (a0) {
            if (a0 === false) {
                return Value(Failure(st.t), Done);
            }
            var s = a0;
            return Value(Success(s, st.c, st.t), Done);
        }.call(this, unify(u, v, st.s));
    };
}
function unify(a0, a1, a2) {
    if (Substitutions.hasInstance ? Substitutions.hasInstance(a2) : a2 instanceof Substitutions) {
        var u = a0;
        var v = a1;
        var s = a2;
        return function (a0$2, a1$2) {
            var r0 = Variable.unapply(a0$2);
            if (r0 != null && r0.length === 1) {
                var r1 = Variable.unapply(a1$2);
                if (r1 != null && (r1.length === 1 && r0[0] == r1[0])) {
                    var v$2 = r0[0];
                    var u$2 = r1[0];
                    return s;
                }
            }
            if (Variable.hasInstance ? Variable.hasInstance(a0$2) : a0$2 instanceof Variable) {
                var u$2 = a0$2;
                var v$2 = a1$2;
                return s.extend(u$2, v$2);
            }
            if (Variable.hasInstance ? Variable.hasInstance(a1$2) : a1$2 instanceof Variable) {
                var u$2 = a0$2;
                var v$2 = a1$2;
                return s.extend(v$2, u$2);
            }
            var r2 = Pair.unapply(a1$2);
            if (r2 != null && r2.length === 2) {
                var r3 = Pair.unapply(a0$2);
                if (r3 != null && r3.length === 2) {
                    var a1$3 = r3[0];
                    var d1 = r3[1];
                    var a2$2 = r2[0];
                    var d2 = r2[1];
                    return unify(d1, d2, unify(a1$3, a2$2, s));
                }
            }
            if (a0$2 == a1$2) {
                var u$2 = a0$2;
                var v$2 = a1$2;
                return s;
            }
            return false;
        }.call(this, walk(u, s), walk(v, s));
    }
    return false;
}
function call_fresh(fn) {
    return function (a0) {
        if (Failure.hasInstance ? Failure.hasInstance(a0) : a0 instanceof Failure) {
            var f = a0;
            return Value(f, Done);
        }
        var r0 = Success.unapply(a0);
        if (r0 != null && r0.length === 3) {
            var s = r0[0];
            var c = r0[1];
            var t = r0[2];
            return fn(Variable(c))(Success(s, c + 1, t));
        }
        throw new TypeError('No match');
    };
}
function disj(g1, g2) {
    return function (st) {
        return mplus(g1(st), g2(st));
    };
}
function conj(g1, g2) {
    return function (st) {
        return bind(g1(st), g2);
    };
}
function mplus(a0, a1) {
    if (Done.hasInstance ? Done.hasInstance(a0) : a0 instanceof Done) {
        var s = a1;
        return s;
    }
    var r0 = Thunk.unapply(a0);
    if (r0 != null && (r0.length === 1 && (Stream.hasInstance ? Stream.hasInstance(a1) : a1 instanceof Stream))) {
        var fn = r0[0];
        var s = a1;
        return Thunk(function () {
            return mplus(s, fn);
        });
    }
    var r1 = Value.unapply(a0);
    if (r1 != null && (r1.length === 2 && (Stream.hasInstance ? Stream.hasInstance(a1) : a1 instanceof Stream))) {
        var v = r1[0];
        var rest = r1[1];
        var s2 = a1;
        return Value(v, mplus(rest, s2));
    }
    throw new TypeError('No match');
}
function bind(a0, a1) {
    if (Done.hasInstance ? Done.hasInstance(a0) : a0 instanceof Done) {
        var _ = a1;
        return Done;
    }
    var r0 = Thunk.unapply(a0);
    if (r0 != null && r0.length === 1) {
        var fn = r0[0];
        var g = a1;
        return Thunk(function () {
            return bind(fn(), g);
        });
    }
    var r1 = Value.unapply(a0);
    if (r1 != null && r1.length === 2) {
        var v = r1[0];
        var rest = r1[1];
        var g = a1;
        return mplus(g(v), bind(rest, g));
    }
    throw new TypeError('No match');
}
/* Runner */
function take(a0, a1) {
    if (a0 === 0) {
        var _ = a1;
        return [];
    }
    if (Done.hasInstance ? Done.hasInstance(a1) : a1 instanceof Done) {
        var n = a0;
        return [];
    }
    var r0 = Thunk.unapply(a1);
    if (r0 != null && r0.length === 1) {
        var n = a0;
        var fn = r0[0];
        return take(n, fn());
    }
    var r1 = Value.unapply(a1);
    if (r1 != null && r1.length === 2) {
        var r2 = r1[0];
        if (Success.hasInstance ? Success.hasInstance(r2) : r2 instanceof Success) {
            var n = a0;
            var s = r2;
            var rest = r1[1];
            return [s].concat(take(n - 1, rest));
        }
        if (Failure.hasInstance ? Failure.hasInstance(r2) : r2 instanceof Failure) {
            var n = a0;
            var f = r2;
            var rest = r1[1];
            return take(n, rest);
        }
    }
    throw new TypeError('No match');
}
var emptyState = Success(Substitutions([]), 0, []);
function call_goal(g) {
    return g(emptyState);
}
/* Convenience methods for inspecting the results */
Cons.prototype.toString = function () {
    return '(' + this.toArray().join(',') + ')';
};
Cons.prototype.toArray = function () {
    return function (a0) {
        if (Nil.hasInstance ? Nil.hasInstance(a0) : a0 instanceof Nil) {
            return [];
        }
        var r0 = Pair.unapply(a0);
        if (r0 != null && r0.length === 2) {
            var r1 = r0[1];
            if (Cons.hasInstance ? Cons.hasInstance(r1) : r1 instanceof Cons) {
                var a = r0[0];
                var d = r1;
                return [a].concat(d.toArray());
            }
            var a = r0[0];
            var d = r1;
            return [a].concat([d]);
        }
        throw new TypeError('No match');
    }.call(this, this);
};
Substitutions.prototype.toObject = function () {
    return this.variables.map(function (i) {
        return walkStar(i, this).toString();
    }.bind(this));
};
// fixme: actual push/pop handling with indentation
function inspectTraceFrame(a0) {
    if (TraceFrame.hasInstance ? TraceFrame.hasInstance(a0) : a0 instanceof TraceFrame) {
        var t = a0;
        return t.toString();
    }
    throw new TypeError('No match');
}
function inspectTrace(states) {
    return states.map(function (a0) {
        var r0 = Success.unapply(a0);
        if (r0 != null && r0.length === 3) {
            var s = r0[0];
            var c = r0[1];
            var t = r0[2];
            return 'Found: ' + reifyFirst(s) + ' via \n' + t.map(inspectTraceFrame).join('\n');
        }
        throw new TypeError('No match');
    }).join('\n\n');
}
function reifyFirst(state) {
    return walkStar(Variable(0), state);
}
function walkStar(v, s) {
    return function (a0) {
        if (Variable.hasInstance ? Variable.hasInstance(a0) : a0 instanceof Variable) {
            var v$2 = a0;
            return v$2;
        }
        var r0 = Pair.unapply(a0);
        if (r0 != null && r0.length === 2) {
            var a = r0[0];
            var d = r0[1];
            return Pair(walkStar(a, s), walkStar(d, s));
        }
        var other = a0;
        return other;
    }.call(this, walk(v, s));
}
function run(n, goal) {
    return take(n, call_goal(call_fresh(goal))).map(function (state) {
        return reifyFirst(state.s);
    });
}
function runTrace(n, goal) {
    return take(n, call_goal(call_fresh(goal)));
}
/* Tracing goals */
function trace(name, goal) {
    return function (a0) {
        if (Failure.hasInstance ? Failure.hasInstance(a0) : a0 instanceof Failure) {
            var f = a0;
            return goal(f);
        }
        if (Success.hasInstance ? Success.hasInstance(a0) : a0 instanceof Success) {
            var s = a0;
            return traceStream(goal(s.addTrace(Push(name, s.s))));
        }
        throw new TypeError('No match');
    };
}
function traceStream(a0) {
    if (Done.hasInstance ? Done.hasInstance(a0) : a0 instanceof Done) {
        return Done;
    }
    var r0 = Thunk.unapply(a0);
    if (r0 != null && r0.length === 1) {
        var t = r0[0];
        return Thunk(function () {
            return traceStream(t());
        });
    }
    var r1 = Value.unapply(a0);
    if (r1 != null && r1.length === 2) {
        var r2 = r1[0];
        if (Failure.hasInstance ? Failure.hasInstance(r2) : r2 instanceof Failure) {
            var f = r2;
            var rest = r1[1];
            return Value(f, Done);
        }
        if (State.hasInstance ? State.hasInstance(r2) : r2 instanceof State) {
            var s = r2;
            var rest = r1[1];
            return Value(s.addTrace(Pop(s.s)), traceStream(rest));
        }
    }
    throw new TypeError('No match');
}
/* Let's try it out! */
function appendo(l, s, out) {
    return disj(conj(equal(Nil, l), equal(s, out)), call_fresh(function (a) {
        return call_fresh(function (d) {
            return conj(trace('equal(Pair(a, d), l)', equal(Pair(a, d), l)), call_fresh(function (res) {
                return conj(trace('equal(Pair(a, res), out)', equal(Pair(a, res), out)), function (st) {
                    return trace('appendo(d, s, res)', appendo(d, s, res))(st);
                });
            }));
        });
    }));
}
console.log('(appendo \'(1 2) \'(3) q): ', run(1, function (q) {
    return appendo(Pair(1, Pair(2, Nil)), Pair(3, Nil), q);
}).toString());
console.log('(appendo \'(1 2) q \'(1 2 3 4)): ', run(1, function (q) {
    return appendo(Pair(1, Pair(2, Nil)), q, Pair(1, Pair(2, Pair(3, Pair(4, Nil)))));
}).toString());
console.log('(appendo q r \'(1 2 3)) for q: ', run(10, function (q) {
    return call_fresh(function (r) {
        return appendo(q, r, Pair(1, Pair(2, Pair(3, Nil))));
    });
}).toString());
console.log('How did we find answer to (appendo q r \'(1 2 3 4)): ', inspectTrace(runTrace(5, function (q) {
    return call_fresh(function (r) {
        return appendo(q, r, Pair(1, Pair(2, Pair(3, Pair(4, Nil)))));
    });
})));
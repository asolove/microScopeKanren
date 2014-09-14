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
                throw new TypeError('Unexpected type for field Variable.i: ' + i.toString());
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
        function Substitutions$2() {
        }
        function Empty$2() {
        }
        Empty$2.prototype = new Substitutions$2();
        Empty$2.prototype.constructor = Empty$2;
        function Substitution$2(u, v, r) {
            if (!(this instanceof Substitution$2)) {
                return new Substitution$2(u, v, r);
            }
            if (u instanceof Variable) {
                this.u = u;
            } else {
                throw new TypeError('Unexpected type for field Substitutions.Substitution.u: ' + u.toString());
            }
            this.v = v;
            if (r instanceof Substitutions) {
                this.r = r;
            } else {
                throw new TypeError('Unexpected type for field Substitutions.Substitution.r: ' + r.toString());
            }
        }
        Substitution$2.prototype = new Substitutions$2();
        Substitution$2.prototype.constructor = Substitution$2;
        var derived = Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'Substitutions',
                constructor: Substitutions$2,
                prototype: Substitutions$2.prototype,
                variants: [
                    {
                        name: 'Empty',
                        constructor: Empty$2,
                        prototype: Empty$2.prototype
                    },
                    {
                        name: 'Substitution',
                        constructor: Substitution$2,
                        prototype: Substitution$2.prototype,
                        fields: [
                            'u',
                            'v',
                            'r'
                        ]
                    }
                ]
            }))));
        Substitutions$2.Empty = new derived.variants[0].constructor();
        Substitutions$2.Substitution = derived.variants[1].constructor;
        return Substitutions$2;
    }();
var Empty = Substitutions.Empty;
var Substitution = Substitutions.Substitution;
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
                throw new TypeError('Unexpected type for field State.Success.s: ' + s.toString());
            }
            if (typeof c === 'number' || Object.prototype.toString.call(c) === '[object Number]') {
                this.c = c;
            } else {
                throw new TypeError('Unexpected type for field State.Success.c: ' + c.toString());
            }
            if (Array.isArray ? Array.isArray(t) : Object.prototype.toString.call(t) === '[object Array]') {
                this.t = t;
            } else {
                throw new TypeError('Unexpected type for field State.Success.t: ' + t.toString());
            }
        }
        Success$2.prototype = new State$2();
        Success$2.prototype.constructor = Success$2;
        var derived = Setter.derive(Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'State',
                constructor: State$2,
                prototype: State$2.prototype,
                variants: [{
                        name: 'Success',
                        constructor: Success$2,
                        prototype: Success$2.prototype,
                        fields: [
                            's',
                            'c',
                            't'
                        ]
                    }]
            })))));
        State$2.Success = derived.variants[0].constructor;
        return State$2;
    }();
var Success = State.Success;
State.prototype.addTrace = function (a0) {
    if (TraceFrame.hasInstance ? TraceFrame.hasInstance(a0) : a0 instanceof TraceFrame) {
        var t = a0;
        return this.set({ t: this.t.concat([t]) });
    }
    throw new TypeError('No match');
};
var TraceFrame = function () {
        function TraceFrame$2(n, s) {
            if (!(this instanceof TraceFrame$2)) {
                return new TraceFrame$2(n, s);
            }
            if (typeof n === 'string' || Object.prototype.toString.call(n) === '[object String]') {
                this.n = n;
            } else {
                throw new TypeError('Unexpected type for field TraceFrame.n: ' + n.toString());
            }
            if (s instanceof Substitutions) {
                this.s = s;
            } else {
                throw new TypeError('Unexpected type for field TraceFrame.s: ' + s.toString());
            }
        }
        var derived = Extractor.derive(ToString.derive(Clone.derive(Eq.derive({
                name: 'TraceFrame',
                constructor: TraceFrame$2,
                prototype: TraceFrame$2.prototype,
                variants: [{
                        name: 'TraceFrame',
                        constructor: TraceFrame$2,
                        prototype: TraceFrame$2.prototype,
                        fields: [
                            'n',
                            's'
                        ]
                    }]
            }))));
        return derived.constructor;
    }();
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
                throw new TypeError('Unexpected type for field Stream.Thunk.fn: ' + fn.toString());
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
                throw new TypeError('Unexpected type for field Stream.Value.v: ' + v.toString());
            }
            if (r instanceof Stream) {
                this.r = r;
            } else {
                throw new TypeError('Unexpected type for field Stream.Value.r: ' + r.toString());
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
        if (Empty.hasInstance ? Empty.hasInstance(a1) : a1 instanceof Empty) {
            var v = r0[0];
            return false;
        }
        var r1 = Substitution.unapply(a1);
        if (r1 != null && r1.length === 3) {
            var r2 = r1[0];
            var r3 = Variable.unapply(r2);
            if (r3 != null && (r3.length === 1 && r0[0] == r3[0])) {
                var v = r0[0];
                var v2 = r3[0];
                var val = r1[1];
                var _ = r1[2];
                return val;
            }
        }
    }
    if (Variable.hasInstance ? Variable.hasInstance(a0) : a0 instanceof Variable) {
        var r4 = Substitution.unapply(a1);
        if (r4 != null && r4.length === 3) {
            var v = a0;
            var _ = r4[1];
            var _ = r4[1];
            var ss = r4[2];
            return step(v, ss);
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
                return Done;
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
                return Substitution(u$2, v$2, s);
            }
            if (Variable.hasInstance ? Variable.hasInstance(a1$2) : a1$2 instanceof Variable) {
                var u$2 = a0$2;
                var v$2 = a1$2;
                return Substitution(v$2, u$2, s);
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
function call_fresh(f) {
    return function (a0) {
        var r0 = Success.unapply(a0);
        if (r0 != null && r0.length === 3) {
            var s = r0[0];
            var c = r0[1];
            var t = r0[2];
            return f(Variable(c))(Success(s, c + 1, t));
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
    }
    throw new TypeError('No match');
}
var emptyState = Success(Empty, 0, []);
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
            if (Pair.hasInstance ? Pair.hasInstance(r1) : r1 instanceof Pair) {
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
    var r = {};
    var s = this;
    while (s != Empty) {
        r[s.u.i] = walkStar(s.u, this);
        s = s.r;
    }
    return r;
};
function inspectTraceFrame(a0) {
    var r0 = TraceFrame.unapply(a0);
    if (r0 != null && r0.length === 2) {
        var name = r0[0];
        var ss = r0[1];
        return name + ': ' + require('util').inspect(ss.toObject());
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
    return function (st) {
        return traceStream(goal(st), name, st);
    };
}
function traceStream(a0, a1, a2) {
    if (Done.hasInstance ? Done.hasInstance(a0) : a0 instanceof Done) {
        var _ = a2;
        var _ = a2;
        return Done;
    }
    var r0 = Thunk.unapply(a0);
    if (r0 != null && (r0.length === 1 && (State.hasInstance ? State.hasInstance(a2) : a2 instanceof State))) {
        var t = r0[0];
        var n = a1;
        var s = a2;
        return Thunk(function () {
            return traceStream(t(), n, s);
        });
    }
    var r1 = Value.unapply(a0);
    if (r1 != null && (r1.length === 2 && (State.hasInstance ? State.hasInstance(a2) : a2 instanceof State))) {
        var s = r1[0];
        var rest = r1[1];
        var n = a1;
        var st = a2;
        return Value(s.addTrace(TraceFrame(n, s.s)), traceStream(rest, n, st));
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
console.log('How did we find answer to (appendo \'(1 2) \'(3) q): ', inspectTrace(runTrace(1, function (q) {
    return appendo(Pair(1, Pair(2, Nil)), Pair(3, Nil), q);
})));
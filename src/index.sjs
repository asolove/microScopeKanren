// microKanren, (c) Jason Hemann and Dan Friedman
// JS implementation and tracing support by Adam Solove

var Clone = require('adt-simple').Clone;
var Eq = require('adt-simple').Eq;
var Extractor = require('adt-simple').Extractor;
var Setter = require('adt-simple').Setter;
var ToString = require('adt-simple').ToString;


data Variable {
	i: Number
} deriving (Eq, Clone, ToString, Extractor)

union Cons {
	Nil,
	Pair {
		a: *,
		d: *
	}
} deriving (Eq, Clone, Extractor)

union Substitutions {
	Empty,
	Substitution {
		u: Variable,
		v: *,
		r: Substitutions
	}
} deriving (Eq, Clone, ToString, Extractor)

union State {
	Success {
		s: Substitutions,
		c: Number,
		t: Array // of TraceTrames
	}
} deriving (Eq, Clone, ToString, Extractor, Setter)

State.prototype.addTrace = function {
	t@TraceFrame => this.set({t: this.t.concat([t])})
}

data TraceFrame {
	n: String,
	s: Substitutions
} deriving (Eq, Clone, ToString, Extractor)

union Stream {
	Done,
	Thunk {
		fn: Function
	},
	Value {
		v: State,
		r: Stream
	}
} deriving (Eq, Clone, ToString, Extractor)

function step {
	(Variable(v), Empty) => false,
	(Variable(v), Substitution(Variable(v2), val, _)) if v == v2 => val,
	(v@Variable, Substitution(_, _, ss)) => step(v, ss)
}

function walk {
	(v@Variable, s@Substitutions) => match step(v, s) {
		false => v,
		v2@Variable => walk(v2, s),
		other => other
	},
	(v, _) => v
}

function equal(u, v) {
	return function(st) {
		return match unify(u, v, st.s) {
			false => Done,
			s => Value(Success(s, st.c, st.t), Done)
		}
	}
}

function unify {
	(u, v, s@Substitutions) => match (walk(u, s), walk(v, s)) {
		(Variable(v), Variable(u)) if v == u => s,
		(u@Variable, v) => Substitution(u, v, s),
		(u, v@Variable) => Substitution(v, u, s),
		(Pair(a1, d1), Pair(a2, d2)) => unify(d1, d2, unify(a1, a2, s)),
		(u, v) if u == v => s,
		default => false
	},
	default => false
}

function call_fresh (f) {
	return function {
		(Success(s, c, t)) => f(Variable(c))(Success(s, c+1, t))
	}
}

function disj (g1, g2) {
	return function(st) {
		return mplus(g1(st), g2(st))
	}
}

function conj(g1, g2) {
	return function(st) {
		return bind(g1(st), g2)
	}
}


function mplus {
	(Done, s) => s,
	(Thunk(fn), s@Stream) => Thunk(function(){ return mplus(s, (fn)) }),
	(Value(v, rest), s2@Stream) => Value(v, mplus(rest, s2))
}

function bind {
	(Done, _) => Done,
	(Thunk(fn), g) => Thunk(function(){ return bind(fn(), g)}),
	(Value(v, rest), g) => mplus(g(v), bind(rest, g))
}

/* Runner */
function take {
	(0, _) => [],
	(n, Done) => [],
	(n, Thunk(fn)) => take(n, fn()),
	(n, Value(s@Success, rest)) => [s].concat(take(n-1, rest))
}

var emptyState = Success(Empty, 0, [])

function call_goal(g) {
	return g(emptyState)
}

/* Convenience methods for inspecting the results */

Cons.prototype.toString = function(){
	return "(" + this.toArray().join(",") + ")";
}

Cons.prototype.toArray = function() {
	return match this {
		Nil => [],
		Pair(a, d@Pair) => [a].concat(d.toArray()),
		Pair(a, d) => [a].concat([d])
	}
}

Substitutions.prototype.toObject = function() {
	var r = {};
	var s = this;
	while(s != Empty) {
		r[s.u.i] = walkStar(s.u, this);
		s = s.r;
	}
	return r;
}

function inspectTraceFrame {
	TraceFrame(name, ss) => name + ": " + require("util").inspect(ss.toObject());
}

function inspectTrace(states) {
	return states.map(function {
		Success(s, c, t) => 
			"Found: " + reifyFirst(s) + " via \n" + t.map(inspectTraceFrame).join("\n");
	}).join("\n\n");
}

function reifyFirst(state){
	return walkStar(Variable(0), state);
}

function walkStar(v, s) {
	return match walk(v, s) {
		v@Variable => v,
		Pair(a, d) => Pair(walkStar(a, s), walkStar(d, s)),
		other => other
	}
}

function run(n, goal) {
	return take(n, call_goal(call_fresh(goal))).map(
			function(state){ return reifyFirst(state.s); });
}

function runTrace(n, goal) {
	return take(n, call_goal(call_fresh(goal)));
}

/* Tracing goals */
function trace(name, goal) {
	return function(st) {
		return traceStream(goal(st), name, st);
	}
}

function traceStream {
	(Done, _, _) => Done,
	(Thunk(t), n, s@State) => Thunk(function(){ return traceStream(t(), n, s) }),
	(Value(s, rest), n, st@State) => 
		Value(s.addTrace(TraceFrame(n, s.s)),
			traceStream(rest, n, st))
}


/* Let's try it out! */

function appendo(l, s, out) {
	return disj(
		conj(equal(Nil, l), equal(s, out)),
		call_fresh(function (a){
			return call_fresh(function(d){
				return conj(
					trace("equal(Pair(a, d), l)", equal(Pair(a, d), l)),
					call_fresh(function(res){
						return conj(
							trace("equal(Pair(a, res), out)", equal(Pair(a, res), out)),
							function(st) {
								return trace("appendo(d, s, res)", appendo(d, s, res))(st);
							}
						)
					})
				)
			})
		})
	)
}


console.log("(appendo '(1 2) '(3) q): ",
	run(1, function(q){
		return appendo(Pair(1, Pair(2, Nil)), Pair(3, Nil), q)
	}).toString())

console.log("(appendo '(1 2) q '(1 2 3 4)): ",
	run(1, function(q){
		return appendo(Pair(1, Pair(2, Nil)), q, Pair(1, Pair(2, Pair(3, Pair(4, Nil)))))
	}).toString())

console.log("(appendo q r '(1 2 3)) for q: ",
	run(10, function(q){
		return call_fresh(function(r){
			return appendo(q, r, Pair(1, Pair(2, Pair(3, Nil))));
		})
	}).toString())

console.log("How did we find answer to (appendo '(1 2) '(3) q): ",
	inspectTrace(runTrace(1, function(q){
		return appendo(Pair(1, Pair(2, Nil)), Pair(3, Nil), q)
	})));
// microKanren, (c) Jason Hemann and Dan Friedman
// JS implementation and tracing support by Adam Solove

var Eq = require('adt-simple').Eq;
var Clone = require('adt-simple').Clone;
var ToString = require('adt-simple').ToString;
var Extractor = require('adt-simple').Extractor;


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

Cons.prototype.toString = function(){
	var values = map(function(x){ return x; }, this);
	return "(" + values.join(",") + ")";
}

union Substitutions {
	Empty,
	Substitution {
		v: Variable,
		val: *,
		r: Substitutions
	}
} deriving (Eq, Clone, ToString, Extractor)

union State {
	Success {
		s: Substitutions,
		c: Number
	}
} deriving (Eq, Clone, ToString, Extractor)

union Stream {
	Done,
	Thunk {
		fn: Function
	},
	Value {
		head: State,
		tail: Stream
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
		var s = unify(u, v, st.s);
		if(s) {
			return Value(Success(s, st.c), Done)
		} else {
			return Done
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
		(Success(s, c)) => f(Variable(c))(Success(s, c+1))
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
	(0, _) => Nil,
	(n, Done) => Nil,
	(n, Thunk(fn)) => take(n, fn()),
	(n, Value(Success(s, c), rest)) => Pair(s, take(n-1, rest))
}

var emptyState = Success(Empty, 0)

function call_goal(g) {
	return g(emptyState)
}

var emptyState = Success(Empty, 0);

/* Convenience methods for inspecting the results */
function map {
	(f, Nil) => [],
	(f, Pair(a, d)) => [f(a)].concat(map(f, d))
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

/* Let's try it out! */

function appendo(l, s, out) {
	return disj(
		conj(equal(Nil, l), equal(s, out)),
		call_fresh(function (a){
			return call_fresh(function(d){
				return conj(
					equal(Pair(a, d), l),
					call_fresh(function(res){
						return conj(
							equal(Pair(a, res), out),
							function(st) {
								return appendo(d, s, res)(st)
							}
						)
					})
				)
			})
		})
	)
}


var forwards = map(reifyFirst, take(1, call_goal(call_fresh(function(res){
	return appendo(Pair(1, Pair(2, Nil)), Pair(3, Nil), res)
}))));

console.log("(appendo '(1 2) '(3) q): " + forwards.toString());



var backwards = map(reifyFirst, take(1, call_goal(call_fresh(function(res){
	return appendo(Pair(1, Pair(2, Nil)), res, Pair(1, Pair(2, Pair(3, Pair(4, Nil)))))
}))));

console.log("(appendo '(1 2) q `(1 2 3 4)): " + backwards.toString());


var options = map(reifyFirst, take(10, call_goal(call_fresh(function(res){
	return call_fresh(function(other){
		return appendo(res, other, Pair(1, Pair(2, Pair(3, Nil))));
	})
}))));

console.log("(appendo q r '(1 2 3)): " + options.toString());


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

Variable.prototype.toString = function(){
	return "_." + this.i;
}

union Cons {
	Nil,
	Pair {
		a: *,
		d: *
	}
} deriving (Eq, Clone, Extractor)


data Substitutions {
	variables: Array // variable index => value
} deriving (Eq, Clone, ToString, Extractor)

Substitutions.prototype.extend = function(v, value) {
	var variables = this.variables.map(function(x){ return x; });
	variables[v.i] = value;
	return Substitutions(variables);
}

union State {
	Success {
		s: Substitutions,
		c: Number,
		t: Array // of TraceFrames
	},
	Failure {
		t: Array // of TraceFrames
	}
} deriving (Eq, Clone, ToString, Extractor, Setter)

State.prototype.addTrace = function {
	t@TraceFrame => this.set({t: this.t.concat([t])})
}

union TraceFrame {
	Push {
		name: String,
		subs: Substitutions
	},
	Pop {
		subs: Substitutions
	}
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
	(Variable(v), Substitutions(s)) => s[v] || false
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
			false => Value(Failure(st.t), Done),
			s => Value(Success(s, st.c, st.t), Done)
		}
	}
}

function unify {
	(u, v, s@Substitutions) => match (walk(u, s), walk(v, s)) {
		(Variable(v), Variable(u)) if v == u => s,
		(u@Variable, v) => s.extend(u, v),
		(u, v@Variable) => s.extend(v, u),
		(Pair(a1, d1), Pair(a2, d2)) => unify(d1, d2, unify(a1, a2, s)),
		(u, v) if u == v => s,
		default => false
	},
	default => false
}

function call_fresh (fn) {
	return function {
		f@Failure => Value(f, Done),
		Success(s, c, t) => fn(Variable(c))(Success(s, c+1, t))
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
	(n, Value(s@Success, rest)) => [s].concat(take(n-1, rest)),
	(n, Value(f@Failure, rest)) => take(n, rest)
}

var emptyState = Success(Substitutions([]), 0, [])

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
		Pair(a, d@Cons) => [a].concat(d.toArray()),
		Pair(a, d) => [a].concat([d])
	}
}

Substitutions.prototype.toObject = function() {
	return this.variables.map(function(i){
		return walkStar(i, this).toString();
	}.bind(this));
}

// fixme: actual push/pop handling with indentation
function inspectTraceFrame {
	t@TraceFrame => t.toString();
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
	return function {
		f@Failure => goal(f),
		s@Success => traceStream(goal(s.addTrace(Push(name, s.s))))
	}
}

function traceStream {
	Done => Done,
	Thunk(t) => Thunk(function(){ return traceStream(t()) }),
	Value(f@Failure, rest) => Value(f, Done), // add trace info?
	Value(s@State, rest) => Value(s.addTrace(Pop(s.s)), traceStream(rest))
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

var appendoTrace = runTrace(5, function(q){
		return call_fresh(function(r){
			return appendo(q, r, Pair(1, Pair(2, Pair(3, Pair(4, Nil)))));
		})
	})

console.log("How did we find answer to (appendo q r '(1 2 3 4)): ",
	inspectTrace(appendoTrace));

/* Let's visualize it! */

data TraceStack {
	name: String,
	children: Array, // of TraceStack
	before: Substitutions,
	after: Substitutions
} deriving (Eq, Clone, ToString, Extractor, Setter)

function traceToStack(frames) {
	var stack = [];
	var lastFrame;
	frames.forEach(function {
		Push(name, subs) => {
			console.log("push");
			var trace = TraceStack(name, [], subs, Substitutions([]));
			if(stack[0]) {
				var current = stack[0];
				stack[0] = current.set({children: current.children.concat(trace)});
				console.log("adding trace to ", current)
				//stack[0] = stack[0].set({children: stack[0].children.concat([trace])});
			} else {
				console.log("stack is empty")
			}
			stack.push(trace);
		},
		Pop(subs) => {
			console.log("pop");
			lastFrame = stack.pop().set({after: subs});
		}
	});
	return lastFrame;
}


var AnswerInspector = React.createClass({
	render: function(){
		return this.props.answers.map(function(state){
			return <div>
				<h2>Answer: {reifyFirst(state)}</h2>
				<TraceStackInspector stack={traceToStack(state.t)}/>
			</div>;
		});
	}
})

var TraceStackInspector = React.createClass({
	render: function() {
		var children = this.props.stack.children.map(TrackStackInspector);

		return <div className="stack">
			<span class="name">{this.props.stack.name}</span>
			<div className="before">
				<SubstitutionTable subs={this.props.stack.before} />
			</div>
			<div className="after">
				<SubstitutionTable subs={this.props.stack.after} />
			</div>
			<div className="children">{children}</div>
		</div>;
	}
});

var SubstitutionTable = React.createClass({
	render: function() {
		rows = this.props.subs.variables.map(function(value, i){
			return <tr>
								<th>{i}</th>
								<td>{walkStar(Variable(i), subs)}</td>
						</tr>;
		});
		return <table class="substitutions">
			{rows}
		</table>
	}
});

React.renderComponent(AnswerInspector, { answers: appendoTrace });

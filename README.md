Micro Scope Kanren
==================

<img width="687" alt="image" src="https://user-images.githubusercontent.com/8495/210161127-3f4727c8-78f0-4fc8-9b12-fc5f9c915ba8.png">

The relation between you and your logic program.

A JavaScript implementation of MicroKanren that also traces
logic variables and unifications as the program runs.

The goal is to be able to see how your program runs: how do different 
parts of the program interleave answers?

Background
----------

MicroKanren [1] is a tiny functional core for logic programming.

This repo implements that core in JavaScript, plus traces the program as it runs.

Todo
----

- Trace goals
- Visualize interleaving of traced goals
- MiniKanren macros
- Make importable as a library

[1] http://webyrd.net/scheme-2013/papers/HemannMuKanren2013.pdf

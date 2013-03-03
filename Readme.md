platform.js
===========

This is a general purpose library, for build large JS web applications.
It splits into 3 parts:

 * dom manipulation libraries
     * bb.js a library for building and operating directly on HTMLElements; no wrappers
     * bb-gun.js a high-level wrapper for HTMLElements, for building those core custom widgets in your application
 * shims and extras
     * ensuring ECMAScript 5 methods, and some ECMAScript 6 methods
     * assertions
     * type checking functions (i.e. isNumeric() )
     * some extra functions on core prototypes
 * high-level programming
     * means for currying / partial-application
     * lots of variants on binding methods, and describing data flow
     * class building, with checks (like checking if overriding methods really do override or not)

Be warned, this library has an emphasis on:

 * methods doing more than one thing, based on their parameters
 * *very* strict checks everywhere
 * extending the prototype (yes, I know it's frowned on, but it's the only way to keep high-level code terse and elegant).



Function.js
===========

@author Joseph Lenton

A Function utility library. Helps with building classes, with aspects-related
constructs.

Also includes some helper functions, to make working with functions easier.

===============================================================================

## Function

===============================================================================

    var __setProp__ = window.__setProp__;



-------------------------------------------------------------------------------

### LazyParam

A system for describing lazy parameters. When using bind, method, or curry,
this gives you exact control over *which* parameters can be omitted.

For example

```
    var f2 = f.curry( a, b, _, c );
    f2( x );

The above is the same as calling:

```
    f( a, b, x, c );

In the example, the parameter left out is exactly defined, using the underscore.

#### alternative to using underscore

If you wish to use the underscore for something else, you can use the value
'LazyParam' instead.

```
    var f2 = f.curry( a, b, LazyParam, c );
    f2( x );

-------------------------------------------------------------------------------

    var LazyParam = function() {
        fail( "evaluating a lazy value" );
    }

    LazyParam.method = function( fun ) {
        if ( isString(fun) ) {
            <- function(obj) {
                if ( ! isFunction(obj) ) {
                    fail( "function not found for _." + fun );
                }

                return obj[fun]();
            }
        } else if ( isFunction(fun) ) {
            <- function(obj) {
                return fun.call( obj );
            }
        } else {
            fail( "unknown parameter given, must be function or string" );
        }
    }

    window._ = LazyParam;
    window.LazyParam = LazyParam;

-------------------------------------------------------------------------------

### newPrototypeArray


-------------------------------------------------------------------------------
    
    var newPrototypeArray = function( src, arr, check ) {
        var hasCheck = ( arguments.length >= 3 );
        var proto = src.prototype;

        var obj = {};
        for ( var k in proto ) {
            if ( proto.hasOwnProperty(k) ) {
                obj[k] = proto[k];
            }
        }

        for ( var i = 0; i < arr.length; i++ ) {
            var srcObj = arr[i];

            if ( srcObj instanceof Array ) {
                for ( var j = 0; j < srcObj.length; j++ ) {
                    var k = srcObj[j];

                    assert( hasCheck, "Function implementation missing for " + k );

                    var alt = check.callback( obj, k, undefined );

                    assert( alt !== undefined, "Function implementation missing for " + k );

                    obj[k] = alt;
                }
            } else {
                while ( (typeof srcObj === 'function') || (srcObj instanceof Function) ) {
                    srcObj = srcObj.prototype;
                }

                for ( var k in srcObj ) {
                    if ( srcObj.hasOwnProperty(k) ) {
                        if ( hasCheck ) {
                            var alt = check.callback( obj, k, srcObj[k] );

                            if ( alt !== undefined ) {
                                obj[k] = alt;
                            } else {
                                obj[k] = srcObj[k];
                            }
                        } else {
                            obj[k] = srcObj[k];
                        }
                    }
                }
            }
        }

        obj.constructor = src;

        return obj;
    }


-------------------------------------------------------------------------------

### newFunctionExtend

-------------------------------------------------------------------------------

    var newFunctionExtendCallback = {
        isOkCallback: null,

        callback: function(dest, k, val) {
            if ( k !== 'constructor' ) {
                var val = this.isOkCallback(dest, k, val);

                if (
                        val !== undefined &&
                        val !== null &&
                        val !== false &&
                        val !== true
                ) {
                    return val;
                } else if ( val !== true ) {
                    if ( errors === null ) {
                        errors = [ k ];
                    } else {
                        errors.push( k );
                    }
                } else {
                    return undefined;
                }
            }
        }
    }

    /**
     * Used to generate the Function extension methods.
     */
    var newFunctionExtend = function( errMsg, isOkCallback ) {
        return function() {
            var errors = null;

            newFunctionExtendCallback.isOkCallback = isOkCallback;
            var proto = newPrototypeArray( this, arguments, newFunctionExtendCallback )
             
            if ( errors !== null ) {
                throw new Error( errMsg + "\n    " + errors.join(', ') );
            }

            var self = this;
            var fun = function() {
                self.apply( this, arguments );
            }

            fun.prototype = proto;
            proto.constructor = fun;

            return fun;
        }
    }



-------------------------------------------------------------------------------

### newPartial

-------------------------------------------------------------------------------

    var newPartial = function( fun, target, initArgs, initArgsStartI, isPostPend ) {
        assert( initArgsStartI <= initArgs.length, "start index is greater than the number of arguments given" );

        return (function() {
                    if ( target === undefined ) {
                        target = this;
                    }

                    /*
                     * Concat the old and new arguments together,
                     * into one.
                     *
                     * The first check allows us to skip this process,
                     * if arguments were not supplied for the second call.
                     */
                    var combinedArgs;

                    var initArgsLen = initArgs.length;
                    var argsLen     = arguments.length;

                    if ( argsLen === 0 ) {
                        for ( var i = initArgsStartI; i < initArgsLen; i++ ) {
                            if ( initArgs[i] === LazyParam ) {
                                fail( "value not provided for lazy argument" );
                            }
                        }

                        if ( initArgsStartI === 0 ) {
                            combinedArgs = initArgs;
                        } else if ( initArgsStartI === initArgsLen ) {
                            combinedArgs = null;
                        } else {
                            combinedArgs = new Array( initArgsLen - initArgsStartI );

                            for ( var i = initArgsStartI; i < initArgsLen; i++ ) {
                                combinedArgs[i - initArgsStartI] = initArgs[i];
                            }
                        }
                    } else {
                        // post-pend (our args go last)
                        if ( isPostPend ) {
                            /*
                             * combinedArgs = initArgs + arguments
                             */
                            combinedArgs = [];

                            for ( var i = initArgsLen-1; i >= initArgsStartI; i-- ) {
                                var arg = initArgs[i];

                                if ( arg === LazyParam ) {
                                    argsLen--;
                                    combinedArgs.unshift( arguments[argsLen] );
                                } else {
                                    combinedArgs.unshift( initArgs[i] );
                                }
                            }

                            assert( argsLen >= 0, "not enough arguments given" );

                            for ( var i = argsLen-1; i >= 0; i++ ) {
                                combinedArgs.unshift( arguments[i] );
                            }

                        // pre-pend (normal curry)
                        } else {
                            combinedArgs = [];
                            var startI = 0;

                            for ( var i = initArgsStartI; i < initArgsLen; i++ ) {
                                var arg = initArgs[i];

                                if ( arg === LazyParam ) {
                                    combinedArgs.push( arguments[startI] );
                                    startI++;
                                } else {
                                    combinedArgs.push( arg );
                                }
                            }

                            assert( startI <= argsLen, "not enough arguments given" );

                            while ( startI < argsLen ) {
                                combinedArgs.push( arguments[startI++] );
                            }
                        }
                    }

                    return fun.apply( target, combinedArgs );
                });
    }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var bindFun = function( preFun, fun, args, startIndex ) {
        if ( args === null ) {
            return tagBound(function() {
                preFun.apply( this, arguments );

                if ( preFun.__bound !== undefined ) {
                    return fun.apply( preFun.__bound, arguments );
                } else {
                    return fun.apply( this, arguments );
                }
            }, preFun.__bound );
        } else {
            // ensure references do not hang around to stuff we are not using
            if ( args !== null && startIndex > 0 ) {
                for ( var i = 0; i < startIndex; i++ ) {
                    args[ i ] = null;
                }
            }

            return tagBound(function() {
                var argsLen = args.length;
                var argumentsLen = arguments.length;
                var funArgs;

                if ( argumentsLen === 0 ) {
                    if ( startIndex > 0 ) {
                        funArgs = new Array( argsLen - startIndex );

                        for ( var i = startIndex; i < argsLen; i++ ) {
                            funArgs[ i - startIndex ] = args[ i ];
                        }
                    } else {
                        funArgs = args;
                    }
                } else {
                    if ( startIndex > 0 ) {
                        funArgs = new Array( (argsLen - startIndex) + argumentsLen );
                        
                        for ( var i = startIndex; i < argsLen; i++ ) {
                            funArgs[ i - startIndex ] = args[ i ];
                        }

                        for ( var i = 0; i < argumentsLen; i++ ) {
                            funArgs[ i + (argsLen - startIndex) ] = arguments[ i ];
                        }
                    }
                }

                preFun.apply( this, arguments );
                if ( preFun.__bound !== undefined ) {
                    return fun.apply( preFun.__bound, funArgs );
                } else {
                    return fun.apply( this, funArgs );
                }
            }, preFun.__bound );
        }
    }



-------------------------------------------------------------------------------

### wrapNamedFun

Used in conjunction with 'then', it allows you to chain method calls.

-------------------------------------------------------------------------------

    var wrapNamedFun = function( preFun, method ) {
        var bound = preFun.__bound;

        // no 'this', so use the window
        if ( bound === undefined ) {
            return function() {
                var thisFun = window[ method ];
                assertFunction( thisFun, "function '" + method + "', not found" );

                if ( arguments.length === 0 ) {
                    return thisFun.call( this );
                } else {
                    return thisFun.apply( this, arguments );
                }
            }
        // 'this' provided, so chain off it
        } else {
            return tagBound(function() {
                var thisFun = bound[ method ];
                assertFunction( thisFun, "method '" + method + "', not found" );

                if ( arguments.length === 0 ) {
                    return thisFun.call( bound );
                } else {
                    return thisFun.apply( bound, arguments );
                }
            }, bound);
        }
    }



-------------------------------------------------------------------------------

### tagBound

Tags the target to be bound to this function, and nothing else!

This is used for when you want to state what the function is bound to, but are
already handling binding to a target (i.e. calling 'call' or 'apply') yourself
within the function. As a result, it won't get wrapped, which the standard
'bind' functions will do.

The fact that this will return the same function given, without any added
wrapping, is the whole point it was defined.

@param fun The function to tag.
@param target The object to bind to this function.

-------------------------------------------------------------------------------

    var tagBound = function( fun, target ) {
        fun.__bound = target;
        return fun;
    }



-------------------------------------------------------------------------------

### bindTarget

Binds the given function to the target given, and then returns the function.

@param fun The function to bind a value to.
@param target The target to be used for the function binding.

-------------------------------------------------------------------------------

    var bindTarget = function( fun, target ) {
        return tagBound(function() {
            return fun.apply( target, arguments );
        }, target );
    }



===============================================================================

## Function Methods

===============================================================================

-------------------------------------------------------------------------------

### Function.create

The equivalent to calling 'new Fun()'.

The reason this exists, is because by oferring it as a function, you can then 
bind the constructor call and pass it around.

-------------------------------------------------------------------------------

    __setProp__( Function,
        'create', function() {
            var argsLen = arguments.length;

            if ( argsLen === 0 ) {
                return new this();
            } else if ( argsLen === 1 ) {
                return new this( arguments[0] );
            } else if ( argsLen === 2 ) {
                return new this( arguments[0], arguments[1] );
            } else if ( argsLen === 3 ) {
                return new this( arguments[0], arguments[1], arguments[2] );
            } else if ( argsLen === 4 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3] );
            } else if ( argsLen === 5 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4] );
            } else if ( argsLen === 6 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5] );
            } else if ( argsLen === 7 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6] );
            } else if ( argsLen === 8 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7] );
            } else if ( argsLen === 9 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8] );
            } else if ( argsLen === 10 ) {
                return new this( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9] );
            } else {
                var obj  = Object.create( this.prototype );
                var obj2 = this.apply( obj, arguments );

                if ( Object(obj2) === obj2 ) {
                    return obj2;
                } else {
                    return obj;
                }
            }
        }
    );

-------------------------------------------------------------------------------

### Function.maybe

```
    function setupButton( callback ) {
        button.onclick = function(ev) {
            // called if the callback was given, and otherwise does nothing at all
            Function.maybeCall( callback );
        }
    }

The above can be shortened to ...

```
    function setupButton( callback ) {
        button.onclick = Function.maybeCall.curry( callback );
    }

@param callback The function to be tested and then called.
@param args ... 0 or more parameters for the function to take.
@return undefined if there is no function, and otherwise the result of calling it.
-------------------------------------------------------------------------------

    __setProp__( Function,
        'maybeCall', function(callback) {
            if ( callback ) {
                assertFunction( callback, "none function provided" );

                var argsLen = arguments.length;

                if ( argsLen > 1 ) {
                    return callback.apply2( this, args, 1 );
                } else {
                    return callback.call( this );
                }
            } else {
                return undefined;
            }
        }
    );

-------------------------------------------------------------------------------

### Function.maybeApply

This is the apply version of maybeCall.

@param callback The function to be tested and called.
@param args optional, the parameters for the function when it is called.
@return undefined if there is no function, and otherwise the result of calling the function.
-------------------------------------------------------------------------------

    __setProp__( Function,
        'maybeApply', function(callback, args) {
            if ( callback ) {
                assertFunction( callback, "none function provided" );

                if ( argsLen > 1 ) {
                    return callback.apply( this, args );
                } else {
                    return callback.call( this );
                }
            } else {
                return undefined;
            }
        }
    );

===============================================================================

## Function.protototype extensions

Methods for function objects.

===============================================================================

-------------------------------------------------------------------------------

### function.__bound

An internal property, used for tracking what a function gets bound to, when it
is bound. This is so functions chaining off the first, can also access the bound
object.

By default, it binds to the default 'this', for when a function is not bound.
This is typically always, the global 'window'.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        '__bound', undefined
    );


-------------------------------------------------------------------------------

### function.bind

The same as the old bound, only it also supports lazy arguments.

On top of lazy, it also adds tracking of the bound target. This is needed for
other function methods, for adding in extras on top.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'bind', function( target ) {
            // __bound must be undefined, or a value!
            if ( target === null ) {
                target = undefined;
            }

            assert( arguments.length > 0, "not enough arguments" );

            var newFun = newPartial( this, target, arguments, 1, false );
            newFun.prototype = this.prototype;
            newFun.__bound = target;

            return newFun;
        }
    );    


-------------------------------------------------------------------------------

### function.apply2

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'apply2', function( target, args, startIndex ) {
            if ( args !== undefined && args !== null ) {
                assertArray( args );

                if ( startIndex === undefined || startIndex === 0 ) {
                    return this.apply( target, args );
                } else {
                    var argsLen = args.length;

                    if ( argsLen-startIndex === 1 ) {
                        return this.call( target, args[ argsLen-1 ] );
                    } else {
                        var params = new Array( argsLen - startIndex );

                        while ( argsLen --> startIndex ) {
                            args[ argsLen-startIndex ] = arguments[ argsLen ];
                        }

                        return this.apply( target, params );
                    }
                }
            } else {
                return this.call( target );
            }
        }
    );

-------------------------------------------------------------------------------

### function.λ

An alias for 'curry'.

```
    // these two are identical ...
    button.onclick = refresh.curry( environment, user );
    button.onclick = refresh.λ( environment, user );

@see function.curry

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'λ', Function.prototype.curry
    );



-------------------------------------------------------------------------------

### Throttle

This returns a version of the function, where when called, it will wait a set
amount of milliseconds, before it is called.

If the function is called multiple times, each time it will reset the wait
timer.

-------------------------------------------------------------------------------


    __setProp__( Function.prototype,
        'throttle', function( delay ) {
            if ( delay === undefined ) {
                delay = 1;
            }

            var fun = this;
            var funTimeout = null;

            return function() {
                var self = this;
                var args = arguments;

                if ( funTimeout !== null ) {
                    cancelTimeout( funTimeout );
                }

                funTimeout = setTimeout( function() {
                    funTimeout = null;

                    fun.apply( self, args );
                }, delay );
            }
        }
    );

-------------------------------------------------------------------------------

### Function.lazy

This is very similar to 'bind'.

It creates a new function, for which you can add on,
extra parameters.

Where it differes, is that if those parameters are functions,
they will be executed in turn.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'lazy', function(target) {
            var args = arguments;
            var self = this;

            return (function() {
                        /*
                         * The use of -1 and +1,
                         * with the 'args' array,
                         * is to skip out the 'target' parameter.
                         */
                        var allArgs = new Array( (arguments.length + args.length)-1 )
                        var argsLen = args.length-1;

                        for ( var i = 0; i < argsLen; i++ ) {
                            if ( slate.util.isFunction(args[i]) ) {
                                allArgs[i] = args[i+1]();
                            } else {
                                allArgs[i] = args[i+1];
                            }
                        }

                        for ( var i = 0; i < arguments.length; i++ ) {
                            allArgs[ argsLen + i ] = arguments[i];
                        }

                        return self.apply( target, allArgs );
                    }).proto( this );
        }
    );



-------------------------------------------------------------------------------

### function.eventFields


-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'eventFields', function( field ) {
            for ( var i = 0; i < arguments.length; i++ ) {
                var field = arguments[i];

                assert( this[field] === undefined, "overriding existing field with new event stack" );

                this[field] = Function.eventField( this );
            }

            return this;
        }
    );

-------------------------------------------------------------------------------

### function.proto

Duplicates this function, and sets a new prototype for it.

@param The new prototype.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'proto', function( newProto ) {
            if ( (typeof newProto === 'function') || (newProto instanceof Function) ) {
                for ( var k in newProto ) {
                    if ( newProto.hasOwnProperty(k) && k !== 'prototype' ) {
                        this[k] = newProto[k];
                    }
                }

                newProto = newProto.prototype;
            }

            this.prototype = newProto;

            return this;
        }
    );



-------------------------------------------------------------------------------

### function.newPrototype

This creates a new prototype,
with the methods provided extending it.

it's the same as 'extend', but returns an object for use
as a prototype instead of a funtion.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'newPrototype', function() {
            return newPrototypeArray( this, arguments );
        }
    );


-------------------------------------------------------------------------------

### function.protoOverride

Same as append, but the methods it overrides *must* exist.

This allows you to have a sanity check.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'protoOverride', newFunctionExtend(
                "Methods are overriding, but they do not exist,",
                function(dest, k, val) {
                    return ( dest[k] !== undefined )
                }
        )
    );



-------------------------------------------------------------------------------

### function.protoBefore


-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'protoBefore', newFunctionExtend(
                "Pre-Adding method behaviour, but original method not found,",
                function(dest, k, val) {
                    if ( dest[k] === undefined ) {
                        return undefined;
                    } else {
                        return dest[k].preSub( val );
                    }
                }
        )
    );



-------------------------------------------------------------------------------

### function.protoAfter


-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'protoAfter', newFunctionExtend(
                "Adding method behaviour, but original method not found,",
                function(dest, k, val) {
                    if ( dest[k] === undefined ) {
                        return undefined;
                    } else {
                        return dest[k].sub( val );
                    }
                }
        )
    );



-------------------------------------------------------------------------------

### function.protoExtend

Adds on extra methods, but none of them are allowed 
to override any others.

This is used as a sanity check.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'protoExtend', newFunctionExtend(
                "Extending methods already exist, ",
                function(dest, k, val) {
                    return ( dest[k] === undefined )
                }
        )
    );



-------------------------------------------------------------------------------

### function.require


-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'protoRequire', newFunctionExtend(
                "Pre-Adding method behaviour, but original method not found,",
                function(dest, k, val) {
                    if ( dest[k] !== undefined ) {
                        return dest[k];
                    } else {
                        return function() {
                            throw new Error( "Function not implemented " + k );
                        }
                    }
                }
        )
    );



-------------------------------------------------------------------------------

### function.params

This is just like curry,
in that you can add extra parameters to this function.

It differs, in that no more parameters can be added
when the function is called.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'params', function() {
            var self = this,
                args = arguments;

            return (function() {
                        return self.apply( this, args );
                    }).proto( this );
        }
    );



-------------------------------------------------------------------------------

### function.curry

This is essentially the same as 'bind', but with no target given.

It copies this function, and returns a new one, with the parameters given tacked
on at the start. You can also use the underscore to leave gaps for parameters
given.

```
    var f2 = someFunction.curry( _, 1, 2, 3 );

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'curry', function() {
            return newPartial( this, undefined, arguments, 0, false ).
                    proto( self );
        }
    );



-------------------------------------------------------------------------------

### function.postCurry

postCurry is the same as 'curry',
only the arguments are appended to the end,
instead of at the front.

With curry ...

```
     var f2 = f.curry( 1, 2, 3 )

Here f2 becomes:

```
     function f2( 1, 2, 3, ... ) { }

With 'postCurry', it is the other way around.
For example:

```
    var f2 = f.postCurry( 1, 2, 3 ) { }

Here f2 becomes:

```
    function f2( ..., 1, 2, 3 )

Another example, given the code:

```
     var f = function( a1, a2, a3, a4 ) {
         // do nothing
     }
     
     var fRice = f.rice( 1, 2 )
     fRice( "a", "b" );
     
Variables inside f will be ...

```
     a1 -> "a"
     a2 -> "b"
     a3 ->  1
     a4 ->  2

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'postCurry', function() {
            return newPartial( this, undefined, arguments, 0, true ).
                    proto( self );
        }
    );



-------------------------------------------------------------------------------

### function.preSub

Copies this function, tacking on the 'pre' function given.

That is because the after behaviour does *not* modify this function,
but makes a copy first.

@param pre A function to call.
@return A new function, with the pre behaviour tacked on, to run before it.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'preSub', function( pre ) {
            var self = this;

            return (function() {
                        pre.apply( this, arguments );
                        return self.apply( this, arguments );
                    }).
                    proto( this );
        }
    );



-------------------------------------------------------------------------------

### function.wrap

This allows you to wrap around this function,
with new functionality.

Note that with the given 'wrap' function,
the first parameter is always the function being wrapped.
So parameters start from index 1, not 0.

@example
     foo.wrap( function(fooCaller, param1, param2, param3) {
         param1 *= 2;
         var fooResult = fooCaller( param1, param2 );
         return param3 + fooResult;
     } );

@param wrap The variable to wrap functionality with.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'wrap', function( wrap ) {
            assertFunction( wrap, "function not provided for wrap parameter" );

            var self = this;
            return (function() {
                        var args = new Array( arguments.length+1 );
                        for ( var i = 0; i < arguments.length; i++ ) {
                            args[i+1] = arguments[i];
                        }

                        args[0] = self.bind( this );

                        return wrap.call( this, arguments );
                    }).
                    proto( this );
        }
    );



-------------------------------------------------------------------------------

### function.sub

Copies this function, tacking on the 'post' function given.

This is intended for sub-classing,
hence the name, 'sub'.

That is because the after behaviour does *not* modify this function,
but makes a copy first.

@param post A function to call.
@return A new function, with the post behaviour tacked on.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'sub', function( post ) {
            var self = this;

            return (function() {
                        self.apply( this, arguments );
                        return post.apply( this, arguments );
                    }).
                    proto( this );
        }
    );



-------------------------------------------------------------------------------

### function.then

Mixes the functions given, onto this one, like sub.

The other use is if called on a 'bound' function,
then this is the same as calling 'method',
on that object it is bound to,
if the first parameter is a string.

i.e.
 
```
     var doAB = obj.method( 'doA' ).then( 'doB' );

... is the same as ...

```
     var doAB = function() {
         obj.doA();
         obj.doB();
     }

You can also use it to chain function calls. For example

```
    button.onclick = someFunction.then( callbackFunction )

This is the same as ...

```
    button.onclick = function() {
        someFunction.apply( this, arguments );
        callbackFunction.apply( this, arguments );
    };

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'then', function() {
            var argsLen = arguments.length;

            assert( argsLen !== 0, "not enough parameters" );

            var arg = arguments[0];
            if ( isFunction(arg) ) {
                if ( argsLen === 1 ) {
                    return bindFun( this, arg, null, 0 );
                } else {
                    return bindFun( this, arg, arguments, 1 );
                }
            } else {
                if ( argsLen === 1 ) {
                    return bindFun( this, wrapNamedFun( this, arg ), null, 0 );
                } else {
                    return bindFun( this, wrapNamedFun( this, arg ), arguments, 1 );
                }
            }
        }
    );


-------------------------------------------------------------------------------

### function.thenMaybe

This is the same as 'then', however if the function given is not found, it will
silently do nothing.

This is useful for chaining in callbacks which are optional.

```
    button.onclick = doSomething().thenMaybe( callback );

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'thenMaybe', function( fun ) {
            /*
             * if not a function,
             * or it's the name of a function but not a method on this object,
             * or it's the name of a function and not a function that exists globally ...
             * 
             * ... then replace it with a blank stub to be used instead.
             */
            if (
                    ! isFunction(fun) || ( 
                            isString( fun ) && 
                            ( fun.__bound !== undefined && ! isFunction(fun.__bound[fun]) ) ||
                            ( ! isFunction(window[fun]) )
                    )
            ) {
                arguments[0] = function() { }
            }

            <- this.then.apply( this, arguments )
        }
    )

-------------------------------------------------------------------------------

### function.subBefore

When called, a copy of this function is returned,
with the given 'pre' function tacked on before it.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'subBefore', function( pre ) {
            var self = this

            <- (function() {
                        post.call( this, arguments );
                        return self.call( this, arguments );
                    }).
                    proto( this );
        }
    );

-------------------------------------------------------------------------------

### function.callLater

This is a mix of call, and later.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'callLater', function( target ) {
            var argsLen = arguments.length;
            var self = this;

            if ( argsLen <= 1 ) {
                <- setTimeout( function() {
                    self.call( target );
                }, 0 );
            } else if ( argsLen === 2 ) {
                var param1 = arguments[1];

                <- setTimeout( function() {
                    self.call( target, param1 );
                }, 0 );
            } else if ( argsLen === 3 ) {
                var param1 = arguments[1];
                var param2 = arguments[2];

                <- setTimeout( function() {
                    self.call( target, param1, param2 );
                }, 0 );
            } else if ( argsLen === 4 ) {
                var param1 = arguments[1];
                var param2 = arguments[2];
                var param3 = arguments[3];

                <- setTimeout( function() {
                    self.call( target, param1, param2, param3 );
                }, 0 );
            } else {
                <- this.applyLater( target, arguments );
            }
        }
    );



-------------------------------------------------------------------------------

### function.applyLater


-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'applyLater', function( target, args ) {
            if ( arguments.length <= 1 ) {
                args = new Array(0);
            }

            var self = this;

            <- setTimeout( function() {
                self.apply( target, args );
            }, 0 );
        }
    );



-------------------------------------------------------------------------------

### function.later

Sets this function to be called later.  If a timeout is given, then that is how
long it will wait for.

If no timeout is given, it defaults to 0.

It returns the value used when creating the timeout, and this allows you to
cancel the timeout using 'clearTimeout'.

@param target Optional, a target object to bind this function to.
@param timeout Optional, the timeout to wait before calling this function, defaults to 0.
@return The setTimeout identifier token, allowing you to cancel the timeout.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'later', function( timeout ) {
            var fun = this;

            if ( arguments.length === 0 ) {
                timeout = 0;
            } else if ( ! (typeof timeout === 'number') ) {
                // here the timeout is the target
                fun = fun.bind( timeout );

                if ( arguments.length > 1 ) {
                    timeout = arguments[1];
                } else {
                    timeout = 0;
                }
            }

            <- setTimeout( fun, timeout );
        }
    );



-------------------------------------------------------------------------------

### function.bindLater

This returns a function, which when called, will call this function, in the
future.

Yes, it's as simple as that.

@param target Optional, a target object to bind this function to.
@param timeout Optional, the timeout to wait before calling this function, defaults to 0.

-------------------------------------------------------------------------------

    __setProp__( Function.prototype,
        'bindLater', function( target, timeout ) {
            if ( arguments.length === 0 ) {
                return this.method( 'later' );
            } else if ( arguments.length === 1 ) {
                return this.method( 'later', timeout );
            } else {
                return this.method( 'later', target, timeout );
            }
        }
    );



Function.js
===========

@author Joseph Lenton

A Function utility library. Helps with building classes, with aspects-related
constructs.

Also includes some helper functions, to make working with functions easier.

-------------------------------------------------------------------------------
    
# Lazy

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

-------------------------------------------------------------------------------

    var Lazy = function() {
        logError( "evaluating a lazy value" );
    }

    window['_'] = Lazy;



-------------------------------------------------------------------------------

## Function.create

The equivalent to calling 'new Fun()'.

The reason this exists, is because by oferring it as a function,
you can then bind and pass it around.

-------------------------------------------------------------------------------

    Function.create = function() {
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



-------------------------------------------------------------------------------

## function.bind

The same as the old bound, only it also supports lazy arguments.

On top of lazy, it also adds tracking of the bound target. This is needed for
other function methods, for adding in extras on top.

-------------------------------------------------------------------------------

    Function.prototype.bind = function( target ) {
        assert( arguments.length > 0, "not enough arguments" );

        var newFun = newPartial( this, target || undefined, arguments, 1, false );
        newFun.prototype = this.prototype;
        newFun.__bound = target;

        return newFun;
    }



-------------------------------------------------------------------------------

## Function.lazy

This is very similar to 'bind'.

It creates a new function, for which you can add on,
extra parameters.

Where it differes, is that if those parameters are functions,
they will be executed in turn.

-------------------------------------------------------------------------------

    Function.prototype.lazy = function(target) {
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



-------------------------------------------------------------------------------

## function.eventFields


-------------------------------------------------------------------------------

    Function.prototype.eventFields = function( field ) {
        for ( var i = 0; i < arguments.length; i++ ) {
            var field = arguments[i];

            assert( this[field] === undefined, "overriding existing field with new event stack" );

            this[field] = Function.eventField( this );
        }

        return this;
    }



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

                    var alt = check( obj, k, undefined );

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
                            var alt = check( obj, k, srcObj[k] );

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

## function.proto

Duplicates this function, and sets a new prototype for it.

@param The new prototype.

-------------------------------------------------------------------------------

    Function.prototype.proto = function( newProto ) {
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



-------------------------------------------------------------------------------

## function.newPrototype

This creates a new prototype,
with the methods provided extending it.

it's the same as 'extend', but returns an object for use
as a prototype instead of a funtion.

-------------------------------------------------------------------------------

    Function.prototype.newPrototype = function() {
        return newPrototypeArray( this, arguments );
    }

    /**
     * Used to generate the Function extension methods.
     */
    var newFunctionExtend = function( errMsg, isOkCallback ) {
        return function() {
            var errors = null;

            var proto = newPrototypeArray( this, arguments, function(dest, k, val) {
                if ( k !== 'constructor' ) {
                    var val = isOkCallback(dest, k, val);

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
            } )
             
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

## function.override

Same as append, but the methods it overrides *must* exist.

This allows you to have a sanity check.

-------------------------------------------------------------------------------

    Function.prototype.override = newFunctionExtend(
            "Methods are overriding, but they do not exist,",
            function(dest, k, val) {
                return ( dest[k] !== undefined )
            }
    )



-------------------------------------------------------------------------------

## function.before


-------------------------------------------------------------------------------

    Function.prototype.before = newFunctionExtend(
            "Pre-Adding method behaviour, but original method not found,",
            function(dest, k, val) {
                if ( dest[k] === undefined ) {
                    return undefined;
                } else {
                    return dest[k].preSub( val );
                }
            }
    )



-------------------------------------------------------------------------------

## function.after


-------------------------------------------------------------------------------

    Function.prototype.after = newFunctionExtend(
            "Adding method behaviour, but original method not found,",
            function(dest, k, val) {
                if ( dest[k] === undefined ) {
                    return undefined;
                } else {
                    return dest[k].sub( val );
                }
            }
    )



-------------------------------------------------------------------------------

## function.extend

Adds on extra methods, but none of them are allowed 
to override any others.

This is used as a sanity check.

-------------------------------------------------------------------------------

    Function.prototype.extend = newFunctionExtend(
            "Extending methods already exist, ",
            function(dest, k, val) {
                return ( dest[k] === undefined )
            }
    )



-------------------------------------------------------------------------------

## function.require


-------------------------------------------------------------------------------

    Function.prototype.require = newFunctionExtend(
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



-------------------------------------------------------------------------------

## function.params

This is just like curry,
in that you can add extra parameters to this function.

It differs, in that no more parameters can be added
when the function is called.

-------------------------------------------------------------------------------

    Function.prototype.params = function() {
        var self = this,
            args = arguments;

        return (function() {
                    return self.apply( this, args );
                }).proto( this );
    }



-------------------------------------------------------------------------------

## function.curry

This is essentially the same as 'bind', but with no target given.

It copies this function, and returns a new one, with the parameters given tacked
on at the start. You can also use the underscore to leave gaps for parameters
given.

```
    var f2 = someFunction.curry( _, 1, 2, 3 );

-------------------------------------------------------------------------------

    Function.prototype.curry = function() {
        return newPartial( this, undefined, arguments, 0, false ).
                proto( self );
    }



-------------------------------------------------------------------------------

## function.postCurry

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

    Function.prototype.postCurry = function() {
        return newPartial( this, undefined, arguments, 0, true ).
                proto( self );
    }



-------------------------------------------------------------------------------

### newPartial

-------------------------------------------------------------------------------

    var newPartial = function( fun, target, initArgs, initArgsStartI, isPostPend ) {
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
                    if ( arguments.length === 0 ) {
                        for ( var i = initArgsStartI; i < initArgs.length; i++ ) {
                            if ( initArgs[i] === Lazy ) {
                                logError( "value not provided for lazy argument" );
                            }
                        }

                        combinedArgs = initArgs;
                    } else {
                        var argsLen     = arguments.length;
                        var initArgsLen =  initArgs.length;

                        // post-pend (our args go last)
                        if ( isPostPend ) {
                            /*
                             * combinedArgs = initArgs + arguments
                             */
                            combinedArgs = [];

                            for ( var i = initArgsLen-1; i >= initArgsStartI; i-- ) {
                                var arg = initArgs[i];

                                if ( arg === Lazy ) {
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

                                if ( arg === Lazy ) {
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

## function.preSub

Copies this function, tacking on the 'pre' function given.

That is because the after behaviour does *not* modify this function,
but makes a copy first.

@param pre A function to call.
@return A new function, with the pre behaviour tacked on, to run before it.

-------------------------------------------------------------------------------

    Function.prototype.preSub = function( pre ) {
        var self = this;
        return (function() {
                    pre.apply( this, arguments );
                    return self.apply( this, arguments );
                }).
                proto( this );
    }



-------------------------------------------------------------------------------

## function.wrap

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

    Function.prototype.wrap = function( wrap ) {
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



-------------------------------------------------------------------------------

## function.sub

Copies this function, tacking on the 'post' function given.

This is intended for sub-classing,
hence the name, 'sub'.

That is because the after behaviour does *not* modify this function,
but makes a copy first.

@param post A function to call.
@return A new function, with the post behaviour tacked on.

-------------------------------------------------------------------------------

    Function.prototype.sub = function( post ) {
        var self = this;

        return (function() {
                    self.apply( this, arguments );
                    return post.apply( this, arguments );
                }).
                proto( this );
    }

    var boundOne = function( self, fun ) {
        return function() {
            self.apply( this, arguments );
            return fun.apply( this, arguments );
        }
    }

    var boundArr = function( self, funs ) {
        return (function() {
            var funsLen = funs.length;

            for ( var i = 0; i < funs-1; i++ ) {
                funs[i].apply( this, arguments );
            }

            return funs[funsLen-1].apply( this, arguments );
        });
    }



-------------------------------------------------------------------------------

### addFun

Used in conjunction with 'Object.method',
it allows you to chain method calls.

-------------------------------------------------------------------------------

    var andFun = function( self, args ) {
        var method = args[0];
        var bound = self.__bound;
        assert( bound, self.name + " has not been bound to anything" );

        return this.then(
                bound.methodApply( method, args, 1 )
        )
    }



-------------------------------------------------------------------------------

## function.then

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

-------------------------------------------------------------------------------

    Function.prototype.then = function() {
        var argsLen = arguments.length,
            args = arguments;

        if ( argsLen === 0 ) {
            logError( "not enough parameters" );
        } else {
            var arg = arguments[0];

            if ( isFunction(arg) ) {
                if ( argsLen === 1 ) {
                    return boundOne( this, arguments[0] );
                } else {
                    return boundArr( this, arguments );
                }
            } else {
                return andFun( this, arguments );
            }
        }
    }



-------------------------------------------------------------------------------

## function.subBefore

When called, a copy of this function is returned,
with the given 'pre' function tacked on before it.

-------------------------------------------------------------------------------

    Function.prototype.subBefore = function( pre ) {
        return (function() {
                    post.call( this, arguments );
                    return self.call( this, arguments );
                }).
                proto( this );
    }

Time Functions
==============

-------------------------------------------------------------------------------

## function.callLater

-------------------------------------------------------------------------------

    Function.prototype.callLater = function( target ) {
        var argsLen = arguments.length;
        var self = this;

        if ( argsLen <= 1 ) {
            return setTimeout( function() {
                self.call( target );
            }, 0 );
        } else if ( argsLen === 2 ) {
            var param1 = arguments[1];

            return setTimeout( function() {
                self.call( target, param1 );
            }, 0 );
        } else if ( argsLen === 3 ) {
            var param1 = arguments[1];
            var param2 = arguments[2];

            return setTimeout( function() {
                self.call( target, param1, param2 );
            }, 0 );
        } else if ( argsLen === 4 ) {
            var param1 = arguments[1];
            var param2 = arguments[2];
            var param3 = arguments[3];

            return setTimeout( function() {
                self.call( target, param1, param2, param3 );
            }, 0 );
        } else {
            return this.applyLater( target, arguments );
        }
    }



-------------------------------------------------------------------------------

## function.applyLater


-------------------------------------------------------------------------------

    Function.prototype.applyLater = function( target, args ) {
        if ( arguments.length <= 1 ) {
            args = new Array(0);
        }

        var self = this;

        return setTimeout( function() {
            self.apply( target, args );
        }, 0 );
    }



-------------------------------------------------------------------------------

## function.later

Sets this function to be called later.
If a timeout is given, then that is how long it
will wait for.

If no timeout is given, it defaults to 0.

Cancelling the timeout can be done using 'clearTimeout'.

@param target Optional, a target object to bind this function to.
@param timeout Optional, the timeout to wait before calling this function, defaults to 0.
@return The setTimeout identifier token, allowing you to cancel the timeout.

-------------------------------------------------------------------------------

    Function.prototype.later = function( timeout ) {
        var fun = this;

        if ( arguments.length === 0 ) {
            timeout = 0;
        } else if ( ! (typeof timeout === 'number') ) {
            fun = fun.bind( timeout );

            if ( arguments.length > 1 ) {
                timeout = arguments[1];
            } else {
                timeout = 0;
            }
        }

        return setTimeout( fun, timeout );
    }


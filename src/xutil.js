"use strict";

(function( window, undefined ) {
    var runAssert function( msg, args, i ) {
        if ( i === undefined ) {
            i = 0;
        }

        for ( ; i < arguments.length; i++ ) {
            console.log( arguments[i] );
        }

        if ( isFunction(msg) ) {
            var args = [];

            for ( ; i < arguments.length; i++ ) {
                args[i] = arguments[i];
            }

            msg = msg.apply( null, args );
        }

        throw new Error( msg );
    };

    /**
     * An assertion.
     * 
     * Given a condition that evaluates to a truthy-value,
     * then this will silently do nothing.
     * 
     * If the condition evaluates to a falsy-value, then this
     * will throw the second parameter, the message of the error.
     * The second parameter can optionally be a function, which
     * will be called, and return the message to run.
     * 
     * More parameters can be optionally supplied, which will
     * be printed to the console (for debuggin that error).
     * 
     * Those parameters are also passed into the callback
     * function, as it's parameters.
     */
    var assert = window['assert'] = (function() {
        return function( condition, msg ) {
            if ( ! condition ) {
                if ( msg === undefined ) {
                    msg = "assertion error, given condition is false-like";
                }

                runAssert( msg, arguments, 2 );
            }
        }
    })();

    var assertString = window['assertString'] = (function() {
        return function( obj, msg ) {
            if ( ! isString(obj) ) {
                if ( msg === undefined ) {
                    msg = "string expected";
                }

                runAssert( msg, arguments, 2 );
            }
        }
    })();

    var assertFunction = window['assertFunction'] = (function() {
        return function( obj, msg ) {
            if ( ! isFunction(obj) ) {
                if ( msg === undefined ) {
                    msg = "function expected";
                }

                runAssert( msg, arguments, 2 );
            }
        }
    })();

    var assertObject = window['assertObject'] = (function() {
        return function( obj, msg ) {
            if ( ! isObject(obj) ) {
                if ( msg === undefined ) {
                    msg = "object literal expected";
                }

                runAssert( msg, arguments, 2 );
            }
        }
    })();

    var assertArray = window['assertArray'] = (function() {
        return function( obj, msg ) {
            if ( !(obj instanceof Array) || (! isArguments(obj)) ) {
                if ( msg === undefined ) {
                    msg = "array expected";
                }

                runAssert( msg, arguments, 2 );
            }
        }
    })();

    /**
     * This tests for JS Object literals, such as {}.
     * This will return false on any other JavaScript objects.
     * 
     * @param The object literal to test.
     * @return True if the object is an object literal, otherwise false.
     */
    var isObject = window['isObject'] = (function() {
        var constructor = ({}).constructor;

        return function( obj ) {
            return obj !== undefined && obj !== null && obj.constructor === constructor;
        }
    })();

    /**
     * @param The object to check.
     * @return True if the given object is an arguments object, false if not.
     */
    var isArguments = window['isArguments'] = (function() {
        var argsConstructor;

        (function() {
            argsConstructor = arguments.constructor;
        })();

        return function( args ) {
            return args !== undefined && args !== null && args.constructor === argsConstructor;
        };
    })();

    /**
     * @param The string to test.
     * @return True if it is a string literal, or a String object. Otherwise false.
     */
    var isString = window['isString'] = (function() {
        return function( str ) {
            return typeof str === 'string' || str instanceof String ;
        }
    })();

    /**
     * @param The function to test.
     * @return True if the object is a function, otherwise false.
     */
    var isFunction = window['isFunction'] = (function() {
        return function( fun ) {
            return typeof fun === 'function' || fun instanceof Function ;
        }
    })();

    var future = window['future'] = (function() {
        var nextFuns = [];

        var runFutureFuns = function() {
            for ( var i = 0; i < nextFuns.length; i++ ) {
                var f = nextFuns[i];
                f();
            }
        };

        return function() {
            if ( nextFuns.length === 0 ) {
                setTimeout( runFutureFuns );
            }

            for ( var i = 0; i < arguments.length; i++ ) {
                nextFuns.push( arguments[i] );
            }
        };
    })();
})( window );

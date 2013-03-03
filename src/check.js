"use strict";

/*
 * check.js.
 * 
 * Standard safety checking, for any project.
 * From a jQuery plugin, to a big web project.
 *
 * This includes
 *  - assertions
 *  - object type checks
 */

/*
 * Checks
 */
(function(window) {
    var objPrototype   = ({}).__proto__;
    var objConstructor = objPrototype.constructor;
    
    var argsConstructor = (function() {
        return arguments.constructor;
    })();

    window['isObject'] = function( obj ) {
        if ( obj !== undefined && obj !== null ) {
            var proto = obj.__proto__;

            if ( proto !== undefined && proto !== null ) {
                return proto             === objPrototype   &&
                       proto.constructor === objConstructor ;
            }
        }

        return false;
    }

    window['isNumber'] = function( n ) {
        return ( typeof n === 'number'   ) || ( n instanceof Number );
    }

    window['isFunction'] = function( f ) {
        return ( typeof f === 'function' ) || ( f instanceof Function );
    }

    /**
     * Returns true if the value is like a number.
     * This is either an actual number, or a string which represents one.
     */
    window['isNumeric'] = function( str ) {
        return ( typeof str === 'number' ) ||
               ( str instanceof Number   ) ||
               ( String(str).search( /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/ ) !== -1 )
    }

    window['isString'] = function( str ) {
        return ( typeof str === 'string' ) || ( str instanceof String );
    }

    window['isLiteral'] = function(obj) {
        return isString(obj) ||
                isNumber(obj) ||
                obj === undefined ||
                obj === null ||
                obj === true ||
                obj === false
    }

    window['isArrayArguments'] = function( arr ) {
        return ( arr instanceof Array ) ||
               (
                       arr !== undefined &&
                       arr !== null &&
                       arr.constructor === argsConstructor &&
                       arr.length !== undefined
               )
    }

    window['isArray'] = function( arr ) {
        return ( arr instanceof Array );
    }
})(window);

/*
 * Assertions.
 */

/**
 * An Error type, specific for assertions.
 */
function AssertionError( msg ) {
    if ( ! msg ) {
        msg = "assertion failed";
    }

    Error.call( this, msg );

    this.name = "AssertionError";
    this.message = msg;

    var errStr = '';
    var scriptLine;
    try {
        var thisStack;
        if ( this.stack ) {
            thisStack = this.stack;

            scriptLine = thisStack.split( "\n" )[1];
            if ( scriptLine ) {
                scriptLine = scriptLine.replace( /:[0-9]+:[0-9]+$/, '' );
                scriptLine = scriptLine.replace( /^.* /, '' );
                throw new Error();
            }
        }
    } catch ( err ) {
        var errStack = err.stack.split("\n");

        for ( var i = 1; i < errStack.length; i++ ) {
            if ( errStack[i].indexOf( scriptLine ) === -1 ) {
                errStr = errStack.slice(i).join( "\n" );
                break;
            }
        }

        if ( errStr === '' ) {
            errStr = errStack.join( "\n" );
        }
    }

    console.error( 'Assertion Error, ' + msg );
    for ( var i = 1; i < arguments.length; i++ ) {
        console.log( arguments[i] );
    }
    if ( errStr !== '' ) {
        console.error( "\n" + errStr );
    }
}
AssertionError.prototype = new Error();
AssertionError.prototype.constructor = AssertionError;

/**
 * Throws a new Error object,
 * which displays the message given.
 *
 * What is unique about this function,
 * is that it will also print out all of the
 * arguments given, before it throws the error.
 *
 * This allows you to have console.log +
 * throw new Error, built together, as one.
 *
 * @param msg The message to display in the error.
 */
function logError( msg ) {
    var err = Object.create( AssertionError.prototype );
    AssertionError.apply( err, arguments );
    throw err;
}

/**
 * Note that 0 and empty strings, will not cause failure.
 */
function assert( foo, msg ) {
    if ( foo === undefined || foo === null || foo === false ) {
        throw new AssertionError( msg, foo );
    }
}

/**
 * Throws an assertion error, if what is given if truthy.
 *
 * Note that 0 and empty strings, will cause failure.
 */
function assertNot( foo, msg ) {
    if (
            foo !== false &&
            foo !== null &&
            foo !== undefined
    ) {
        throw new AssertionError( msg, foo );
    }
}

function assertUnreachable( msg ) {
    assert( false, msg || "this section of code should never be reached" );
}

function assertObject( obj, msg ) {
    if ( ! isObject(obj) ) {
        throw new AssertionError( msg || "code expected a JSON object literal", obj );
    }
}

/**
 * Throws an AssertionError if the value given is not
 * a literal value.
 */
function assertLiteral( obj, msg ) {
    if ( ! isLiteral(obj) ) {
        throw new AssertionError( msg || "code expected a JSON object literal", obj );
    }
}

function assertFunction( f, msg ) {
    if ( typeof f !== 'function' && !(f instanceof Function) ) {
        throw new AssertionError( msg, f );
    }
}

function assertBool( f, msg ) {
    if ( f !== true && f !== false ) {
        throw new AssertionError( msg, f );
    }
}

function assertArray( arr, msg ) {
    if ( ! (arr instanceof Array) && (arr.length === undefined) ) {
        throw new AssertionError( msg, arr );
    }
}

function assertString( str, msg ) {
    if ( typeof str !== 'string' && !(str instanceof String) ) {
        throw new AssertionError( msg, str );
    }
}

function assertNum( n, msg ) {
    if ( typeof n !== 'number' && !(n instanceof Number) ) {
        throw new AssertionError( msg, n );
    }
}

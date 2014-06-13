
===============================================================================

check.js
========

@author Joseph Lenton

This includes
 - assertions
 - object type checks

===============================================================================



This should hold something like '[object Arguments]'

    var ARGUMENTS_TYPE_NAME = (function() {
        return '' + arguments;
    })();



-------------------------------------------------------------------------------

## isObject

Tests for a JSON object literal. Note that 'new Object()' will also pass this
test as these share the same constructor and prototype as object literals.

```
    isObject( {}           ) // -> true
    isObject( new Object() ) // -> true
    isObject( []           ) // -> false
    isObject( 'dkdkdkdkdk' ) // -> false
    isObject( new FooBar() ) // -> false

For testing if it's some kind of object, do ...

```
    obj instanceof Object

@param obj The object to test.
@return True if it is an object, false if not.

-------------------------------------------------------------------------------

    var isObject = window.isObject = function( obj ) {
        if ( obj !== undefined && obj !== null ) {
            var constructor = obj.constructor;

            if ( constructor === Object ) {
                return constructor.prototype === Object.prototype;
            }
        }

        return false;
    }



-------------------------------------------------------------------------------

## isFunction

@param f The value to test.
@return True if the function is a function primitive, or Function object.

-------------------------------------------------------------------------------

    var isFunction = window.isFunction = function( f ) {
        return ( typeof f === 'function' ) || ( f instanceof Function );
    }



-------------------------------------------------------------------------------

## isNumber

@param n The value to test.
@return True if 'n' is a primitive number, or a Number object.

-------------------------------------------------------------------------------

    var isNumber = window.isNumber = function( n ) {
        return ( typeof n === 'number' ) || ( n instanceof Number );
    }



-------------------------------------------------------------------------------

## isNumeric

Returns true if the value is like a number.
This is either an actual number, or a string which represents one.

@param str The string to test.
@return True, if given a number, or if it looks like a number, otherwise false.

-------------------------------------------------------------------------------

    var isNumeric = window.isNumeric = function( str ) {
        return ( typeof str === 'number' ) ||
               ( str instanceof Number   ) ||
               ( String(str).search( /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/ ) !== -1 )
    }



-------------------------------------------------------------------------------

## isString

@param str The value to test.
@return True if the given value, is a string primitive or a String object.

-------------------------------------------------------------------------------

    var isString = window.isString = function( str ) {
        return ( typeof str === 'string' ) || ( str instanceof String );
    }



-------------------------------------------------------------------------------

## isLiteral

Returns true or false, if the object given is a primitive value, including
undefined and null, or one of the objects that can also represent them (such
as Number or String).

@param obj The value to test.
@return True if the object is null, undefined, true, false, a string or a number.

-------------------------------------------------------------------------------

    var isLiteral = window.isLiteral = function(obj) {
        return isString(obj) ||
                isNumber(obj) ||
                obj === undefined ||
                obj === null ||
                obj === true ||
                obj === false
    }



-------------------------------------------------------------------------------

## isHTMLElement

-------------------------------------------------------------------------------

    var isHTMLElement = window.isHTMLElement = function(obj) {
        return obj.nodeType !== undefined;
    }



-------------------------------------------------------------------------------

## isArrayArguments

You cannot be absolutely certain an 'arguments' is an 'arguments', so takes an
educated guess. That means it may not be 100% correct. However in practice, you
would have to build an object that looks like an array 'arguments', to fool
this.

@param arr The object to test, for being an Array or arguments.
@return True if the object is an array, or believed to be an array arguments.

-------------------------------------------------------------------------------

    var isArrayArguments = window.isArrayArguments = function( arr ) {
        return isArray(arr) || isArguments(arr);
    }



-------------------------------------------------------------------------------

## isArray

This does not include testring for 'arguments'; they will fail this test. To
include them, use 'isArrayArguments'.

@param arr The value to test.
@return True, if the object given is an array object.

-------------------------------------------------------------------------------

    var isArray = window.isArray = Array.isArray ?
            Array.isArray :
            function( arr ) {
                return ( arr instanceof Array );
            } ;



-------------------------------------------------------------------------------

## isArguments

@return True if the object given is an arguments object, otherwise false.

-------------------------------------------------------------------------------

    var isArguments = window.isArguments = function( args ) {
        return ('' + arr) === ARGUMENTS_TYPE_NAME ;
    }




Assertions
==========

These are a list of assertion checking functions, which ensure that what is
given matches the definition of the assertion, and if so, nothing will happen.

If they do not, an AssertionError is thrown.

The functions optionally take a message, and will print out any extra arguments
to console.log.

All of the tests take the form:

```
    assertionFun( test, errorMessage, ... consoleArguments )

The test is whatever is being checked, and the optional errorMessage is
displayed if the assertion fails.

The 'consoleArguments', is 1 or more optional values, which will be printed to
the console. That is useful for adding debugging information on why an
assertion fails.

-------------------------------------------------------------------------------

## Assertion Error

An Error type, specific for assertions.

-------------------------------------------------------------------------------

    var AssertionError = function( msg ) {
        if ( ! msg ) {
            msg = "assertion failed";
        }

        this.name = "AssertionError";
        this.description = this.message = msg;

        if (navigator.appName === 'Microsoft Internet Explorer') {
            Error.call( this, 0, msg );
        } else {
            Error.call( this, msg );
        }

        var errStr = '';
        var scriptLine;
        try {
            if ( this.stack ) {
                scriptLine = this.stack.split( "\n" )[1];

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

-------------------------------------------------------------------------------

### newAssertion

A helper method, for building the AssertionError object.

It is used, to move the parameters around, from the format the assertion
functions use, to match that of the AssertionError.

In the error, the msg is the first parameter, and in the functions, it is the
second.

@param args The arguments for the new AssertionError.

-------------------------------------------------------------------------------

    var newAssertionError = function( args, altMsg ) {
        var msg = args[1];
        args[1] = args[0];
        args[0] = msg || altMsg;

        var err = Object.create( AssertionError );
        AssertionError.apply( err, args );
        return err;
    }



-------------------------------------------------------------------------------

## fail

A shorthand alternative to performing

```
    throw new Error( "whatever" )

Throws a new Error object,
which displays the message given.

What is unique about this function,
is that it will also print out all of the
arguments given, before it throws the error.

```
    fail( "some-error", a, b, c )
    
    // equivalent to ...
    
    console.log( a );
    console.log( b );
    console.log( c );
    throw new Error( "some-error" );

This allows you to have console.log +
throw new Error, built together, as one.

@param msg The message to display in the error.

-------------------------------------------------------------------------------

    var fail = window["fail"] = function( msg ) {
        var err = Object.create( AssertionError.prototype );
        AssertionError.apply( err, arguments );
        throw err;
    }



-------------------------------------------------------------------------------

## assert

Note that 0 and empty strings, will not cause failure.

@param test
@param msg

-------------------------------------------------------------------------------

    var assert = window["assert"] = function( test, msg ) {
        if ( test === undefined || test === null || test === false ) {
            throw newAssertionError( arguments );
        }
    }



-------------------------------------------------------------------------------

## assertNot

Throws an assertion error, if what is given if truthy.

Note that 0 and empty strings, will cause failure.

@param test
@param msg

-------------------------------------------------------------------------------

    var assertNot = window["assertNot"] = function( test, msg ) {
        if (
                test !== false &&
                test !== null &&
                test !== undefined
        ) {
            throw newAssertionError( arguments, "item is truthy" );
        }
    }



-------------------------------------------------------------------------------

## assertUnreachable

Displays a generic error message, that the current location in code, is meant
to be unreachable. So something has gone wrong.

This always throws an assertion error.

-------------------------------------------------------------------------------

    var assertUnreachable = window["assertUnreachable"] = function( msg ) {
        assert( false, msg || "this section of code should never be reached" );
    }



-------------------------------------------------------------------------------

## assertObject

Throws an assertion error, if the object given is *not* a JSON Object literal.
So regular objects, they will throw an assertion. It's only the '{ }' style
objects that this allows.

-------------------------------------------------------------------------------

    var assertObject = window["assertObject"] = function( obj, msg ) {
        if ( ! isObject(obj) ) {
            throw newAssertionError( arguments, "code expected a JSON object literal" );
        }
    }



-------------------------------------------------------------------------------

## assertLiteral

Throws an AssertionError if the value given is not
a literal value.

@param obj
@param msg

-------------------------------------------------------------------------------

    var assertLiteral = window["assertLiteral"] = function( obj, msg ) {
        if ( ! isLiteral(obj) ) {
            throw newAssertionError( arguments, "primitive value expected" );
        }
    }



-------------------------------------------------------------------------------

## assertFunction

@param f A function object to test.
@param msg The message to display if the test fails.

-------------------------------------------------------------------------------

    var assertFunction = window["assertFunction"] = function( f, msg ) {
        if ( typeof f !== 'function' && !(f instanceof Function) ) {
            throw newAssertionError( arguments, "function expected" );
        }
    }



-------------------------------------------------------------------------------

## assertBool

@param f The boolean value to test.
@param msg The error message on failure.

-------------------------------------------------------------------------------

    var assertBool = window["assertBool"] = function( f, msg ) {
        if ( f !== true && f !== false ) {
            throw newAssertionError( arguments, "boolean expected" );
        }
    }



-------------------------------------------------------------------------------

## assertArray

@param arr The array to test.
@param msg The error message.

-------------------------------------------------------------------------------

    var assertArray = window["assertArray"] = function( arr, msg ) {
        if ( ! isArray(arr) && (arr.length === undefined) ) {
            throw newAssertionError( arguments, "array expected" );
        }
    }



-------------------------------------------------------------------------------

## assertString

@param str The string to test against.
@param msg The error message to show.

-------------------------------------------------------------------------------

    var assertString = window["assertString"] = function( str, msg ) {
        if ( typeof str !== 'string' && !(str instanceof String) ) {
            throw newAssertionError( arguments, "string expected" );
        }
    }



-------------------------------------------------------------------------------

## assertNumber

This includes both number primitives, and Number objects.

@param n The number to check.
@param msg An optional error message.

-------------------------------------------------------------------------------

    var assertNumber = window["assertNumber"] = function( n, msg ) {
        if ( typeof n !== 'number' && !(n instanceof Number) ) {
            throw newAssertionError( arguments, "number expected" );
        }
    }



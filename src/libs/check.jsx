
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

## isObjectLiteral

Tests for a JSON object literal. Note that 'new Object()' will also pass this
test as these share the same constructor and prototype as object literals.

```
    isObjectLiteral( {}           ) // -> true
    isObjectLiteral( new Object() ) // -> true
    isObjectLiteral( []           ) // -> false
    isObjectLiteral( 'dkdkdkdkdk' ) // -> false
    isObjectLiteral( new FooBar() ) // -> false

For testing if it's some kind of object, do ...

```
    obj instanceof Object

@param obj The object to test.
@return True if it is an object, false if not.

-------------------------------------------------------------------------------

    var isObjectLiteral = function( obj ) {
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

    var isFunction = function( f ) {
        return ( typeof f === 'function' ) || ( f instanceof Function );
    }



-------------------------------------------------------------------------------

## isNumber

@param n The value to test.
@return True if 'n' is a primitive number, or a Number object.

-------------------------------------------------------------------------------

    var isNumber = function( n ) {
        return ( typeof n === 'number' ) || ( n instanceof Number );
    }



-------------------------------------------------------------------------------

## isNumeric

Returns true if the value is like a number.
This is either an actual number, or a string which represents one.

@param str The string to test.
@return True, if given a number, or if it looks like a number, otherwise false.

-------------------------------------------------------------------------------

    var isNumeric = function( str ) {
        return ( typeof str === 'number' ) ||
               ( str instanceof Number   ) ||
               ( String(str).search( /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/ ) !== -1 )
    }



-------------------------------------------------------------------------------

## isString

@param str The value to test.
@return True if the given value, is a string primitive or a String object.

-------------------------------------------------------------------------------

    var isString = function( str ) {
        return ( typeof str === 'string' ) || ( str instanceof String );
    }



-------------------------------------------------------------------------------

## isArray

This is just Array.isArray and is only provided for completeness along side
isString and so on.

@param arr The value to test.
@return True if the given value is an array, otherwise false.

-------------------------------------------------------------------------------

    var isArray = Array.isArray



-------------------------------------------------------------------------------

## isBoolean

@param bool The boolean value to test.
@return True if the value is true or false, otherwise false.

-------------------------------------------------------------------------------

    var isBoolean = function( bool ) {
        return bool === true || bool === false ;
    }



-------------------------------------------------------------------------------

## isLiteral

Returns true or false, if the object given is a primitive value, including
undefined and null, or one of the objects that can also represent them (such
as Number or String).

@param obj The value to test.
@return True if the object is null, undefined, true, false, a string or a number.

-------------------------------------------------------------------------------

    var isLiteral = function(obj) {
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

    var isHTMLElement = function(obj) {
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

    var isArrayArguments = function( arr ) {
        return isArray(arr) || isArguments(arr);
    }



-------------------------------------------------------------------------------

## isArguments

@return True if the object given is an arguments object, otherwise false.

-------------------------------------------------------------------------------

    var isArguments = function( args ) {
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

The 'extraMsgArray' may just be the arguments value from a function. As a
result it could have values already at the start. For this reason the
startIndex parameter is provided so you could skip these elements at the start
of the array.

@param msg Optional The main message for the assertion.
@param secondMsg Optional A secondary message. For many assertions this may be
the test performed.
@param extraMsgArray Optional An array containing any other extra message
things to display.
@param startIndex Optional Where to start taking bits from the extraMsgArray,
defaults to 0.

-------------------------------------------------------------------------------

    var AssertionError = function( msg, secondMsg, extraMsgArray, startIndex ) {
        if ( ! msg ) {
            msg = "assertion failed";
        }

        if ( startIndex === undefined ) {
            startIndex = 0;
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

            // IE
            } else {
                var currentFunction = arguments.callee.caller;

                while ( currentFunction ) {
                    var fn = currentFunction.toString();
                    var fname = fn.substring(fn.indexOf('function') + 8, fn.indexOf('')) || 'anonymous';

                    errStr += fname + '\n';
                    currentFunction = currentFunction.caller;
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
        for ( var i = startIndex; i < extraMsgArray.length; i++ ) {
            console.log( extraMsgArray[i] );
        }

        if ( errStr !== '' ) {
            console.error( "\n" + errStr );

            if ( IS_HTA ) {
                alert( errStr );
            }
        }
    }




Assign the original Error prototype *not* new Error().

    AssertionError.prototype = Error.prototype;



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

```
    // equivalent to ...
    console.log( a );
    console.log( b );
    console.log( c );
    throw new Error( "some-error" );

This allows you to have console.log +
throw new Error, built together, as one.

@param msg Optional The message to display in the error.

-------------------------------------------------------------------------------

    var fail = function( msg ) {
        throw new AssertionError( msg || "Failure is reported.", 'Fail()', arguments, 1 );
    }



-------------------------------------------------------------------------------

## assert

Note that 0 and empty strings will not cause failure.

@param test
@param msg Optional

-------------------------------------------------------------------------------

    var assert = function( test, msg ) {
        if ( test === undefined || test === null || test === false ) {
            throw new AssertionError( msg || "Assertion has failed.", test, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertNot

Throws an assertion error if what is given if truthy.

Note that 0 and empty strings will cause failure.

@param test
@param msg Optional

-------------------------------------------------------------------------------

    var assertNot = function( test, msg ) {
        if (
                test !== false &&
                test !== null &&
                test !== undefined
        ) {
            throw new AssertionError( msg || "Item is truthy.", test, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertUnreachable

Displays a generic error message, that the current location in code, is meant
to be unreachable. So something has gone wrong.

This always throws an assertion error.

@param msg Optional The message to display.

-------------------------------------------------------------------------------

    var assertUnreachable = function( msg ) {
        assert( false, msg || "this section of code should never be reached" );
    }



-------------------------------------------------------------------------------

## assertObjectLiteral

Throws an assertion error, if the object given is *not* a JSON Object literal.
So regular objects, they will throw an assertion. It's only the '{ }' style
objects that this allows.

@param obj The object to test.
@param msg Optional The message to display if this assertion fails.

-------------------------------------------------------------------------------

    var assertObjectLiteral = function( obj, msg ) {
        if ( ! isObjectLiteral(obj) ) {
            throw new AssertionError( msg || "Code expected an JSON object literal.", obj, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertLiteral

Throws an AssertionError if the value given is not a literal value.

Note that literals do not include object literals. Just strings, numbers,
booleans, null, and undefined.

@param obj
@param msg Optional

-------------------------------------------------------------------------------

    var assertLiteral = function( obj, msg ) {
        if ( ! isLiteral(obj) ) {
            throw new AssertionError( msg || "Primitive value expected.", obj, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertFunction

@param fun A function object to test.
@param msg Optional The message to display if the test fails.

-------------------------------------------------------------------------------

    var assertFunction = function( fun, msg ) {
        if ( typeof fun !== 'function' && !(fun instanceof Function) ) {
            throw new AssertionError( msg || "Function expected.", fun, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertBoolean

@param bool The boolean value to test.
@param msg Optional The error message on failure.

-------------------------------------------------------------------------------

    var assertBoolean = function( bool, msg ) {
        if ( bool !== true && bool !== false ) {
            throw new AssertionError( msg || "Boolean expected.", bool, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertArray

@param arr The array to test.
@param msg Optional The error message.

-------------------------------------------------------------------------------

    var assertArray = function( arr, msg ) {
        if ( ! isArray(arr) && (arr.length === undefined) ) {
            throw new AssertionError( msg || "Array expected.", arr, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertString

@param str The string to test against.
@param msg Optional The error message to show.

-------------------------------------------------------------------------------

    var assertString = function( str, msg ) {
        if ( typeof str !== 'string' && !(str instanceof String) ) {
            throw new AssertionError( msg || "String expected.", str, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertNumber

This includes both number primitives, and Number objects.

@param num The number to check.
@param msg Optional An optional error message.

-------------------------------------------------------------------------------

    var assertNumber = function( num, msg ) {
        if ( typeof n !== 'number' && !(n instanceof Number) ) {
            throw new AssertionError( msg || "Number expected.", num, arguments, 2 );
        }
    }



-------------------------------------------------------------------------------

## assertParent( dom:Element )

Throws an error if the given element is not a HTMLElement, or if it does not
have a parent node.

-------------------------------------------------------------------------------

    var assertParent = function( dom ) {
        assert( dom instanceof HTMLElement && dom.parentNode !== null, "dom is not in the document; it doesn't have a parentNode" )
    }




"use strict";(function() {

/* Core
====

The absolute core bootstrap, used by everything.

===============================================================================

-------------------------------------------------------------------------------

### OBJECT_DESCRIPTION

A re-usable object, for setting descriptions. It's re-used to avoid object
creation.

------------------------------------------------------------------------------- */

    var OBJECT_DESCRIPTION = {
        value           : undefined,
        enumerable      : false,
        writable        : true,
        configurable    : true
    };



/* -------------------------------------------------------------------------------

### __shim__ obj:Object name:string val:any

Same as __setProp__, only the item only gets set, *if* it is not already there.
This is for setting shims, hence why it's called 'shim'.

@param obj The object to set the property to.
@param name The name of the property to set.
@param val The item to set at that property, 99% of the time this is a function.

------------------------------------------------------------------------------- */

    var __shim__ = function( obj, name, val ) {
        if ( ! obj.hasOwnProperty(name) ) {
            __setProp__( obj, name, val );
        }
    }



/* -------------------------------------------------------------------------------

### __setProp__ obj:Object name:string val:any

------------------------------------------------------------------------------- */

    var __setProp__ = function( obj, name, val ) {
        if ( typeof name === 'string' ) {
            OBJECT_DESCRIPTION.value = val;

            try {
                Object.defineProperty( obj, name, OBJECT_DESCRIPTION );
            } catch ( ex ) {
                obj[name] = val;
            }
        } else {
            for ( var trueName in name ) {
                if ( name.hasOwnProperty(trueName) ) {
                    OBJECT_DESCRIPTION.value = trueName;

                    try {
                        Object.defineProperty( obj, name[trueName], OBJECT_DESCRIPTION );
                    } catch ( ex ) {
                        obj[trueName] = name[trueName];
                    }
                }
            }
        }
    }



/* ===============================================================================

# user agent testing globals

These are global variables which are set to the version of the browser, if this
is running in that browser.

Only rely on these sparingly; always feature detect where possible!

=============================================================================== */

    var IS_IE       = false;
    var IS_HTA      = false;
    var IS_OPERA    = false;
    var IS_MOZILLA  = false;
    var IS_CHROME   = false;
    var IS_SAFARI   = false;

    var getUAVersion = function(userAgent, browserName) {
        var test = new RegExp(browserName + "([\\d.]+)", 'i');
        var match = userAgent.match( test );

        if ( match !== null && match.length > 0 ) {
            var strMatch = match[0];
            var splitI = strMatch.indexOf("/");

            if ( splitI === -1 ) {
                splitI = strMatch.indexOf(":");
            }

            if ( splitI !== -1 ) {
                return parseInt( strMatch.substring(splitI+1) ) || -1;
            }
        }

        return -1;
    }

    var userAgent = navigator.userAgent.toString();

    if (userAgent.indexOf("MSIE/") !== -1) {
        IS_IE = getUAVersion( userAgent, "MSIE/" );

        if ( window.external === null || window.external === undefined ) {
            IS_HTA = IS_IE;
        }

    } else if (userAgent.indexOf("Trident/") !== -1) {
        if ( userAgent.indexOf(" rv:") !== -1 ) {
            IS_IE = getUAVersion( userAgent, "rv:" );
        } else {
            IS_IE = getUAVersion( userAgent, "Trident/" );
        }

        if ( window.external === null || window.external === undefined ) {
            IS_HTA = IS_IE;
        }

    } else if (userAgent.indexOf("Chrome/") !== -1) {
        IS_CHROME = getUAVersion( userAgent, "Chrome/" );

    } else if (userAgent.indexOf("Safari/") !== -1) {
        IS_SAFARI = getUAVersion( userAgent, "Safari/" );

    } else if (userAgent.indexOf("Firefox/") !== -1) {
        IS_MOZILLA = getUAVersion( userAgent, "Firefox/" );

    } else if (userAgent.indexOf("Iceweasel/") !== -1) {
        IS_MOZILLA = getUAVersion( userAgent, "Iceweasel/" );

    } else if (userAgent.indexOf("Netscape/") !== -1) {
        IS_MOZILLA = getUAVersion( userAgent, "Netscape/" );
    }



/* -------------------------------------------------------------------------------

## IS_IE

A global property which is truthy when this is running in IE holding the
version of IE we are running on.

When it's not IE this will hold false.

------------------------------------------------------------------------------- */

    window.IS_IE        = IS_IE         ;



/* -------------------------------------------------------------------------------

## IS_HTA

This is truthy if this is running as a .hta application. .HTA applications are
presumed to be IE powered (Trident, Chakra, etc).

As a result this will either be false for when it is not a .HTA, or the same
value as 'IS_IE'.

------------------------------------------------------------------------------- */

    window.IS_HTA       = IS_HTA        ;



/* -------------------------------------------------------------------------------

## IS_MOZILLA

------------------------------------------------------------------------------- */

    window.IS_MOZILLA   = IS_MOZILLA    ;



/* -------------------------------------------------------------------------------

## IS_CHROME

------------------------------------------------------------------------------- */

    window.IS_CHROME    = IS_CHROME     ;



/* -------------------------------------------------------------------------------

## IS_SAFARI

------------------------------------------------------------------------------- */

    window.IS_SAFARI    = IS_SAFARI     ;



/* -------------------------------------------------------------------------------

## IS_OPERA

------------------------------------------------------------------------------- */

    window.IS_OPERA     = IS_OPERA      ;






/* ===============================================================================

# shim.js

This is a collection of shims from around the internet,
and some built by me, which add support for missing JS features.

===============================================================================



===============================================================================

## window

===============================================================================



===============================================================================

### window.requestAnimationFrame

=============================================================================== */

    if ( ! window['requestAnimationFrame'] ) {
        window['requestAnimationFrame'] =
            window['mozRequestAnimationFrame']      ||
            window['webkitRequestAnimationFrame']   ||
            window['msRequestAnimationFrame']       ||
            function( f ) {
                setTimeout( f, 0 )
            }
    }



/* ===============================================================================

### window.requestIdleCallback

Needed for pretty much everything but Chrome (and maybe FF).

New function for being called when the browser is idle and can process work.
The fallback is just to use animation frame sometime in the future.

We call multiple times to avoid being on the next frame where there may be work
from a legit 'requestAnimationFrame' call.

=============================================================================== */

    if ( ! window['requestIdleCallback'] ) {
        window['requestIdleCallback'] = function(f) {
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    window.requestAnimationFrame( f )
                })
            })
        }
    }



/* ===============================================================================

## Array

Note that 'map' is missing, because it is dealt with
in the 'extras' file.

===============================================================================

### forEach

Production steps of ECMA-262, Edition 5, 15.4.4.18
Reference: http://es5.github.com/#x15.4.4.18

------------------------------------------------------------------------------- */

    if ( ! Array.prototype['forEach'] ) {
        __shim__( Array.prototype,
            'forEach', function( callback, thisArg ) {
                var T, k;

                if ( this === null ) {
                  throw new TypeError( "this is null or not defined" );
                }

                // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
                var O = Object(this);

                // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
                // 3. Let len be ToUint32(lenValue).
                var len = O.length >>> 0; // Hack to convert O.length to a UInt32

                // 4. If IsCallable(callback) is false, throw a TypeError exception.
                // See: http://es5.github.com/#x9.11
                if ( {}.toString.call(callback) !== "[object Function]" ) {
                  throw new TypeError( callback + " is not a function" );
                }

                // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if ( thisArg ) {
                  T = thisArg;
                }

                // 6. Let k be 0
                k = 0;

                // 7. Repeat, while k < len
                while( k < len ) {

                  var kValue;

                  // a. Let Pk be ToString(k).
                  //   This is implicit for LHS operands of the in operator
                  // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                  //   This step can be combined with c
                  // c. If kPresent is true, then
                  if ( Object.prototype.hasOwnProperty.call(O, k) ) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[ k ];

                    // ii. Call the Call internal method of callback with T as the this value and
                    // argument list containing kValue, k, and O.
                    callback.call( T, kValue, k, O );
                  }
                  // d. Increase k by 1.
                  k++;
                }
                // 8. return undefined
            }
        )
    }

/* ===============================================================================

## String

===============================================================================

-------------------------------------------------------------------------------

### toArray

@see https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

------------------------------------------------------------------------------- */

    __shim__( String.prototype,
            'toArray', function() {
                return this.valueOf().split( '' );
            }
    );

    if ( ! String.prototype['trimLeft'] ) {
        var leftTrimSpaceRegex = /^\s\s*/

        __shim__( String.prototype,
                'trimLeft', function(check) {
                    if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                        return this.valueOf().replace( leftTrimSpaceRegex, '' );
                    } else if ( check.length === 0 ) {
                        return this.valueOf()
                    } else {
                        var check = check.escapeRegExp();

                        return this.valueOf().replace(
                                new RegExp( "^(" + check + ")(" + check + ")*" ),
                                ''
                        )
                    }
                }
        )
    }


    if ( ! String.prototype['trimRight'] ) {
        var spaceRegex = /\s/

        __shim__( String.prototype,
                'trimRight', function() {
                    var thisVal = this.valueOf()

                    if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                        var	i = thisVal.length
                        while ( spaceRegex.test(thisVal.charAt(--i)) );
                        return thisVal.slice( 0, i + 1 )

                    } else if ( check.length === 0 ) {
                        return thisVal

                    } else {
                        var check = check.escapeRegExp()

                        return thisVal.replace(
                                new RegExp( "(" + check + ")(" + check + ")*$" ),
                                ''
                        )
                    }
                }
        )
    }

    if ( ! String.prototype['contains'] ) {
        __shim__( String.prototype,
                'contains', function( str, index ) {
                    var argsLen = arguments.length;

                    if ( argsLen === 1 ) {
                        return this.valueOf().indexOf(str) !== -1;
                    } else if ( argsLen === 2 ) {
                        return this.valueOf().indexOf(str, index) !== -1;
                    } else if ( argsLen === 0 ) {
                        throw new Error( "no search string provided" );
                    }
                }
        )
    }



/* -------------------------------------------------------------------------------

## string.repeat

Fast repeat, uses the `Exponentiation by squaring` algorithm.

This is optimized for non-FF browsers, because FF already has a version
in-built.

FireFox also has issues with the use of 'valueOf', where in other browsers it's
use always yields a speedup. The short of it is that you can only use 'valueOf'
to convert a String object to a literal string, if you intend to call a lot of
methods or perform a lot of concatonation, on that string. Otherwise the cost
of using 'valueOf' is greater than the cost of using a String object.

We only optimize up to 'count' of 4, because it is at 4 or 3 counts and less
where inlining it makes a large optimization. Above 4, it is either similar
performance or worse.

------------------------------------------------------------------------------- */

    __shim__( String.prototype,
            'repeat', function(count) {
                count = count|0;

                if ( count < 1 ) {
                    return '';

                } else if ( count === 1 ) {
                    return this.valueOf();

                } else if ( count === 2 ) {
                    var thisVal = this.valueOf();
                    return thisVal + thisVal ;

                } else if ( count === 3 ) {
                    var thisVal = this.valueOf();
                    return thisVal + thisVal + thisVal;

                } else if ( count === 4 ) {
                    var thisVal = this.valueOf();
                    return thisVal + thisVal + thisVal + thisVal;

                } else {
                    var pattern = this.valueOf();
                    var result = '';

                    while ( count > 1 ) {
                        if ( (count & 1) === 1 ) {
                            result += pattern;
                        }

                        count >>= 1;
                        pattern += pattern;
                    }

                    return result + pattern;
                }
            }
    );



    __shim__( String.prototype,
            'startsWith', function(searchString) {
              var position = arguments[1];

              // Let searchStr be ToString(searchString).
              var searchStr = searchString.toString();

              // ReturnIfAbrupt(searchStr).

              // Let S be the result of calling ToString,
              // giving it the this value as its argument.
              var s = this.toString();

              // ReturnIfAbrupt(S).

              // Let pos be ToInteger(position).
              // (If position is undefined, this step produces the value 0).
              var pos = (position === undefined) ? 0 : Number.toInteger(position);
              // ReturnIfAbrupt(pos).

              // Let len be the number of elements in S.
              var len = s.length;

              // Let start be min(max(pos, 0), len).
              var start = Math.min(Math.max(pos, 0), len);

              // Let searchLength be the number of elements in searchString.
              var searchLength = searchString.length;

              // If searchLength+start is greater than len, return false.
              if ((searchLength + start) > len) return false;

              // If the searchLength sequence of elements of S starting at
              // start is the same as the full element sequence of searchString,
              // return true.
              var index = ''.indexOf.call(s, searchString, start);
              return index === start;
            }
    );

    __shim__( String.prototype,
            'endsWith', function(searchString) {
              var endPosition = arguments[1];

              // ReturnIfAbrupt(CheckObjectCoercible(this value)).
              // Let S be the result of calling ToString, giving it the this value as its argument.
              // ReturnIfAbrupt(S).
              var s = this.toString();

              // Let searchStr be ToString(searchString).
              // ReturnIfAbrupt(searchStr).
              var searchStr = searchString.toString();

              // Let len be the number of elements in S.
              var len = s.length;

              // If endPosition is undefined, let pos be len, else let pos be ToInteger(endPosition).
              // ReturnIfAbrupt(pos).
              var pos = (endPosition === undefined) ?
                len :
                Number.toInteger(endPosition);

              // Let end be min(max(pos, 0), len).
              var end = Math.min(Math.max(pos, 0), len);

              // Let searchLength be the number of elements in searchString.
              var searchLength = searchString.length;

              // Let start be end - searchLength.
              var start = end - searchLength;

              // If start is less than 0, return false.
              if (start < 0) return false;

              // If the searchLength sequence of elements of S starting at start is the same as the full element sequence of searchString, return true.
              // Otherwise, return false.
              var index = ''.indexOf.call(s, searchString, start);
              return index === start;
            }
    );



/* -------------------------------------------------------------------------------

### Element.matches( queryString:string )

Support is in IE 9 and above but with prefixes, and often called 'matchesSelector'.

A new W3C selection tester, for testing if a node matches a selection. Very
new, so it's either browser specific, or needs a shim.

------------------------------------------------------------------------------- */

    if ( ! Element.prototype.matches ) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector
    }



/* -------------------------------------------------------------------------------

### classList.js: Cross-browser full element.classList implementation.

Required for IE 9, and toggle adjustments for IE 10 and 11

2012-11-15

By Eli Grey, http://eligrey.com
Public Domain.

NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

@source http://purl.eligrey.com/github/classList.js/blob/master/classList.js

------------------------------------------------------------------------------- */

    if ("document" in self) {
        // Full polyfill for browsers with no classList support
        if (!("classList" in document.createElement("_"))) {
            (function (view) {
                if (!('Element' in view)) return;

                var
                    classListProp = "classList"
                  , protoProp = "prototype"
                  , elemCtrProto = view.Element[protoProp]
                  , objCtr = Object
                  , strTrim = String[protoProp].trim || function () {
                    return this.replace(/^\s+|\s+$/g, "");
                  }
                  , arrIndexOf = Array[protoProp].indexOf || function (item) {
                    var
                        i = 0
                      , len = this.length
                    ;
                    for (; i < len; i++) {
                      if (i in this && this[i] === item) {
                        return i;
                      }
                    }
                    return -1;
                  }
                  // Vendors: please allow content code to instantiate DOMExceptions
                  , DOMEx = function (type, message) {
                    this.name = type;
                    this.code = DOMException[type];
                    this.message = message;
                  }
                  , checkTokenAndGetIndex = function (classList, token) {
                    if (token === "") {
                      throw new DOMEx(
                          "SYNTAX_ERR"
                        , "An invalid or illegal string was specified"
                      );
                    }
                    if (/\s/.test(token)) {
                      throw new DOMEx(
                          "INVALID_CHARACTER_ERR"
                        , "String contains an invalid character"
                      );
                    }
                    return arrIndexOf.call(classList, token);
                  }
                  , ClassList = function (elem) {
                    var
                        trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
                      , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
                      , i = 0
                      , len = classes.length
                    ;
                    for (; i < len; i++) {
                      this.push(classes[i]);
                    }
                    this._updateClassName = function () {
                      elem.setAttribute("class", this.toString());
                    };
                  }
                  , classListProto = ClassList[protoProp] = []
                  , classListGetter = function () {
                    return new ClassList(this);
                  }
                ;
                // Most DOMException implementations don't allow calling DOMException's toString()
                // on non-DOMExceptions. Error's toString() is sufficient here.
                DOMEx[protoProp] = Error[protoProp];
                classListProto.item = function (i) {
                  return this[i] || null;
                };
                classListProto.contains = function (token) {
                  token += "";
                  return checkTokenAndGetIndex(this, token) !== -1;
                };
                classListProto.add = function () {
                  var
                      tokens = arguments
                    , i = 0
                    , l = tokens.length
                    , token
                    , updated = false
                  ;
                  do {
                    token = tokens[i] + "";
                    if (checkTokenAndGetIndex(this, token) === -1) {
                      this.push(token);
                      updated = true;
                    }
                  }
                  while (++i < l);

                  if (updated) {
                    this._updateClassName();
                  }
                };
                classListProto.remove = function () {
                  var
                      tokens = arguments
                    , i = 0
                    , l = tokens.length
                    , token
                    , updated = false
                    , index
                  ;
                  do {
                    token = tokens[i] + "";
                    index = checkTokenAndGetIndex(this, token);
                    while (index !== -1) {
                      this.splice(index, 1);
                      updated = true;
                      index = checkTokenAndGetIndex(this, token);
                    }
                  }
                  while (++i < l);

                  if (updated) {
                    this._updateClassName();
                  }
                };
                classListProto.toggle = function (token, force) {
                  token += "";

                  var
                      result = this.contains(token)
                    , method = result ?
                      force !== true && "remove"
                    :
                      force !== false && "add"
                  ;

                  if (method) {
                    this[method](token);
                  }

                  if (force === true || force === false) {
                    return force;
                  } else {
                    return !result;
                  }
                };
                classListProto.toString = function () {
                  return this.join(" ");
                };

                if (objCtr.defineProperty) {
                  var classListPropDesc = {
                      get: classListGetter
                    , enumerable: true
                    , configurable: true
                  };
                  try {
                    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                  } catch (ex) { // IE 8 doesn't support enumerable:true
                    if (ex.number === -0x7FF5EC54) {
                      classListPropDesc.enumerable = false;
                      objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                    }
                  }
                } else if (objCtr[protoProp].__defineGetter__) {
                  elemCtrProto.__defineGetter__(classListProp, classListGetter);
                }
            }(self));

        } else {
            // There is full or partial native classList support, so just check if we need
            // to normalize the add/remove and toggle APIs.

            (function () {
                var testElement = document.createElement("_");

                testElement.classList.add("c1", "c2");

                // Polyfill for IE 10/11 and Firefox <26, where classList.add and
                // classList.remove exist but support only one argument at a time.
                if (!testElement.classList.contains("c2")) {
                    var createMethod = function(method) {
                        var original = DOMTokenList.prototype[method];

                        DOMTokenList.prototype[method] = function(token) {
                            var i, len = arguments.length;

                            for (i = 0; i < len; i++) {
                                token = arguments[i]
                                original.call(this, token)
                            }
                        }
                    }

                    createMethod('add')
                    createMethod('remove')
                }

                testElement.classList.toggle("c3", false)

                // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
                // support the second argument.
                if (testElement.classList.contains("c3")) {
                    var _toggle = DOMTokenList.prototype.toggle

                    DOMTokenList.prototype.toggle = function(token, force) {
                        if (1 in arguments && !this.contains(token) === !force) {
                            return force;
                        } else {
                            return _toggle.call(this, token);
                        }
                    }
                }

                testElement = null
            }());
        }
    }




/* ===============================================================================

check.js
========

@author Joseph Lenton

This includes
 - assertions
 - object type checks

===============================================================================



This should hold something like '[object Arguments]' */

    var ARGUMENTS_TYPE_NAME = (function() {
        return '' + arguments;
    })();



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

    var isObjectLiteral = function( obj ) {
        if ( obj !== undefined && obj !== null ) {
            var constructor = obj.constructor;

            if ( constructor === Object ) {
                return constructor.prototype === Object.prototype;
            }
        }

        return false;
    }



/* -------------------------------------------------------------------------------

## isFunction

@param f The value to test.
@return True if the function is a function primitive, or Function object.

------------------------------------------------------------------------------- */

    var isFunction = function( f ) {
        return ( typeof f === 'function' ) || ( f instanceof Function );
    }



/* -------------------------------------------------------------------------------

## isNumber

@param n The value to test.
@return True if 'n' is a primitive number, or a Number object.

------------------------------------------------------------------------------- */

    var isNumber = function( n ) {
        return ( typeof n === 'number' ) || ( n instanceof Number );
    }



/* -------------------------------------------------------------------------------

## isNumeric

Returns true if the value is like a number.
This is either an actual number, or a string which represents one.

@param str The string to test.
@return True, if given a number, or if it looks like a number, otherwise false.

------------------------------------------------------------------------------- */

    var isNumeric = function( str ) {
        return ( typeof str === 'number' ) ||
               ( str instanceof Number   ) ||
               ( String(str).search( /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/ ) !== -1 )
    }



/* -------------------------------------------------------------------------------

## isString

@param str The value to test.
@return True if the given value, is a string primitive or a String object.

------------------------------------------------------------------------------- */

    var isString = function( str ) {
        return ( typeof str === 'string' ) || ( str instanceof String );
    }



/* -------------------------------------------------------------------------------

## isArray

This is just Array.isArray and is only provided for completeness along side
isString and so on.

@param arr The value to test.
@return True if the given value is an array, otherwise false.

------------------------------------------------------------------------------- */

    var isArray = Array.isArray



/* -------------------------------------------------------------------------------

## isBoolean

@param bool The boolean value to test.
@return True if the value is true or false, otherwise false.

------------------------------------------------------------------------------- */

    var isBoolean = function( bool ) {
        return bool === true || bool === false ;
    }



/* -------------------------------------------------------------------------------

## isLiteral

Returns true or false, if the object given is a primitive value, including
undefined and null, or one of the objects that can also represent them (such
as Number or String).

@param obj The value to test.
@return True if the object is null, undefined, true, false, a string or a number.

------------------------------------------------------------------------------- */

    var isLiteral = function(obj) {
        return isString(obj) ||
                isNumber(obj) ||
                obj === undefined ||
                obj === null ||
                obj === true ||
                obj === false
    }



/* -------------------------------------------------------------------------------

## isHTMLElement

------------------------------------------------------------------------------- */

    var isHTMLElement = function(obj) {
        return obj.nodeType !== undefined;
    }



/* -------------------------------------------------------------------------------

## isArrayArguments

You cannot be absolutely certain an 'arguments' is an 'arguments', so takes an
educated guess. That means it may not be 100% correct. However in practice, you
would have to build an object that looks like an array 'arguments', to fool
this.

@param arr The object to test, for being an Array or arguments.
@return True if the object is an array, or believed to be an array arguments.

------------------------------------------------------------------------------- */

    var isArrayArguments = function( arr ) {
        return isArray(arr) || isArguments(arr);
    }



/* -------------------------------------------------------------------------------

## isArguments

@return True if the object given is an arguments object, otherwise false.

------------------------------------------------------------------------------- */

    var isArguments = function( args ) {
        return ('' + arr) === ARGUMENTS_TYPE_NAME ;
    }




/* Assertions
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

------------------------------------------------------------------------------- */

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




/* Assign the original Error prototype *not* new Error(). */

    AssertionError.prototype = Error.prototype;



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

    var fail = function( msg ) {
        throw new AssertionError( msg || "Failure is reported.", 'Fail()', arguments, 1 );
    }



/* -------------------------------------------------------------------------------

## assert

Note that 0 and empty strings will not cause failure.

@param test
@param msg Optional

------------------------------------------------------------------------------- */

    var assert = function( test, msg ) {
        if ( test === undefined || test === null || test === false ) {
            throw new AssertionError( msg || "Assertion has failed.", test, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertNot

Throws an assertion error if what is given if truthy.

Note that 0 and empty strings will cause failure.

@param test
@param msg Optional

------------------------------------------------------------------------------- */

    var assertNot = function( test, msg ) {
        if (
                test !== false &&
                test !== null &&
                test !== undefined
        ) {
            throw new AssertionError( msg || "Item is truthy.", test, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertUnreachable

Displays a generic error message, that the current location in code, is meant
to be unreachable. So something has gone wrong.

This always throws an assertion error.

@param msg Optional The message to display.

------------------------------------------------------------------------------- */

    var assertUnreachable = function( msg ) {
        assert( false, msg || "this section of code should never be reached" );
    }



/* -------------------------------------------------------------------------------

## assertObjectLiteral

Throws an assertion error, if the object given is *not* a JSON Object literal.
So regular objects, they will throw an assertion. It's only the '{ }' style
objects that this allows.

@param obj The object to test.
@param msg Optional The message to display if this assertion fails.

------------------------------------------------------------------------------- */

    var assertObjectLiteral = function( obj, msg ) {
        if ( ! isObjectLiteral(obj) ) {
            throw new AssertionError( msg || "Code expected an JSON object literal.", obj, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertLiteral

Throws an AssertionError if the value given is not a literal value.

Note that literals do not include object literals. Just strings, numbers,
booleans, null, and undefined.

@param obj
@param msg Optional

------------------------------------------------------------------------------- */

    var assertLiteral = function( obj, msg ) {
        if ( ! isLiteral(obj) ) {
            throw new AssertionError( msg || "Primitive value expected.", obj, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertFunction

@param fun A function object to test.
@param msg Optional The message to display if the test fails.

------------------------------------------------------------------------------- */

    var assertFunction = function( fun, msg ) {
        if ( typeof fun !== 'function' && !(fun instanceof Function) ) {
            throw new AssertionError( msg || "Function expected.", fun, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertBoolean

@param bool The boolean value to test.
@param msg Optional The error message on failure.

------------------------------------------------------------------------------- */

    var assertBoolean = function( bool, msg ) {
        if ( bool !== true && bool !== false ) {
            throw new AssertionError( msg || "Boolean expected.", bool, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertArray

@param arr The array to test.
@param msg Optional The error message.

------------------------------------------------------------------------------- */

    var assertArray = function( arr, msg ) {
        if ( ! isArray(arr) && (arr.length === undefined) ) {
            throw new AssertionError( msg || "Array expected.", arr, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertString

@param str The string to test against.
@param msg Optional The error message to show.

------------------------------------------------------------------------------- */

    var assertString = function( str, msg ) {
        if ( typeof str !== 'string' && !(str instanceof String) ) {
            throw new AssertionError( msg || "String expected.", str, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertNumber

This includes both number primitives, and Number objects.

@param num The number to check.
@param msg Optional An optional error message.

------------------------------------------------------------------------------- */

    var assertNumber = function( num, msg ) {
        if ( typeof n !== 'number' && !(n instanceof Number) ) {
            throw new AssertionError( msg || "Number expected.", num, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertParent( dom:Element )

Throws an error if the given element is not a HTMLElement, or if it does not
have a parent node.

------------------------------------------------------------------------------- */

    var assertParent = function( dom ) {
        assert( dom instanceof HTMLElement && dom.parentNode !== null, "dom is not in the document; it doesn't have a parentNode" )
    }






/* ===============================================================================

# bb.js

@author Joseph Lenton

This is a set of dom creation, and interaction, functions.
It aims to provide a more rich API than the standard
document API, with very little overhead added on top.

This does no DOM wrapping, or other functionality like that,
it mostly takes information to create a dom element which
is returned, or alter a given dom element.

When the type of an element is not declared,
it will be of this type by default.

## about events

Custom events can be created. When the event goes to be placed on the DOM
element, these custom events will be called instead.

They can replace existing events, including HTML events, or can add entirely
new events (for example adding custom touch events).

The custom events are a function callback which should have the following
signature ...

@example
    function(
        dom:DOMElement,
        fun:EventCallback,
        useCapture:boolean,
        bb:BB,
        evName:string,
        eventParams:string[],
        eventParamsStartIndex:number
    );

@param dom The dom element that the event is being set to.
@param fun The function being set by the user for this event.
@param useCapture A boolean to say if this should capture the events of
child nodes or not.
@param bb The BB instance used to create this event.
@param evName The name of the event being set.
@param eventParams Optional, can be null. This is an array of string parameters
that can be added on to the event name.
@param eventParamsStartIndex Optional. When eventParams is provided (not null),
this is the index you should start taking the parameters from. So if it's 0,
you start from the first element. If it's 1, you ignore the first element.
(At the time of writing this is always 1, but this may not always be the case).

Most events will have the name like 'touch' or 'mousedown' or something like
that. You can however add in extra parameters. For example 'mousedown left'.

In that example the 'left' part will be removed and put into the 'eventParams'
array as a parameter.

=============================================================================== */

    var HTMLDocument = ( window['HTMLDocument'] || null );

    var DEFAULT_ELEMENT = 'div';

    var WHITESPACE_REGEX = / +/g;

    var STOP_PROPAGATION_FUN = function( ev ) {
        ev.stopPropagation();
    }

    var PREVENT_DEFAULT_FUN = function( ev ) {
        ev.preventDefault();
    }

    var OBJECT_DESCRIPTION = {
        value           : undefined,
        enumerable      : false,
        writable        : true,
        configurable    : true
    }

    var KEY_CODES = {
        BACKSPACE   : 8,

        TAB         : 9,
        "\t"        : 9,

        ENTER       : 13,
        "\r"        : 13,
        "\n"        : 13,

        CTRL        : 17,
        CONTROL     : 17,

        ALT         : 18,
        SHIFT       : 16,

        ESC         : 27,
        ESCAPE      : 27,

        SPACE       : 32,
        ' '         : 32,

        PAGE_UP     : 33,
        PAGEUP      : 33,

        PAGE_DOWN   : 34,
        PAGEDOWN    : 34,

        END         : 35,
        HOME        : 36,

        LEFT        : 37,
        LEFT_ARROW  : 37,
        LEFTARROW   : 37,
        ARROW_LEFT  : 37,
        ARROWLEFT   : 37,

        UP          : 38,
        UP_ARROW    : 38,
        UPARROW     : 38,
        ARROW_UP    : 38,
        ARROWUP     : 38,

        RIGHT       : 39,
        RIGHT_ARROW : 39,
        RIGHTARROW  : 39,
        ARROW_RIGHT : 39,
        ARROWRIGHT  : 39,

        DOWN        : 40,
        DOWN_ARROW  : 40,
        DOWNARROW   : 40,
        ARROW_DOWN  : 40,
        ARROWDOWN   : 40,

        INSERT      : 45,

        DEL         : 46,
        DELETE      : 46,

        0           : 48,
        1           : 49,
        2           : 50,
        3           : 51,
        4           : 52,
        5           : 53,
        6           : 54,
        7           : 55,
        8           : 56,
        9           : 57,

        A           : 65,
        B           : 66,
        C           : 67,
        D           : 68,
        E           : 69,
        F           : 70,
        G           : 71,
        H           : 72,
        I           : 73,
        J           : 74,
        K           : 75,
        L           : 76,
        M           : 77,
        N           : 78,
        O           : 79,
        P           : 80,
        Q           : 81,
        R           : 82,
        S           : 83,
        T           : 84,
        U           : 85,
        V           : 86,
        W           : 87,
        X           : 88,
        Y           : 89,
        Z           : 90,

        F1          : 112,
        F2          : 113,
        F3          : 114,
        F4          : 115,

        F5          : 116,
        F6          : 117,
        F7          : 118,
        F8          : 119,

        F9          : 120,
        F10         : 121,
        F11         : 122,
        F12         : 123,

        LESS_THAN   : 188,
        LESSTHAN    : 188,
        '<'         : 188,

        GREATER_THAN: 190,
        GREATERTHAN : 190,
        '>'         : 190,

        COMMA       : 188,
        ','         : 188,

        FULL_STOP   : 190,
        FULLSTOP    : 190,
        '.'         : 190,

        PLUS        : ( IS_MOZILLA ? 61  : 187 ),
        '+'         : ( IS_MOZILLA ? 61  : 187 ),
        MINUS       : ( IS_MOZILLA ? 173 : 189 ),
        '-'         : ( IS_MOZILLA ? 173 : 189 )
    }



/* The blank data is used internally for HTML events. All of the HTML events are
set to the same BROWSER_PROVIDED_DEFAULT object. */

    var BROWSER_PROVIDED_DEFAULT = {
            /**
             * A blank function that does nothing.
             *
             * This is here to avoid 'null', so this value is always not-null
             * in all cases.
             */
            fun: function() { },

            /**
             * True when you should call the function set on this object.
             * Otherwise false.
             */
            isFunction: false,

            /**
             * Denotes if there is a native version of this provided by thead
             * browser.
             *
             * Even if this has been wrapped by something custom this should
             * still be true.
             */
            isBrowserProvided: true
    };

    var __initFunsArr = []
    var __initFunsI = 0
    var InitFuns_create = function() {
      if ( __initFunsI > 0 ) {
        return __initFunsArr[ --__initFunsI ]

      } else {
        return {
            length: 0,
            arr: []
        }
      }
    }

    var InitFuns_callAndFree = function( bb, initFuns ) {
      var arr = initFuns.arr
      var len = initFuns.length

      for ( var i = 0; i < len; i++ ) {
        var initFun = arr[i]
        var dom = initFun.dom

        var result = initFun.fun.call( dom, dom )
        if ( result ) {
          var initFuns2 = InitFuns_create()
          applyOne( bb, dom, result, true, initFuns2 )
          InitFuns_callAndFree( bb, initFuns2 )
        }

        // clear
        initFun.dom = initFun.fun = null
      }

      initFuns.length = 0
      __initFunsArr[ __initFunsI++ ] = initFuns
    }

    var InitFuns_add = function( initFuns, dom, f ) {
      assert( dom !== null, "null init dom given" )
      assert( f !== null, "null init function given" )

      var i = initFuns.length++
      var arr = initFuns.arr

      var initFun;
      if ( i < arr.length ) {
        initFun = arr[ i ]
        initFun.dom = dom
        initFun.fun = f
      } else {
        initFun = { dom: dom, fun: f }
        arr[ i ] = initFun
      }
    }

    var newBBFunctionData = function( callback, oldEvent ) {
        if (
                ((typeof callback) === 'function') ||
                (callback instanceof Function)
        ) {
            return {
                    fun:  callback,
                    isFunction: true,
                    isBrowserProvided: (!!oldEvent && oldEvent.isBrowserProvided)
            };
        } else {
            fail( "non-function provided as callback" );
        }
    }



/* -------------------------------------------------------------------------------

## HTML Elements

------------------------------------------------------------------------------- */

    var HTML_ELEMENTS = {
            'a'           : BROWSER_PROVIDED_DEFAULT,
            'abbr'        : BROWSER_PROVIDED_DEFAULT,
            'address'     : BROWSER_PROVIDED_DEFAULT,
            'area'        : BROWSER_PROVIDED_DEFAULT,
            'article'     : BROWSER_PROVIDED_DEFAULT,
            'aside'       : BROWSER_PROVIDED_DEFAULT,
            'audio'       : BROWSER_PROVIDED_DEFAULT,
            'b'           : BROWSER_PROVIDED_DEFAULT,
            'base'        : BROWSER_PROVIDED_DEFAULT,
            'bdi'         : BROWSER_PROVIDED_DEFAULT,
            'bdo'         : BROWSER_PROVIDED_DEFAULT,
            'blockquote'  : BROWSER_PROVIDED_DEFAULT,
            'body'        : BROWSER_PROVIDED_DEFAULT,
            'br'          : BROWSER_PROVIDED_DEFAULT,
            'button'      : BROWSER_PROVIDED_DEFAULT,
            'canvas'      : BROWSER_PROVIDED_DEFAULT,
            'caption'     : BROWSER_PROVIDED_DEFAULT,
            'cite'        : BROWSER_PROVIDED_DEFAULT,
            'code'        : BROWSER_PROVIDED_DEFAULT,
            'col'         : BROWSER_PROVIDED_DEFAULT,
            'colgroup'    : BROWSER_PROVIDED_DEFAULT,
            'data'        : BROWSER_PROVIDED_DEFAULT,
            'datalist'    : BROWSER_PROVIDED_DEFAULT,
            'dd'          : BROWSER_PROVIDED_DEFAULT,
            'del'         : BROWSER_PROVIDED_DEFAULT,
            'details'     : BROWSER_PROVIDED_DEFAULT,
            'dfn'         : BROWSER_PROVIDED_DEFAULT,
            'dialog'      : BROWSER_PROVIDED_DEFAULT,
            'div'         : BROWSER_PROVIDED_DEFAULT,
            'dl'          : BROWSER_PROVIDED_DEFAULT,
            'dt'          : BROWSER_PROVIDED_DEFAULT,
            'em'          : BROWSER_PROVIDED_DEFAULT,
            'embed'       : BROWSER_PROVIDED_DEFAULT,
            'fieldset'    : BROWSER_PROVIDED_DEFAULT,
            'figcaption'  : BROWSER_PROVIDED_DEFAULT,
            'figure'      : BROWSER_PROVIDED_DEFAULT,
            'footer'      : BROWSER_PROVIDED_DEFAULT,
            'form'        : BROWSER_PROVIDED_DEFAULT,
            'h1'          : BROWSER_PROVIDED_DEFAULT,
            'h2'          : BROWSER_PROVIDED_DEFAULT,
            'h3'          : BROWSER_PROVIDED_DEFAULT,
            'h4'          : BROWSER_PROVIDED_DEFAULT,
            'h5'          : BROWSER_PROVIDED_DEFAULT,
            'h6'          : BROWSER_PROVIDED_DEFAULT,
            'head'        : BROWSER_PROVIDED_DEFAULT,
            'header'      : BROWSER_PROVIDED_DEFAULT,
            'hgroup'      : BROWSER_PROVIDED_DEFAULT,
            'hr'          : BROWSER_PROVIDED_DEFAULT,
            'html'        : BROWSER_PROVIDED_DEFAULT,
            'i'           : BROWSER_PROVIDED_DEFAULT,
            'iframe'      : BROWSER_PROVIDED_DEFAULT,
            'img'         : BROWSER_PROVIDED_DEFAULT,
            'input'       : BROWSER_PROVIDED_DEFAULT,
            'ins'         : BROWSER_PROVIDED_DEFAULT,
            'kbd'         : BROWSER_PROVIDED_DEFAULT,
            'keygen'      : BROWSER_PROVIDED_DEFAULT,
            'label'       : BROWSER_PROVIDED_DEFAULT,
            'legend'      : BROWSER_PROVIDED_DEFAULT,
            'li'          : BROWSER_PROVIDED_DEFAULT,
            'link'        : BROWSER_PROVIDED_DEFAULT,
            'map'         : BROWSER_PROVIDED_DEFAULT,
            'mark'        : BROWSER_PROVIDED_DEFAULT,
            'menu'        : BROWSER_PROVIDED_DEFAULT,
            'menuitem'    : BROWSER_PROVIDED_DEFAULT,
            'meta'        : BROWSER_PROVIDED_DEFAULT,
            'meter'       : BROWSER_PROVIDED_DEFAULT,
            'nav'         : BROWSER_PROVIDED_DEFAULT,
            'noscript'    : BROWSER_PROVIDED_DEFAULT,
            'object'      : BROWSER_PROVIDED_DEFAULT,
            'ol'          : BROWSER_PROVIDED_DEFAULT,
            'optgroup'    : BROWSER_PROVIDED_DEFAULT,
            'option'      : BROWSER_PROVIDED_DEFAULT,
            'output'      : BROWSER_PROVIDED_DEFAULT,
            'p'           : BROWSER_PROVIDED_DEFAULT,
            'param'       : BROWSER_PROVIDED_DEFAULT,
            'pre'         : BROWSER_PROVIDED_DEFAULT,
            'progress'    : BROWSER_PROVIDED_DEFAULT,
            'q'           : BROWSER_PROVIDED_DEFAULT,
            'rp'          : BROWSER_PROVIDED_DEFAULT,
            'rt'          : BROWSER_PROVIDED_DEFAULT,
            'ruby'        : BROWSER_PROVIDED_DEFAULT,
            's'           : BROWSER_PROVIDED_DEFAULT,
            'samp'        : BROWSER_PROVIDED_DEFAULT,
            'script'      : BROWSER_PROVIDED_DEFAULT,
            'section'     : BROWSER_PROVIDED_DEFAULT,
            'select'      : BROWSER_PROVIDED_DEFAULT,
            'small'       : BROWSER_PROVIDED_DEFAULT,
            'source'      : BROWSER_PROVIDED_DEFAULT,
            'span'        : BROWSER_PROVIDED_DEFAULT,
            'strong'      : BROWSER_PROVIDED_DEFAULT,
            'style'       : BROWSER_PROVIDED_DEFAULT,
            'sub'         : BROWSER_PROVIDED_DEFAULT,
            'summary'     : BROWSER_PROVIDED_DEFAULT,
            'sup'         : BROWSER_PROVIDED_DEFAULT,
            'table'       : BROWSER_PROVIDED_DEFAULT,
            'tbody'       : BROWSER_PROVIDED_DEFAULT,
            'td'          : BROWSER_PROVIDED_DEFAULT,
            'textarea'    : BROWSER_PROVIDED_DEFAULT,
            'tfoot'       : BROWSER_PROVIDED_DEFAULT,
            'th'          : BROWSER_PROVIDED_DEFAULT,
            'thead'       : BROWSER_PROVIDED_DEFAULT,
            'time'        : BROWSER_PROVIDED_DEFAULT,
            'title'       : BROWSER_PROVIDED_DEFAULT,
            'tr'          : BROWSER_PROVIDED_DEFAULT,
            'track'       : BROWSER_PROVIDED_DEFAULT,
            'u'           : BROWSER_PROVIDED_DEFAULT,
            'ul'          : BROWSER_PROVIDED_DEFAULT,
            'var'         : BROWSER_PROVIDED_DEFAULT,
            'video'       : BROWSER_PROVIDED_DEFAULT,
            'wbr'         : BROWSER_PROVIDED_DEFAULT
    }



/* -------------------------------------------------------------------------------

## HTML Events

All of the HTML events available.

------------------------------------------------------------------------------- */

    var HTML_EVENTS = {
            /* CSS Events */

            // this is added manually as a custom event,
            // to deal with prefixes.

            'transitionend'               : BROWSER_PROVIDED_DEFAULT,
            'animationstart'              : BROWSER_PROVIDED_DEFAULT,
            'animationend'                : BROWSER_PROVIDED_DEFAULT,
            'animationiteration'          : BROWSER_PROVIDED_DEFAULT,

            /* Touch Events */
            'touchstart'                  : BROWSER_PROVIDED_DEFAULT,
            'touchend'                    : BROWSER_PROVIDED_DEFAULT,
            'touchmove'                   : BROWSER_PROVIDED_DEFAULT,
            'touchcancel'                 : BROWSER_PROVIDED_DEFAULT,

            /* Drag n' Drop Events */
            'drag'                        : BROWSER_PROVIDED_DEFAULT,
            'dragstart'                   : BROWSER_PROVIDED_DEFAULT,
            'dragend'                     : BROWSER_PROVIDED_DEFAULT,
            'dragover'                    : BROWSER_PROVIDED_DEFAULT,
            'dragenter'                   : BROWSER_PROVIDED_DEFAULT,
            'dragleave'                   : BROWSER_PROVIDED_DEFAULT,
            'drop'                        : BROWSER_PROVIDED_DEFAULT,

            /* HTML5 Events (minus those which are also L3) */
            'afterprint'                  : BROWSER_PROVIDED_DEFAULT,
            'beforeprint'                 : BROWSER_PROVIDED_DEFAULT,
            'beforeunload'                : BROWSER_PROVIDED_DEFAULT,
            'change'                      : BROWSER_PROVIDED_DEFAULT,
            'contextmenu'                 : BROWSER_PROVIDED_DEFAULT,
            'DOMContentLoaded'            : BROWSER_PROVIDED_DEFAULT,
            'hashchange'                  : BROWSER_PROVIDED_DEFAULT,
            'input'                       : BROWSER_PROVIDED_DEFAULT,
            'invalid'                     : BROWSER_PROVIDED_DEFAULT,
            'message'                     : BROWSER_PROVIDED_DEFAULT,
            'offline'                     : BROWSER_PROVIDED_DEFAULT,
            'online'                      : BROWSER_PROVIDED_DEFAULT,
            'pagehide'                    : BROWSER_PROVIDED_DEFAULT,
            'pageshow'                    : BROWSER_PROVIDED_DEFAULT,
            'popstate'                    : BROWSER_PROVIDED_DEFAULT,
            'readystatechange'            : BROWSER_PROVIDED_DEFAULT,
            'reset'                       : BROWSER_PROVIDED_DEFAULT,
            'show'                        : BROWSER_PROVIDED_DEFAULT,
            'submit'                      : BROWSER_PROVIDED_DEFAULT,

            /* L3 Dom Events */
            'DOMActivate'                 : BROWSER_PROVIDED_DEFAULT,
            'load'                        : BROWSER_PROVIDED_DEFAULT,
            'unload'                      : BROWSER_PROVIDED_DEFAULT,
            'abort'                       : BROWSER_PROVIDED_DEFAULT,
            'error'                       : BROWSER_PROVIDED_DEFAULT,
            'select'                      : BROWSER_PROVIDED_DEFAULT,
            'resize'                      : BROWSER_PROVIDED_DEFAULT,
            'scroll'                      : BROWSER_PROVIDED_DEFAULT,

            'blur'                        : BROWSER_PROVIDED_DEFAULT,
            'DOMFocusIn'                  : BROWSER_PROVIDED_DEFAULT,
            'DOMFocusOut'                 : BROWSER_PROVIDED_DEFAULT,
            'focus'                       : BROWSER_PROVIDED_DEFAULT,
            'focusin'                     : BROWSER_PROVIDED_DEFAULT,
            'focusout'                    : BROWSER_PROVIDED_DEFAULT,

            'click'                       : BROWSER_PROVIDED_DEFAULT,
            'dblclick'                    : BROWSER_PROVIDED_DEFAULT,
            'mousedown'                   : BROWSER_PROVIDED_DEFAULT,
            'mouseenter'                  : BROWSER_PROVIDED_DEFAULT,
            'mouseleave'                  : BROWSER_PROVIDED_DEFAULT,
            'mousemove'                   : BROWSER_PROVIDED_DEFAULT,
            'mouseover'                   : BROWSER_PROVIDED_DEFAULT,
            'mouseout'                    : BROWSER_PROVIDED_DEFAULT,
            'mouseup'                     : BROWSER_PROVIDED_DEFAULT,

            'wheel'                       : BROWSER_PROVIDED_DEFAULT,

            'keydown'                     : BROWSER_PROVIDED_DEFAULT,
            'keypress'                    : BROWSER_PROVIDED_DEFAULT,
            'keyup'                       : BROWSER_PROVIDED_DEFAULT,

            'compositionstart'            : BROWSER_PROVIDED_DEFAULT,
            'compositionupdate'           : BROWSER_PROVIDED_DEFAULT,
            'compositionend'              : BROWSER_PROVIDED_DEFAULT,

            'DOMAttrModified'             : BROWSER_PROVIDED_DEFAULT,
            'DOMCharacterDataModified'    : BROWSER_PROVIDED_DEFAULT,
            'DOMNodeInserted'             : BROWSER_PROVIDED_DEFAULT,
            'DOMNodeInsertedIntoDocument' : BROWSER_PROVIDED_DEFAULT,
            'DOMNodeRemoved'              : BROWSER_PROVIDED_DEFAULT,
            'DOMNodeRemovedFromDocument'  : BROWSER_PROVIDED_DEFAULT,
            'DOMSubtreeModified'          : BROWSER_PROVIDED_DEFAULT
    }



/* -------------------------------------------------------------------------------

### newRegisterMethod

Generates a register method.

We generate it, so we can avoid the cost of passing
in a callback method.

@param methodName The name of this method (for internal recursive calls).
@param methodNameOne The name of the callback to perform, on this object.

------------------------------------------------------------------------------- */

    var newRegisterMethod = function( doThis, doThisOne ) {
        return function( name, fun ) {
            var argsLen = arguments.length

            if ( argsLen === 1 ) {
                assertObjectLiteral( name, "non-object given for registering" )

                for ( var k in name ) {
                    if ( name.hasOwnProperty(k) ) {
                        doThis( this, k, name[k] )
                    }
                }
            } else if ( argsLen === 2 ) {
                if ( name instanceof Array ) {
                    for ( var i = 0; i < name.length; i++ ) {
                        doThis( this, name[i], fun )
                    }

                } else {
                    assertString( name, "non-string given for name" )
                    assertFunction( fun, "non-function given for function" )

                    doThisOne( this,  name, fun )
                }

            } else if ( argsLen === 0 ) {
                fail( "no parameters given" )

            } else {
                var names = new Array( argsLen-1 )
                fun = arguments[ argsLen-1 ]

                for ( var i = 0; i < argsLen-1; i++ ) {
                    names[i] = arguments[i]
                }

                doThis( this,  names, fun )
            }

            return this
        }
    }



/* -------------------------------------------------------------------------------


## Helper Methods, before, bb it's self!


-------------------------------------------------------------------------------



-------------------------------------------------------------------------------

### setOnOffObject

------------------------------------------------------------------------------- */

    var setOnOffObject = function( bb, nextSetFun, events, dom, obj, useCapture ) {
        assert( dom, "null or undefined dom given", dom );

        for ( var k in obj ) {
            if ( obj.hasOwnProperty(k) ) {
                setOnOff( bb, nextSetFun, events, dom, k, obj[k], useCapture )
            }
        }
    }



/* -------------------------------------------------------------------------------

## setOnOff

Helper function that does the main crux of setting or removing an event. It
does checking to ensure the event being set/removed is valid and then calls on
to the next function.

The next function to call is either to set or remove the event. Which to use is
passed as a parameter.

Note that 'useCapture' is the same as the 'useCapture' from the DOM's
'addEventListener' method.

@param bb The bb instance that is being used to set the event.
@param nextSetFun:() -> void, The next function to call on to to set the event on or off.
@param events A collection of all events available.
@param dom The HTML node we are setting the event to.
@param name The name of the event, or an array of event names.
@param fun The function to perform when the event is fired.
@param useCapture True or false, denotes if this captures the event or not.

------------------------------------------------------------------------------- */

    var setOnOff = function( bb, nextSetFun, events, dom, name, fun, useCapture ) {
        assert( dom, "null or undefined dom given", dom );
        assertBoolean( useCapture, "useCapture should be true or false, and it's not" );

        if ( name instanceof Array ) {
            for ( var i = 0; i < name.length; i++ ) {
                setOnOff( bb, nextSetFun, events, dom, name[i], fun, useCapture );
            }

        // Has name been trimmed before now? The anser is no!
        } else {
            assertString( name, "Bad parameters given for setting event on or off." );

            var evName = name.trim();
            var evParams;
            var spaceI = evName.indexOf(' ');

            if ( spaceI !== -1 ) {
                evParams = evName.substring( spaceI + 1 );
                evName   = evName.substring( 0, spaceI );
            } else {
                evParams = '';
            }

            var evFun = events[ evName ];

            if (
                    evFun !== undefined &&
                    evFun !== null
            ) {
                if ( ! evFun.isFunction ) {
                    if ( evParams !== '' ) {
                        fail( "extra event parameters given which will do nothing, '" + name + "'" );
                    }

                    evFun = null;
                }
            } else {
                fail( "unknown event given " + name );
            }

            nextSetFun( bb, evFun, dom, evName, evParams, fun, useCapture );
        }
    }



/* -------------------------------------------------------------------------------

### setOnInner

This exists so that all of the event look up, splitting of the event name, and
some error checking has all been performed *before* we potentially iterate over
an array (if dom is an array of elements).

It also allows all of the error checking and lookup code to be done together,
before this code is called.

------------------------------------------------------------------------------- */

    var setOnInner = function( bb, evFun, dom, evName, evParams, fun, useCapture ) {
        if ( dom instanceof Array || dom instanceof NodeList ) {
            for ( var i = 0; i < dom.length; i++ ) {
                setOnInner( bb, evFun, dom[i], evName, evParams, fun, useCapture );
            }

        // isWindow dom = ( dom.self === dom )
        } else if ( dom.nodeType !== undefined || (dom.self === dom) ) {
            if ( evFun !== null ) {
                evFun.fun( dom, fun, useCapture, bb, evName, evParams );

            } else {
                dom.addEventListener( evName, fun, useCapture )

            }

        } else {
            fail( "Unknown dom node given", dom );

        }
    }



/* -------------------------------------------------------------------------------

### setOffInner

------------------------------------------------------------------------------- */

    var setOffInner = function( bb, evFun, dom, evName, evParams, fun, useCapture ) {
        if ( dom instanceof Array ) {
            for ( var i = 0; i < dom.length; i++ ) {
                setOffInner( bb, evFun, dom[i], evName, evParams, fun, useCapture );
            }

        // isWindow dom = ( dom.self === dom )
        } else if ( dom.nodeType !== undefined || (dom.self === dom) ) {
            if ( evFun !== null && ! evFun.isBrowserProvided ) {
                fail( "Feature not supported: setting off custom events" );
            }

            dom.removeEventListener( evName, fun, useCapture )

        } else {
            fail( "Unknown dom node given", dom );

        }
    }



    var iterateClasses = function( args, i, endI, fun ) {
        for ( ; i < endI; i++ ) {
            var arg = args[i];

            if ( isString(arg) ) {
                if ( iterateClassesString(arg, fun) === false ) {
                    return;
                }

            } else if ( isArray(arg) ) {
                iterateClasses( arg, 0, arg.length, fun );

            } else {
                fail( "invalid parameter", arg, args, i, endI );

            }
        }
    }

    var iterateClassesString = function( klassString, fun ) {
        assertString( klassString, "expected string for add DOM class" );

        klassString = klassString.trim();
        if ( klassString.length > 0 ) {
            if ( klassString.indexOf(' ') !== -1 ) {
                var klasses = klassString.split( ' ' );

                for ( var i = 0; i < klasses.length; i++ ) {
                    var klass = klasses[i];

                    if ( klass !== '' ) {
                        var dotI = klass.indexOf( '.' );
                        if ( dotI === 0 ) {
                            klass = klass.substring(1);
                        }

                        if ( klass.indexOf('.') !== -1 ) {
                            var klassParts = klass.split('.');

                            for ( var j = 0; j < klassParts.length; j++ ) {
                                if ( fun(klassParts[j]) === false ) {
                                    return false;
                                }
                            }
                        } else if ( fun(klass) === false ) {
                            return false;
                        }
                    }
                }
            } else {
                var dotI = klassString.indexOf( '.' );
                if ( dotI === 0 ) {
                    klassString = klassString.substring(1);
                }

                if ( klassString.indexOf('.') !== -1 ) {
                    var argParts = klassString.split('.');

                    for ( var i = 0; i < argParts.length; i++ ) {
                        if ( fun(argParts[i]) === false ) {
                            return false;
                        }
                    }
                } else if ( fun(klassString) === false ) {
                    return false;
                }
            }
        }

        return true;
    }

    var parseClassArray = function( arr, startI ) {
        var klass = '';

        for ( var i = startI; i < arr.length; i++ ) {
            var c = arr[i];

            if ( isString(c) ) {
                klass += ' ' + c;
            } else if ( c instanceof Array ) {
                klass += parseClassArray( c, 0 );
            } else {
                fail( 'unknown class given', c );
            }
        }

        return klass;
    }

    var applyArray = function( bb, dom, args, startI, initFuns ) {
        if ( args !== null ) {
            var argsLen = args.length;

            for (var i = startI; i < argsLen; i++) {
                applyOne( bb, dom, args[i], false, initFuns )
            }
        }

        return dom;
    }

    var applyOne = function( bb, dom, arg, stringsAreContent, initFuns ) {
        if (arg instanceof Array) {
            applyArray( bb, dom, arg, 0, initFuns )

        } else if ( arg.nodeType !== undefined ) {
            dom.appendChild( arg )

        /*
         * - html
         * - class names
         */
        } else if ( isString(arg) ) {
            if ( stringsAreContent || arg.trim().charAt(0) === '<' ) {
                dom.insertAdjacentHTML( 'beforeend', arg )
            } else {
                addClassOneString( dom, arg )
            }

        } else if ( isObjectLiteral(arg) ) {
            attrObj( bb, dom, arg, true, initFuns )

        } else if ( isFunction(arg) ) {
            InitFuns_add( initFuns, dom, arg )

        } else {
            fail( "invalid argument given", arg )
        }

        return dom
    }

    var createOne = function( bb, obj, initFuns ) {
        /*
         * A String ...
         *  <html element="description"></html>
         *  .class-name
         *  element-name
         *  '' (defaults to a div)
         */
        if ( isString(obj) ) {
            return createString( bb, obj );

        /*
         * An array of classes.
         */
        } else if ( obj instanceof Array ) {
            if ( obj.length > 0 ) {
                if ( obj[0].charAt(0) === '.' ) {
                    return createString( bb, obj.join(' ') );
                } else {
                    return createString( bb, '.' + obj.join(' ') );
                }
            } else {
                return bb.createElement();
            }
        } else if ( obj.nodeType !== undefined ) {
            return obj;
        } else if ( isObjectLiteral(obj) ) {
            return createObj( bb, obj, initFuns );
        } else {
            fail( "unknown parameter given", obj );
        }
    }

    var createObj = function( bb, obj, initFuns ) {
        var dom = obj.hasOwnProperty("nodeName") ? bb.createElement( obj["nodeName"] ) :
                  obj.hasOwnProperty("tagName")  ? bb.createElement( obj["tagName"]  ) :
                                        bb.createElement()                  ;

        for ( var k in obj ) {
            if ( obj.hasOwnProperty(k) ) {
                attrOne( bb, dom, k, obj[k], false, initFuns );
            }
        }

        return dom;
    }

    var createString = function( bb, obj ) {
        obj = obj.trim();

        /*
         * It's a HTML element.
         */
        if ( obj.charAt(0) === '<' ) {
            var dom = obj.toHTML();

            if ( dom === undefined ) {
                fail( "invalid html given", obj );
            } else {
                return dom;
            }
        } else if ( obj.charAt(0) === '.' ) {
            var dom = bb.createElement();
            dom.className = obj.substring(1).replace( /\./g, ' ' );
            return dom;
        } else if ( obj === '' ) {
            return bb.createElement();
        } else {
            return bb.createElement( obj )
        }
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var toggleClassOne = function( dom, klass, onAdd, onRemove ) {
        if ( isString(klass) ) {
            return toggleClassString( dom, klass, onAdd, onRemove );
        } else if ( isArray(klass) ) {
            return toggleClassArray( dom, klass, 0, klass.length, null, null );
        } else if ( isObjectLiteral(klass) ) {
            return toggleClassObj( dom, klass, onAdd, onRemove );
        } else {
            fail( "Unknown value given for 'klass' in toggle" );
            return dom;
        }
    }



/* -------------------------------------------------------------------------------

@param startI Where the start iterating from in klass, if klass is an array.
@param endI Where to end iterating from in klass, if klass is an array.

------------------------------------------------------------------------------- */

    var toggleClassBoolean = function( dom, flag, klass, onAdd, onRemove ) {
        if ( flag ) {
            if ( isArray(klass) ) {
                return addClassArray( dom, klass, 0 );
            } else {
                return addClassOne( dom, klass );
            }

            if ( onAdd !== null ) {
                onAdd( true );
            }

        } else {
            if ( isArray(klass) ) {
                return removeClassArray( dom, klass, 0 );
            } else {
                return removeClassOne( dom, klass );
            }

            if ( onRemove !== null ) {
                onRemove( false );
            } else if ( onAdd !== null ) {
                onAdd( false );
            }
        }

        return dom;
    }



/* -------------------------------------------------------------------------------

Takes a boolean flag and an array, and sets all the klasses in the array on or
off depending on the flag.

------------------------------------------------------------------------------- */

    var toggleClassBooleanArray = function( dom, flag, args, startI, endI, onAdd, onRemove ) {
        assert( startI < endI, "no arguments provided" );

        var hasRemove = false;
        var hasAdd = false;

        if ( flag ) {
            hasAdd = true;

            iterateClasses( args, startI, endI, function(klass) {
                dom.classList.add(klass);
            } );
        } else {
            hasRemove = true;

            iterateClasses( args, startI, endI, function(klass) {
                dom.classList.remove(klass);
            } );
        }

        toggleClassCallAddRemove( onAdd, onRemove, hasAdd, hasRemove );

        return dom;
    }



/* -------------------------------------------------------------------------------

### toggleClassCallAddRemove

Calls the onAdd and onRemove event handlers for you based on if they exist.
This exists because this job is done about 4 times across 4 different functions,
so it's DRY'd up and placed here.

------------------------------------------------------------------------------- */

    var toggleClassCallAddRemove = function( dom, onAdd, onRemove, hasAdd, hasRemove ) {
        if ( onAdd !== null ) {
            if ( onRemove !== null ) {
                if ( hasAdd ) {
                    onAdd.call( dom, true );
                }

                if ( hasRemove ) {
                    onRemove.call( dom, true );
                }
            } else {
                onAdd.call( dom, hasAdd );
            }
        }
    }



/* -------------------------------------------------------------------------------

### toggleClassObj dom klass{ name:string => onOff:bool }

------------------------------------------------------------------------------- */

    var toggleClassObj = function( dom, klass, onAdd, onRemove ) {
        var hasAdd = false;
        var hasRemove = false;

        for ( var k in klass ) {
            if ( klass.hasOwnProperty(k) ) {
                var val = klass[k];

                if ( isFunction(val) ) {
                    toggleClassString( dom, klass, val, null );

                } else if ( isBoolean(val) ) {
                    if ( val ) {
                        addClassOneString( dom, k );
                        hasAdd = true;
                    } else {
                        removeClassOne( dom, k );
                        hasRemove = true;
                    }
                } else {
                    fail( "Unknown type given for value to class '" + klass + "' in toggleClass." );
                }
            }
        }

        toggleClassCallAddRemove( onAdd, onRemove, hasAdd, hasRemove );

        return dom;
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var toggleClassArray = function( dom, args, startI, endI, onAdd, onRemove ) {
        assert( startI < endI, "no arguments provided" );

        var hasRemove = false;
        var hasAdd = false;

        iterateClasses( args, startI, endI, function(klass) {
            if ( dom.classList.contains(klass) ) {
                dom.classList.remove(klass);
                hasRemove = true;
            } else {
                dom.classList.add(klass);
                hasAdd = true;
            }
        } );

        toggleClassCallAddRemove( onAdd, onRemove, hasAdd, hasRemove );

        return dom;
    }



/* -------------------------------------------------------------------------------

### toggleClassString

------------------------------------------------------------------------------- */

    var toggleClassString = function( dom, klass, onAdd, onRemove ) {
        if ( onAdd === null && onRemove === null ) {
            iterateClassesString( klass, function(k) {
                dom.classList.toggle(k);
            } );
        } else {
            var hasAdd = false;
            var hasRemove = false;

            iterateClassesString( klass, function(k) {
                if ( dom.classList.contains(k) ) {
                    dom.classList.add( k );
                    hasAdd = true;
                } else {
                    dom.classList.remove( k );
                    hasRemove = false;
                }
            } );

            toggleClassCallAddRemove( onAdd, onRemove, hasAdd, hasRemove );
        }
    }



    var beforeOne = function( bb, parentDom, dom, arg ) {
        if ( dom !== null ) {
            if ( arg instanceof Array ) {
                for ( var i = 0; i < arg.length; i++ ) {
                    beforeOne( bb, parentDom, dom, arg[i] );
                }
            } else if ( arg.nodeType !== undefined ) {
                parentDom.insertBefore( arg, dom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforebegin', arg );
            } else if ( isObjectLiteral(arg) ) {
                parentDom.insertBefore( createObj(bb, arg), dom );
            } else {
                fail( "invalid argument given", arg );
            }
        }

        return dom;
    }

    var afterOne = function( bb, parentDom, dom, arg ) {
        if ( dom !== null ) {
            if ( arg instanceof Array ) {
                for ( var i = 0; i < arg.length; i++ ) {
                    afterOne( bb, parentDom, dom, arg[i] );
                }
            } else if ( arg.nodeType !== undefined ) {
                parentDom.insertAfter( arg, dom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'afterend', arg );
            } else if ( isObjectLiteral(arg) ) {
                parentDom.insertAfter( createObj(bb, arg), dom );
            } else {
                fail( "invalid argument given", arg );
            }
        }

        return dom;
    }

    var addOne = function( bb, dom, arg ) {
        if ( dom !== null ) {
            if ( arg instanceof Array ) {
                for ( var i = 0; i < arg.length; i++ ) {
                    addOne( bb, dom, arg[i] );
                }
            } else if ( arg.nodeType !== undefined ) {
                assert( arg.parentNode === null, "adding element, which already has a parent" );
                dom.appendChild( arg );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforeend', arg );
            } else if ( isObjectLiteral(arg) ) {
                dom.appendChild( createObj(bb, arg) );
            } else {
                fail( "invalid argument given", arg );
            }
        }

        return dom;
    }

    var addArray = function( bb, dom, args, startI ) {
        if ( dom !== null ) {
            for ( var i = startI; i < args.length; i++ ) {
                addOne( bb, dom, args[i] );
            }
        }

        return dom;
    }

    /**
     * If there is a '.' in an attribute name,
     * then this will be called.
     *
     * These handle attributes in the form:
     *
     *      'div.classFoo whatever'
     *      'div.className'
     *      '.className'
     *
     */
    var attrOneNewChild = function( bb, dom, k, val, dotI, initFuns ) {
        assert( k.length > 1, "empty description given" );

        var className = k.substring(dotI+1);
        var domType =
                ( dotI > 0               ) ? k.substring( 0, dotI ) :
                ( val instanceof Element ) ? val.nodeName           :
                                            'div'                   ;

        var newDom = newOneNewChildInner( bb, dom, domType, val, k, initFuns )

        addClassOneString( newDom, className );
    }

    var newOneNewChildInner = function( bb, dom, domType, val, debugVal, initFuns ) {
        var newDom

        if ( isObjectLiteral(val) ) {
            assert( bb.setup.isElement(domType), "invalid element type given, " + domType )
            val["nodeName"] = domType

            newDom = createObj( bb, val, initFuns )

        } else if ( val instanceof Element ) {
            if ( domType !== '' && domType.toLowerCase() !== val.nodeName.toLowerCase() ) {
                fail( "Type of dom node does not match the type stated in the identifier, given '" + domType + "', got '" + val.nodeName + "'" )
            }

            newDom = val

        } else {
            newDom = bb.createElement( domType )

            if ( val.nodeType !== undefined ) {
                newDom.appendChild( val )

            } else if ( isString(val) ) {
                newDom.innerHTML = val

            } else if ( isArray(val) ) {
                applyArray(
                        this,
                        newDom,
                        val,
                        0,
                        initFuns
                )

            } else {
                fail( "invalid object description given for, " + debugVal, debugVal );

            }
        }

        dom.appendChild( newDom );

        return newDom;
    }



/* -------------------------------------------------------------------------------

@param isApply This is true when 'attrOne' is being called repeteadly over the
same DOM element. Namely this is done when DOM elements are described and
created.

------------------------------------------------------------------------------- */

    var attrOne = function( bb, dom, k, val, isApply, initFuns ) {
        var dotI = k.indexOf( '.' );
        var ev;

        if ( dotI !== -1 ) {
            attrOneNewChild( bb, dom, k, val, dotI, initFuns )

        } else {
            var spaceI = k.indexOf(' '),
                rest = '';

            if ( spaceI !== -1 ) {
                rest = k.substr( spaceI );
                k = k.substr( 0, spaceI );

                assert(
                        k !== 'nodeName'        &&
                        k !== 'tagName'         &&
                        k !== 'className'       &&
                        k !== 'stop'            &&
                        k !== 'on'              &&
                        k !== 'once'            &&
                        k !== 'id'              &&
                        k !== 'style'           &&
                        k !== 'text'            &&
                        k !== 'textContent'     &&
                        k !== 'html'            &&
                        k !== 'innerHTML'       &&
                        k !== 'innerHtml'       &&
                        k !== 'value'           &&
                        k !== 'stopPropagation' &&
                        k !== 'preventDefault'  &&
                        k !== 'init'            &&
                        k !== 'addTo',
                        "invalid property given, cannot have extra rules in name"
                );
            }

            if ( k === "nodeName" || k === "tagName" ) {
                /*
                 * do nothing,
                 *
                 * Do not fail, because this can be used through an outer method,
                 * where the nodeName/tagName was used to create this element.
                 */

            } else if ( k === 'className' ) {
                if ( isApply ) {
                    // String check is there because most of the time 'val'
                    // will being a string. So just check for that and then
                    // decide if it's an object literal laterz.
                    if ( (typeof val !== 'string') && isObjectLiteral(val) ) {
                        toggleClassObj( dom, val, null, null );
                    } else {
                        addClassOne( dom, val );
                    }
                } else {
                    setClassOne( dom, val );
                }

            } else if ( k === 'stop' ) {
                bb.stop( dom, val );
            } else if ( k === 'on' ) {
                bb.on( dom, val );
            } else if ( k === 'once' ) {
                bb.once( dom, val );
            } else if ( k === 'id' ) {
                dom.id = val
            } else if ( k === 'style' ) {
                if ( isString(val) ) {
                    dom.setAttribute( 'style', val );
                } else {
                    bb.style( dom, val );
                }

            } else if ( k === 'text' || k === 'textContent' ) {
                setText( dom, combineStringOne(val), true )
            } else if ( k === 'html' || k === 'innerHTML' || k === 'innerHtml' ) {
                setHTML( bb, dom, val, false )
            } else if ( k === 'value' ) {
                if ( val === undefined || val === null ) {
                    dom.value = '';
                } else {
                    dom.value = val
                }

            } else if ( k === 'stopPropagation' ) {
                setOnOff( bb, setOnInner, bb.setup.data.events, dom, val, STOP_PROPAGATION_FUN, false )

            } else if ( k === 'preventDefault' ) {
                setOnOff( bb, setOnInner, bb.setup.data.events, dom, val, PREVENT_DEFAULT_FUN, false )

            } else if ( k === 'init' ) {
                assertFunction( val, "none function given for 'init' attribute" )
                InitFuns_add( initFuns, dom, val )

            } else if ( k === 'addTo' ) {
                assert( dom.parentNode === null, "dom element already has a parent" )
                createOne( bb, val, initFuns ).appendChild( dom )

            /* Events, includes HTML and custom  */
            } else if (
                ( ev = bb.setup.getEvent(k) ) !== null &&

                // I am cutting a hole specifically for handling input's
                ! ( k === 'input' && !(val instanceof Function) )
            ) {
                if ( ev.isFunction ) {
                    ev.fun( dom, val, false, bb, k, rest );
                } else {
                    dom.addEventListener( k, val, false )
                }

            /* new objet creation */
            } else if ( bb.setup.isElement(k) ) {
                newOneNewChildInner( bb, dom, k, val, k, initFuns );

            /* Arribute */
            } else {
                assertLiteral(
                        val,
                        "setting an object to a DOM attribute (probably a bug)," + k,
                        k,
                        val
                );

                dom.setAttribute( k, val );
            }
        }
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var attrObj = function( bb, dom, obj, isApply, initFuns ) {
        var hasHTMLText = false;

        for ( var k in obj ) {
            if ( obj.hasOwnProperty(k) ) {
                if ( k === 'text' || k === 'html' ) {
                    if ( hasHTMLText ) {
                        fail( "cannot use text and html at the same time", obj );
                    } else {
                        hasHTMLText = true;
                    }
                }

                attrOne( bb, dom, k, obj[k], isApply, initFuns );
            }
        }
    }



/* ===============================================================================

### setHTML bb:BB dom:Element el:string|Element|string[]|Element[] append:boolean

=============================================================================== */

    var setHTML = function( bb, dom, el, append ) {
        assert( el, "given element is not valid" );

        if ( isString(el) ) {
            if ( append ) {
                dom.insertAdjacentHTML( 'beforeend', content )
            } else {
                dom.innerHTML = el
            }
        } else if ( el.nodeType !== undefined ) {
            dom.appendChild( el );
        } else if ( el instanceof Array ) {
            bb.htmlArray( dom, el, 0 )
        } else if ( isObjectLiteral(el) ) {
            dom.appendChild( bb.createOne(el) )
        } else {
            fail( "Unknown html value given", el );
        }

        return dom;
    }



/* -------------------------------------------------------------------------------

### setText dom:Element text:string append:boolean

Sets the given string, to the dom element given. This is set to it's
textContent if it is a standard HTMLElement, and to it's value if it is a
HTMLInput.

@param dom The Element to set the text to.
@param text A string of the text being set.
@param append True if the text should be appended, false to replace.
@return The given dom, for function chaining of elements.

------------------------------------------------------------------------------- */

    var setText = function( dom, text, append ) {
        if ( dom instanceof HTMLInputElement ) {
            if ( append ) {
                dom.value += text;
            } else {
                dom.value = text;
            }

        } else if ( append ) {
            dom.appendChild( document.createTextNode(text) )

        } else {
            dom.textContent = text;
        }

        return dom;
    }



/* -------------------------------------------------------------------------------

### combineStringOne text:array|string|number|boolean

If an array is given, then the array is joined, and the result is returned. If
the given value is a string, then this is just returned.

Anything else will cause an error to be raised.

This exists as a function for unifying strings and arrays of strings, as one.

@param text The text to combine.
@return Either the array of strings combined, or if given a string, it will
  just be returned.

------------------------------------------------------------------------------- */

    var combineStringOne = function( text ) {
        if ( text instanceof Array ) {
            return combineStringArray( text, 0 )

        } else if ( isString(text) ) {
            return text

        } else {
            var type = (typeof text)

            if (
                    type === 'number' ||
                    type === 'boolean'
            ) {
              return '' + text

            } else {
              fail( "non-string given for text content", text )
            }
        }
    }



/* -------------------------------------------------------------------------------

### combineStringArray args:array startI:int

Given an array, and it should be an array, it will combine it's elements into
one string. The array *must* contain either strings, or arrays of strings, and
nothing else.

The 'startI' is optional, and states where to start joining string from in the
`args` array. So if it's 0, it will start from the first element, and 1 will
start joining from the second element onwards.

@param args An array of strings (or arrays of strings), to combine.
@param startI Optional, where to start joining elements from in the array.
@return All of the args combined into a single string.

------------------------------------------------------------------------------- */

    var combineStringArray = function( args, startI ) {
        if ( startI === undefined ) {
            startI = 0
        }

        var argsLen = args.length

        if ( startI > argsLen ) {
            fail( "start index is greater than the array length" )

        } else if ( startI === argsLen ) {
            return ''

        } else {
            var allText = combineStringOne( args[startI++] )

            while( startI++ < argsLen ) {
                allText += combineStringOne( args[startI] )
            }

            return allText
        }
    }



/* -------------------------------------------------------------------------------

### addClassOne dom klass:string|[klass]

------------------------------------------------------------------------------- */

    var addClassOne = function( dom, klass ) {
        if ( isString(klass) ) {
            return addClassOneString( dom, klass )

        } else if ( isArray(klass) ) {
            return addClassArray( dom, klass, 0 )

        } else {
            fail("Unknown klass value given for adding a class")
        }
    }



/* -------------------------------------------------------------------------------

### addClassOneString dom klass

This is for when the DOM is *pre* known and verified as a HTMLElement.

------------------------------------------------------------------------------- */

    var addClassOneString = function( dom, klass ) {
        assertString( klass, "Given class names are not a string." )

        /*
         * Take the class apart, and then append the pieces indevidually.
         * We have to split based on spaces, and based on '.'.
         */
        if ( klass.length > 0 ) {
            if ( klass.indexOf(' ') !== -1 ) {
                var parts = klass.split( ' ' )

                for ( var i = 0; i < parts.length; i++ ) {
                    var part = parts[i]

                    if ( part.length > 0 ) {
                        if ( part.indexOf('.') !== -1 ) {
                            var partParts = part.split('.')

                            for ( var j = 0; j < partParts.length; j++ ) {
                                var partPart = partParts[j]

                                if ( partPart.length > 0 ) {
                                    dom.classList.add( partPart )
                                }
                            }
                        } else {
                            dom.classList.add( part )
                        }
                    }
                }
            } else if ( klass.indexOf('.') !== -1 ) {
                var parts = klass.split( '.' )

                for ( var i = 0; i < parts.length; i++ ) {
                    var part = parts[i]

                    if ( part.length > 0 ) {
                        dom.classList.add( part )
                    }
                }
            } else if ( klass.length > 0 ) {
                dom.classList.add( klass )
            }
        }

        return dom
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var addClassArray = function( dom, args, i ) {
        if ( i === undefined ) {
            i = 0
        }

        iterateClasses( args, i, args.length, function(klass) {
            dom.classList.add( klass )
        } )

        return dom
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var setClassOne = function( dom, klass ) {
        if ( typeof klass === 'string' ) {
            dom.className = klass.replace(/\./g, ' ')

        } else if ( klass instanceof Array ) {
            // sub arrays will also get joined but with a comma
            // so we use the replace to remove the comma as well as the dots
            dom.className = klass.join(' ').replace(/\.|,/g, ' ')

        } else if ( isObjectLiteral(klass) ) {
            dom.className = ''

            for ( var k in klass ) {
                if ( klass.hasOwnProperty(k) && klass[k] ) {
                    dom.classList.add( k )
                }
            }
        } else {
            fail( "Expected ClassName to be a string or array of strings, but it's something else." )
        }
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var removeClassOne = function( dom, klasses ) {
        iterateClassesString( klasses, function(klass) {
            dom.classList.remove( klass )
        } )

        return dom
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var removeClassArray = function( dom, klasses, i ) {
        if ( i === undefined ) {
            i = 0;
        }

        iterateClasses( klasses, i, klasses.length, function(klass) {
            dom.classList.remove( klass );
        } )

        return dom;
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var bbGet = function(dom) {
        assert( dom, "falsy dom given for bb.get" );

        if ( isString(dom) ) {
            return document.querySelector(dom) || null;

        } else if ( dom.nodeType !== undefined ) {
            return dom;

        } else {
            fail( "unknown object given", dom );
        }
    }

    var bbGetOrCreate = function( dom ) {
        if ( isObjectLiteral(dom) ) {
            var initFuns = InitFuns_create()
            var dom = createObj( bb, dom, initFuns )
            InitFuns_callAndFree( bb, initFuns )

            return dom
        } else {
            return bbGet( dom )

        }
    }



/* ===============================================================================

Pre-provided Keyboard Events
----------------------------

These events will bind when these keypresses have been pressed. If you want
something more sophisticated, build it yourself.

===============================================================================



-------------------------------------------------------------------------------

### newKeyTest k:string

------------------------------------------------------------------------------- */

    var NONE      = 0
    var SHIFT     = 1
    var CTRL      = 4
    var ALT       = 16
    var META      = 64
    var ANY       = 255

    var newKeyTest = function( k ) {
        k = k.trim().toLowerCase();

        var testState = 0;
        var charCode = 0;
        var keyCode = 0;
        var letter = '';
        var tests = null;

        if ( k ===  'shift' ) {
            testState = SHIFT
        } else if ( k ===   'ctrl' ) {
            testState = CTRL
        } else if ( k ===    'alt' ) {
            testState = ALT
        } else if ( k ===   'meta' ) {
            testState = META
        } else if ( k ===    'any' ) {
            testState = ANY

        } else if ( k ===   '!any' ) {
            fail( "'!any' cannot be used, it is not valid" );
        } else if ( k ===       '' ) {
            fail( "empty key testing description given" );

        } else if ( k.indexOf(',') !== -1 ) {
            testState = 0;
            var kParts = k.split( ',' );
            var kPartsLen = kParts.length;
            tests = new Array( kPartsLen );

            for ( var i = 0; i < kPartsLen; i++ ) {
                tests[i] = newKeyTest( kParts[i] );
            }
        } else if ( k.indexOf(' ') !== -1 ) {
            var kParts = k.split( ' ' );
            testState = 0;

            for ( var i = 0; i < kParts.length; i++ ) {
                var k2 = kParts[i];

                if ( k2 !== '' ) {
                    if ( k2 === 'shift' ) {
                        if ( (testState & SHIFT) === 1 ) { fail("'shift' is set on, twice" ); }
                        testState |= SHIFT

                    } else if ( k2 ===  'ctrl' ) {
                        if ( (testState & CTRL) === 1  ) { fail("'ctrl' is set on, twice" ); }
                        testState |= CTRL

                    } else if ( k2 ===  'alt' ) {
                        if ( (testState & ALT) === 1   ) { fail("'alt' is set on, twice" ); }
                        testState |= ALT

                    } else if ( k2 ===  'meta' ) {
                        if ( (testState & META) === 1  ) { fail("'meta' is set on, twice" ); }
                        testState |= META

                    } else if ( k2 === 'any' ) {
                        if ( testState !== NONE ) { fail("'any' used in conjunction with other modifiers"); }
                        testState = ANY

                    // a letter/key was named
                    } else {
                        if ( letter !== '' ) {
                            fail( "Naming more than 1 key for key event, " + letter + ", and " + k2 );
                        } else {
                            letter = k2;
                        }
                    }
                }
            }
        } else {
            letter = k;
        }

        // validate the letter that was picked
        if ( letter !== '' ) {
            keyCode = KEY_CODES[ letter.toUpperCase() ] || 0

            if ( letter.length === 1 ) {
                charCode = letter.charCodeAt( 0 )

            } else {
                if ( letter === 'enter' ) {
                    charCode = "\r".charCodeAt( 0 )

                } else if ( letter === 'tab' ) {
                    charCode = "\t".charCodeAt( 0 )

                } else if ( letter === 'space' ) {
                    charCode = " ".charCodeAt( 0 )

                } else if ( letter === 'comma' ) {
                    charCode = ','.charCodeAt( 0 )

                } else if ( letter === 'singlequote' ) {
                    charCode = "'".charCodeAt( 0 )

                } else if ( letter === 'doublequote' ) {
                    charCode = '"'.charCodeAt( 0 )

                } else if ( letter === 'plus' ) {
                    charCode = '+'.charCodeAt( 0 )

                } else if ( letter === 'multiply' ) {
                    charCode = '*'.charCodeAt( 0 )

                } else if ( letter === 'dollar' ) {
                    letter = '$'.charCodeAt( 0 )
                }
            }

            if ( keyCode === 0 && charCode === 0 ) {
                fail( "unknown letter given '" + letter + "'" )
            }
        }

        return {
                /*
                 * This is for when there are multiple inner tests; the
                 * other properties should all be ignored when this is not
                 * null.
                 */
                tests           : tests     ,

                modifierBitmask : testState ,
                letter          : letter    ,
                charCode        : charCode  ,
                keyCode         : keyCode
        };
    }



/* -------------------------------------------------------------------------------

### addKeyEventOne

This is for setting the keydown / keypress / keyup key events to a DOM node.
That includes doing all the calculations to work out what it is we are pressing
and how.

It can take 'data' as in a function to call, or an object describing the key
to call.

@example
    bb.on( dom, 'keypress', someFun )
    // one function for keypress enter, another for escape
    bb.on( dom, 'keypress', { enter: startFun }, { esc: cancelFun } )

It can also take an array of values which in turn is just the previous two.

@example
    // sets two functions to the keypress
    bb.on( dom, 'keypress', [ someFun, anotherFun ] );
    // one function for keypress enter, another for escape
    bb.on( dom, 'keypress', [{ enter: startFun }, { esc: cancelFun }] );

The event name can also take keys within that. For example:

@example
    bb.on( dom, 'keypress enter', startFun )
    bb.on( dom, 'keypress esc'  , endFun   )

------------------------------------------------------------------------------- */

    var addKeyEventOne = function(dom, data, useCapture, bb, eventName, key) {
        // standard key stuff, so just add it
        if ( isFunction(data) ) {
            if ( key === '' ) {
                dom.addEventListener( eventName, data );
            } else {
                addCleverKeyEventOne( dom, key, '', data, useCapture, bb, eventName );
            }

        } else if ( isArray(data) ) {
            for ( var i = 0; i < data.length; i++ ) {
                addKeyEventOne( dom, data[i], useCapture, bb, eventName, key );
            }

        } else if ( isObjectLiteral(data) ) {
            for ( var keyAlt in data ) {
                if ( data.hasOwnProperty(keyAlt) ) {
                    addCleverKeyEventOne( dom, key, keyAlt, data[keyAlt], useCapture, bb, eventName);
                }
            }

        } else {
            fail( "unknown data given for '" + eventName + "'" );
        }
    };



/* -------------------------------------------------------------------------------

@param k:string A string describing the key to press.

------------------------------------------------------------------------------- */

    var addCleverKeyEventOne = function(dom, k, keyAlt, val, useCapture, bb, eventName) {
        if ( k === '' ) {
            if ( keyAlt === '' ) {
                k = 'any';
            } else {
                k = keyAlt;
            }
        } else {
            if ( keyAlt !== '' ) {
                k += ',' + keyAlt;
            }
        }

        if ( isObjectLiteral(val) ) {
            var kParts;
            if ( k.indexOf(',') !== -1 ) {
                kParts = k.split( ',' );
            } else {
                kParts = null;
            }

            for ( var l in val ) {
                if ( val.hasOwnProperty(l) ) {
                    var valVal = val[l];
                    var k2;

                    if ( l.indexOf(',') !== -1 ) {
                        lParts = l.split(',');

                        if ( kParts !== null ) {
                            var k2Parts = new Array( lParts.length * kParts.length );
                            var k2Inc = 0;

                            for ( var i = 0; i < kParts.length; k++ ) {
                                var k2Temp = kParts[i] + ' ';

                                for ( var j = 0; j < lParts.length; j++ ) {
                                    k2Parts[ k2Inc++ ] = k2Temp + lParts[j];
                                }
                            }

                            k2 = k2Parts.join( ',' );
                        } else {
                            for ( var i = 0; i < lParts.length; i++ ) {
                                lParts[i] = k + ' ' + lParts[i];
                            }

                            k2 = lParts.join( ',' );
                        }
                    } else if ( kParts !== null ) {
                        var k2Parts = new Array( kParts.length );
                        for ( var i = 0; i < kParts.length; i++ ) {
                            k2Parts[i] = kParts[i] + ' ' + l;
                        }

                        k2 = k2Parts.join( ',' );
                    } else {
                        k2 = k + ' ' + l;
                    }

                    if ( isFunction(valVal) || isArray(valVal) || isObjectLiteral(valVal) ) {
                        addCleverKeyEventOne( dom, k2, valVal, useCapture, bb, eventName );
                    } else {
                        fail( "unknown callback given for '" + eventName + "', at '" + k2 + "'" );
                    }
                }
            }

        } else if ( isArray(val) ) {
            for ( var i = 0; i < val.length; i++ ) {
                addCleverKeyEventOne( dom, k, val[i], useCapture, bb, eventName );
            }

        } else if ( isFunction(val) ) {
            var test = newKeyTest( k );
            var testFun = function(ev) {
                if ( testKeyboardEvent(ev, test) ) {
                    return val.call( this, ev );
                }
            }

            bb.onInternal( dom, eventName, val, testFun, useCapture );

        // failure
        } else {
            var eventDescription = "'" + eventName + " " + k + "'" ;

            if ( val === undefined ) {
                fail( "Undefined function given for " + eventDescription );
            } else if ( val === null ) {
                fail( "Null function given for " + eventDescription );
            } else {
                fail( "non-function given for " + eventDescription );
            }
        }
    };



/* -------------------------------------------------------------------------------

### testKeyboardEvent ev:KeyboardEvent keyTest

For building the test to see if the keyboard key given is the key we are after
or not.

------------------------------------------------------------------------------- */

    var testKeyboardEvent = function( ev, keyTest ) {
        if ( keyTest.tests !== null ) {
            var tests = keyTest.tests;

            for ( var i = 0; i < tests.length; i++ ) {
                if ( testKeyboardEvent(ev, tests[i]) ) {
                    return true;
                }
            }
        } else {
            var t = keyTest.modifierBitmask;

            /*
             * Test the modifier keys, either ...
             *
             *  * the bit mask is set to 'any',
             *  * or the ev modifier is false and the bit in test state is 0
             *  * or the ev modifier is true and the bit in test state is 1
             */
            if (
                    // the bitmask is set to any
                    t === ANY || (
                            (!!ev.shiftDown || !!ev.shiftKey) === ((t & SHIFT) === 1) &&
                            (!!ev.ctrlDown  || !!ev.ctrlKey ) === ((t & CTRL ) === 1) &&
                            (!!ev.altDown   || !!ev.altKey  ) === ((t & ALT  ) === 1) &&
                            (!!ev.metaDown  || !!ev.metaKey ) === ((t & META ) === 1)
                    )
            ) {

                /*
                 * Now test the actual key.
                 *
                 * These tests are ...
                 *  - there is a charCode, and it matches test
                 *  - there is a keyCode, and it matches test
                 *  - there is a named key, and it matches test
                 *  - there is a char, and it matches test
                 */
                if (
                    ( ev.charCode !== 0 && ev.charCode === keyTest.charCode ) ||
                    ( ev.keyCode  !== 0 && ev.keyCode  === keyTest.keyCode  )
                ) {
                    return true;

                } else if ( keyTest.letter !== undefined ) {
                    var evKey = ev.key || ev.keyIdentifier

                    if ( isString(evKey) && evKey.toLowerCase() === keyTest.letter ) {
                      return true
                    }

                    var c = ev.char
                    if ( isString(c) && c.toLowerCase() === keyTest.letter ) {
                      return true
                    }

                    return false
                }
            }
        }

        return false;
    }


/* ===============================================================================

newBB
-----

Factory method for creating the bb module it's self. It's here for:

 - emphasize what bb actually declares as public (everything in here).
 - allow creating copies of bb through bb.clone().
 - if cloned, it avoids re-creating the helper methods used within (as they are
   defined above this, outside).

=============================================================================== */

    var newBB = function() {

/* -------------------------------------------------------------------------------

## bb()

Runs 'createArray' with the values given, and then returns the result. This is
shorthand for creating new DOM elements.

bb also has a tonne of methods added on top, like jQuery, it is both a library
and a function.

------------------------------------------------------------------------------- */

        var bb = function() {
            if ( this instanceof bb ) {
                return newBB( arguments );
            } else if ( arguments.length === 1 ) {
                return bb.createArray( arguments[0], null, 0 );
            } else {
                return bb.createArray( arguments[0], arguments, 1 );
            }
        }

        bb.__initFuns = []



/* -------------------------------------------------------------------------------

## bb.setup

Deals with the global setup of bb. For example adding more default elements, or
adding new custom events which you can use on DOM elements.

------------------------------------------------------------------------------- */

        bb.setup = {
                data: {
                        classPrefix: '',

                        /**
                         * These contain alternative names for custom elements.
                         * At the time of writing, it's just shorthand for input
                         * types. So a name with 'checkbox' returns an input box
                         * of type 'checkbox'.
                         */
                        elements: HTML_ELEMENTS,

                        /**
                         * Holds mappings of event names, to the functions that
                         * define them.
                         */
                        events  : HTML_EVENTS
                },

                /**
                 * Allows you to get or set a prefix,
                 * which is appended before all class names,
                 * when a class is set to this.
                 *
                 *      classPrefix() -> String
                 *      classPrefix( prefix ) -> this
                 */

                 /*
                  * It was built for CSS namespacing, but I don't know if this
                  * is ever used?
                  *
                  * Maybe in BBGun???
                  */
                classPrefix: function( prefix ) {
                    if ( arguments.length === 0 ) {
                        return this.data.prefix;
                    } else {
                        this.data.prefix = prefix;
                        return this;
                    }
                },

                getEvent: function( name ) {
                    var ev = this.data.events[ name ];

                    if (
                            ev !== undefined &&
                            ev !== null
                    ) {
                        return ev;
                    } else {
                        return null;
                    }
                },

                /**
                 *
                 */
                getElement: function( name ) {
                    var ev = this.data.elements[ name ];

                    if (
                            ev !== undefined &&
                            ev !== null
                    ) {
                        return ev;
                    } else {
                        return null;
                    }
                },

                /**
                 * Registers event building functions.
                 *
                 * This allows you to over-write existing event defining,
                 * or add entirely new ones.
                 *
                 * For example, you could over-write 'click' for touch devices,
                 * or add new events such as 'taponce'.
                 *
                 * Events should use the event callback signature which is
                 * documented at the top of this file.
                 */
                event: newRegisterMethod(
                    function(self, k, fun) { self.event(k, fun) },
                    function(self, k, fun) { self.eventOne(k, fun) }
                ),

                eventOne: function( name, fun ) {
                    this.data.events[ name ] = newBBFunctionData( fun, this.data.events[name] );
                },

                normalizeEventName: function( name ) {
                    return name.
                            toLowerCase().
                            replace( /^(webkit|moz|ms)/, '' );
                },

                isEvent: function( name ) {
                    var ev = this.data.events[ name ];

                    return ev !== undefined &&
                           ev !== null
                },

                isElement: function( name ) {
                    var ev = this.data.elements[ name ];

                    return ev !== undefined &&
                           ev !== null
                },

                /**
                 * Allows registering new types of elements.
                 *
                 * When you build an 'a', you get an anchor.
                 * When you create a 'div', you get a div.
                 *
                 * This allows you to add to this list.
                 * For example 'button' is added, to return
                 * an <input type="button">.
                 *
                 * You can use this to create generic components,
                 * such as 'video', 'menu', and other components.
                 *
                 * @param name The name for the component.
                 * @param fun A function callback which creates, and returns, the element.
                 */
                element: newRegisterMethod(
                    function(self, k, fun) { self.element(k, fun) },
                    function(self, k, fun) { self.elementOne(k, fun) }
                ),

                elementOne: function( name, fun ) {
                    this.data.elements[ name ] = newBBFunctionData( fun, this.data.elements[name] );
                }
        }

        bb.setup.
                /**
                 * Anchors will start with a '#' as their href.
                 */
                element( 'a', function() {
                    var anchor = document.createElement('a');
                    anchor.setAttribute( 'href', '#' );
                    return anchor;
                } )



/* -------------------------------------------------------------------------------

## bb.clone()

Clones the entire bb module, giving you a fresh copy. This is useful because it
will not have any of the setup changes you have made within bb.

------------------------------------------------------------------------------- */

        bb.clone = function() {
            return newBB();
        }



/* -------------------------------------------------------------------------------

## bb.on

Sets events to be run on this element.

These events include:

 * custom events
 * HTML Events

### Examples

```
    bb.on( dom, "click"                        , fun, true   )
    bb.on( dom, "click"                        , fun         )
    bb.on( dom, ["mouseup", "mousedown"]       , fun, false  )
    bb.on( dom, ["mouseup", "mousedown"]       , fun         )
    bb.on( dom, { click: fun, mousedown: fun } , true        )
    bb.on( dom, { click: fun, mousedown: fun }               )
    bb.on( dom, 'mouseup, click'                , mouseChange )
    bb.on( dom, { 'mouseup, click': fun }                     )

------------------------------------------------------------------------------- */

        bb.on = function( dom, name, fun, useCapture ) {
            assert(
                    dom === window ||
                    (dom instanceof HTMLElement ) ||
                    (dom instanceof NodeList    ) ||
                    (dom instanceof Array       ) ||
                    (dom instanceof HTMLDocument),

                    "HTML Element expected in bb.on."
            )

            var argsLen = arguments.length

            if ( argsLen === 4 ) {
                setOnOff( bb, setOnInner, bb.setup.data.events, dom, name, fun, !! useCapture )

            } else if ( argsLen === 3 ) {
                if ( fun === true ) {
                    setOnOffObject( bb, setOnInner, bb.setup.data.events, dom, name, true )
                } else if ( fun === false ) {
                    setOnOffObject( bb, setOnInner, bb.setup.data.events, dom, name, false )
                } else {
                    setOnOff( bb, setOnInner, bb.setup.data.events, dom, name, fun, false )
                }

            } else if ( argsLen === 2 ) {
                setOnOffObject( bb, setOnInner, bb.setup.data.events, dom, name, false )

            } else {
                fail( "unknown parameters given", arguments )
            }

            return dom;
        }



/* -------------------------------------------------------------------------------

## bb.removeOn

Same as 'on', but removes the events, instead of adding them.

These events include:

 * custom events
 * HTML Events

### Examples

```
    bb.removeOn( dom, "click"                        , fun, true  )
    bb.removeOn( dom, "click"                        , fun        )
    bb.removeOn( dom, ["mouseup", "mousedown"]       , fun, false )
    bb.removeOn( dom, ["mouseup", "mousedown"]       , fun        )
    bb.removeOn( dom, { click: fun, mousedown: fun } , true       )
    bb.removeOn( dom, { click: fun, mousedown: fun }              )
    bb.removeOn( dom, 'mouseup click'                , mouseChange)
    bb.removeOn( dom, { 'mouseup click': fun }                    )

------------------------------------------------------------------------------- */

        bb.removeOn = function( dom, name, fun, useCapture ) {
            assert(
                    dom === window ||
                    (dom instanceof HTMLElement ) ||
                    (dom instanceof NodeList    ) ||
                    (dom instanceof Array       ) ||
                    (dom instanceof HTMLDocument),

                    "HTML Element expected in bb.on."
            )

            var argsLen = arguments.length

            if ( argsLen === 4 ) {
                setOnOff( bb, setOffInner, bb.setup.data.events, dom, name, fun, !! useCapture )

            } else if ( argsLen === 3 ) {
                if ( fun === true ) {
                    setOnOffObject( bb, setOffInner, bb.setup.data.events, dom, name, true )
                } else if ( fun === false ) {
                    setOnOffObject( bb, setOffInner, bb.setup.data.events, dom, name, false )
                } else {
                    setOnOff( bb, setOffInner, bb.setup.data.events, dom, name, fun, false )
                }

            } else if ( argsLen === 2 ) {
                setOnOffObject( bb, setOffInner, bb.setup.data.events, dom, name, false )

            } else {
                fail( "unknown parameters given", arguments )
            }

            return dom;
        }



/* -------------------------------------------------------------------------------

### bb.onInternal

This does 2 things:

 * Sets the event given to the dom, as an event to be run. This *actually*
   happens inside here.
 * Builds a mapping between the original callback, and the one actually set.
   This is so it can be unregistered later using onRemoveInternal.

------------------------------------------------------------------------------- */

        bb.onInternal = function( dom, evName, origFun, evCallback, useCapture ) {
            var funCallback = { orig: origFun, callback: evCallback };
            var map;

            if ( dom.__bb_event_map__ === undefined ) {
                map = {}
                map[ evName ] = [ funCallback ]

                try {
                    OBJECT_DESCRIPTION.value = map
                    Object.defineProperty( dom, '__bb_event_map__', OBJECT_DESCRIPTION )

                } catch ( ex ) {
                    dom[ '__bb_event_map__' ] = val

                }

            } else {
                map = dom.__bb_event_map__;

                var arr = map[evName];
                if ( arr === undefined ) {
                    map[evName] = [ funCallback ];
                } else {
                    arr.push( funCallback );
                }
            }

            if ( isFunction(evCallback) ) {
                dom.addEventListener( evName, evCallback, useCapture );
            } else if ( isArray(evCallback) ) {
                for ( var i = 0; i < evCallback.length; i++ ) {
                    dom.addEventListener( evName, evCallback[i], useCapture );
                }
            } else {
                fail( "unknown callback value given for 'bb.onInternal'" );
            }
        }

        bb.onRemoveInternal = function( dom, evName, origFun, evCallback, useCapture ) {
            if ( dom.__bb_event_map__ !== undefined ) {
                var arr = dom.__bb_event_map__[evName];

                if ( arr !== undefined ) {
                    for ( var i = 0; i < arr.length; i++ ) {
                        var callback = funCallback.callback;

                        if ( callback.orig === origFun ) {
                            if ( isArray(callback) ) {
                                for ( var j = 0; j < callback.length; j++ ) {
                                    dom.removeEventListener(
                                            evName,
                                            callback[j],
                                            useCapture
                                    );
                                }
                            } else if ( isFunction(callback) ) {
                                dom.removeEventListener(
                                        evName,
                                        callback,
                                        useCapture
                                );
                            } else {
                                fail( "unknown callback found in 'bb.onRemoveInternal' from the dom" );
                            }
                        }

                        arr.drop( i );
                        return;
                    }
                }
            }

            // all else fails, do this
            dom.removeEventListener( evName, origFun, useCapture );
        }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

        bb.once = function( dom, name, fun, useCapture ) {
            var funWrap = function() {
                bb.removeOn( dom, name, funWrap, useCapture );
                return fun.apply( this, arguments );
            }

            return bb.on( dom, name, funWrap, useCapture );
        }



/* -------------------------------------------------------------------------------

## bb.create

Used as the standard way to

```
      bb.create( html-element,
              info1,
              info2,
              info3,
              info4 ...
      )

------------------------------------------------------------------------------- */

        bb.create = function() {
            if ( arguments.length === 1 ) {
                return bb.createArray( arguments[0], null, 0 );
            } else {
                return bb.createArray( arguments[0], arguments, 1 );
            }
        }

        bb.createArray = function( obj, args, i ) {
            if ( i === undefined ) {
                i = 0
            }

            var initFuns = InitFuns_create()
            var initDom = createOne( bb, obj, initFuns )
            var dom = applyArray( bb, initDom, args, i, initFuns )
            InitFuns_callAndFree( bb, initFuns )

            return dom
        }



/* -------------------------------------------------------------------------------

## bb.createOne

Just describes the dom, based on the object given,
and nothing more.

This is mostly for internal use, where I *only* want to describe a dom. I don't
want any of the arguments-add-class stuff.

@param obj A JavaScript object literal describing an object to create.
@return A Element based on the object given.

------------------------------------------------------------------------------- */

        bb.createOne = function( obj ) {
            var initFuns = InitFuns_create()
            var dom = createOne( bb, obj, initFuns )
            InitFuns_callAndFree( bb, initFuns )

            return dom
        }

/* -------------------------------------------------------------------------------

## bb.createString

Creates a new element based on a given string.

This is normally used internally, to work out what the given string is for.

------------------------------------------------------------------------------- */

        bb.createString = function( obj ) {
            return createString( bb, obj );
        }

/* -------------------------------------------------------------------------------

## bb.createElement()

Creates just an element, of the given name.

What makes this special is that it also hooks into the provided names, such as
'button' as shorthand the input with type button.

@param domName The name of the component to create.
@return A Element for the name given.

------------------------------------------------------------------------------- */

        bb.createElement = function( domName ) {
            var name;
            if ( arguments.length === 0 ) {
                name = DEFAULT_ELEMENT;
            } else {
                assertString( domName, "non-string provided for name", domName );
                assert( domName !== '', "empty string given for name", domName );

                name = domName.trim();
            }

            var type = '';
            var klass = '';

            if ( name.charAt(0) !== '.' ) {
                var seperatorDot = name.indexOf( '.' );
                var seperatorSpace = name.indexOf( ' ' );

                if ( seperatorDot === -1 ) {
                    if ( seperatorSpace === -1 ) {
                        type = name;
                        klass = '';
                    } else {
                        type = name.substring( 0, seperatorSpace );
                        klass = name.substring( seperatorSpace );
                    }
                } else if (
                        seperatorSpace === -1 ||
                        (seperatorDot < seperatorSpace)
                ) {
                    type = name.substring( 0, seperatorDot );
                    klass = name.substring( seperatorDot );
                } else {
                    type = name.substring( 0, seperatorSpace );
                    klass = name.substring( seperatorSpace );
                }
            } else {
                type === DEFAULT_ELEMENT;
                klass = name;
            }

            var dom;
            var elEv = bb.setup.getElement( type );
            if ( elEv !== null ) {
                if ( elEv.isFunction ) {
                    dom = elEv.fun( type )

                    assert(
                            dom && dom.nodeType !== undefined,
                            "html element event must return a HTML Element",
                            dom
                    )
                } else {
                    dom = document.createElement( type )
                }
            } else {
                return bb.setClass( document.createElement(DEFAULT_ELEMENT), name )
            }

            return ( klass !== '' ) ? bb.setClass( dom, klass ) : dom ;
        }

        bb.hasClass = function( dom, klass ) {
            if ( dom.classList !== undefined ) {
                return dom.classList.contains( klass );

            } else {
                var className = dom.className;

                return klass === className ||
                        className.indexOf(      klass + ' ') === 0 ||
                        className.indexOf(' ' + klass      ) === (className.length - (klass.length + 1)) ||
                        className.indexOf(' ' + klass + ' ') !== -1 ;
            }
        }

        bb.hasClassArray = function( dom, klasses, i ) {
            if ( i === undefined ) {
                i = 0
            }

            var isRemoved = false
            iterateClasses( klasses, i, klasses.length, function(klass) {
                if ( ! isRemoved && dom.classList.contains(klass) ) {
                    isRemoved = true

                    return false
                }
            } )

            return isRemoved
        }

        bb.removeClass = function( dom ) {
            var innerDom = bbGet( dom );

            if ( arguments.length === 1 ) {
                return innerDom;
            } else if ( arguments.length === 2 ) {
                return removeClassOne( innerDom, arguments[1] );
            } else {
                return removeClassArray( innerDom, arguments, 1 );
            }
        }

        bb.removeClassArray = function( dom, klasses, i ) {
            return removeClassArray( bbGet(dom), klasses, i );
        }


/* -------------------------------------------------------------------------------
## bb.toggleClass()

A class can be toggled on or off ...

```
     bb.toggleClass( dom, 'show' );

You can also toggle multiple classes on or off ...

```
     bb.toggleClass( dom, 'foobar', 'bar' );

A function can be provided for

```
     bb.toggleClass( dom, 'show', function( isAdded ) {
         if ( isAdded ) {
             // show was added
         } else {
             // show was removed
         }
     } );

Two funcitons can also be provided, for add or removed.
Note that the 'isAdded' parameter is still supplied, for
uniformity. It is just always true for the added fun, and
false for the removed fun.

```
     bb.toggleClass( dom, 'show',
             function( isAdded ) {
                 // show was added
             },
             function( isAdded ) {
                 // show was removed
             }
     )

You can also toggle using an object mapping which classes are on and off ...

```
    // this will set 'show' as a class
    bb.toggleClass( dom, { 'show': true } );
    // non-object version
    bb.toggleClass( dom, true, 'show' );

This is useful for using conditions to set a class on or off.

```
    bb.toggleClass( dom, { 'show': isShow } );

@param dom The element to add or remove the class from.
@param klass The klass to toggle.
@param onAddition Optional, a function called if the class gets added.
@param onRemoval Optional, a function called if the class gets removed.

------------------------------------------------------------------------------- */

        bb.toggleClass = function( dom ) {
            var argsLen = arguments.length;
            var dom = bbGet( dom );

            if ( argsLen === 1 ) {
                return toggleClassOne( dom, arguments[1] );

            } else {

                //
                // check for the last param being a function,
                //      bb.toggleClass( dom, klasses .... onAddFun)
                //
                // or last two being 2 functions:
                //      bb.toggleClass( dom, klasses .... onAddFun, onRemoveFun)
                //

                var onAdd    = null;
                var onRemove = null;
                var endArgsI = argsLen;

                if ( argsLen > 2 ) {
                    onAdd = arguments[ argsLen-1 ];

                    if ( ! isFunction(onAdd) ) {
                        onAdd = null;
                    } else if ( argsLen > 3 ) {
                        var temp = arguments[argsLen - 2];

                        if ( isFunction(temp) ) {
                            onRemove = onAdd;
                            onAdd = temp;

                            endArgsI -= 2;
                        } else {
                            endArgsI--;
                        }
                    }

                } else {
                    onAdd = null;
                }

                // bb.toggleClass div, isShowBool, "show" ... potentially more classes ...
                if ( isBoolean(arguments[1]) ) {
                    assert( argsLen > 2, "not enough arguments provided" );

                    if (
                            ( argsLen === 3 && onAdd === null                   ) ||
                            ( argsLen === 4 && onAdd !== null && onRemove === null ) ||
                            ( argsLen === 5 && onAdd !== null && onRemove !== null )
                    ) {
                        return toggleClassBoolean( dom,
                                arguments[1], // the boolean flag
                                arguments[2], // the class,
                                onAdd,
                                onRemove
                        );

                    } else {
                        return toggleClassBooleanArray( dom,
                                // the boolean flag
                                arguments[1],

                                // the classes
                                arguments, 2, endArgsI,

                                onAdd,
                                onRemove
                        );

                    }

                // bb.toggleClass div, klass, toggleFlag:boolean, onAdd?, onRemove?
                } else if ( isBoolean(arguments[2]) ) {

                    //
                    // this motherfucker is to check ensures that the parameters went ...
                    //
                    //      div,
                    //      klass,
                    //      boolean,
                    //      maybe onAdd function,
                    //      maybe onRemove function
                    assert(
                            ( argsLen === 3 && onAdd === null                   ) ||
                            ( argsLen === 4 && onAdd !== null && onRemove === null ) ||
                            ( argsLen === 5 && onAdd !== null && onRemove !== null ),

                            "too many parameters provided for toggleClass."
                    );

                    return toggleClassBoolean( dom,
                            arguments[2], // the boolean flag
                            arguments[1], // the class(es) to toggle
                            onAdd,
                            onRemove
                    );

                } else if (
                        ( argsLen === 3 && onAdd    !== null ) ||
                        ( argsLen === 4 && onRemove !== null )
                ) {
                    return toggleClassOne( dom, klass, onAdd, onRemove );

                } else {
                    return toggleClassArray( dom, arguments, 1, endArgsI, onAdd, onRemove );

                }
            }
        }

        bb.toggleClassArray = function( dom, args, startI, onAdd, onRemove ) {
            startI = startI | 0;

            if ( onAdd === undefined ) {
                onAdd = null;
            }
            if ( onRemove === undefined ) {
                onRemove = null;
            }

            return toggleClassArray( dom, args, startI, args.length, onAdd, onRemove );
        }

        bb.addClass = function( dom ) {
            var dom = bbGet( dom );

            if ( arguments.length === 2 ) {
                return addClassOneString( dom, arguments[1] );
            } else {
                return addClassArray( dom, arguments, 1 );
            }
        }

        bb.addClassArray = function( dom, args, i ) {
            assertArray( args );
            var dom = bbGet( dom );

            return addClassArray( dom, args, i );
        }

        bb.addClassOne = function(dom, klass) {
            dom = bbGet(dom);
            assert( dom && dom.nodeType !== undefined, "falsy dom given for bb.addClassOne" );

            return addClassOne( dom, klass );
        }



/* -------------------------------------------------------------------------------

### bb.setClass

This sets and replaces all of the current classes with the ones given. So any
previous classes are gone.

------------------------------------------------------------------------------- */

        bb.setClass = function( dom ) {
            if ( arguments.length === 2 ) {
                setClassOne( dom, arguments[1] );
                return dom;
            } else {
                return bb.setClassArray( dom, arguments, 1 );
            }
        }

        bb.setClassArray = function( dom, args, i ) {
            assertArray( args );

            if ( i === undefined ) {
                i = 0;
            }

            var str = '';
            iterateClasses( args, i, args.length, function(klass) {
                str += ' ' + klass;
            } )

            dom.className = str;

            return dom;
        }

        bb.style = function( dom, k, val ) {
            if ( arguments.length === 2 ) {
                if ( k instanceof Array ) {
                    for ( var i = 0; i < k.length; i++ ) {
                        bb.style( dom, k[i] );
                    }

                } else if ( isObjectLiteral(k) ) {
                    for ( var i in k ) {
                        if ( k.hasOwnProperty(i) ) {
                            bb.style( dom, i, k[i] );
                        }
                    }

                } else {
                  fail( "unknown object given", arguments );
                }

            } else if ( arguments.length === 3 ) {
                if ( isString(k) ) {
                    if ( val instanceof Array ) {
                        dom.style[k] = val.join(' ')
                    } else {
                        dom.style[k] = val;
                    }

                } else if ( k instanceof Array ) {
                    for ( var i = 0; i < k.length; i++ ) {
                        bb.style( dom, k[i], val );
                    }

                } else {
                  fail( "unknown object given", arguments );
                }

            } else {
                fail( "unknown object given", arguments );
            }

            return dom;
        }

        bb.get = bbGet



/* -------------------------------------------------------------------------------

### bb.next dom query skip

Returns the next sibling, after the given dom element, which matches the query
given.

The 'skip' is optional, and states 'how many matching elements to skip', before
returning a match. This allows you to skip say 2 matching panes, or 3 matching
buttons, and so on.

@param dom The dom element used in relation to the search query.
@param match The selector which the sibling must match.
@param skip Optional, the number of matching elements to skip before claiming a match.
@return Null if nothing is found, otherwise the sibling which matches the selector given.

------------------------------------------------------------------------------- */

        bb.next = function( dom, query, skip, wrap ) {
            assertString( query, "non-string given for query" );
            assert( query !== '', "blank query given" );

            if ( arguments.length < 3 ) {
                skip = 0;
            } else {
                assert( skip >= 0, "negative index given for bb.next" );
            }

            var dom = bbGet( dom )
            var next = dom.nextSibling

            do {
                if ( next === null ) {
                    if ( wrap ) {
                        next = dom.parentNode.firstChild;
                        wrap = false;
                    } else {
                        return null;
                    }
                }

                if ( next.matches(query) && skip-- === 0 ) {
                    return next;
                }

                next = next.nextSibling;
            } while ( next !== dom );

            return null;
        }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

        bb.nextWrap = function( dom, query, skip ) {
            if ( arguments.length < 3 ) {
                skip = 0;
            }

            return bb.next( dom, query, skip, true );
        }

/* -------------------------------------------------------------------------------

### bb.previous dom query skip

The same as bb.next, but instead of searching forward, this will search
backwards.

This stops searching when it gets to the start of the element, unless 'wrap' is
set to true.

Otherwise, it is exactly the same.

------------------------------------------------------------------------------- */

        bb.previous = function( dom, query, skip, wrap ) {
            assertString( query, "non-string given for query" );
            assert( query !== '', "blank query given" );

            if ( arguments.length < 3 ) {
                skip = 0;
            } else {
                assert( skip >= 0, "negative index given for bb.previous" );
            }

            var dom = bbGet( dom )
            var next = dom.previousSibling

            do {
                if ( next === null ) {
                    if ( wrap ) {
                        next = dom.parentNode.lastChild;
                        wrap = false;
                    } else {
                        return null;
                    }
                }

                if ( next.matches(query) && skip-- === 0 ) {
                    return next;
                }

                next = next.previousSibling;
            } while ( next !== dom );

            return null;
        }



/* -------------------------------------------------------------------------------

### bb.previousWrap

Just like bb.previous, but this has the wrap parameter on.

------------------------------------------------------------------------------- */

        bb.previousWrap = function( dom, query, skip ) {
            if ( arguments.length < 3 ) {
                skip = 0;
            }

            return bb.previous( dom, query, skip, true );
        }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

        bb.beforeOne = function( dom, node ) {
            var dom = bbGet( dom );
            assertParent( dom );

            return beforeOne( bb, dom.parentNode, dom, node );
        }

        bb.afterOne = function( dom, node ) {
            var dom = bbGet( dom );
            assertParent( dom );

            return afterOne( bb, dom.parentNode, dom, node );
        }

        bb.beforeArray = function( dom, args, i ) {
            if ( i === undefined ) {
                i = 0;
            }

            var dom = bbGet( dom );
            assertParent( dom );
            var parentDom = dom.parentNode;

            for ( ; i < args.length; i++ ) {
                beforeOne( bb, parentDom, dom, args[i] );
            }

            return dom;
        }

        bb.afterArray = function( dom, args, i ) {
            if ( i === undefined ) {
                i = 0;
            }

            var dom = bbGet( dom );
            assertParent( dom );
            var parentDom = dom.parentNode;

            for ( ; i < args.length; i++ ) {
                afterOne( bb, parentDom, dom, node );
            }

            return dom;
        }

        bb.before = function( dom ) {
            return bb.beforeArray( dom, arguments, 1 );
        }

        bb.after = function( dom ) {
            return bb.afterArray( dom, arguments, 1 );
        }

        bb.add = function( dom ) {
            if ( arguments.length === 2 ) {
                return addOne( bb, bbGetOrCreate(dom), arguments[1] );
            } else {
                return bb.addArray( dom, arguments, 1 );
            }
        }

        bb.addArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0;
            }

            return addArray( bb, bbGetOrCreate(dom), args, startI );
        }

        bb.addOne = function( dom, dest ) {
            return addOne( bb,
                    bbGetOrCreate( dom ),
                    dest
            );
        }

/* -------------------------------------------------------------------------------

## bb.html

Sets the HTML content within this element.

------------------------------------------------------------------------------- */

        bb.html = function( dom ) {
            return bb.htmlArray( dom, arguments, 1 )
        }

        bb.htmlOne = function( dom, el ) {
            setHTML( bb, dom, el, false )
        }

        bb.htmlArray = function( dom, htmls, i ) {
            assertArray( htmls, "non-array object was given" );

            if ( i === undefined ) {
                i = 0;
            }

            /*
             * Content is cached, so multiple HTML strings
             * are inserted once.
             */
            var content = ''

            for ( ; i < htmls.length; i++ ) {
                var el = htmls[i]

                if ( isString(el) ) {
                    content += el

                } else {
                    if ( content !== '' ) {
                      dom.insertAdjacentHTML( 'beforeend', content )
                      content = ''
                    }

                    if ( el instanceof Array ) {
                        bb.htmlArray( dom, el, 0 )

                    } else if ( el.nodeType !== undefined ) {
                        dom.appendChild( el )

                    } else if ( isObjectLiteral(el) ) {
                        dom.appendChild( bb.createOne(el) )
                    }
                }
            }

            if ( content !== '' ) {
                dom.insertAdjacentHTML( 'beforeend', content )
            }

            return dom
        }

/* -------------------------------------------------------------------------------

## bb.text

Sets the text content within this dom, to the text value(s) given.

You can provide a string, multiple strings, or an array of strings, or a mix
of arrays of strings and strings.

For example

```
    // all of these examples do exactly the same,
    // setting "text here" as the text within the dom element
    bb.text( dom, "text here" );
    bb.text( dom, "text", " ", "here" );
    bb.text( dom, ["text", " ", "here"] );
    bb.text( dom, ["text", "here"].join(" ") );
    bb.text( dom, ["text", " "], "here" );

If given a HTMLInputElement, then this will set its value instead of the text
within it.

@param dom The dom element to set the text of.
@return The 'dom' element given, so you can chain function calls.

------------------------------------------------------------------------------- */

        bb.text = function( dom ) {
            return setText( dom, combineStringArray(arguments, 1), false )
        }



/* -------------------------------------------------------------------------------

## bb.textOne

------------------------------------------------------------------------------- */

        bb.textOne = function( dom, text ) {
            return setText( dom, combineStringOne(text), false )
        }



/* -------------------------------------------------------------------------------

## bb.textArray

------------------------------------------------------------------------------- */

        bb.textArray = function( dom, args, startI ) {
            return setText( dom, combineStringArray(args, startI), false )
        }



/* -------------------------------------------------------------------------------

## bb.attr dom

This is the same as calling 'bb' but instead of creating a new DOM element you
provide it as the base. This allows you to use 'bb()' on a pre-existing element.

------------------------------------------------------------------------------- */

        bb.attr = function( dom, obj, val ) {
            var initDom = bbGet( dom )

            var initFuns = InitFuns_create()
            var dom = applyArray( bb, initDom, arguments, 1, initFuns )
            InitFuns_callAndFree( bb, initFuns )

            return dom
        }



/* ===============================================================================

Normalize Transition End Event
------------------------------



=============================================================================== */

        bb.setup.event( 'transitionend', function( el, callback, useCapture, bb, eventName, rest ) {
            var handleTransitionEnd = function( ev ) {
                callback.call( el, ev )
            }

            el.addEventListener( 'webkitTransitionEnd', handleTransitionEnd, useCapture )
            el.addEventListener( 'transitionend'      , handleTransitionEnd, useCapture )
            el.addEventListener( 'msTransitionEnd'    , handleTransitionEnd, useCapture )
            el.addEventListener( 'oTransitionEnd'     , handleTransitionEnd, useCapture )
        })



/* ===============================================================================

Pre-provided Touch Events
-------------------------

Events for click, and hold, under touch interface, is pre-provided.

=============================================================================== */

        // test from Modernizer
        var IS_TOUCH = !! (
            ( 'ontouchstart' in window ) ||
            ( window.DocumentTouch && (document instanceof DocumentTouch) )
        )

        if ( window['touchy'] ) {
            if ( IS_TOUCH && false ) {
                bb.setup.event( 'click', touchy.click )
            }

            bb.setup.event( 'hold', touchy.hold )
        }



        bb.setup.event( 'keypress', addKeyEventOne );
        bb.setup.event( 'keydown' , addKeyEventOne );
        bb.setup.event( 'keyup'   , addKeyEventOne );

        return bb;
    }

    window['bb'] = newBB();


})();
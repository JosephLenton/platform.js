
===============================================================================

# shim.js

This is a collection of shims from around the internet,
and some built by me, which add support for missing JS features.

===============================================================================



===============================================================================

## window

===============================================================================



===============================================================================

### window.requestAnimationFrame

===============================================================================

    if ( ! window['requestAnimationFrame'] ) {
        window['requestAnimationFrame'] =
            window['mozRequestAnimationFrame']      ||
            window['webkitRequestAnimationFrame']   ||
            window['msRequestAnimationFrame']       ||
            function( f ) {
                setTimeout( f, 0 )
            }
    }



===============================================================================

### window.requestIdleCallback

Needed for pretty much everything but Chrome (and maybe FF).

New function for being called when the browser is idle and can process work.
The fallback is just to use animation frame sometime in the future.

We call multiple times to avoid being on the next frame where there may be work
from a legit 'requestAnimationFrame' call.

===============================================================================

    if ( ! window['requestIdleCallback'] ) {
        window['requestIdleCallback'] = function(f) {
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    window.requestAnimationFrame( f )
                })
            })
        }
    }



===============================================================================

## Array

Note that 'map' is missing, because it is dealt with
in the 'extras' file.

===============================================================================

### forEach

Production steps of ECMA-262, Edition 5, 15.4.4.18
Reference: http://es5.github.com/#x15.4.4.18

-------------------------------------------------------------------------------

    if ( ! Array.prototype['forEach'] ) {
        __shim__( Array.prototype,
            'forEach', function( callback, thisArg ) {
                var T, k;

                if ( this == null ) {
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

===============================================================================

## String

===============================================================================

-------------------------------------------------------------------------------

### toArray

@see https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### Element.matches( queryString:string )

Support is in IE 9 and above but with prefixes, and often called 'matchesSelector'.

A new W3C selection tester, for testing if a node matches a selection. Very
new, so it's either browser specific, or needs a shim.

-------------------------------------------------------------------------------

    if ( ! Element.prototype.matches ) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector
    }



-------------------------------------------------------------------------------

### classList.js: Cross-browser full element.classList implementation.

Required for IE 9, and toggle adjustments for IE 10 and 11

2012-11-15

By Eli Grey, http://eligrey.com
Public Domain.

NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

@source http://purl.eligrey.com/github/classList.js/blob/master/classList.js

-------------------------------------------------------------------------------

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


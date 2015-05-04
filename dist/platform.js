"use strict";(function() {

/* Core
====

The absolute core bootstrap, used by everything.

===============================================================================

-------------------------------------------------------------------------------

Object.defineProperty is present for IE 8 and above,
it just doesn't work in IE 8 for non-HTMLElements.

So don't bother emulating it!

-------------------------------------------------------------------------------

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

### window.__shim__ obj:Object name:string val:any

Same as __setProp__, only the item only gets set, *if* it is not already there.
This is for setting shims, hence why it's called 'shim'.

@param obj The object to set the property to.
@param name The name of the property to set.
@param val The item to set at that property, 99% of the time this is a function.

------------------------------------------------------------------------------- */

    window.__shim__ = function( obj, name, val ) {
        if ( ! obj.hasOwnProperty(name) ) {
            __setProp__( obj, name, val );
        }
    }



/* -------------------------------------------------------------------------------

### window.__setProp__ obj:Object name:string val:any

------------------------------------------------------------------------------- */

    window.__setProp__ = function( obj, name, val ) {
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




})();
"use strict";(function() {

/* ===============================================================================

# shim.js

This is a collection of shims from around the internet,
and some built by me, which add support for missing JS features.

=============================================================================== */

    var __shim__ = window.__shim__;

/* ===============================================================================

## Object

=============================================================================== */

    /**
     * Object.create
     *
     * @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
     */
    __shim__( Object,
        'create', function(o) {
            if (arguments.length > 1) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }

            function F() {}
            F.prototype = o;

            return new F();
        }
    );

    __shim__( Date,
        'now', function() {
            return new Date().getTime();
        }
    );

/* ===============================================================================

### Array

Note that 'map' is missing, because it is dealt with
in the 'extras' file.

===============================================================================

### forEach

Production steps of ECMA-262, Edition 5, 15.4.4.18
Reference: http://es5.github.com/#x15.4.4.18
    
------------------------------------------------------------------------------- */

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
    );

/* ===============================================================================

## String

=============================================================================== */

    var leftTrimSpaceRegex = /^\s\s*/;
    var spaceRegex = /\s/;

/* -------------------------------------------------------------------------------

### toArray

@see https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

------------------------------------------------------------------------------- */

    __shim__( String.prototype,
            'toArray', function() {
                return this.valueOf().split( '' );
            }
    );

    __shim__( String.prototype,
            'trim', function(check) {
                if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                    var str = this.valueOf().replace(leftTrimSpaceRegex, '');
                    var i = str.length;

                    while (spaceRegex.test(str.charAt(--i)));

                    return str.slice(0, i + 1);
                } else if ( check.length === 0 ) {
                    return this.valueOf();
                } else {
                    check = check.escapeRegExp();
                    var regex = new RegExp( "(^(" + check + ")(" + check + ")*)|((" + check + ")(" + check + ")*$)", 'i' );

                    return this.valueOf().replace( regex, '' );
                }
            }
    );

    __shim__( String.prototype,
            'trimLeft', function(check) {
                if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                    return this.valueOf().replace( leftTrimSpaceRegex, '' );
                } else if ( check.length === 0 ) {
                    return this.valueOf();
                } else {
                    var check = check.escapeRegExp();

                    return this.valueOf().replace(
                            new RegExp( "^(" + check + ")(" + check + ")*" ),
                            ''
                    );
                }
            }
    );

    __shim__( String.prototype,
            'trimRight', function() {
                var thisVal = this.valueOf();

                if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                    var	i = thisVal.length;
                    while ( spaceRegex.test(thisVal.charAt(--i)) );
                    return thisVal.slice( 0, i + 1 );
                } else if ( check.length === 0 ) {
                    return thisVal;
                } else {
                    var check = check.escapeRegExp();

                    return thisVal.replace(
                            new RegExp( "(" + check + ")(" + check + ")*$" ),
                            ''
                    );
                }
            }
    );

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
    );


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

/* ===============================================================================

## document

===============================================================================

-------------------------------------------------------------------------------

### document.getElementsByClassName( name )

------------------------------------------------------------------------------- */

    if ( document.getElementsByClassName === undefined ) {
        document.getElementsByClassName = function( klass ) {
            return document.querySelectorAll( '.' + klass );
        }
    };

/* ===============================================================================

## textContent shim

=============================================================================== */

    var div = document.createElement('div');
    if ( 
            div.textContent === undefined &&
            div.innerText !== undefined
    ) {
        // handles innerHTML
        var onPropertyChange = function (e) {
            if (event.propertyName === 'innerHTML') {
                var div = (event.currentTarget) ? event.currentTarget : event.srcElement;
                var children = div.childNodes;

                for ( var i = 0; i < children.length; i++ ) {
                    addProps( children[i] );
                }
            }
        }; 

        var textDesc = {
                get: function() {
                    return this.innerText;
                },

                set: function( text ) {
                    this.innerText = text;
                    return text;
                }
        };

        var addProps = function( dom ) {
            // these only work on non-text nodes
            if ( dom.nodeType !== 3 ) {
                Object.defineProperty( dom, 'textContent', textDesc );
                Object.defineProperty( dom, 'insertAdjacentHTML', insertAdjacentHTMLDesc );

                // just in case it's been attached once already
                dom.detachEvent("onpropertychange", onPropertyChange);
                dom.attachEvent("onpropertychange", onPropertyChange);
            }

            return dom;
        }

        /*
         * Wrap insertAdjacentHTML.
         */
        var insertAdjacentHTMLDesc = function(pos, html) {
            div.innerHTML = html;
            var children = div.children;

            var p = this.parentNode;
            var first = undefined;

            if ( pos === "afterend" ) {
                first = children[0];
            } else if ( pos === "afterbegin" ) {
                first = this.firstChild;
            } else if (
                    pos !== 'beforebegin' ||
                    pos !== 'beforeend'
            ) {
                fail("invalid position given " + pos);
            }

            while ( children.length > 0 ) {
                var child = addProps( children[0] );

                if ( pos === "beforebegin" || pos === 'afterend' ) {
                    p.insertBefore( child, this );
                } else if ( pos === "afterbegin" ) {
                    this.insertBefore( child, first );
                } else if ( pos === 'beforeend' ) {
                    this.appendChild( child );
                }
            }

            if ( pos === 'afterend' ) {
                p.removeChild( this );
                p.insertBefore( this, first );
            }
        };

        // wrap createElement
        var oldCreate = document.createElement;
        document.createElement = function( name ) {
            return addProps( oldCreate(name) );
        }

        // add properties to any existing elements 
        var doms = document.querySelectorAll('*');
        for ( var i = 0; i < doms.length; i++ ) {
            addProps( doms[i] );
        }
    }


/* ===============================================================================

## Element

These do *not* use __shim__, as it breaks in IE 8!

===============================================================================

-------------------------------------------------------------------------------

### element.addEventListener

------------------------------------------------------------------------------- */

    if ( ! Element.prototype.addEventListener ) {
        Element.prototype.addEventListener = function( name, listener ) {
            return this.attachEvent( name, listener );
        }
    }



/* -------------------------------------------------------------------------------

### element.removeEventListener

------------------------------------------------------------------------------- */

    if ( ! Element.prototype.removeEventListener ) {
        Element.prototype.removeEventListener = function( name, listener ) {
            return this.detachEvent( name, listener );
        }
    }



/* -------------------------------------------------------------------------------

### element.matchesSelector()

A new W3C selection tester, for testing if a node matches a selection. Very 
new, so it's either browser specific, or needs a shim.

@author termi https://gist.github.com/termi
@see https://gist.github.com/termi/2369850/f4022295bf19332ff17e79350ec06c5114d7fbc9

------------------------------------------------------------------------------- */

    if ( ! Element.prototype.matchesSelector ) {
        Element.prototype.matchesSelector =
                Element.prototype.matches ||
                Element.prototype.webkitMatchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector || 
                function(selector) {
                    if(!selector)return false;
                    if(selector === "*")return true;
                    if(this === document.documentElement && selector === ":root")return true;
                    if(this === document.body && selector === "body")return true;

                    var thisObj = this,
                        match = false,
                        parent,
                        i,
                        str,
                        tmp;

                    if (/^[\w#\.][\w-]*$/.test(selector) || /^(\.[\w-]*)+$/.test(selector)) {
                        switch (selector.charAt(0)) {
                            case '#':
                                return thisObj.id === selector.slice(1);
                                break;
                            case '.':
                                match = true;
                                i = -1;
                                tmp = selector.slice(1).split(".");
                                str = " " + thisObj.className + " ";
                                while(tmp[++i] && match) {
                                    match = !!~str.indexOf(" " + tmp[i] + " ");
                                }
                                return match;
                                break;
                            default:
                                return thisObj.tagName && thisObj.tagName.toUpperCase() === selector.toUpperCase();
                        }
                    }

                    parent = thisObj.parentNode;
                  
                    if (parent && parent.querySelector) {
                        match = parent.querySelector(selector) === thisObj;
                    }

                    if (!match && (parent = thisObj.ownerDocument)) {
                        tmp = parent.querySelectorAll( selector );

                        for (i in tmp ) if(_hasOwnProperty(tmp, i)) {
                            match = tmp[i] === thisObj;
                            if(match)return true;
                        }
                    }

                    return match;
                }
    };

/* -------------------------------------------------------------------------------

### element.matches

------------------------------------------------------------------------------- */

    if ( ! Element.prototype.matches ) {
        Element.prototype.matches = Element.prototype.matchesSelector
    };

/* -------------------------------------------------------------------------------

### classList.js: Cross-browser full element.classList implementation.

2012-11-15

By Eli Grey, http://eligrey.com
Public Domain.

NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

@source http://purl.eligrey.com/github/classList.js/blob/master/classList.js

------------------------------------------------------------------------------- */
  
    if (typeof document !== "undefined" && !("classList" in document.createElement("a"))) {
        (function (view) {
            "use strict";
             
            if ( !('HTMLElement' in view) && !('Element' in view) ) {
                return;
            }
             
            var
                  classListProp = "classList"
                , protoProp = "prototype"
                , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
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
                          trimmedClasses = strTrim.call(elem.className)
                        , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
                        , i = 0
                        , len = classes.length
                    ;
                    for (; i < len; i++) {
                        this.push(classes[i]);
                    }
                    this._updateClassName = function () {
                        elem.className = this.toString();
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
                ;
                do {
                    token = tokens[i] + "";
                    var index = checkTokenAndGetIndex(this, token);
                    if (index !== -1) {
                        this.splice(index, 1);
                        updated = true;
                    }
                }
                while (++i < l);
             
                if (updated) {
                    this._updateClassName();
                }
            };

            classListProto.toggle = function (token, forse) {
                token += "";
             
                var
                      result = this.contains(token)
                    , method = result ?
                        forse !== true && "remove"
                    :
                        forse !== false && "add"
                ;
             
                if (method) {
                    this[method](token);
                }
             
                return result;
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
    }

})();
"use strict";(function() {

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

    var isObjectLiteral = window.isObjectLiteral = function( obj ) {
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

    var isFunction = window.isFunction = function( f ) {
        return ( typeof f === 'function' ) || ( f instanceof Function );
    }



/* -------------------------------------------------------------------------------

## isNumber

@param n The value to test.
@return True if 'n' is a primitive number, or a Number object.

------------------------------------------------------------------------------- */

    var isNumber = window.isNumber = function( n ) {
        return ( typeof n === 'number' ) || ( n instanceof Number );
    }



/* -------------------------------------------------------------------------------

## isNumeric

Returns true if the value is like a number.
This is either an actual number, or a string which represents one.

@param str The string to test.
@return True, if given a number, or if it looks like a number, otherwise false.

------------------------------------------------------------------------------- */

    var isNumeric = window.isNumeric = function( str ) {
        return ( typeof str === 'number' ) ||
               ( str instanceof Number   ) ||
               ( String(str).search( /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/ ) !== -1 )
    }



/* -------------------------------------------------------------------------------

## isString

@param str The value to test.
@return True if the given value, is a string primitive or a String object.

------------------------------------------------------------------------------- */

    var isString = window.isString = function( str ) {
        return ( typeof str === 'string' ) || ( str instanceof String );
    }



/* -------------------------------------------------------------------------------

## isBoolean

@param bool The boolean value to test.
@return True if the value is true or false, otherwise false.

------------------------------------------------------------------------------- */

    var isBoolean = window.isBoolean = function( bool ) {
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

    var isLiteral = window.isLiteral = function(obj) {
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

    var isHTMLElement = window.isHTMLElement = function(obj) {
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

    var isArrayArguments = window.isArrayArguments = function( arr ) {
        return isArray(arr) || isArguments(arr);
    }



/* -------------------------------------------------------------------------------

## isArray

This does not include testring for 'arguments'; they will fail this test. To
include them, use 'isArrayArguments'.

@param arr The value to test.
@return True, if the object given is an array object.

------------------------------------------------------------------------------- */

    var isArray = window.isArray = Array.isArray ?
            Array.isArray :
            function( arr ) {
                return ( arr instanceof Array );
            } ;



/* -------------------------------------------------------------------------------

## isArguments

@return True if the object given is an arguments object, otherwise false.

------------------------------------------------------------------------------- */

    var isArguments = window.isArguments = function( args ) {
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

            if ( window.IS_HTA ) {
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
    
    // equivalent to ...
    
    console.log( a );
    console.log( b );
    console.log( c );
    throw new Error( "some-error" );

This allows you to have console.log +
throw new Error, built together, as one.

@param msg Optional The message to display in the error.

------------------------------------------------------------------------------- */

    var fail = window["fail"] = function( msg ) {
        throw new AssertionError( msg || "Failure is reported.", 'Fail()', arguments, 1 );
    }



/* -------------------------------------------------------------------------------

## assert

Note that 0 and empty strings will not cause failure.

@param test
@param msg Optional

------------------------------------------------------------------------------- */

    var assert = window["assert"] = function( test, msg ) {
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

    var assertNot = window["assertNot"] = function( test, msg ) {
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

    var assertUnreachable = window["assertUnreachable"] = function( msg ) {
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

    var assertObjectLiteral = window["assertObjectLiteral"] = function( obj, msg ) {
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

    var assertLiteral = window["assertLiteral"] = function( obj, msg ) {
        if ( ! isLiteral(obj) ) {
            throw new AssertionError( msg || "Primitive value expected.", obj, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertFunction

@param fun A function object to test.
@param msg Optional The message to display if the test fails.

------------------------------------------------------------------------------- */

    var assertFunction = window["assertFunction"] = function( fun, msg ) {
        if ( typeof fun !== 'function' && !(fun instanceof Function) ) {
            throw new AssertionError( msg || "Function expected.", fun, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertBoolean

@param bool The boolean value to test.
@param msg Optional The error message on failure.

------------------------------------------------------------------------------- */

    var assertBoolean = window["assertBoolean"] = function( bool, msg ) {
        if ( bool !== true && bool !== false ) {
            throw new AssertionError( msg || "Boolean expected.", bool, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertArray

@param arr The array to test.
@param msg Optional The error message.

------------------------------------------------------------------------------- */

    var assertArray = window["assertArray"] = function( arr, msg ) {
        if ( ! isArray(arr) && (arr.length === undefined) ) {
            throw new AssertionError( msg || "Array expected.", arr, arguments, 2 );
        }
    }



/* -------------------------------------------------------------------------------

## assertString

@param str The string to test against.
@param msg Optional The error message to show.

------------------------------------------------------------------------------- */

    var assertString = window["assertString"] = function( str, msg ) {
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

    var assertNumber = window["assertNumber"] = function( num, msg ) {
        if ( typeof n !== 'number' && !(n instanceof Number) ) {
            throw new AssertionError( msg || "Number expected.", num, arguments, 2 );
        }
    }




})();
"use strict";(function() {

/* ===============================================================================

abc.js
======

@author Joseph Lenton

A debugging library based on Letters
for Ruby, http://lettersrb.com

Adds methods to the Object prototype,
for quick debugging at runtime.

 * a is for assertion
 * b is for block
 * c is for call method
 * d is for debug
 * e if for asserts if this is empty
 * f is for print field

 * k is for printing keys

 * l is for log console

 * m is for mark object
 * n is for no mark (unmark object)

 * p is for print

 * s is for stack trace
 * t is for timestamp
 * u is for user alert

 * v is for printing values

### Marking

Some functions allow you to mark / unmark,
or filter based on mark.

By 'mark' it means setting an identifier to
that object. Why? Sometimes in large systems,
you have lots of objects floating around,
and being pushed through single functions.

Marking is a way for you to mark objects in
the data set before a function call, and then
easily see if they turn up later in other parts
of your program.

'true' represents 'all marks', and is used

when you ask to mark, but don't specify it.

=============================================================================== */

    var __shim__ = window.__shim__;

/* -------------------------------------------------------------------------------

## Assertion

@example

    foo.a()
        // asserts 'this'

@example

    foo.a( function(f) { return f < 10 } )
        // throws assertion if f is not less than 10

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'a', function( block, msg ) {
            if ( arguments.length === 1 ) {
                if (
                        !(typeof block === 'function') &&
                        !(block instanceof Function)
                ) {
                    msg = block;
                    block = undefined;
                }
            } else if ( arguments.length >= 2 ) {
                /*
                 * If ...
                 *  - block is not a function, and,
                 *  - msg is a function,
                 *  - then swap them!
                 */
                if (
                        (
                                !(typeof block === 'function') &&
                                !(block instanceof Function)
                        ) &&
                        (
                                (typeof   msg === 'function') && 
                                (  msg instanceof Function)
                        )
                ) {
                    msg = block;
                    block = undefined;
                }
            }

            var asserted = ( block !== undefined ) ?
                    !! block.call( this, this ) :
                    !! this                     ;

            if ( ! asserted ) {
                if ( msg ) {
                    throw new Error( msg );
                } else {
                    throw new Error( "assertion error!" )
                }
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Block

Function is in the form:

```
    f( obj, mark )

If no mark has been placed,
then mark will be undefined.

The return value is ignored.

@example 1,

     foo.
         b( function(obj) {
             if ( obj ) {
                 console.log( obj );
             }
         } ).
         doWork();

@example 2,

     bar.m( 'work-object' );
    
     // some time later
    
     foo.
         b( function(obj, mark) {
             if ( mark === 'work-object' ) {
                 console.log( obj );
             }
         } ).
         doWork();

@param cmd A block to pass this object into.
@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'b', function( cmd ) {
            cmd.call( this, this, this.____mark____ );

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Call

Calls the command given, on this object.

@param method The method required to be called.
@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'c', function( method ) {
            var args = new Array( arguments.length-1 );
            for ( var i = 1; i < arguments.length; i++ ) {
                args[i-1] = arguments[i];
            }

            this[method].apply( this, args );

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Debug

Starts the debugger, if available.

To select any object that is marked,
just pass in true.

@param mark Optional, debugger is only used if this has the same mark given.
@return This.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'd', function( mark ) {
            if ( arguments.length === 0 ) {
                debugger;
            } else if ( mark === true || this.___mark___ === mark ) {
                debugger;
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Assert

Asserts this is empty.

@return This.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'e', function() {
            var isInvalid = false;

            if ( this.length !== undefined ) {
                if ( this.length > 0 ) {
                    isInvalid = true;
                }
            } else {
                for ( var k in this ) {
                    if ( this.hasOwnProperty(k) ) {
                        isInvalid = true;
                        break;
                    }
                }
            }

            if ( isInvalid ) {
                throw new Error("this object is not empty");
            }
                
            return this;
        }
    );



    __shim__( Object.prototype,
        'f', function( field ) {
            console.log( this[field] );

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Keys

Provides all of the keys for this object.
This only includes keys which are on this
objects property; it ignores prototypal
properties.

If a block is provided, then the keys will
passed into that on each iteration instead
of being outputted to the console.

@param block Optional, a block for iterating across all keys.
@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'k', function( block ) {
            for ( var k in this ) {
                if ( this.hasOwnProperty(k) ) {
                    if ( block ) {
                        block.call( this, k );
                    } else {
                        console.log( k );
                    }
                }
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Log

Prints a message via console.log.
If a msg is provided, it is printed,
and otherwise this object is printed.

@param Optional, a message to send to the console instead.
@return This.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'l', function( msg ) {
            console.log( msg || this );

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Mark

Marking is here to help tracking objects, through a busy system.
They are used to help distinguish objects later, without having to setup global
variables.

Other methods also take a mark, to allow filtering, so you can apply a method
to lots of objects, and only those marked will actually carry out the action.

### marking with a value

The parameter given is the value to use
when marking.

This allows you to mark different objects,
with different values, so they can be
identified in different ways.

### marking via block

If called with a block,
the object is passed into that block.

If the block returns a non-falsy object,
the object is then marked.

If called with no block,
it is marked for certain.

This is to allow marking specific objects 
in a large system, and then allow you to
retrieve them again later.

@param block An optional filter for marking objects, or the value to mark them with.
@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'm', function( block ) {
            if ( block !== undefined ) {
                if ( typeof block === 'function' || (block instanceof Function) ) {
                    var mark = block.call( this, this );

                    if ( mark ) {
                        this.____mark____ = mark;
                    } else {
                        delete this.____mark____;
                    }
                } else {
                    this.___mark___ = block || true;
                }
            } else {
                this.____mark____ = true;
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## No Mark

If this has a mark, then it is unmarked.
The given block, like with mark,
allows you to filter unmarking objects.

@param block An optional filter to use for unmarking.
@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'n', function( block ) {
            if ( this.____mark____ !== undefined ) {
                if ( block !== undefined ) {
                    if ( block.call(this, this, this.____mark____) ) {
                        delete this.____mark____;
                    }
                } else {
                    delete this.____mark____;
                }
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Print

Prints this object to `console.log`.

@param msg Optional, a message to print before the item.
@return This.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'p', function( msg ) {
            if ( arguments.length === 0 ) {
                console.log( this );
            } else {
                console.log( msg, this );
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Stack trace.

Prints a stack trace to the console.

@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        's', function() {
            var err = new Error();

            if ( err.stack ) {
                console.log( err.stack );
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Timestamp

A timestamp is dumped to the console.

@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        't', function() {
            console.log( Date.now() );

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## User Alert

Shows an alert to the user.

@param msg Optional, a message to display, defaults to this object.
@return This.
   
------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'u', function( msg ) {
            if ( arguments.length > 0 ) {
                alert( msg );
            } else {
                alert( this );
            }

            return this;
        }
    );



/* -------------------------------------------------------------------------------

## Values

This will iterate over all of the key => value pairs
in this object. That is regardless of if this is
an Array, Object, or something else.

By default, they are printed.

If a block is provided, they are passed to the block
in turn.

@example

     foo.v( function(k, val) { ... } )

@param block An optional block for iterating over the key-value pairs.
@return This object.

------------------------------------------------------------------------------- */

    __shim__( Object.prototype,
        'v', function( block ) {
            for ( var k in this ) {
                if ( this.hasOwnProperty(k) ) {
                    if ( block ) {
                        block.call( this, k, this[k] );
                    } else {
                        console.log( k, this[k] );
                    }
                }
            }

            return this;
        }
    );


})();
"use strict";(function() {


/* extras
======

This is a page of extras, added onto the core datatypes, allowing you to do
more with them.

This includes extra array methods, methods on the object to allow it to be used in a
more array-like fashion.


 */

    var __setProp__ = window.__setProp__;



/* ===============================================================================

## Object

===============================================================================

-------------------------------------------------------------------------------

### Object.clone

------------------------------------------------------------------------------- */

    __setProp__( Object,
        'clone', function( obj ) {
            if (obj) {
                if (obj instanceof Array) {
                    return obj.splice(0);
                } else {
                    var type = typeof obj;

                    if ( type === 'number' || type === 'string' ) {
                        return obj;
                    } else {
                        var copy = Object.create( obj.constructor.prototype );
                        var keys = Object.keys( obj );
                        var keysLen = keys.length;

                        // copy all attributes across,
                        // but skip prototype items
                        for ( var i = 0; i < keysLen; i++ ) {
                            var k = keys[i];

                            copy[k] = obj[k];
                        }

                        return copy;
                    }
                }
            } else {
                return obj;
            }
        }
    );



/* -------------------------------------------------------------------------------

### invoke

Takes the name of a function to call, or a function to apply to this object.

This is intended for you to be able to give the name of a function, and invoke
it.

```
    obj.invoke( 'doWork' );

You may also send a function object as an alternative, which will be called 
with the object as it's this context.

```
    obj.invoke( function() { } );

Note that if the function is already bound to another value, then this will not
override it. Function binding will take priority.

@param method The name of the method to invoke, or a function object.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
        'invoke', function( method ) {
            return this.invokeArray( method, arguments, 1 );
        }
    );

/* -------------------------------------------------------------------------------

### invokeArray

The same as invoke, only this will take an array of parameters instead.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
        'invokeArray', function( method, args, startIndex ) {
            if ( startIndex === undefined ) {
                startIndex = 0;
            }

            var funArgs;
            var argsLen;

            if ( args === undefined || args === null ) {
                argsLen = 0;
            } else {
                assertArray( args, "non-array given for invoke arguments" );
                argsLen = args.length;

                if ( argsLen > 1 ) {
                    funArgs = new Array( argsLen-1 );

                    for ( var i = 1; i < argsLen; i++ ) {
                        funArgs[ i-1 ] = args[ i ];
                    }
                }
            }


            /*
             * obj.invoke( 'doWork' )
             */
            if ( isString(method) ) {
                var fun = this[ method ];
                assertFunction( fun, "method '" + method + "' was not found" );

                if ( argsLen === 0 ) {
                    return this[ method ]();
                } else if ( argsLen === 1 ) {
                    return this[ method ]( args[1] );
                } else {
                    return fun.apply( this, funArgs );
                }
            /*
             * obj.invoke( function() { } );
             */
            } else if ( isFunction(method) ) {
                if ( argsLen === 0 ) {
                    return method.call( this );
                } else if ( argsLen === 1 ) {
                    return method.call( this, args[1] );
                } else {
                    return method.apply( this, funArgs );
                }
            } else {
                fail( method, "non-function provided" );
            }
        }
    );

/* -------------------------------------------------------------------------------

### map

Maps the function given, against the items stored within this object. Note that
only the items *directly* stored are included; prototype items are skipped.

The function is in the form:

 function( value, k )

'value' is each value stored in turn, whilst 'k' is the key which the value is
stored under.

'this' is also bound to the value.

This is so that it matches up with Array.map.

@param fun The function to apply against this object's properties.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'map', function( fun ) {
                var rs = [];

                if ( (typeof fun === 'string') || (fun instanceof String) ) {
                    if ( arguments.length === 1 ) {
                        for ( var k in this ) {
                            if ( this.has(k) ) {
                                var val = this[k];
                                rs.push( val[fun].call(val, val, k) );
                            }
                        }
                    } else {
                        var args = new Array( arguments.length+1 );
                        for ( var i = 2; i < args.length; i++ ) {
                            args[i] = arguments[i-1];
                        }

                        for ( var k in this ) {
                            if ( this.has(k) ) {
                                var val = this[k];

                                args[0] = val;
                                args[1] = k;

                                rs.push( val[fun].apply(val, args) );
                            }
                        }
                    }
                } else {
                    if ( arguments.length === 1 ) {
                        for ( var k in this ) {
                            if ( this.has(k) ) {
                                var val = this[k];
                                rs.push( fun.call(val, val, k) );
                            }
                        }
                    } else {
                        var args = new Array( arguments.length+1 );
                        for ( var i = 2; i < args.length; i++ ) {
                            args[i] = arguments[i-1];
                        }

                        for ( var k in this ) {
                            if ( this.has(k) ) {
                                var val = this[k];

                                args[0] = val;
                                args[1] = k;

                                rs.push( fun.apply(val, args) );
                            }
                        }
                    }
                }

                return rs;
            }
    );



/* -------------------------------------------------------------------------------

### getProp

This returns the property stored in this object, under the name given. It is
the same as just doing ...

```
    var val = obj[ name ];

However this is a method based version, allowing you to curry, or call using
map, and other tricks like that.

```
    var getName = runtime.method( 'getProp', 'name' );
    var currentName = getName();

Note this will also return values stored in the protoype chain, if not found
in the object.

@param name The name of the property to access.
@return undefined if the property is not found, otherwise the value stored.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'getProp', function( name ) {
                return this[name];
            }
    );

/* -------------------------------------------------------------------------------

### setProp

This is a method version, of setting a value using array index notation.

```
    // these two are identical
    obj['name'] = 'John';
    obj.setProp('name', 'John');

A method version is provided, to allow currying, mapping, or passing the method
when bound to an object around. For example:

```
    var updateName = obj.method( 'setProp', 'name' );
    updateName( 'John' );

It can also take an object of values, to set multiple values to the object.

```
    var person = new Person();
    person.setProp({
            name: 'John',
            age: 20,
            sex: 'male',
            nationality: 'French'
    });

@return This object.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'setProp', function( obj, value ) {
                if ( arguments.length === 1 ) {
                    if ( ! isObjectLiteral(obj) ) {
                        throw new Error("non-object given for multiple property assignment");
                    }

                    for ( var k in obj ) {
                        if ( obj.has(k) ) {
                            this[k] = obj[k];
                        }
                    }
                } else if ( arguments.length === 2 ) {
                    if ( ! isString(obj) ) {
                        throw new Error("non-object given for property assignment");
                    }

                    this[obj] = value;
                } else {
                    throw new Error("invalid number of arguments given");
                }

                return this;
            }
    );

/* -------------------------------------------------------------------------------

### method

Finds the method, and binds it to 'this' object.
This is so you can do:

#### use case

```
     var fun = this.foo.bar.something().whatever.method( 'doWork' );

... instead of ...

```
     var fun = this.foo.bar.something().whatever.doWork.bind(
             this.foo.bar.something().whatever
     )

#### currying

This also supports currying.

```
    var fun = this.foo.bar.something().whatever.method( 'doWork', 1, 2 );

... instead of ...

```
     var fun = this.foo.bar.something().whatever.doWork.bind(
             this.foo.bar.something().whatever,
             1,
             2
     )

#### currying with underscore 

It also supports use of the _ variable, to leave variables open for use later.

```
    var fun = this.foo.bar.something().whatever.method( 'doWork', _, 1, 2 );

... instead of ...

```
    var fun = (function(whatever) {
        return function( param ) {
            return whatever.doWork( param, 1, 2 );
        }
    })(this.foo.bar.something().whatever);

When the function created is called, it's last method is used for the return
value.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'method', function( name ) {
                if ( !isString(name) && !isFunction(name) ) {
                    fail( "unknown value given for method 'name'" );
                } else {
                    return this.methodApply( name, arguments, 1 );
                }
            }
    );



/* -------------------------------------------------------------------------------

### methodApply

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'methodApply', function( name, args, startI ) {
                var fun;
                if ( isFunction(name) ) {
                    fun = name;
                } else {
                    fun = this[name];
                    assertFunction( fun, "method '" + name + "', was not found" );
                }

                if ( startI === undefined ) {
                    startI = 0;
                }

                if ( args === null || args === undefined || startI >= args.length ) {
                    return fun.bind( this );
                } else {
                    var newArgs;

                    if ( startI === 0 ) {
                        newArgs = new Array( args.length + 1 );
                        newArgs[0] = this;

                        for ( var i = 0; i < args.length; i++ ) {
                            newArgs[i+1] = args[i];
                        }
                    } else {
                        var newArgs = new Array( (args.length-startI) + 1 );
                        newArgs[0] = this;

                        for ( var i = startI; i < args.length; i++ ) {
                            newArgs[(i-startI)+1] = args[i];
                        }
                    }

                    return fun.bind.apply( fun, newArgs );
                }
            }
    );



/* -------------------------------------------------------------------------------

### has

This is the same as 'hasOwnProperty', but is shorter, making it nicer to use.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'has', Object.hasOwnProperty
    );



/* -------------------------------------------------------------------------------

### clone

@return a copy of this object.

------------------------------------------------------------------------------- */

    __setProp__( Object.prototype,
            'clone', function() {
                return Object.clone( this );
            }
    );



/* ===============================================================================

## String

=============================================================================== */

    var stringHTMLElement = document.createElement( 'div' );

    var escapeRegExpRegExp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

    var repeatString = function( pattern, count ) {
        if (count < 1) {
            return '';

        } else if ( count === 1 ) {
            return pattern;

        } else if ( count === 2 ) {
            return pattern + pattern ;

        } else if ( count === 3 ) {
            return pattern + pattern + pattern ;

        } else if ( count === 4 ) {
            return pattern + pattern + pattern + pattern ;

        } else {
            var result = '';

            while (count > 1) {
                if (count & 1) {
                    result += pattern;
                }

                count >>= 1, pattern += pattern;
            }

            return result + pattern;
        }
    }



/* ===============================================================================

### String.KEY_CODES

This is a full list of the majority of the keyboard character and key codes,
supported in the current browser.

=============================================================================== */

    __setProp__( String, 'KEY_CODES', {

            BACKSPACE   : 8,

            TAB         : 9,
            "\t"        : 9,

            ENTER       : 13,
            "\r"        : 13,
            "\n"        : 13,

            CTRL        : 17,

            ALT         : 18,
            SHIFT       : 16,

            ESCAPE      : 27,

            SPACE       : 32,
            ' '         : 32,
            
            PAGE_UP     : 33,
            PAGE_DOWN   : 34,
            END         : 35,
            HOME        : 36,

            LEFT_ARROW  : 37,
            UP_ARROW    : 38,
            RIGHT_ARROW : 39,
            DOWN_ARROW  : 40,
            
            INSERT      : 45,
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
            '<'         : 188,
            GREATER_THAN: 190,
            '>'         : 190,

            COMMA       : 188,
            ','         : 188,
            FULL_STOP   : 190,
            '.'         : 190,

            PLUS        : ( IS_MOZILLA ? 61  : 187 ),
            '+'         : ( IS_MOZILLA ? 61  : 187 ),
            MINUS       : ( IS_MOZILLA ? 173 : 189 ),
            '-'         : ( IS_MOZILLA ? 173 : 189 )
    });



/* -------------------------------------------------------------------------------

### map

Same as array.map, but for String objects.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'map', function( fun ) {
                if ( typeof fun === 'string' || (fun instanceof String) ) {
                    var args = new Array( arguments.length+1 );
                    for ( var i = 2; i < args.length; i++ ) {
                        args[i] = arguments[i-1];
                    }

                    return oldMap.call( this, function(obj, i) {
                        args[0] = obj;
                        args[1] = i;

                        return obj[fun].apply( obj, args );
                    } );
                } else {
                    return oldMap.apply( this, arguments );
                }
            }
    )



/* -------------------------------------------------------------------------------

### escapeRegExp

Returns a version of this string, where all special characters from a regular
expression, are escaped and made safe.

@return This string, with all RegExp characters escaped, so they no longer 
  affect any RegExp.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'escapeRegExp', function() {
                return this.replace( escapeRegExpRegExp, "\\$&" );
            }
    )



/* -------------------------------------------------------------------------------

### hasString

@param str The string to search for.
@return True if the string given is present in this string, and false if not.
    
------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'hasString', function(str) {
                return this.indexOf(str) !== -1 ;
            }
    )



/* -------------------------------------------------------------------------------

### escapeHTML

Escapes this string, so it is safe within HTML. This alters all HTML characters
and entities, so they are safe.

If you are doing this to insert a string into an element; STOP! It is better to
set it using the elements 'textContent' property, than to escape with this, and
then set it.

However you can use this if you know better.

@return This string, with all HTML characters escaped, so they no longer affect
  HTML.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'escapeHTML', function() {
                stringHTMLElement.textContent = this.valueOf();
                var html = stringHTMLElement.innerHTML;
                stringHTMLElement.innerHTML = '';

                return html;
            }
    );

/* -------------------------------------------------------------------------------

### remove

Removes all of the strings given, from this string.

```
    // yields "he wrd"
    "hello world".remove( 'l', 'o' );

@param 1 or more strings to be removed.
@return A new string, with all occurrances of the string given, to be removed.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'remove', function() {
                if ( arguments.length === 0 ) {
                    throw new Error( 'no strings given to remove' );
                } else {
                    var reg = '(' + arguments[0].escapeRegExp();

                    for ( var i = 1; i < arguments.length; i++ ) {
                        reg += ')|(' + arguments[i].escapeRegExp();
                    }

                    return this.valueOf().replace( new RegExp(reg + ')', 'g'), '' );
                }
            }
    );


/* -------------------------------------------------------------------------------

### firstSplit

This will return everthing in the string from the start up until the string
sequence provided.

It is the equivalent of doing

@example
    var firstSplit = str.split( seperator )[0];

However if the seperator is not found in the string then it returns an empty
string.

@param seperator The search string used.
@return Everthing from the start of the string up to the search string, or an
empty string.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'firstSplit', function( seperator ) {
                var index = this.valueOf().indexOf( seperator );

                if ( index === -1 ) {
                    return '';
                } else {
                    return this.valueOf().substring( 0, index );
                }
            }
    );



/* -------------------------------------------------------------------------------

### lastSplit

This is the equivalent to:

```
     someString.split( str ).pop() || ''

What it does, is find the last occurance of
'str', and then returns a substring of
everything after that occurance.

@param seperator The string to look for.
@return The string found, or an empty string if not found.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'lastSplit', function( seperator ) {
                var index = this.valueOf().lastIndexOf( seperator );

                if ( index === -1 ) {
                    return '';
                } else {
                    return this.valueOf().substring( index+1 );
                }
            }
    );



/* -------------------------------------------------------------------------------

### toHTML

Essentially this dumps the string into a component, converting it into a HTML
node, and then returning the element.

Note that if it is turned into multiple HTML elements, then the first one is
returned.

```
    var button = "<a href='#'>click me</a>".toHTML()

If the string cannot be converted to HTML for some reason, then an empty div
is returned instead.

@eturn This string, converted to a HTML element.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'toHTML', function() {
                stringHTMLElement.innerHTML = this.valueOf();
                var child = stringHTMLElement.firstChild;
                stringHTMLElement.innerHTML = '';

                return child;
            }
    );



/* -------------------------------------------------------------------------------

### html

Creates a html element, described using the parameters given, based on bb.jsx
form. It takes the same arguments that the bb() function would take.

If no arguments are given, then a div is used instead.

This string is then placed inside of the element created, and that element is
returned.

```
    blogElement.add(
            "<blink>Welcome</blink> to the blog of 1999".html( 'h1', 'blog-header' )
    );

@return A new HTML Element that contains this string, as it's inner html.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'html', function() {
                if ( window.bb ) {
                    var comp = bb.createArray( arguments[0], arguments, 1 );
                    comp.innerHTML = this.valueOf();
                    return comp;
                } else {
                    throw new Error( 'bb not found, and is required for this method' );
                }
            }
    );



/* -------------------------------------------------------------------------------

### text

The same as String.html, only this places this string into the element as text,
instead of raw html.

```
    blogElement.add(
            "Welcome to my blog!".text( 'h1', 'blog-header' )
    );

@return A new HTML Element, with it's text containing this string.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'text', function() {
                if ( window.bb ) {
                    var comp = bb.createArray( arguments[0], arguments, 1 );
                    comp.textContent = this.valueOf();
                    return comp;
                } else {
                    throw new Error( 'bb not found, and is required for this method' );
                }
            }
    );


/* -------------------------------------------------------------------------------

### string.matches( regexp )

This is for an all or nothing test, to see if a string matches a whole regular
expression 100%, or not.

@return True if the regular expression matched the entire string, false if not.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'matches', function(regex) {
                if ( isString(regex) ) {
                    return this === regex;
                } else {
                    assert( regex instanceof RegExp, "non-regular expression given" );

                    var matches = this.valueOf().match( regex );
                    return (matches.length === 1) && (mathes[0] === this);
                }
            }
    );



/* -------------------------------------------------------------------------------

### string.isInteger()

Tests if this string looks like an integer, and if so, then returns true or 
false accordingly.

Note this does not take into account hexadecimal, or any other special notation.
Numbers such as '0999' are also deemed to be not an integer, as it starts with
a trailing zero.

@return True if this string looks like an integer, and false if not.

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
            'isInteger', function() {
                var thisVal = this.valueOf();

                var len;
                if ( (len = thisVal.length) === 0 ) {
                    return false;
                }

                var i;
                if ( thisVal.charCodeAt(0) === 45 ) {
                    // it's just '-' on it's own, return false
                    if ( thisVal.length === 1 ) {
                        return false;
                    // it's '-0 ... something', such as '-0939', return false
                    } else if ( thisVal.length > 2 && thisVal.charCodeAt(1) === '48' ) {
                        return false;
                    } else {
                        i = 1;
                    }
                // it's '0 ... something', such as '0939', return false
                } else if ( thisVal.length > 1 && thisVal.charCodeAt(0) === '48' ) {
                    return false
                } else {
                    i = 0;
                }

                for ( ; i < thisVal.length; i++ ) {
                    var c = thisVal.charCodeAt(0);

                    // if not an ASCII number (before or after 0-9)
                    if ( c < 48 || 57 < c ) {
                        return false;
                    }
                }

                return true;
            }
    );



/* -------------------------------------------------------------------------------

## string.padLeft

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
        'padLeft', function( pad, strLen ) {
            var thisVal = this.valueOf();
            var diff = (strLen|0) - thisVal.length;

            if ( diff <= 0 ) {
                return thisVal;
            } else {
                var padLen = pad.length;

                return repeatString( pad, 
                        // fast positive division + ceiling
                        ( (diff + padLen - 1) / padLen )|0
                ) + thisVal ;
            }
        }
    );



/* -------------------------------------------------------------------------------

## string.padRight

------------------------------------------------------------------------------- */

    __setProp__( String.prototype,
        'padRight', function( pad, strLen ) {
            var thisVal = this.valueOf();
            var diff = (strLen|0) - thisVal.length;

            if ( diff <= 0 ) {
                return thisVal;
            } else {
                var padLen = pad.length;

                return thisVal + repeatString( pad,
                        ( (diff + padLen - 1) / padLen )|0
                )
            }
        }
    );



/* ===============================================================================

## Array

===============================================================================

-------------------------------------------------------------------------------

### map shim

This is a shim for the Array.map method, *if* it is not yet implemented.

We fallback onto the old map for some of our behaviour, or define a new one, if
missing (IE 8).

@see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map#Compatibility

------------------------------------------------------------------------------- */

    var oldMap = Array.prototype.map;
    if ( ! ('map' in Array.prototype) ) {
        oldMap = function(callback, thisArg) {
            var T, A, k;

            if (this === null) {
              throw new TypeError(" this is null or not defined");
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if (typeof callback !== "function") {
              throw new TypeError(callback + " is not a function");
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (thisArg) {
              T = thisArg;
            }

            // 6. Let A be a new array created as if by the expression new Array(len) where Array is
            // the standard built-in constructor with that name and len is the value of len.
            A = new Array(len);

            // 7. Let k be 0
            k = 0;

            // 8. Repeat, while k < len
            while(k < len) {
              var kValue, mappedValue;

              // a. Let Pk be ToString(k).
              //   This is implicit for LHS operands of the in operator
              // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
              //   This step can be combined with c
              // c. If kPresent is true, then
              if (k in O) {

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[ k ];

                // ii. Let mappedValue be the result of calling the Call internal method of callback
                // with T as the this value and argument list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);

                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
                // and false.

                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

                // For best browser support, use the following:
                A[ k ] = mappedValue;
              }
              // d. Increase k by 1.
              k++;
            }

            // 9. return A
            return A;
        };      
    }

/* -------------------------------------------------------------------------------

### filterOutMethod

Same as 'filterMethod', however this will remove
all items which return 'true', rather than keep them.

This is useful for when things return 'true',
and you don't want them. For example:

```
    var nonEmptyNodes = nodes.filterOutMethod( 'isEmpty' )

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'filterOutMethod', function( meth ) {
                var fun;
                if ( arguments.length > 1 ) {
                    var args = new Array( arguments.length-1 );
                    for ( var i = 1; i < arguments.length; i++ ) {
                        args[i-1] = arguments[i];
                    }

                    fun = function( obj ) {
                        var r = obj[meth].apply( obj, args );
                        return r === null || r === false || r === undefined;
                    }
                } else {
                    fun = function( obj ) {
                        var r = obj[meth]();
                        return r === null || r === false || r === undefined;
                    }
                }

                return this.filter( fun );
            }
    );



/* -------------------------------------------------------------------------------

### filterMethod

Calls the given method against all elements in the array.
If it returns a non-falsy item (false, null, or undefined),
then it will be kept.

Otherwise, it will be removed.

```
    var emptyNodes = nodes.filterOutMethod( 'isEmpty' )

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'filterMethod', function( meth ) {
                var fun;
                if ( arguments.length > 1 ) {
                    var args = new Array( arguments.length-1 );
                    for ( var i = 1; i < arguments.length; i++ ) {
                        args[i-1] = arguments[i];
                    }

                    fun = function() {
                        var r = this[meth].apply( this, args );
                        return r !== null && r !== false && r !== undefined;
                    }
                } else {
                    fun = function() {
                        var r = this[meth]();
                        return r !== null && r !== false && r !== undefined;
                    }
                }

                return this.filter( fun );
            }
    );



/* -------------------------------------------------------------------------------

### filterOutType

This is shorthand for using filterType,
where 'keepProto' is set to false.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'filterOutType', function( proto, thisObj ) {
                if ( arguments.length > 1 ) {
                    return this.filterType( proto, thisObj, false );
                } else {
                    return this.filterType( proto, false );
                }
            }
    );



/* -------------------------------------------------------------------------------

### filterType

Filters object based on the prototype given.
This can work in two ways:

 - keepProto = true - keep only object, of that type
 - keepProto = true - keep all objects, except for that type

By default, keepProto is true, and so will keep only items
which match the proto constructor given.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'filterType', function( proto, thisObj, keepProto ) {
                var hasThis = false;
                var argsLen = arguments.length;

                if ( argsLen === 0 ) {
                    throw new Error( "not enough parameters given, no prototype!" );
                } else if ( argsLen === 1 ) {
                    keepProto = true;
                } else if ( argsLen === 2 ) {
                    if ( thisObj === true || thisObj === false ) {
                        keepProto = thisObj;
                        hasThis = false;
                    } else {
                        keepProto = true;
                        hasThis = true;
                    }
                } else {
                    hasThis = true;
                }

                var fun = keepProto ?
                        function() { return  (this instanceof proto) } :
                        function() { return !(this instanceof proto) } ;

                /*
                 * If a this object is provided,
                 * ensure it's not a common falsy value,
                 * often used for no object.
                 */
                if ( hasThis &&
                        (
                                thisObj === undefined ||
                                thisObj === null ||
                                thisObj === false
                        )
                ) {
                    throw new Error( "invalid 'thisObj' given" );
                }

                if ( hasThis ) {
                    return this.filter( fun, thisObj );
                } else {
                    return this.filter( fun );
                }
            }
    );



/* -------------------------------------------------------------------------------

### each

Similar to 'forEach', except the optional 'thisArg' is the first parameter.

The thisArg is also returned if it is provided, and if not, then this array is
returned.

@param thisArg Optional, the value that will be 'this' in the callback.
@param callback The function to perform on each value.
@return This array if no 'thisArg', otherwise the 'thisArg' value given.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'each', function( thisArg, callback ) {
                // 'thisArg' is the callback
                if ( arguments.length === 1 ) {
                    assertFunction( thisArg );

                    this.forEach( thisArg );

                    return this;
                } else {
                    assertFunction( callback );

                    this.forEach( callback, thisArg );

                    return thisArg;
                }
            }
    );



/* -------------------------------------------------------------------------------

### map

Maps a function, against all elements in the given array. If the function given
is a function object, then it is run against each element in turn.

```
    // each unit is updated, with a delta-time given to each one
    units.map( function(unit, i) {
        unit.update( delta );
    } );

The 'this' value is also bound to the value given. This allows the same to be
written as ...

```
    // each unit is updated, with a delta-time given to each one
    units.map( function() {
        this.update( delta );
    } );

You can also create and pass in a function to call instead.

```
    var updateFun = function() {
        this.update( delta );
    }
    units.map( updateFun );

If however it is a string given, then that function is called on each element 
in turn.

```
    // each unit is updated, with a delta-time given to each one
    units.map( 'update', delta );

One or more parameters can be given after the function, as extra parameters to
execute.

@param fun The function to perform on each element.
@return A new array, containing the result from each value.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'map', function( fun ) {
                if ( typeof fun === 'string' || (fun instanceof String) ) {
                    var args = new Array( arguments.length+1 );
                    for ( var i = 2; i < args.length; i++ ) {
                        args[i] = arguments[i-1];
                    }

                    return oldMap.call( this, function(obj, i) {
                        args[0] = obj;
                        args[1] = i;

                        return obj[fun].apply( obj, args );
                    } );
                } else {
                    return oldMap.apply( this, arguments );
                }
            }
    );



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'inject', function( sum, fun ) {
                if ( arguments.length === 1 ) {
                    assertFunction( sum, "no inject function provided" );

                    return this.reduce( sum );
                } else {
                    assertFunction( fun, "no inject function provided" );

                    return this.reduce( fun, sum );
                }
            }
    );



/* -------------------------------------------------------------------------------

### array.first()

@return The first element in this array, or undefined if not found.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'first', function() {
                return this[0];
            }
    );



/* -------------------------------------------------------------------------------

### array.last()

@return The last element in this array, or undefined if not found.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'last', function() {
                return this[ this.length - 1 ];
            }
    );



/* -------------------------------------------------------------------------------

### array.get( index )

Fetches the element at the given index. This is useful for currying.

It also supports negative array indexes, allowing you to get the last element,
or the one before last.

```
    var last = arr.get( -1 );
    var penultimate = arr.get( -2 );

If the index is out of bounds, it will return undefined.

@param index The numeric index of the item to fetch from the array.
@return The element stored at the given index, or undefined if not found.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'get', function( index ) {
                return ( index < 0 ) ?
                        this[ this.length + index ] :
                        this[ index ]               ;
            }
    );



/* -------------------------------------------------------------------------------

### array.set( index, value )

Sets an element to this array, just like with standard array notation.
This is useful for currying, and it also supports negative indexes.

@param index Where to store the element in this array.
@param value The value to store.
@return This array, for method chaining.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'set', function( index, value ) {
                if ( index < 0 ) {
                    this[ this.length + index ] = value;
                } else {
                    this[ index ] = value;
                }

                return this;
            }
    );



/* -------------------------------------------------------------------------------

### array.drop( index )

Removes the item at the index given. This can be a negative or positive index.
The element is deleted from this array, and this array is then returned, 
allowing function chaining.

@param index The index of where to delete an item from this array.
@return this array.

------------------------------------------------------------------------------- */

    __setProp__( Array.prototype,
            'drop', function( index ) {
                var len = this.length;
                var delIndex = index;
                var args = arguments;
                var argsLen = args.length;

                if ( argsLen === 0 ) {
                    fail( "no indexes given" );
                } else if ( argsLen === 1 ) {
                    if ( delIndex < 0 ) {
                        delIndex = len + delIndex;

                        if ( delIndex < 0 ) {
                            fail( "index out of range, " + index );
                        }
                    } else if ( delIndex >= len ) {
                        fail( "index out of range, " + index );
                    }

                    for ( var i = delIndex+1; i < len; i++ ) {
                        this[ i-1 ] = this[ i ];
                    }

                    this.length = len-1;
                } else {
                    /* 
                     * This brute-force searches through the indexes given, and
                     * with each lowest index in turn, shuffles all the elements
                     * down the array. This is from 'last+1' to 'delIndex'.
                     * 
                     * It then does it once more after the loop, to include 
                     * those following the highest 'delIndex'.
                     * 
                     * The lowest index for each, is skipped.
                     * 
                     * Whilst brute force is generally considered bad, it's
                     * best *on very small data sets!* This is because things
                     * like array construction and function calls, would 
                     * suddenly take up a lot more performance when compared
                     * to O( n^2 ) on a data set with 2 or 3 elements.
                     * 
                     * If lots of people want to delete 20 or more elements,
                     * then it would become a problem.
                     */
                    var last = -1;
                    var offset = 0;
                    for ( var i = 0; i < argsLen; i++ ) {
                        var delIndex = len;

                        for ( var j = 0; j < argsLen; j++ ) {
                            var searchIndex = args[j];

                            if ( searchIndex < 0 ) {
                                searchIndex = len + searchIndex;
                                wasNegative = true;

                                if ( searchIndex < 0 ) {
                                    fail( "index out of range, " + searchIndex );
                                }
                            } else if ( searchIndex >= len ) {
                                fail( "index out of range, " + searchIndex );
                            }

                            if ( last < searchIndex && searchIndex < delIndex ) {
                                delIndex = searchIndex;
                            }
                        }

                        // shuffle elements down the array,
                        // to replace the element we deleted
                        for ( var j = last+1; j < delIndex; j++ ) {
                            this[ j-offset ] = this[ j ];
                        }

                        last = delIndex;
                        offset++;
                    }

                    for ( var j = last+1; j < len; j++ ) {
                        this[ j-offset ] = this[ j ];
                    }

                    this.length = len - offset;
                }

                return this;
            }
    );



/* ===============================================================================

## Console

Redefines 'window.console' functions so they are bound to the 'console' object.
Why? So it's easier to chain them into stuff.

For example lets say we want to do ...

```
    document.body.onclick = function(ev) {
        console.log( ev );
    }

This could be replaced with just ...

```
    document.body.onclick = console.log

However the above will fail, because 'log' will not run within the context of
the 'console' object by default.

It also allows use of 'console.log' and similar console methods, within partial
function application.

=============================================================================== */

    /*
     * Apply this change to all functions in order, on the console object, if
     * it is present.
     */

    if ( window && console in window ) {
        for ( var k in console ) {
            var fun = console[k];

            if ( fun instanceof Function ) {
                console[k] = fun.bind( console );
            }
        }
    }




})();
"use strict";(function() {

/* Function.js
===========

@author Joseph Lenton

A Function utility library. Helps with building classes, with aspects-related
constructs.

Also includes some helper functions, to make working with functions easier.

===============================================================================

## Function

=============================================================================== */

    var __setProp__ = window.__setProp__;



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

    var LazyParam = function() {
        fail( "evaluating a lazy value" );
    }

    LazyParam.method = function( fun ) {
        if ( isString(fun) ) {
            return function(obj) {
                if ( ! isFunction(obj) ) {
                    fail( "function not found for _." + fun );
                }

                return obj[fun]();
            }
        } else if ( isFunction(fun) ) {
            return function(obj) {
                return fun.call( obj );
            }
        } else {
            fail( "unknown parameter given, must be function or string" );
        }
    }

    window._ = LazyParam;
    window.LazyParam = LazyParam;

/* -------------------------------------------------------------------------------

### newPrototypeArray


------------------------------------------------------------------------------- */
    
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


/* -------------------------------------------------------------------------------

### newFunctionExtend

------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### applyToFun

Used to call apply on a function and return it's result. It's needed because
this actually fails on a whole host of functions; native functions!

The apply will fail because native functions cannot take a non-undefined value
for the target. They cannot have a target value.

So this will try to call it normally and if that fails call without an object.

------------------------------------------------------------------------------- */

    var applyToFun = function( fun, target, combinedArgs ) {
        // if no target, native or otherwise
        if ( target === undefined && target === null ) {
            return fun.apply( undefined, combinedArgs );

        } else {
            // calling non-native function with a target
            try {
                return fun.apply( target, combinedArgs );

            // calling an native function
            } catch ( err ) {
                return fun.apply( undefined, combinedArgs );

            }
        }
    }



/* -------------------------------------------------------------------------------

### newPartial

------------------------------------------------------------------------------- */

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

                    return applyToFun( fun, target, combinedArgs );
                });
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### wrapNamedFun

Used in conjunction with 'then', it allows you to chain method calls.

------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

    var tagBound = function( fun, target ) {
        fun.__bound = target;
        return fun;
    }



/* -------------------------------------------------------------------------------

### bindTarget

Binds the given function to the target given, and then returns the function.

@param fun The function to bind a value to.
@param target The target to be used for the function binding.

------------------------------------------------------------------------------- */

    var bindTarget = function( fun, target ) {
        return tagBound(function() {
            return fun.apply( target, arguments );
        }, target );
    }



/* ===============================================================================

## Function Methods

===============================================================================

-------------------------------------------------------------------------------

### Function.create

The equivalent to calling 'new Fun()'.

The reason this exists, is because by oferring it as a function, you can then 
bind the constructor call and pass it around.

------------------------------------------------------------------------------- */

    __setProp__( Function,
        'create', function() {
            var argsLen = arguments.length;

            if ( argsLen === 0 ) {
                return new Function();
            } else if ( argsLen === 1 ) {
                return new Function( arguments[0] );
            } else if ( argsLen === 2 ) {
                return new Function( arguments[0], arguments[1] );
            } else if ( argsLen === 3 ) {
                return new Function( arguments[0], arguments[1], arguments[2] );
            } else if ( argsLen === 4 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3] );
            } else if ( argsLen === 5 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4] );
            } else if ( argsLen === 6 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5] );
            } else if ( argsLen === 7 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6] );
            } else if ( argsLen === 8 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7] );
            } else if ( argsLen === 9 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8] );
            } else if ( argsLen === 10 ) {
                return new Function( arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9] );
            } else {
                var obj  = Object.create( Function.prototype );
                var obj2 = Function.apply( obj, arguments );

                if ( Object(obj2) === obj2 ) {
                    return obj2;
                } else {
                    return obj;
                }
            }
        }
    );

/* -------------------------------------------------------------------------------

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
------------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------------

### Function.maybeApply

This is the apply version of maybeCall.

@param callback The function to be tested and called.
@param args optional, the parameters for the function when it is called.
@return undefined if there is no function, and otherwise the result of calling the function.
------------------------------------------------------------------------------- */

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

/* ===============================================================================

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

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        '__bound', undefined
    );


/* -------------------------------------------------------------------------------

### function.bind

The same as the old bound, only it also supports lazy arguments.

On top of lazy, it also adds tracking of the bound target. This is needed for
other function methods, for adding in extras on top.

------------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------------

### function.apply2

------------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------------

### function.λ

An alias for 'curry'.

```
    // these two are identical ...
    button.onclick = refresh.curry( environment, user );
    button.onclick = refresh.λ( environment, user );

@see function.curry

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'λ', Function.prototype.curry
    );



/* -------------------------------------------------------------------------------

### Throttle

This returns a version of the function, where when called, it will wait a set
amount of milliseconds, before it is called.

If the function is called multiple times, each time it will reset the wait
timer.

------------------------------------------------------------------------------- */

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
                    clearTimeout( funTimeout );
                }

                funTimeout = setTimeout( function() {
                    funTimeout = null;

                    fun.apply( self, args );
                }, delay );
            }
        }
    );



/* -------------------------------------------------------------------------------

### function.delay( delay )

This is very similar to 'future' and 'throttle'. This will return a function 
that wraps this function which when called will actually run in the future.

With this the call is just delayed, and calling it multiple times will result
in it being called multiple times in the future. The execution of the function
is 'delayed' (hence the name).

When the result is called it will call the function sometime in the future. 
This is after a ceratain amount of milliseconds, which is provided by 'delay'.

This is just like 'throttle', only this will call in the function in the future
for *each* time it is called. So if you call the function 4 times in a row, 
then it will be called 4 times in the future as well.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'delay', function(delay) {
            if ( delay === undefined ) {
                delay = 0;
            }

            var fun = this;

            return function() {
                var self = this;
                var args = arguments;

                setTimeout( function() {
                    fun.apply( self, args );
                }, delay );
            }
        }
    );



/* -------------------------------------------------------------------------------

### Function.lazy

This is very similar to 'bind'.

It creates a new function, for which you can add on,
extra parameters.

Where it differes, is that if those parameters are functions,
they will be executed in turn.

------------------------------------------------------------------------------- */

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
                            if ( isFunction(args[i]) ) {
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



/* -------------------------------------------------------------------------------

### function.eventFields


------------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------------

### function.proto

Duplicates this function, and sets a new prototype for it.

@param The new prototype.

------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### function.newPrototype

This creates a new prototype,
with the methods provided extending it.

it's the same as 'extend', but returns an object for use
as a prototype instead of a funtion.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'newPrototype', function() {
            return newPrototypeArray( this, arguments );
        }
    );


/* -------------------------------------------------------------------------------

### function.protoOverride

Same as append, but the methods it overrides *must* exist.

This allows you to have a sanity check.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'protoOverride', newFunctionExtend(
                "Methods are overriding, but they do not exist,",
                function(dest, k, val) {
                    return ( dest[k] !== undefined )
                }
        )
    );



/* -------------------------------------------------------------------------------

### function.protoBefore


------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### function.protoAfter


------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### function.protoExtend

Adds on extra methods, but none of them are allowed 
to override any others.

This is used as a sanity check.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'protoExtend', newFunctionExtend(
                "Extending methods already exist, ",
                function(dest, k, val) {
                    return ( dest[k] === undefined )
                }
        )
    );



/* -------------------------------------------------------------------------------

### function.require


------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### function.params

This is just like curry,
in that you can add extra parameters to this function.

It differs, in that no more parameters can be added
when the function is called.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'params', function() {
            var self = this,
                args = arguments;

            return (function() {
                        return self.apply( this, args );
                    }).proto( this );
        }
    );



/* -------------------------------------------------------------------------------

### function.curry

This is essentially the same as 'bind', but with no target given.

It copies this function, and returns a new one, with the parameters given tacked
on at the start. You can also use the underscore to leave gaps for parameters
given.

```
    var f2 = someFunction.curry( _, 1, 2, 3 );

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'curry', function() {
            return newPartial( this, undefined, arguments, 0, false ).
                    proto( self );
        }
    );



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'postCurry', function() {
            return newPartial( this, undefined, arguments, 0, true ).
                    proto( self );
        }
    );



/* -------------------------------------------------------------------------------

### function.preSub

Copies this function, tacking on the 'pre' function given.

That is because the after behaviour does *not* modify this function,
but makes a copy first.

@param pre A function to call.
@return A new function, with the pre behaviour tacked on, to run before it.

------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

### function.sub

Copies this function, tacking on the 'post' function given.

This is intended for sub-classing,
hence the name, 'sub'.

That is because the after behaviour does *not* modify this function,
but makes a copy first.

@param post A function to call.
@return A new function, with the post behaviour tacked on.

------------------------------------------------------------------------------- */

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



/* -------------------------------------------------------------------------------

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

------------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------------

### function.thenMaybe

This is the same as 'then', however if the function given is not found, it will
silently do nothing.

This is useful for chaining in callbacks which are optional.

```
    button.onclick = doSomething().thenMaybe( callback );

------------------------------------------------------------------------------- */

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

            return this.then.apply( this, arguments )
        }
    )

/* -------------------------------------------------------------------------------

### function.subBefore

When called, a copy of this function is returned,
with the given 'pre' function tacked on before it.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'subBefore', function( pre ) {
            var self = this

            return (function() {
                        post.call( this, arguments );
                        return self.call( this, arguments );
                    }).
                    proto( this );
        }
    );

/* -------------------------------------------------------------------------------

### function.callFuture

This is a mix of call, and future.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'callFuture', function( target ) {
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
                return this.applyFuture( target, arguments );
            }
        }
    );



/* -------------------------------------------------------------------------------

### function.applyFuture


------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'applyFuture', function( target, args, timeout ) {
            if ( arguments.length >= 3 ) {
                assertNumber( timeout, 'non-number given for timeout' );
            } else {
                timeout = 0;
            }

            if ( arguments.length <= 1 ) {
                args = null;
            }

            var self = this;
            return setTimeout( function() {
                self.apply( target, args );
            }, timeout );
        }
    );



/* -------------------------------------------------------------------------------

### function.future

Sets this function to be called future. This will call the function in 0 
milliseconds; essentially some time in the future, as soon as possible.

It returns the value used when creating the timeout, and this allows you to
cancel the timeout using 'clearTimeout'.

You can provide zero or more arguments, which will be passed to the function,
when it is called.

@return The setTimeout identifier token, allowing you to cancel the timeout.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'future', function() {
            var fun = this;
            var args = arguments;

            if ( arguments.length === 0 ) {
                return setTimeout( fun, 0 );
            } else if ( arguments.length === 1 ) {
                return setTimeout( function() {
                    fun(args[0]);
                }, 0 );
            } else {
                return setTimeout( function() {
                    fun.apply( null, args );
                }, 0 );
            }
        }
    );



/* -------------------------------------------------------------------------------

### function.bindFuture

This returns a function, which when called, will call this function, in the
future.

Yes, it's as simple as that.

@param target Optional, a target object to bind this function to.
@param timeout Optional, the timeout to wait before calling this function, defaults to 0.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'bindFuture', function( target, timeout ) {
            if ( arguments.length === 0 ) {
                return this.method( 'future' );
            } else if ( arguments.length === 1 ) {
                return this.method( 'future', timeout );
            } else {
                return this.method( 'future', target, timeout );
            }
        }
    );



/* -------------------------------------------------------------------------------

## function.methodize

Turns a function into a method. This allows you to build generic functions,
and then reuse them for various other classes.

```
    // a generic function for returning the name of an object
    var getName = function( obj ) {
        return obj.name.trim();
    }

```
    // a prototype class using the 'getName' function as a method
    var Person = function( name ) {
        this.name = name;
    }
    Person.prototype.getName = getName.methodize();

The first parameter of the function being methodized, will always hold 'this'.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'methodize', function() {
            var fun = this;
            
            return function() {
                var argsLen = arguments.length;

                if ( argsLen === 0 ) {
                    return fun.call( undefined, this );
                } else if ( argsLen === 1 ) {
                    return fun.call( undefined, this, arguments[0] );
                } else if ( argsLen === 2 ) {
                    return fun.call( undefined, this, arguments[1], arguments[2] );
                } else if ( argsLen === 3 ) {
                    return fun.call( undefined, this, arguments[1], arguments[2], arguments[3] );
                } else {
                    var args = new Array( argsLen+1 );
                    args[0] = this;
                    for ( var i = 1; 1 < argsLen; i++ ) {
                        args[i] = arguments[i-1];
                    }

                    return fun.apply( undefined, args );
                }
            }
        }
    );



/* -------------------------------------------------------------------------------

## function.demethodize

This turns a method into a function.

```
    // so you can take a method call like this ...
    target.method( param1, param2, param3 );
    // take the method away from it
    var fun = target.method.demethodize();
    // and use it like this, and it's the same as above ...
    fun( target, param1, param2, param3 );

There are times where you may want to do this, where the object is passed in as
the first parameter.

------------------------------------------------------------------------------- */

    __setProp__( Function.prototype,
        'demethodize', function() {
            var fun = this;

            return function() {
                var argsLen = arguments.length;

                if ( argsLen === 0 ) {
                    return fun.call( null );
                } else if ( argsLen === 1 ) {
                    return fun.call( arguments[0] );
                } else if ( argsLen === 2 ) {
                    return fun.call( arguments[0], arguments[1] );
                } else if ( argsLen === 3 ) {
                    return fun.call( arguments[0], arguments[1], arguments[2] );
                } else if ( argsLen === 4 ) {
                    return fun.call( arguments[0], arguments[1], arguments[2], arguments[3] );
                } else {
                    return fun.apply( arguments[0], args );
                }
            }
        }
    );




})();
"use strict";(function() {

/* Math.jsx
========

@author Joseph Lenton

Adds on extras for extra mathematical operations.
 */

    var __setProp__ = window.__setProp__;
    
    __setProp__( Math, {
            'TAO': Math.PI*2  ,
            'π'  : Math.PI    ,
            'τ'  : Math.PI*2
    } );
    
    __setProp__( window, {
            'π'  : Math.PI    ,
            'τ'  : Math.PI*2
    } );

/* -------------------------------------------------------------------------------

# Math.round

The 'nearest' value is so you can round to the nearest 0.5, 0.3, 0.1, 10, or
any other value.

```
    Math.round( 55.4      ) // returns 55
    Math.round( 55.4, 1   ) // returns 55 (same as above)
    Math.round( 55.4, 0.5 ) // returns 55.5
    Math.round( 55.4, 5   ) // returns 55
    Math.round( 55.4, 10  ) // returns 60
    Math.round( 55.4, 100 ) // returns 100 (rounds to nearest 100)
    Math.round( 55.4, 0   ) // returns 55.4 (always returns the number given)

One useful feature is that it is trivial to round to the nearest set number of
decimal places.

```
    // round PI to the nearest 3 decimal places, 3.142
    Math.round( π, 0.001 )

@param num The number to round.
@param nearest Optional, another number to 'round nearest to'. By default, this is 1.
@return The number given, rounded.

------------------------------------------------------------------------------- */

    var oldRound = Math.round;

    __setProp__( Math,
            'round', function( num, within ) {
                if ( arguments.length === 1 ) {
                    return oldRound( num );
                } else if ( within === 0 ) {
                    return num;
                } else {
                    return oldRound(num/within) * within
                }
            }
    );



/* -------------------------------------------------------------------------------

# Math.parse

This is a small parser for parsing and evaluating simple math expressions.

Note this is *not*, and *never* intends to be, a full language.

The point is so you can have a public facing input that allows inputs such as 
"200" or "190+12". This means the user can enter a simple mathematical 
expression instead of working it out by hand.

So far this only supports ...
 - integers 
 - decimal values
 - hexadecimal values, 0xabc34
 - binary values, 0b010101011010
 - parenthesis, (1+2) * 3
 - add, subtract, divide, and multiply (with correct associativity)

No variables, no functions, because this isn't a mini programming language.

You chuck the maths into parse and it either gives you the result, or null. 
Null is returned if there is some issue with the input and it's designed to ask
no questions and just fail fast.

If null is not good enough; well again this is not intended to be a fully 
functioning language. So if you want an in-depth maths AST builder and error
checker then tbh use something else because this ain't that.

Users may also be interested that internally this does *not* use eval or any
alternative. It parses and then runs the maths.

@param str A string containing a mathematical expression to parse and run.
@param null if an error occurred, otherwise the result.

------------------------------------------------------------------------------- */

    __setProp__( Math,
            'parse', (function() {
            var TERM_ZERO            = 1
            var TERM_NINE            = 2
            var TERM_PLUS            = 3
            var TERM_SUB             = 4
            var TERM_MULT            = 5
            var TERM_DIVIDE          = 6
            var TERM_LEFT_BRACKET    = 7
            var TERM_RIGHT_BRACKET   = 8
            
            /// Token for whole int numbers.
            /// It will also push 1 extra integer into the tokens array.
            ///     - the integer value
            var TERM_INT_NUMBER      = 9
            
            /// Token for decimal numbers.
            /// It will also push 3 extra integers onto the tokens array
            ///     - the integer value
            ///     - it's decimal part as an int
            ///     - the number of digits in the decimal part
            var TERM_DECIMAL_NUMBER  = 10

            var SPACE           = ' '.charCodeAt(0);
            var TAB             = "\t".charCodeAt(0);
            var LOWER_B         = 'b'.charCodeAt(0);
            var LOWER_X         = 'x'.charCodeAt(0);
            var UPPER_B         = 'B'.charCodeAt(0);
            var UPPER_X         = 'X'.charCodeAt(0);

            var FULL_STOP       = '.'.charCodeAt(0);
            var UNDERSCORE      = '_'.charCodeAt(0);

            var ZERO            = '0'.charCodeAt(0);
            var ONE             = '1'.charCodeAt(0);
            var NINE            = '9'.charCodeAt(0);

            var PLUS            = '+'.charCodeAt(0);
            var SUB             = '-'.charCodeAt(0);
            var MULT            = '*'.charCodeAt(0);
            var DIVIDE          = '/'.charCodeAt(0);

            var LEFT_BRACKET    = '('.charCodeAt(0);
            var RIGHT_BRACKET   = ')'.charCodeAt(0);

            var parseTokenNumber = function( str, state, code, i, tokens ) {
                // stuff for iteration
                var strLen = str.length;
                var secondCode = str.charCodeAt( i+1 );

                var hasMore = false;

                var num = 0;
                var decimalNum = 0;
                var decimalLen = 0;
                var isDecimal = false;

                /*
                 * 0x - Hexadecimal
                 */
                if ( 
                        (secondCode === LOWER_X || secondCode === UPPER_X) && 
                        code === ZERO 
                ) {
                    base = 16;
                    hasMore = false;

                    i += 2;
                    for ( ; i < strLen; i++ ) {
                        code = str.charCodeAt( i );

                        if ( ZERO <= code && code <= NINE ) {
                            num = num*16 + (code - ZER0   );
                            hasMore = true;
                        } else if ( LOWER_A <= code && code <= LOWER_F ) {
                            num = num*16 + (code - LOWER_A);
                            hasMore = true;
                        } else if ( UPPER_A <= code && code <= UPPER_F ) {
                            num = num*16 + (code - LOWER_A);
                            hasMore = true;

                        // decimal hexidecimal, not supported
                        } else if (code === FULL_STOP ) {
                            state.fail = true;
                            return 0;
                        } else if ( code !== UNDERSCORE ) {
                            break;
                        }
                    }

                    if ( ! hasMore ) {
                        state.fail = true;
                        return 0;
                    }

                /*
                 * 0b - Binary number
                 */
                } else if (
                        (secondCode === LOWER_B || secondCode === UPPER_B)
                        && code === ZERO 
                ) {
                    base = 2;

                    for ( var i = 2; i < strLen; i++ ) {
                        code = str.charCodeAt( i );

                        if ( code === ZERO ) {
                            num = num*2;
                            hasMore = true;
                        } else if ( code === ONE ) {
                            num = num*2 + 1;
                            hasMore = true;
                        
                        // decimal binary, not supported
                        } else if (code === FULL_STOP ) {
                            state.fail = true;
                            return 0;

                        } else if ( code !== UNDERSCORE ) {
                            break;
                        }
                    }

                    if ( ! hasMore ) {
                        state.fail = true;
                        return 0;
                    }

                /*
                 * regular base 10 number
                 */
                } else {
                    // this is for the whole number section
                    // this is optional, as long as there is a decimal section
                    if ( code !== FULL_STOP ) {
                        for ( ; i < strLen; i++ ) {
                            code = str.charCodeAt( i );

                            if ( ZERO <= code && code <= NINE ) {
                                num = num*10 + (code - ZERO);
                                hasMore = true;

                            // check for a decimal place,
                            // and a double decimal stop (which should never happen, but just to be safe)
                            } else if ( code === FULL_STOP ) {
                                break;

                            // look for numbers outside of the 0 to 9 range
                            } else if ( code !== UNDERSCORE ) {
                                break;
                            }
                        }

                        if ( ! hasMore ) {
                            state.fail = true;
                            return 0;
                        }
                    }

                    // this is for the decimal section, if there is one
                    if ( code === FULL_STOP ) {
                        decimalNum = 0;
                        isDecimal = true;
                        hasMore = false;

                        i++;
                        for ( ; i < strLen; i++ ) {
                            code = str.charCodeAt( i );

                            if ( ZERO <= code && code <= NINE ) {
                                num = num*10 + (code - ZERO);
                                decimalLen++;
                                hasMore = true;

                            // double decimal, like 123.456.789
                            } else if ( code === FULL_STOP ) {
                                state.fail = true;
                                return 0;

                            // look for numbers outside of the 0 to 9 range
                            } else if ( code !== UNDERSCORE ) {
                                break;
                            }
                        }

                        if ( ! hasMore ) {
                            state.fail = true;
                            return 0;
                        }
                    }
                }

                if ( isDecimal ) {
                    tokens.push( TERM_DECIMAL_NUMBER );
                    tokens.push( num|0 );
                    tokens.push( decimalNum|0 );
                    tokens.push( decimalLen|0 );
                } else {
                    tokens.push( TERM_INT_NUMBER );
                    tokens.push( num|0 );
                }

                return i;
            }

            var parseTokens = function( str, state ) {
                var tokens = [];
                var strLen = str.length;
                var numTokens = 0;

                for ( var i = 0; i < strLen; i++ ) {
                    var c = str.charCodeAt( i );

                    // trim whitespace
                    while ( c === SPACE || c === TAB ) {
                        c = str.charCodeAt( ++i );
                    }

                    if ( i < strLen ) {
                        // match precise terminals
                        if ( c === LEFT_BRACKET ) {
                            tokens.push( TERM_LEFT_BRACKET );

                        } else if ( c === RIGHT_BRACKET ) {
                            tokens.push( TERM_RIGHT_BRACKET );

                        } else if ( c === PLUS ) {
                            tokens.push( TERM_PLUS );

                        } else if ( c === SUB ) {
                            tokens.push( TERM_SUB );

                        } else if ( c === MULT ) {
                            tokens.push( TERM_MULT );

                        } else if ( c === DIVIDE ) {
                            tokens.push( TERM_DIVIDE );

                        // is number, supports
                        //  0-9 integer values
                        //  0x  hexadecimal values
                        } else if ( c >= ZERO && c <= NINE ) {
                            var newI = parseTokenNumber( str, state, c, i, tokens );

                            if ( newI > i ) {
                                i = newI-1;
                            } else {
                                state.fail = true;
                                break;
                            }

                        // we don't know what this is o _ O
                        } else {
                            state.fail = true;
                            break;
                        }

                        numTokens++;
                    }
                }

                state.tokensLen = numTokens;

                return tokens;
            }

            var evalExpr = function( tokens, state ) {
                return evalSub( tokens, state );
            }

            var evalSub = function( tokens, state ) {
                var num = evalPlus( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_SUB ) {
                    state.i++;

                    return num - evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalPlus = function( tokens, state ) {
                var num = evalMult( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_PLUS ) {
                    state.i++;

                    return num + evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalMult = function( tokens, state ) {
                var num = evalDivide( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_MULT ) {
                    state.i++;

                    return num * evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalDivide = function( tokens, state ) {
                var num = evalBrackets( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_DIVIDE ) {
                    state.i++;

                    return num / evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalBrackets = function( tokens, state ) {
                var token = tokens[ state.i ];

                if ( token === TERM_PLUS ) {
                    state.i++;
                    return   evalBrackets( tokens, state );
                } else if ( token === TERM_SUB ) {
                    state.i++;
                    return - evalBrackets( tokens, state );
                } else if ( token === TERM_LEFT_BRACKET ) {
                    state.i++;
                    var num = evalExpr( tokens, state );

                    if ( state.fail )
                        return 0;

                    // closing bracket expected
                    var token = tokens[ state.i++ ];
                    if ( token !== TERM_RIGHT_BRACKET ) {
                        state.fail = true;
                    }

                    return num;
                } else {
                    return evalNumber( tokens, state );
                }
            }

            var evalNumber = function( tokens, state ) {
                var i = state.i;
                var token = tokens[ i ];

                var r = 0;
                if ( token === TERM_INT_NUMBER ) {
                    var num = tokens[ i+1 ];
                    state.i += 2;

                    r = num;
                } else if ( token === TERM_DECIMAL_NUMBER ) {
                    var num = tokens[ i+1 ];
                    var decimalNum = tokens[ i+2 ];
                    var decimalLen = tokens[ i+3 ];
                    state.i += 3;

                    var divider = 1;
                    while ( decimalLen --> 0 ) {
                        divider *= 10;
                    }

                    r = num + (decimalNum / divider);
                } else {
                    state.fail = true;
                }

                return r;
            }


            return function(str) {
                var state = {
                    // where we are currently parsing in the string
                    i: 0,

                    // set to true when parsing has failed somehow
                    fail: false,

                    tokensLen: 0
                };

                var tokens = parseTokens( str, state );

                if ( tokens.length > 0 && state.fail === false ) {
                    var result = evalExpr( tokens, state );

                    if ( ! state.fail && state.i === tokens.length ) {
                        return result;
                    }
                }

                return null;
            }
        })()
    );

})();
"use strict";

(function() {
    var IS_TOUCH = !! (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);

    /**
     * How quickly someone must tap,
     * for it to be a 'fast click'.
     *
     * In milliseconds.
     */
    var FAST_CLICK_DURATION = 150,
        FAST_CLICK_DIST = 20,
        SLOW_CLICK_DIST = 15;

    var startTouch = function( xy, touch ) {
        if ( touch ) {
            xy.finger = touch.identifier;
            xy.timestart = Date.now();

            updateXY( xy, touch, false );

            return true;
        } else {
            return false;
        }
    };

    var updateXY = function( xy, ev, updateMove ) {
        var x,
            y;

        if ( ev.offsetX !== undefined ) { // Opera
            x = ev.offsetX;
            y = ev.offsetY;
        } else if ( ev.layerX !== undefined ) { // Firefox
            x = ev.layerX;
            y = ev.layerY;
        } else if ( ev.clientX !== undefined ) {
            x = ev.clientX;
            y = ev.clientY;

            for (
                    var tag = ev.target;
                    tag.offsetParent;
                    tag = tag.offsetParent
            ) {
                x -= tag.offsetLeft;
                y -= tag.offsetTop;
            }
        // fail, so just put no movement in
        } else {
            x = 0;
            y = 0;
        }

        if ( updateMove ) {
            xy.moveX += (xy.x - x)
            xy.moveY += (xy.y - y)
        } else {
            xy.moveX = 0;
            xy.moveY = 0;
        }

        xy.x = x;
        xy.y = y;
    }

    var pressBuilder = function( el, onDown, onMove, onUp ) {
        if ( ! isHTMLElement(el) ) {
            throw new Error( "non-html element given" );
        }

        var xy = {
                timestart : 0,
                finger    : 0,

                x: 0,
                y: 0,

                moveX: 0,
                moveY: 0
        };

        if ( IS_TOUCH ) {
            var touchstart = function( ev ) {
                var touch = ev.changedTouches[ 0 ];
        
                if ( startTouch(xy, touch) ) {
                    onDown.call( el, ev, touch );
                }
            }

            el.addEventListener( 'touchstart', touchstart, false );

            el.addEventListener( 'touchmove', function(ev) {
                if ( xy.finger === -1 ) {
                    touchstart( ev );
                } else {
                    for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                        var touch = ev.changedTouches[ i ];
                    
                        if ( touch && touch.identifier === xy.finger ) {
                            onMove.call( el, ev, touch );
                            return;
                        }
                    }
                }
            }, false );

            var touchEnd = function(ev) {
                for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                    var touch = ev.changedTouches[ i ];
                
                    if ( touch && touch.identifier === xy.finger ) {
                        xy.finger = -1;

                        updateXY( xy, touch, true );

                        var duration = Date.now() - xy.timestart;
                        var dist = Math.sqrt( xy.moveX*xy.moveX + xy.moveY*xy.moveY )

                        if (
                                ( dist < FAST_CLICK_DIST && duration < FAST_CLICK_DURATION ) ||
                                  dist < SLOW_CLICK_DIST
                        ) {
                            // true is a click
                            onUp.call( el, ev, touch, true );
                        } else {
                            // false is a hold
                            onUp.call( el, ev, touch, false );
                        }

                        return;
                    }
                }
            }

            document.getElementsByTagName('body')[0].
                    addEventListener( 'touchend', touchEnd );
            el.addEventListener( 'touchend', touchEnd, false );

            el.addEventListener( 'click', function(ev) {
                if ( (ev.which || ev.button) === 1 ) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            } );
        } else {
            var isDown = false;

            el.addEventListener( 'mousedown', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 ) {
                    isDown = true;
                    onDown.call( el, ev, ev );
                }
            } );

            el.addEventListener( 'mousemove', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 && isDown ) {
                    onMove.call( el, ev, ev );
                }
            } );

            el.addEventListener( 'mouseup', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 && isDown ) {
                    isDown = false;
                    onUp.call( el, ev, ev );
                }
            } );
        }

        return el;
    };

    var clickBuilder = function( el, callback ) {
        if ( ! isHTMLElement(el) ) {
            throw new Error( "non-html element given" );
        }

        var xy = { finger: -1, timestart: 0, x: 0, y: 0, moveX: 0, moveY: 0 };

        if ( IS_TOUCH ) {
            var touchstart = function(ev) {
                startTouch( xy, ev.changedTouches[0] );
            };

            el.addEventListener( 'touchstart', touchstart, false );

            el.addEventListener( 'touchmove', function(ev) {
                if ( xy.finger === -1 ) {
                    touchstart( ev );
                } else {
                    for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                        var touch = ev.changedTouches[ i ];
                    
                        if ( touch && touch.identifier === xy.finger ) {
                            updateXY( xy, touch, true );
                            return;
                        }
                    }
                }
            }, false )

            el.addEventListener( 'touchend', function(ev) {
                for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                    var touch = ev.changedTouches[ i ];
                    
                    if ( touch && touch.identifier === xy.finger ) {
                        xy.finger = -1;

                        updateXY( xy, touch, true );

                        var duration = Date.now() - xy.timestart;
                        var dist = Math.sqrt( xy.moveX*xy.moveX + xy.moveY*xy.moveY )

                        if (
                                ( dist < FAST_CLICK_DIST && duration < FAST_CLICK_DURATION ) ||
                                  dist < SLOW_CLICK_DIST
                        ) {
                            callback.call( el, ev );
                            ev.preventDefault();
                        }

                        return;
                    }
                }
            }, false )

            var killEvent = function(ev) {
                if ( (ev.which || ev.button) === 1 ) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }

            el.addEventListener( 'click'    , killEvent );
            el.addEventListener( 'mouseup'  , killEvent );
            el.addEventListener( 'mousedown', killEvent );
        } else {
            el.addEventListener( 'click', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 ) {
                    ev.preventDefault();
                
                    callback.call( el, ev, ev );
                }
            } );
        }

        return el;
    };

    var holdBuilder = IS_TOUCH ?
            function( el, fun ) {
                pressBuilder(
                        el,

                        // goes down
                        function(ev) {
                            fun.call( el, ev, true, false );
                        },

                        // moves
                        function(ev) {
                            // do nothing
                        },

                        function(ev, touchEv, isClick) {
                            fun.call( el, ev, false, isClick );
                        }
                )

                return el;
            } :
            function( el, fun ) {
                var isDown = false;

                el.addEventListener( 'mousedown', function(ev) {
                    ev = ev || window.event;

                    if ( (ev.which || ev.button) === 1 ) {
                        ev.preventDefault();
                    
                        isDown = true;
                        fun.call( el, ev, true );
                    }
                } );

                el.addEventListener( 'mouseup', function(ev) {
                    ev = ev || window.event;

                    if ( (ev.which || ev.button) === 1 && isDown ) {
                        ev.preventDefault();
                    
                        isDown = false;
                        fun.call( el, ev, false );
                    }
                } );

                return el;
            } ;

    var touchy = window['touchy'] = {
            click: clickBuilder,
            press: pressBuilder,
            hold : holdBuilder
    }
})();
"use strict";(function() {

/* jsx.jsx

=============================================================================== */

    var jsx = window['jsx'] = function( code ) {
        return jsx.compile( code );
    }

    /**
     * ASCII codes for characters.
     *
     * @type {number}
     * @const
     */
    var TAB = 9, // \t
        SLASH_N = 10, // \n
        SLASH_R = 13, // \r

        SPACE = 32,
        EXCLAMATION = 33,
        DOUBLE_QUOTE = 34,
        HASH = 35,
        DOLLAR = 36,
        PERCENT = 37,
        AMPERSAND = 38,
        SINGLE_QUOTE = 39,
        LEFT_PAREN = 40,
        RIGHT_PAREN = 41,
        STAR = 42, // *
        PLUS = 43,
        COMMA = 44,
        MINUS = 45,
        FULL_STOP = 46,
        SLASH = 47,

        ZERO = 48,
        ONE = 49,
        TWO = 50,
        THREE = 51,
        FOUR = 52,
        FIVE = 53,
        SIX = 54,
        SEVEN = 55,
        EIGHT = 56,
        NINE = 57,

        COLON = 58,
        SEMI_COLON = 59,

        LESS_THAN = 60,
        EQUAL = 61,
        GREATER_THAN = 62,
        QUESTION_MARK = 63,
        AT = 64,

        UPPER_A = 65,
        UPPER_F = 70,
        UPPER_Z = 90,

        LEFT_SQUARE = 91,
        BACKSLASH = 92,
        RIGHT_SQUARE = 93,
        CARET = 94,
        UNDERSCORE = 95,

        LOWER_A = 97,
        LOWER_B = 98,
        LOWER_C = 99,
        LOWER_D = 100,
        LOWER_E = 101,
        LOWER_F = 102,
        LOWER_G = 103,
        LOWER_H = 104,
        LOWER_I = 105,
        LOWER_J = 106,
        LOWER_K = 107,
        LOWER_L = 108,
        LOWER_M = 109,
        LOWER_N = 110,
        LOWER_O = 111,
        LOWER_P = 112,
        LOWER_Q = 113,
        LOWER_R = 114,
        LOWER_S = 115,
        LOWER_T = 116,
        LOWER_U = 117,
        LOWER_V = 118,
        LOWER_W = 119,
        LOWER_X = 120,
        LOWER_Y = 121,
        LOWER_Z = 122,

        LEFT_BRACE = 123,
        BAR = 124,
        RIGHT_BRACE = 125,
        TILDA = 126;



    /**
     * Note this doesn't tell you in full if something is numeric because it
     * also depends on the context of the whole word. 
     *
     * For example 'b' will fail with this test, however '0b1111' is numeric.
     * Only rely on this for checking a single character and not the whole word.
     *
     * @return True or False if the code is for an ASCII character between 0 and 9.
     */
    var isNumeric = function( code ) {
        return ( code >= ZERO && code <= NINE ) ;
    }



    /**
     *
     */
    var isAlphaNumeric = function( code ) {
        return (
            ( code >= LOWER_A && code <= LOWER_Z ) || // lower case letter
            ( code >= UPPER_A && code <= UPPER_Z ) || // upper case letter
            ( code === UNDERSCORE ) ||
            ( code >= ZERO && code <= NINE )     // a number
            );
    }



    var scriptOrderArray = [];

    var orderCallbacks = function( arr, callback ) {
        var i = arr.length;
        arr.push({ callback: callback, args: undefined, self: undefined });

        return function() {
            if ( arr[0].callback === callback ) {
                arr.shift().callback.apply( this, arguments );

                while ( arr.length > 0 && arr[0].args !== undefined ) {
                    var obj = arr.shift();

                    obj.callback.apply( obj.self, obj.args );
                }
            } else {
                var obj = arr[i];

                obj.args = arguments;
                obj.self = this;
            }
        }
    }

    jsx.executeScripts = function() {
        setTimeout( function() {
            var scripts = document.getElementsByTagName( 'script' );

            for ( var i = 0; i < scripts.length; i++ ) {
                var src = scripts[i].getAttribute( 'src' );
                var type = scripts[i].getAttribute('type');

                if ( src ) {
                    if ( isJSXScriptType(type) ) {
                        jsx.executeUrl( src );
                   }
                } else if ( isJSXScriptType(type) ) {
                    jsx.executeCode( script.innerHTML );
                }
            }
        }, 0 );
    }


    jsx.executeUrl = function( url ) {
        if ( typeof url === 'string' ) {
            jsx.compileUrl( url, orderCallbacks(scriptOrderArray, function(err, code) {
                if ( err ) {
                    throw err;
                } else {
                    newScriptCode( code, url );
                }
            }) );
        } else if ( url instanceof Array ) {
            for ( var i = 0; i < url.length; i++ ) {
                jsx.executeUrl( url[i], callback );
            }
        } else {
            throw new Error( 'unknown value given for url, ' + url );
        }
    }



    jsx.executeCode = function( code ) {
        setTimeout( orderCallbacks(scriptOrderArray, function() {
            newScriptCode( code, url );
        }), 0);
    }


    jsx.compileUrl = function( url, callback ) {
        try {
            var ajaxObj = new window.XMLHttpRequest();

            ajaxObj.onreadystatechange = function() {
                if ( ajaxObj.readyState === 4 ) {
                    var err    = undefined,
                        status = ajaxObj.status;

                    if ( ! (status >= 200 && status < 300 || status === 304) ) {                    
                        err = new Error( "error connecting to url " + url.escapeHTML() + ', ' + status );
                        callback( err, null, url, ajaxObj );
                    } else {
                        var code = jsx.compile( ajaxObj.responseText );
                        callback( null, code, url, ajaxObj );
                    }
                }
            }

            ajaxObj.open( 'GET', url, true );
            ajaxObj.send();
        } catch ( ex ) {
            /*
             * If access using XMLHttpRequest failed, try the ActiveX file
             * system instead (for .hta files or JScript).
             */
            if ( ex.message.toLowerCase().indexOf("access is denied.") === 0 ) {
                if ( "ActiveXObject" in window ) {
                    try {
                        var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
                        var path;

                        if ( url.search(/^(\/|\\|file:\/\/|http:\/\/|https:\/\/)/) === 0 ) {
                            path = url.replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '');
                        } else {
                            path = document.URL.
                                    replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '').
                                    replace(/\\/g, "/").
                                    split("/").
                                    drop(-1).
                                    join( "/" ) + "/" + url;
                        }

                        var file = fileSystem.OpenTextFile( path, 1, false );
                        if ( file ) {
                            var code = jsx.compile( file.readAll() );
                            file.Close();

                            // this *must* be done in the future
                            setTimeout( function() {
                                callback( null, code, url, null );
                            }, 0 );

                            return;
                        }
                    } catch ( ex ) {
                        // do nothing
                    }
                }
            }

            callback(ex, null, url, null);
        }
    };


    var replaceIndentationWithOpenDoubleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return '    "';
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + '"';
        } else {
            return match;
        }
    };

    var replaceIndentationWithOpenSingleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return "    '";
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + "'";
        } else {
            return match;
        }
    };

    var parseInjectedVariables = function( injectedVariables ) {
        var str = '';

        for ( var k in injectedVariables ) {
            if ( injectedVariables.hasOwnProperty(k) ) {
                str += 
                        "window['" +
                                k.replace(/'/g, "\\'").replace(/\\/g, "\\\\") +
                        "'] = " + 
                        injectedVariables[k] +
                        ";";
            }
        }

        return str;
    }

    jsx.compile = function( code, injectedVariables ) {
        var injectedCode = '';
        if ( injectedVariables ) {
            injectedCode = parseInjectedVariables( injectedVariables );
        }

        var lines = code.split(/\n\r|\r\n|\n|\r/);

        var isMarkdown      = true,
            commentStarted  = false,
            isExample       = false,
            seenExample     = false,
            isList          = false;

        var code = [ '"use strict";(function() {' + injectedCode ];

        var isDoubleComment = false;
        var inDoubleString = false;
        var inSingleString = false;

        for ( var i = 0; i < lines.length; i++ ) {
            var line = lines[i];

            /*
             * Work out what to build.
             */

            if ( isMarkdown ) {
                if (
                        seenExample &&
                        line.length < 4
                ) {
                    isExample   = false;
                    seenExample = false;
                } else if (
                    line.length === 3 &&
                    line.charAt(0) === '`' &&
                    line.charAt(1) === '`' &&
                    line.charAt(2) === '`'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if (
                    line.length >= 8 &&
                    line.charAt(0) === '@' &&
                    line.charAt(1) === 'e' &&
                    line.charAt(2) === 'x' &&
                    line.charAt(3) === 'a' &&
                    line.charAt(4) === 'm' &&
                    line.charAt(5) === 'p' &&
                    line.charAt(6) === 'l' &&
                    line.charAt(7) === 'e'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if ( isExample && !seenExample && line.trim() !== '' ) {
                    seenExample = true;

                } else if (
                        line.length > 4 &&
                        line.charAt(0) === ' ' &&
                        line.charAt(1) === ' ' &&
                        line.charAt(2) === ' ' &&
                        line.charAt(3) === ' '
                ) {
                    if ( isList && line.trim() !== '' ) {
                        // ignore, if this is a continuation of a list
                    } else if ( ! isExample ) {
                        isMarkdown = false;
                    }
                } else if ( isList ) {
                    if ( line.trim() === '' ) {
                        isList = false;
                    } else if ( ! isListTest(line) ) {
                        isList = false;
                    }
                } else if ( isListTest(line) ) {
                    isList = true;
                }
            } else {
                if (
                            line.trim().length > 0 &&
                            (
                                line.charAt(0) !== ' ' ||
                                line.charAt(1) !== ' ' ||
                                line.charAt(2) !== ' ' ||
                                line.charAt(3) !== ' '
                            )
                ) {
                    isMarkdown = true;
                }
            }

            /*
             * Now actually build the new line.
             */
            
            if ( isMarkdown ) {
                var codeLine;

                if ( ! commentStarted ) {
                    codeLine = " /* ";
                    commentStarted = true;
                } else {
                    codeLine = '';
                }

                code.push( codeLine + line.replace( /\*\//g, "* /" ) )
            } else {
                // end the 'previous' line
                if ( commentStarted ) {
                    code[i-1] += " */";
                    commentStarted = false;
                }

                for ( ; i < lines.length; i++ ) {
                    var l = lines[i];

                    /*
                     * we chomp till we reach markdown,
                     * so when we reach it, back up (with i--),
                     * and deal with the markdown on the next outer loop.
                     */
                    // if the line has content, and does not start with 4 spaces ...
                    if ( 
                            l.trim().length > 0 &&
                            (
                                l.charAt(0) !== ' ' ||
                                l.charAt(1) !== ' ' ||
                                l.charAt(2) !== ' ' ||
                                l.charAt(3) !== ' '
                            )
                    ) {
                        isMarkdown = true;
                        i--;
                        break;
                    }

                    var lLen = l.length;
                    for ( var k = 0; k < lLen; k++ ) {
                        var c = l.charAt(k);

                        // these are in order of precedence
                        if ( inDoubleString ) {
                            if (
                                                c === '"' &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inDoubleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenDoubleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( inSingleString ) {
                            if (
                                                c === "'" &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inSingleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenSingleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( isDoubleComment ) {
                            if (
                                                c === '*' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                isDoubleComment = false;

                                // +1 so we include this character too

                                k++;
                            }
                        } else {
                            /*
                             * Look to enter a new type of block,
                             * such as comments, strings, inlined-JS code.
                             */

                            // multi-line comment
                            if (
                                    c === '/' &&
                                    l.charAt(k+1) === '*'
                            ) {
                                k++;

                                isDoubleComment = true;
                            } else if (
                                    c === '/' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                /* skip the rest of the line for parsing */
                                break;

                            // look for strings
                            } else if ( c === '"' ) {
                                inDoubleString = true;
                            } else if ( c === "'" ) {
                                inSingleString = true;
                            } else if ( c === '/' ) {
                                // todo
                                // replace with '#' for ecmascript 6
                               
                            // change '!=' to '!=='
                            } else if (
                                                c === '!' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '!==' + l.substring( k+2 );
                                }

                                // skip past the '!=='
                                k += 3 - 1;

                            // change '==' to '==='
                            } else if (
                                                c === '=' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '===' + l.substring( k+2 );
                                }

                                // skip past the '==='
                                k += 3 - 1;

                            // change '<-' to 'return'
                            } else if (
                                                c === '<' &&
                                    l.charAt(k+1) === '-' &&
                                    l.charAt(k+2) === ' ' &&
                                    l.charAt(k-1) !== '<'
                            ) {
                                l = l.substring( 0, k ) + 'return' + l.substring( k+2 );
                                k += 6 - 1; // length of 'return' - 1

                             // ?? -> arguments[arguments.i = ++arguments.i || 0]
                            } else if (
                                                c === '?' &&
                                    l.charAt(k+1) === '?' &&
                                    l.charAt(k-1) !== '?' &&
                                    l.charAt(k+2) !== '?'
                            ) {
                                var newString = '(arguments[arguments.i = ++arguments.i||0])';
                                l = l.substring( 0, k ) + newString + l.substring( k+2 );
                                k += newString.length + 1;

                            // 0b010101 number literal
                            } else if (
                                                    c === '0' &&
                                    l.charCodeAt(k+1) === LOWER_B &&
                                    ! isAlphaNumeric(l.charCodeAt(k-1))
                            ) {
                                // +2 is to skip the '0b' we have already seen
                                var charI = k + 2;
                                while ( charI < lLen ) {
                                    var charC = l.charCodeAt( charI++ );

                                    if ( charC !== ZERO && charC !== ONE ) {
                                        break;
                                    }
                                }

                                if ( charI > k + 3 ) {
                                    var num = l.substring( k+2, charI );
                                    var numString = parseInt( num, 2 ) + '';
                                    l = l.substring( 0, k ) + numString + l.substring( charI );

                                    k += numString.length;
                                }

                            // numbers that are actually strings
                            //  i.e. 100%, 10px
                            } else if ( isNumeric(l.charCodeAt(k)) ) {
                                var charI = k+1;
                                var isString = false;

                                while ( charI < lLen ) {
                                    var charC = l.charCodeAt( charI++ );

                                    if (
                                            charC === SPACE ||
                                            charC === TAB   ||
                                            charC === SLASH_N ||
                                            charC === SLASH_R
                                    ) {
                                        break;

                                    } else if ( ! isNumeric(charC) ) {
                                        isString = true;

                                    }
                                }

                                if ( isString ) {
                                    var newStr = '"' + l.substring( k+2, charI ) + '"' ;
                                    l = l.substring( 0, k ) + newStr + l.substring( charI );
                                    k += newStr.length;
                                }

                            // for css colours like #aaa
                            } else if ( c === '#' ) {
                                var charI = k+1;

                                while ( charI < lLen && isBreakCharCode(l.charCodeAt(charI)) ) {
                                    charI++
                                }

                                var newStr = '"' + l.substring( k+2, charI ) + '"' ;
                                l = l.substring( 0, k ) + newStr + l.substring( charI );
                                k += newStr.length;
                            }

                        }
                    } // for c in line

                    code.push( l );
                }
            }
        }

        code.push( '})();' );
        code.push( '' );

        return code.join( "\n" );
    }

    var newScriptCode = function( code, src ) {
        src = src || "<anonymous script tag>";

        var exception = null;
        var catchException = function(ex) {
            exception = ex;
            return true;
        }

        window.addEventListener( 'error', catchException, true );

        var script = document.createElement('script');
        script.innerHTML = code;
        document.head.appendChild( script );

        window.removeEventListener( 'error', catchException, true );

        if ( exception !== null ) {
            throw new Error( 
                    src + "\n" +
                    "line " + (exception.lineno || exception.lineNumber) + "\n" +
                    (exception.message || exception.description)
            );
        }
    }


    var isListTest = function( line ) {
        return (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '-' &&
                                line.charAt(2) !== '-'
                        ) || (
                                line.charAt(0) === '-' &&
                                line.charAt(1) !== '-' &&
                                line.length > 2
                        )
                ) || (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '*' &&
                                line.charAt(2) !== '*'
                        ) || (
                                line.charAt(0) === '*' &&
                                line.charAt(1) !== '*' &&
                                line.length > 2
                        )
                );
    }

    var isJSXScriptType = function( type ) {
        if ( type !== null && type !== undefined && type !== '' ) {
            type = type.toLowerCase();

            return (
                    type === 'jsx' ||
                    type === 'text/jsx' ||
                    type === 'text\\jsx' ||
                    type === 'application/jsx' ||
                    type === 'application\\jsx'
            );
        } else {
            return false;
        }
    }

    var script = document.currentScript;
    if ( ! script ) {
        var scripts = document.getElementsByTagName( 'script' );
        script = scripts[ scripts.length - 1 ];
    }

    if ( script && script.getAttribute('data-autocompile') === 'true' ) {
        jsx.executeScripts();
    }


})();
"use strict";(function() {

/* ===============================================================================

# JSX Compiler

JSX are the language extensions on top of JavaScript, which most of platform.js
is written in (most at the time of writing).

This file contains the code to attach in the JSX compiler, so JSX can compile 
JSX.

### autocompile jsx files

If you set 'data-autocompile="true"' on the platform.js script tag, for example

```
    <script src="platform.js" data-autocompile="true"></script>

then all of your jsx scripts will be extracted from the head, compiled, and
then executed automatically.

===============================================================================

-------------------------------------------------------------------------------

## jsx( code )

The jsx module is a self executing function, which also has properties on it
you can execute. Like the $ in jQuery.

Given JSX code, this will return it compiled into JS.

------------------------------------------------------------------------------- */

    var jsx = window['jsx'] = function( code ) {
        return jsx.compile( code );
    }

/* -------------------------------------------------------------------------------

## orderCallbacks

Helper function, which pushes callbacks into an array, and then returns a 
function to replace that callback. This function ensures that when the function
is called, the callbacks in the array are called in the order they were placed
there.

------------------------------------------------------------------------------- */

    var scriptOrderArray = [];

    var orderCallbacks = function( arr, callback ) {
        var i = arr.length;
        arr.push({ callback: callback, args: undefined, self: undefined });

        return function() {
            if ( arr[0].callback === callback ) {
                arr.shift().callback.apply( this, arguments );

                while ( arr.length > 0 && arr[0].args !== undefined ) {
                    var obj = arr.shift();

                    obj.callback.apply( obj.self, obj.args );
                }
            } else {
                var obj = arr[i];

                obj.args = arguments;
                obj.self = this;
            }
        }
    }

/* -------------------------------------------------------------------------------

## jsx.executeScripts

------------------------------------------------------------------------------- */

    jsx.executeScripts = function() {
        setTimeout( function() {
            var scripts = document.getElementsByTagName( 'script' );

            for ( var i = 0; i < scripts.length; i++ ) {
                var src = scripts[i].getAttribute( 'src' );
                var type = scripts[i].getAttribute('type');

                if ( src ) {
                    if ( isJSXScriptType(type) ) {
                        jsx.executeUrl( src );
                   }
                } else if ( isJSXScriptType(type) ) {
                    jsx.executeCode( script.innerHTML );
                }
            }
        }, 0 );
    }


/* -------------------------------------------------------------------------------

## jsx.executeUrl( url )

Note that you can provide a single url as a string, or multiple urls in an 
array.

------------------------------------------------------------------------------- */

    jsx.executeUrl = function( url ) {
        if ( typeof url === 'string' ) {
            jsx.compileUrl( url, orderCallbacks(scriptOrderArray, function(err, code) {
                if ( err ) {
                    throw err;
                } else {
                    newScriptCode( code, url );
                }
            }) );
        } else if ( url instanceof Array ) {
            for ( var i = 0; i < url.length; i++ ) {
                jsx.executeUrl( url[i], callback );
            }
        } else {
            throw new Error( 'unknown value given for url, ' + url );
        }
    }


/* -------------------------------------------------------------------------------

## jsx.executeCode( code )

Parses the given code, and then inserts it into a script tag.

------------------------------------------------------------------------------- */

    jsx.executeCode = function( code ) {
        setTimeout( orderCallbacks(scriptOrderArray, function() {
            newScriptCode( code, url );
        }), 0);
    }


/* -------------------------------------------------------------------------------

## jsx.compileUrl( url, callback )

Callback must take the form

```
    function( ex:Error, code:string, url:string, ajaxObj:XMLHttpRequest )

 * 'Ex' will be null if there was no error, and non-null if there was an error.

 * 'url' is the url you gave to the compileUrl function.

 * 'code' is the compiled code, which will only be present if the request was
   successful. It will be null if it was not successful.

 * 'ajaxObj' is the object used to make the request, and is provided for 
   completeness. If for some reason the ajax object failed to be created, then
   this will be null.

------------------------------------------------------------------------------- */

    jsx.compileUrl = function( url, callback ) {
        try {
            var ajaxObj = new window.XMLHttpRequest();

            ajaxObj.onreadystatechange = function() {
                if ( ajaxObj.readyState === 4 ) {
                    var err    = undefined,
                        status = ajaxObj.status;

                    if ( ! (status >= 200 && status < 300 || status === 304) ) {                    
                        err = new Error( "error connecting to url " + url.escapeHTML() + ', ' + status );
                        callback( err, null, url, ajaxObj );
                    } else {
                        var code = jsx.compile( ajaxObj.responseText );
                        callback( null, code, url, ajaxObj );
                    }
                }
            }

            ajaxObj.open( 'GET', url, true );
            ajaxObj.send();
        } catch ( ex ) {
            /*
             * If access using XMLHttpRequest failed, try the ActiveX file
             * system instead (for .hta files or JScript).
             */
            if ( ex.message.toLowerCase().indexOf("access is denied.") === 0 ) {
                if ( "ActiveXObject" in window ) {
                    try {
                        var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
                        var path;

                        if ( url.search(/^(\/|\\|file:\/\/|http:\/\/|https:\/\/)/) === 0 ) {
                            path = url.replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '');
                        } else {
                            path = document.URL.
                                    replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '').
                                    replace(/\\/g, "/").
                                    split("/").
                                    drop(-1).
                                    join( "/" ) + "/" + url;
                        }

                        var file = fileSystem.OpenTextFile( path, 1, false );
                        if ( file ) {
                            var code = jsx.compile( file.readAll() );
                            file.Close();

                            // this *must* be done in the future
                            setTimeout( function() {
                                callback( null, code, url, null );
                            }, 0 );

                            return;
                        }
                    } catch ( ex ) {
                        // do nothing
                    }
                }
            }

            callback(ex, null, url, null);
        }
    };

/* -------------------------------------------------------------------------------

## jsx.compile( srcCode )

------------------------------------------------------------------------------- */

    jsx.compile = function( srcCode, injectedVariables ) {
        var injectedCode = '';
        if ( injectedVariables ) {
            injectedCode = parseInjectedVariables( injectedVariables );
        }

        var lines = srcCode.split(/\n\r|\r\n|\n|\r/);

        var isMarkdown      = true,
            commentStarted  = false,
            isExample       = false,
            seenExample     = false,
            isList          = false;

        var code = [ '"use strict";(function() {' + injectedCode ];

        var isDoubleComment = false;
        var inDoubleString = false;
        var inSingleString = false;

        for ( var i = 0; i < lines.length; i++ ) {
            var line = lines[i];

            /*
             * Work out what to build.
             */

            if ( isMarkdown ) {
                if (
                        seenExample &&
                        line.length < 4
                ) {
                    isExample   = false;
                    seenExample = false;
                } else if (
                    line.length === 3 &&
                    line.charAt(0) === '`' &&
                    line.charAt(1) === '`' &&
                    line.charAt(2) === '`'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if (
                    line.length >= 8 &&
                    line.charAt(0) === '@' &&
                    line.charAt(1) === 'e' &&
                    line.charAt(2) === 'x' &&
                    line.charAt(3) === 'a' &&
                    line.charAt(4) === 'm' &&
                    line.charAt(5) === 'p' &&
                    line.charAt(6) === 'l' &&
                    line.charAt(7) === 'e'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if ( isExample && !seenExample && line.trim() !== '' ) {
                    seenExample = true;

                } else if (
                        line.length > 4 &&
                        line.charAt(0) === ' ' &&
                        line.charAt(1) === ' ' &&
                        line.charAt(2) === ' ' &&
                        line.charAt(3) === ' '
                ) {
                    if ( isList && line.trim() !== '' ) {
                        // ignore, if this is a continuation of a list
                    } else if ( ! isExample ) {
                        isMarkdown = false;
                    }
                } else if ( isList ) {
                    if ( line.trim() === '' ) {
                        isList = false;
                    } else if ( ! isListTest(line) ) {
                        isList = false;
                    }
                } else if ( isListTest(line) ) {
                    isList = true;
                }
            } else {
                if (
                            line.trim().length > 0 &&
                            (
                                line.charAt(0) !== ' ' ||
                                line.charAt(1) !== ' ' ||
                                line.charAt(2) !== ' ' ||
                                line.charAt(3) !== ' '
                            )
                ) {
                    isMarkdown = true;
                }
            }

            /*
             * Now actually build the new line.
             */
            
            if ( isMarkdown ) {
                var codeLine;

                if ( ! commentStarted ) {
                    codeLine = " /* ";
                    commentStarted = true;
                } else {
                    codeLine = '';
                }

                code.push( codeLine + line.replace( /\*\//g, "* /" ) )
            } else {
                // end the 'previous' line
                if ( commentStarted ) {
                    code[i-1] += " */";
                    commentStarted = false;
                }

                for ( ; i < lines.length; i++ ) {
                    var l = lines[i];

                    /*
                     * we chomp till we reach markdown,
                     * so when we reach it, back up (with i--),
                     * and deal with the markdown on the next outer loop.
                     */
                    // if the line has content, and does not start with 4 spaces ...
                    if ( 
                            l.trim().length > 0 &&
                            (
                                l.charAt(0) !== ' ' ||
                                l.charAt(1) !== ' ' ||
                                l.charAt(2) !== ' ' ||
                                l.charAt(3) !== ' '
                            )
                    ) {
                        isMarkdown = true;
                        i--;
                        break;
                    }

                    var lLen = l.length;
                    for ( var k = 0; k < lLen; k++ ) {
                        var c = l.charAt(k);

                        // these are in order of precedence
                        if ( inDoubleString ) {
                            if (
                                                c === '"' &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inDoubleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenDoubleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( inSingleString ) {
                            if (
                                                c === "'" &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inSingleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenSingleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( isDoubleComment ) {
                            if (
                                                c === '*' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                isDoubleComment = false;

                                // +1 so we include this character too

                                k++;
                            }
                        } else {
                            /*
                             * Look to enter a new type of block,
                             * such as comments, strings, inlined-JS code.
                             */

                            // multi-line comment
                            if (
                                    c === '/' &&
                                    l.charAt(k+1) === '*'
                            ) {
                                k++;

                                isDoubleComment = true;
                            } else if (
                                    c === '/' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                /* skip the rest of the line for parsing */
                                break;

                            // look for strings
                            } else if ( c === '"' ) {
                                inDoubleString = true;
                            } else if ( c === "'" ) {
                                inSingleString = true;

                            } else if ( c === '/' ) {
                                // todo
                                // replace with '#' for ecmascript 6
                               
                            // change '!=' to '!=='
                            } else if (
                                                c === '!' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '!==' + l.substring( k+2 );
                                }

                                // skip past the '!=='
                                k += 3 - 1;

                            // change '==' to '==='
                            } else if (
                                                c === '=' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '===' + l.substring( k+2 );
                                }

                                // skip past the '==='
                                k += 3 - 1;

                            // change '<-' to 'return'
                            } else if (
                                                c === '<' &&
                                    l.charAt(k+1) === '-' &&
                                    l.charAt(k+2) === ' ' &&
                                    l.charAt(k-1) !== '<'
                            ) {
                                l = l.substring( 0, k ) + 'return' + l.substring( k+2 );
                                k += 6 - 1; // length of 'return' - 1
                             // ?? -> arguments[arguments.i = ++arguments.i || 0]
                            } else if (
                                                c === '?' &&
                                    l.charAt(k+1) === '?' &&
                                    l.charAt(k-1) !== '?' &&
                                    l.charAt(k+2) !== '?'
                            ) {
                                var newString = '(arguments[arguments.i = ++arguments.i||0])';
                                l = l.substring( 0, k ) + newString + l.substring( k+2 );
                                k += newString.length + 1;
                            }
                        }
                    } // for c in line

                    code.push( l );
                }
            }
        }

        code.push( '})();' );
        code.push( '' );

        return code.join( "\n" );
    }

    var replaceIndentationWithOpenDoubleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return '    "';
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + '"';
        } else {
            return match;
        }
    };

    var replaceIndentationWithOpenSingleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return "    '";
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + "'";
        } else {
            return match;
        }
    };

    var parseinjectedvariables = function( injectedvariables ) {
        var str = '';

        for ( var k in injectedvariables ) {
            if ( injectedvariables.hasownproperty(k) ) {
                str += 
                        "window['" +
                                k.replace(/'/g, "\\'").replace(/\\/g, "\\\\") +
                        "'] = " + 
                        injectedvariables[k] +
                        ";";
            }
        }

        return str;
    }

/* -------------------------------------------------------------------------------

### newScriptCode( code:string, src:string )

Creates a new script tag, and adds it to the head, for it to be executed.

------------------------------------------------------------------------------- */

    var newScriptCode = function( code, src ) {
        src = src || "<anonymous script tag>";

        var exception = null;
        var catchException = function(ex) {
            exception = ex;
            return true;
        }

        window.addEventListener( 'error', catchException, true );

        var script = document.createElement('script');
        script.innerHTML = code;
        document.head.appendChild( script );

        window.removeEventListener( 'error', catchException, true );

        if ( exception !== null ) {
            throw new Error( 
                    src + "\n" +
                    "line " + (exception.lineno || exception.lineNumber) + "\n" +
                    (exception.message || exception.description)
            );
        }
    }

/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var isListTest = function( line ) {
        return (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '-' &&
                                line.charAt(2) !== '-'
                        ) || (
                                line.charAt(0) === '-' &&
                                line.charAt(1) !== '-' &&
                                line.length > 2
                        )
                ) || (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '*' &&
                                line.charAt(2) !== '*'
                        ) || (
                                line.charAt(0) === '*' &&
                                line.charAt(1) !== '*' &&
                                line.length > 2
                        )
                );
    }


/* -------------------------------------------------------------------------------

### isJSXScriptType( type:string )

Used to test if the 'type' attribute of a script tag, is the correct type for
a JSX file.

@param The type returned from calling 'getAttribute("type")' on a script tag.
@return True if there is a type, and it's a JSX type, otherwise false.

------------------------------------------------------------------------------- */

    var isJSXScriptType = function( type ) {
        if ( type !== null && type !== undefined && type !== '' ) {
            type = type.toLowerCase();

            return (
                    type === 'jsx' ||
                    type === 'text/jsx' ||
                    type === 'text\\jsx' ||
                    type === 'application/jsx' ||
                    type === 'application\\jsx'
            );
        } else {
            return false;
        }
    }

/* -------------------------------------------------------------------------------

Automatically parse scripts if the 'data-autocompile="true"' is set on this
script tag.

------------------------------------------------------------------------------- */

    var script = document.currentScript;
    if ( ! script ) {
        var scripts = document.getElementsByTagName( 'script' );
        script = scripts[ scripts.length - 1 ];
    }

    if ( script && script.getAttribute('data-autocompile') === 'true' ) {
        jsx.executeScripts();
    }


})();
"use strict";(function() {

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

    var DEFAULT_ELEMENT = 'div';

    var WHITESPACE_REGEX = / +/g;

    var STOP_PROPAGATION_FUN = function( ev ) {
        ev.stopPropagation();
    }

    var PREVENT_DEFAULT_FUN = function( ev ) {
        ev.preventDefault();
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



    var listToDataMap = function( arr ) {
        var map = {};

        for ( var i = 0; i < arr.length; i++ ) {
            var el = arr[i];

            assert( ! map.has(el), "duplicate entry found in list '" + el + "'" );
            map[ el ] = BROWSER_PROVIDED_DEFAULT;
        }

        return map;
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

    var HTML_ELEMENTS = [
            'a',
            'abbr',
            'address',
            'area',
            'article',
            'aside',
            'audio',
            'b',
            'base',
            'bdi',
            'bdo',
            'blockquote',
            'body',
            'br',
            'button',
            'canvas',
            'caption',
            'cite',
            'code',
            'col',
            'colgroup',
            'data',
            'datalist',
            'dd',
            'del',
            'details',
            'dfn',
            'dialog',
            'div',
            'dl',
            'dt',
            'em',
            'embed',
            'fieldset',
            'figcaption',
            'figure',
            'footer',
            'form',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'head',
            'header',
            'hgroup',
            'hr',
            'html',
            'i',
            'iframe',
            'img',
            'input',
            'ins',
            'kbd',
            'keygen',
            'label',
            'legend',
            'li',
            'link',
            'map',
            'mark',
            'menu',
            'menuitem',
            'meta',
            'meter',
            'nav',
            'noscript',
            'object',
            'ol',
            'optgroup',
            'option',
            'output',
            'p',
            'param',
            'pre',
            'progress',
            'q',
            'rp',
            'rt',
            'ruby',
            's',
            'samp',
            'script',
            'section',
            'select',
            'small',
            'source',
            'span',
            'strong',
            'style',
            'sub',
            'summary',
            'sup',
            'table',
            'tbody',
            'td',
            'textarea',
            'tfoot',
            'th',
            'thead',
            'time',
            'title',
            'tr',
            'track',
            'u',
            'ul',
            'var',
            'video',
            'wbr'
    ];

/* -------------------------------------------------------------------------------

## HTML Events

All of the HTML events available.

------------------------------------------------------------------------------- */

    var HTML_EVENTS = [
            /* CSS Events */

            // this is added manually as a custom event,
            // to deal with prefixes.
            
            'transitionend',
            'animationstart',
            'animationend',
            'animationiteration',

            /* Touch Events */
            'touchstart',
            'touchend',
            'touchmove',
            'touchcancel',

            /* Drag n' Drop Events */
            'drag',
            'dragstart',
            'dragend',
            'dragover',
            'dragenter',
            'dragleave',
            'drop',

            /* HTML5 Events (minus those which are also L3) */
            'afterprint',
            'beforeprint',
            'beforeunload',
            'change',
            'contextmenu',
            'DOMContentLoaded',
            'hashchange',
            'input',
            'invalid',
            'message',
            'offline',
            'online',
            'pagehide',
            'pageshow',
            'popstate',
            'readystatechange',
            'reset',
            'show',
            'submit',
                
            /* L3 Dom Events */
            'DOMActivate',
            'load',
            'unload',
            'abort',
            'error',
            'select',
            'resize',
            'scroll',

            'blur',
            'DOMFocusIn',
            'DOMFocusOut',
            'focus',
            'focusin',
            'focusout',

            'click',
            'dblclick',
            'mousedown',
            'mouseenter',
            'mouseleave',
            'mousemove',
            'mouseover',
            'mouseout',
            'mouseup',

            'wheel',

            'keydown',
            'keypress',
            'keyup',

            'compositionstart',
            'compositionupdate',
            'compositionend',

            'DOMAttrModified',
            'DOMCharacterDataModified',
            'DOMNodeInserted',
            'DOMNodeInsertedIntoDocument',
            'DOMNodeRemoved',
            'DOMNodeRemovedFromDocument',
            'DOMSubtreeModified'
    ];

/* -------------------------------------------------------------------------------

### assertParent( dom:Element )

Throws an error, if the given dom element does not have a parent node.

------------------------------------------------------------------------------- */

    var assertParent = function( dom ) {
        assert( dom.parentNode !== null,
                "dom is not in the document; it doesn't have a parentNode" );
    }

/* -------------------------------------------------------------------------------

### newRegisterMethod

Generates a register method.

We generate it, so we can avoid the cost of passing
in a callback method.

@param methodName The name of this method (for internal recursive calls).
@param methodNameOne The name of the callback to perform, on this object.

------------------------------------------------------------------------------- */

    var newRegisterMethod = function( methodName, methodNameOne ) {
        return new Function( "name", "fun", [
                        '    var argsLen = arguments.length;',
                        '    ',
                        '    if ( argsLen === 1 ) {',
                        '        assertObjectLiteral( name, ' +
                        '                "non-object given for registering" ',
                        '        );',
                        '        ',
                        '        for ( var k in name ) {',
                        '            if ( name.has(k) ) {',
                        '                this.' + methodName + '(k, name[k]);',
                        '            }',
                        '        }',
                        '    } else if ( argsLen === 2 ) {',
                        '        if ( name instanceof Array ) {',
                        '            for ( var i = 0; i < name.length; i++ ) {',
                        '                this.' + methodName + '(name[i], fun);',
                        '            }',
                        '        } else {',
                        '            assertString( name, "non-string given for name" );',
                        '            assertFunction( fun, "non-function given for function" );',
                        '            ',
                        '            this.' + methodNameOne + '( name, fun );',
                        '        }',
                        '    } else if ( argsLen === 0 ) {',
                        '        fail( "no parameters given" )',
                        '    } else {',
                        '        var names = new Array( argsLen-1 );',
                        '        fun = arguments[ argsLen-1 ];',
                        '        ',
                        '        for ( var i = 0; i < argsLen-1; i++ ) {',
                        '            names[i] = arguments[i];',
                        '        }',
                        '        ',
                        '        this.' + methodName + '( names, fun );',
                        '    }',
                        '    ',
                        '    return this;'
                ].join("\n")
        )
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
            if ( obj.has(k) ) {
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
        if ( dom instanceof Array ) {
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

    var applyArray = function(bb, bbGun, dom, args, startI) {
        if ( args !== null ) {
            var argsLen = args.length;

            for (var i = startI; i < argsLen; i++) {
                applyOne(bb, bbGun, dom, args[i], false);
            }
        }

        return dom;
    }

    var runAttrFun = function( bb, bbGun, dom, arg ) {
        bb.__doms[ bb.__domsI ] = dom;
        bb.__domsI++;

        var r;
        if ( bbGun !== null ) {
            r = arg.call( bbGun );
        } else {
            r = arg.call( dom );
        }

        /*
         * Any non-undefined result is appended.
         */

        if ( r !== undefined ) {
            if ( isArray(r) ) {
                addArray( bb, dom, r, 0 );
            } else {
                addOne( bb, dom, r );
            }
        }

        bb.__domsI--;
        bb.__doms[ bb.__domsI ] = null;
    }

    var applyOne = function(bb, bbGun, dom, arg, stringsAreContent) {
        if (arg instanceof Array) {
            applyArray( bb, bbGun, dom, arg, 0 );
        } else if ( arg.nodeType !== undefined ) {
            dom.appendChild( arg );
        } else if ( arg.__isBBGun ) {
            dom.appendChild( arg.dom() );
        /*
         * - html
         * - class names
         */
        } else if ( isString(arg) ) {
            if ( stringsAreContent || arg.trim().charAt(0) === '<' ) {
                dom.insertAdjacentHTML( 'beforeend', arg );
            } else {
                addClassOneString( dom, arg );
            }
        } else if ( isObjectLiteral(arg) ) {
            attrObj( bb, bbGun, dom, arg, true );
        } else if ( isFunction(arg) ) {
            runAttrFun( bb, bbGun, dom, arg );
        } else {
            fail( "invalid argument given", arg );
        }

        return dom
    }

    var createOneBBGun = function( bb, bbgun, obj ) {
        if ( isObjectLiteral(obj) ) {
            return createObj( bb, bbgun, obj );
        } else {
            var dom = createOne( bb, obj );
            assert( ! dom.__isBBGun, "BBGun given as basis for new BBGun" );
            bbgun.dom( dom );
        }

        return dom;
    }

    var createOne = function( bb, obj ) {
        if ( bb.__domsI === 0 ) {
            return createOneInner( bb, obj );
        } else {
            var newDom = createOneInner( bb, obj );
            bb.__doms[ bb.__domsI-1 ].appendChild( newDom );
            return newDom;
        }
    }

    var createOneInner = function( bb, obj ) {
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
        } else if ( obj.__isBBGun ) {
            return obj;
        } else if ( isObjectLiteral(obj) ) {
            return createObj( bb, null, obj );
        } else {
            fail( "unknown parameter given", obj );
        }
    }

    var createObj = function( bb, bbGun, obj ) {
        var dom = obj.has("nodeName") ? bb.createElement( obj["nodeName"] ) :
                  obj.has("tagName")  ? bb.createElement( obj["tagName"]  ) :
                                        bb.createElement()                  ;

        if ( bbGun !== null ) {
            bbGun.dom( dom );
        }

        for ( var k in obj ) {
            if ( obj.has(k) ) {
                attrOne( bb, bbGun, dom, k, obj[k], false );
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
            if ( klass.has(k) ) {
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
            } else if ( arg.__isBBGun ) {
                parentDom.insertBefore( arg.dom(), dom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforebegin', arg );
            } else if ( isObjectLiteral(arg) ) {
                parentDom.insertBefore( createObj(bb, null, arg), dom );
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
            } else if ( arg.__isBBGun ) {
                parentDom.insertAfter( arg.dom(), dom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'afterend', arg );
            } else if ( isObjectLiteral(arg) ) {
                parentDom.insertAfter( createObj(bb, null, arg), dom );
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
            } else if ( arg.__isBBGun ) {
                var argDom = arg.dom();
                assert( argDom.parentNode === null, "adding element, which already has a parent" );
                dom.appendChild( argDom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforeend', arg );
            } else if ( isObjectLiteral(arg) ) {
                dom.appendChild( createObj(bb, null, arg) );
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
    var attrOneNewChild = function( bb, bbGun, dom, k, val, dotI ) {
        assert( k.length > 1, "empty description given" );

        var className = k.substring(dotI+1);
        var domType = ( dotI > 0 ) ?
                    k.substring( 0, dotI ) :
                    'div'                  ;

        var newDom = newOneNewChildInner( bb, bbGun, dom, domType, val, k );

        addClassOneString( newDom, className );
    }

    var newOneNewChildInner = function( bb, bbGun, dom, domType, val, debugVal ) {
        var newDom;

        if ( isObjectLiteral(val) ) {
            assert( bb.setup.isElement(domType), "invalid element type given, " + domType );
            val["nodeName"] = domType;

            newDom = createObj( bb, null, val );
        } else {
            newDom = bb.createElement( domType );

            if ( val.nodeType !== undefined ) {
                newDom.appendChild( val );
            } else if ( val.__isBBGun ) {
                newDom.appendChild( val.dom() );
            } else if ( isString(val) ) {
                newDom.innerHTML = val;
            } else if ( isArray(val) ) {
                applyArray(
                        this,
                        null,
                        newDom,
                        val,
                        0
                )
            } else if ( isFunction(val) ) {
                if ( domType === 'a' ) {
                    newDom.addEventListener( 'click', val );
                } else if ( domType === 'input' ) {
                    var inputType = newDom.getAttribute('type');

                    if (
                            inputType === 'button' || 
                            inputType === 'submit' || 
                            inputType === 'checkbox' 
                    ) {
                        newDom.addEventListener( 'click', val );
                    } else {
                        fail(
                                "function given for object description for new input of " +
                                inputType +
                                " (don't know what to do with it)" 
                        );
                    }
                } else {
                    fail( "function given for object description for new " +
                            domType + ", (don't know what to do with it)" );
                }
            } else {
                fail( "invalid object description given for, " + debugVal,
                        debugVal );
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

    var attrOne = function(bb, bbGun, dom, k, val, isApply) {
        var dotI = k.indexOf( '.' );
        var ev;

        if ( dotI !== -1 ) {
            attrOneNewChild( bb, bbGun, dom, k, val, dotI );
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
                bb.textOne( dom, val );
            } else if ( k === 'html' || k === 'innerHTML' || k === 'innerHtml' ) {
                bb.htmlOne( dom, val );
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
                assertFunction( val, "none function given for 'init' attribute" );

                if ( bbGun !== null ) {
                    val.call( bbGun, bbGun );
                } else {
                    val.call( dom, dom );
                }

            } else if ( k === 'addTo' ) {
                assert( dom.parentNode === null, "dom element already has a parent" );
                createOne( bb, val ).appendChild( dom );

            /* Events, includes HTML and custom  */
            } else if ( (ev = bb.setup.getEvent(k)) !== null ) {
                if ( bbGun !== null ) {
                    bbGun.on( k, val );
                } else if ( ev.isFunction ) {
                    ev.fun( dom, val, false, bb, k, rest );
                } else {
                    dom.addEventListener( k, val, false )
                }

            /* custom BBGun Event */
            } else if (
                    bbGun !== null && 
                    bbGun.constructor.prototype.__eventList[k] === true 
            ) {
                bbGun.on( k, val );

            /* new objet creation */
            } else if ( bb.setup.isElement(k) ) {
                newOneNewChildInner( bb, bbGun, dom, k, val, k );

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

    var attrObj = function(bb, bbGun, dom, obj, isApply) {
        var hasHTMLText = false;

        for ( var k in obj ) {
            if ( obj.has(k) ) {
                if ( k === 'text' || k === 'html' ) {
                    if ( hasHTMLText ) {
                        fail( "cannot use text and html at the same time", obj );
                    } else {
                        hasHTMLText = true;
                    }
                }

                attrOne( bb, bbGun, dom, k, obj[k], isApply );
            }
        }
    }



/* -------------------------------------------------------------------------------

### setText dom:Element text:string

Sets the given string, to the dom element given. This is set to it's 
textContent if it is a standard HTMLElement, and to it's value if it is a
HTMLInput.

@param dom The Element to set the text to.
@param text A string of the text being set.
@return The given dom, for function chaining of elements.

------------------------------------------------------------------------------- */

    var setText = function( dom, text ) {
        if ( dom instanceof HTMLInputElement ) {
            dom.value = text;
        } else {
            dom.textContent = text;
        }

        return dom;
    }



/* -------------------------------------------------------------------------------

### combineStringOne text:array|string

If an array is given, then the array is joined, and the result is returned. If
the given value is a string, then this is just returned.

Anything else will cause an error to be raised.

This exists as a function for unifying strings and arrays of strings, as one.

@param text The text to combine.
@return Either the array of strings combined, or if given a string, it will 
  just be returned.

------------------------------------------------------------------------------- */

    var combineStringOne = function(text) {
        if ( text instanceof Array ) {
            return combineStringArray( text, 0 );
        } else if ( isString(text) ) {
            return text;
        } else {
            fail( "non-string given for text content", text );
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
            startI = 0;
        }

        var argsLen = args.length;

        if ( startI > argsLen ) {
            fail( "start index is greater than the array length" );
        } else if ( startI === argsLen ) {
            return '';
        } else {
            var allText = combineStringOne( args[startI++] );

            while( startI++ < argsLen ) {
                allText += combineStringOne( args[startI] );
            }

            return allText;
        }
    }



/* -------------------------------------------------------------------------------

### addClassOne dom klass:string|[klass]

------------------------------------------------------------------------------- */

    var addClassOne = function( dom, klass ) {
        if ( isString(klass) ) {
            return addClassOneString( dom, klass );
        } else if ( isArray(klass) ) {
            return addClassArray( dom, klass, 0 );
        } else {
            fail("Unknown klass value given for adding a class");
        }
    }



/* -------------------------------------------------------------------------------

### addClassOneString dom klass

This is for when the DOM is *pre* known and verified as a HTMLElement.

------------------------------------------------------------------------------- */

    var addClassOneString = function( dom, klass ) {
        assertString( klass, "Given class names are not a string." );

        /*
         * Take the class apart, and then append the pieces indevidually.
         * We have to split based on spaces, and based on '.'.
         */
        if ( klass.length > 0 ) {
            if ( klass.indexOf(' ') !== -1 ) {
                var parts = klass.split( ' ' );

                for ( var i = 0; i < parts.length; i++ ) {
                    var part = parts[i];

                    if ( part.length > 0 ) {
                        if ( part.indexOf('.') !== -1 ) {
                            var partParts = part.split('.');

                            for ( var j = 0; j < partParts.length; j++ ) {
                                var partPart = partParts[j];

                                if ( partPart.length > 0 ) {
                                    dom.classList.add( partPart );
                                }
                            }
                        } else {
                            dom.classList.add( part );
                        }
                    }
                }
            } else if ( klass.indexOf('.') !== -1 ) {
                var parts = klass.split( '.' );

                for ( var i = 0; i < parts.length; i++ ) {
                    var part = parts[i];

                    if ( part.length > 0 ) {
                        dom.classList.add( part );
                    }
                }
            } else if ( klass.length > 0 ) {
                dom.classList.add( klass );
            }
        }

        return dom;
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var addClassArray = function( dom, args, i ) {
        if ( i === undefined ) {
            i = 0;
        }

        iterateClasses( args, i, args.length, function(klass) {
            dom.classList.add( klass );
        } )

        return dom;
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var setClassOne = function( dom, klass ) {
        if ( typeof klass === 'string' ) {
            dom.className = klass.replace(/\./g, ' ');
        } else if ( klass instanceof Array ) {
            // sub arrays will also get joined but with a comma
            // so we use the replace to remove the comma as well as the dots
            dom.className = klass.join(' ').replace(/\.|,/g, ' ');
        } else if ( isObjectLiteral(klass) ) {
            dom.className = '';

            for ( var k in klass ) {
                if ( klass.has(k) && klass[k] ) {
                    dom.classList.add( k );
                }
            }
        } else {
            fail( "Expected ClassName to be a string or array of strings, but it's something else." );
        }
    }



/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

    var removeClassOne = function( dom, klasses ) {
        iterateClassesString( klasses, function(klass) {
            dom.classList.remove( klass );
        } )

        return dom;
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

        bb.__domsI = 0;

        bb.__doms = [];



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
                        elements: listToDataMap( HTML_ELEMENTS ),

                        /**
                         * Holds mappings of event names, to the functions that
                         * define them.
                         */
                        events  : listToDataMap( HTML_EVENTS )
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
                event: newRegisterMethod( 'event', 'eventOne' ),

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
                element: newRegisterMethod( 'element', 'elementOne' ),
                
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
                } ).

                /**
                 * If you create an element, which is named with one of those
                 * below, then it will be created as an input with that type.
                 * 
                 * For example:
                 * 
                 *      // returns <input type="submit"></input>
                 *      bb.createElement( 'submit' ); 
                 * 
                 */
                element( [
                                'button',
                                'checkbox',
                                'color',
                                'date',
                                'datetime',
                                'datetime-local',
                                'email',
                                'file',
                                'hidden',
                                'image',
                                'month',
                                'number',
                                'password',
                                'radio',
                                'range',
                                'reset',
                                'search',
                                'submit',
                                'tel',
                                'text',
                                'time',
                                'url',
                                'week'
                        ],

                        function( type ) {
                            assert( type );

                            var input = document.createElement('input');
                            input.setAttribute( 'type', type );
                            return input;
                        }
                );



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
                    (dom instanceof HTMLElement) ||
                    (dom instanceof HTMLDocument) ||
                    dom.__isBBGun,
                
                    "HTML Element expected in bb.on."
            );

            var argsLen = arguments.length;

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
            var argsLen = arguments.length;

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
                map[ evName ] = [ funCallback ];

                __setProp__( dom, '__bb_event_map__', map )
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

/* -------------------------------------------------------------------------------

## bb.createBBGun

------------------------------------------------------------------------------- */

        bb.createBBGun = function(bbGun, obj, args, i) {
            if ( i === undefined ) {
                i = 0
            }

            return applyArray(
                    bb,
                    bbGun,
                    createOneBBGun( bb, bbGun, obj ),
                    args,
                    i
            )
        }

        bb.initBBGun = function( bbGun ) {
            var dom = bbGun.dom();

            if ( arguments.length === 1 ) {
                return bbGun.dom();
            } else {
                return applyArray(
                        bb,
                        bbGun,
                        bbGun.dom(),
                        arguments,
                        1
                );
            }
        }

        bb.createArray = function( obj, args, i ) {
            if ( i === undefined ) {
                i = 0
            }

            return applyArray(
                    bb,
                    null,
                    createOne( bb, obj ),
                    args,
                    i
            );
        }

        bb.apply = function( dom ) {
            return applyArray(
                    bb,
                    null,
                    bb.get( dom, true ),
                    arguments,
                    1
            );
        }

        bb.applyArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0
            }

            return applyArray(
                    bb,
                    null,
                    bb.get( dom, true ),
                    args,
                    startI
            )
        }

/* -------------------------------------------------------------------------------

## bb.createOne

Just describes the dom, based on the object given,
and nothing more.

This is mostly for internal use, where I *only*
want to describe a dom. I don't want any of the
arguments-add-class stuff.

@param obj A JavaScript object literal describing an object to create.
@return A Element based on the object given.

------------------------------------------------------------------------------- */

        bb.createOne = function( obj ) {
            return createOne( bb, obj );
        }

        bb.createObj = function( obj ) {
            assertObjectLiteral( obj );

            return createObj( bb, null, obj );
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
                    dom = elEv.fun( type );

                    if ( dom.__isBBGun ) {
                        dom = dom.dom();
                    }  else {
                        assert(
                                dom && dom.nodeType !== undefined,
                                "html element event, must return a HTML Element, or BBGun",
                                dom 
                        );
                    }
                } else {
                    dom = document.createElement( type );
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
                i = 0;
            }

            var isRemoved = false;
            iterateClasses( klasses, i, klasses.length, function(klass) {
                if ( ! isRemoved && dom.classList.contains(klass) ) {
                    isRemoved = true;
                    return false;
                }
            } );

            return isRemoved;
        }

        bb.removeClass = function( dom ) {
            var innerDom = bb.get( dom, false );

            if ( arguments.length === 1 ) {
                return innerDom;
            } else if ( arguments.length === 2 ) {
                return removeClassOne( innerDom, arguments[1] );
            } else {
                return removeClassArray( innerDom, arguments, 1 );
            }
        }

        bb.removeClassArray = function( dom, klasses, i ) {
            return removeClassArray( bb.get(dom, false), klasses, i );
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
            var dom = bb.get( dom );

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
            var dom = bb.get( dom );

            if ( arguments.length === 2 ) {
                return addClassOneString( dom, arguments[1] );
            } else {
                return addClassArray( dom, arguments, 1 );
            }
        }

        bb.addClassArray = function( dom, args, i ) {
            assertArray( args );
            var dom = bb.get( dom );

            return addClassArray( dom, args, i );
        }

        bb.addClassOne = function(dom, klass) {
            dom = bb.get(dom, false);
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
                if ( isString(k) ) {
                    return dom.style[k];
                } else if ( k instanceof Array ) {
                    for ( var i = 0; i < k.length; i++ ) {
                        bb.style( dom, k[i] );
                    }
                } else if ( isObjectLiteral(k) ) {
                    for ( var i in k ) {
                        if ( k.has(i) ) {
                            bb.style( dom, i, k[i] );
                        }
                    }
                }
            } else if ( arguments.length === 3 ) {
                if ( isString(k) ) {
                    dom.style[k] = val;
                } else if ( k instanceof Array ) {
                    for ( var i = 0; i < k.length; i++ ) {
                        bb.style( dom, k[i], val );
                    }
                }
            } else {
                fail( "unknown object given", arguments );
            }

            return dom;
        }

        bb.get = function(dom, performQuery) {
            assert( dom, "falsy dom given for bb.get" );

            if (performQuery !== false && isString(dom)) {
                return document.querySelector(dom) || null;
            } else if ( dom.nodeType !== undefined ) {
                return dom;
            } else if ( isObjectLiteral(dom) ) {
                return createObj( bb, null, dom );
            } else if ( dom.__isBBGun ) {
                return dom.dom()
            } else {
                fail( "unknown object given", dom );
            }
        }



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

            var dom = bb.get( dom );
            if ( dom.__isBBGun ) {
                dom = dom.dom();
            }

            var next = dom.nextSibling;

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

            var dom = bb.get( dom );
            if ( dom.__isBBGun ) {
                dom = dom.dom();
            }

            var next = dom.previousSibling;

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
            var dom = bb.get( dom, true );
            assertParent( dom );

            return beforeOne( bb, dom.parentNode, dom, node );
        }

        bb.afterOne = function( dom, node ) {
            var dom = bb.get( dom, true );
            assertParent( dom );

            return afterOne( bb, dom.parentNode, dom, node );
        }

        bb.beforeArray = function( dom, args, i ) {
            if ( i === undefined ) {
                i = 0;
            }

            var dom = bb.get( dom, true );
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

            var dom = bb.get( dom, true );
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
                return addOne( bb, bb.get(dom, true), arguments[1] );
            } else {
                return bb.addArray( dom, arguments, 1 );
            }
        }

        bb.addArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0;
            }

            return addArray( bb, bb.get(dom, true), args, startI );
        }

        bb.addOne = function( dom, dest ) {
            return addOne( bb,
                    bb.get( dom ),
                    dest
            );
        }

/* -------------------------------------------------------------------------------

## bb.html

Sets the HTML content within this element.

------------------------------------------------------------------------------- */

        bb.html = function( dom ) {
            return bb.htmlArray( dom, arguments, 1 );
        }

        bb.htmlOne = function( dom, el ) {
            assert( el, "given element is not valid" );

            if ( isString(el) ) {
                dom.innerHTML = el;
            } else if ( el.nodeType !== undefined ) {
                dom.appendChild( el );
            } else if ( el.__isBBGun ) {
                dom.appendChild( el.dom() )
            } else if ( el instanceof Array ) {
                bb.htmlArray( dom, el, 0 )
            } else if ( isObjectLiteral(el) ) {
                dom.appendChild( bb.describe(el) )
            } else {
                fail( "Unknown html value given", el );
            }

            return dom;
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
            var content = '',
                children = [];
            for ( ; i < htmls.length; i++ ) {
                var el = htmls[i];

                if ( isString(el) ) {
                    content += el;
                } else if ( el instanceof Array ) {
                    bb.htmlArray( dom, el, 0 );
                } else {
                    if ( content !== '' ) {
                        dom.insertAdjacentHTML( 'beforeend', content );
                        content = '';
                    }

                    if ( el.nodeType !== undefined ) {
                        dom.appendChild( el );
                    } else if ( el.__isBBGun ) {
                        dom.appendChild( el.dom() );
                    } else if ( isObjectLiteral(el) ) {
                        dom.appendChild(
                                bb.describe(el)
                        );
                    }
                }
            }

            if ( content !== '' ) {
                dom.insertAdjacentHTML( 'beforeend', content );
            }

            return dom;
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
            return setText( dom, combineStringArray(arguments, 1) );
        }



/* -------------------------------------------------------------------------------

## bb.textOne

------------------------------------------------------------------------------- */

        bb.textOne = function( dom, text ) {
            return setText( dom, combineStringOne(text) );
        }



/* -------------------------------------------------------------------------------

## bb.textArray

------------------------------------------------------------------------------- */

        bb.textArray = function( dom, args, startI ) {
            return setText( dom, combineStringArray(args, startI) );
        }



/* -------------------------------------------------------------------------------

## bb.attr dom

The dom it takes, can be a query for a dom, a BBGun object, or a HTML Element.
For example:

```
    // grab a title, and retrieve the text within it
    var titleDom = bb.get( "h1.title" );
    var mainTitleText = bb.attr( titleDom, "textContent" );
    // the above could be shortened to just ...
    var mainTitleText = bb.attr( "h1.title", "textContent" );

### Special Properties

 - on, events
 - className
 - id
 - style

 - html
 - text     Sets the textContent of this element.
 - value,   Sets the value within this element. This applies to inputs and
   textareas.

 - stopPropagation For the events named, they are set, with a function which 
   will simply stop propagation of that event.
 - preventDefault  For the events named, this will set a function, which
   prevents the default action from taking place.

 - addTo,   given an element (or a description of an element), this element
   is added to the one given.

Anything else is set as an attribute of the object.

------------------------------------------------------------------------------- */

        bb.attr = function( dom, obj, val ) {
            if ( arguments.length === 2 ) {
                if ( isString(obj) ) {
                    var realDom = bb.get( dom );

                    if ( obj === 'className' || obj === 'class' ) {
                        return realDom.className;
                    } else if ( 
                            obj === 'value' ||
                            ( realDom instanceof HTMLInputElement && (
                                    obj === 'text' ||
                                    obj === 'textContent' 
                            ) )
                    ) {
                        return obj.value;
                    } else if ( obj === 'id' ) {
                        return realDom.id;
                    } else if (
                            obj === 'html'      ||
                            obj === 'innerHTML' ||
                            obj === 'innerHtml' 
                    ) {
                        return realDom.innerHTML;
                    } else if (
                            obj === 'text'        ||
                            obj === 'textContent' ||
                           (obj === 'value' && realDom instanceof HTMLInputElement)
                    ) {
                        return realDom.textContent;
                    } else if ( obj === 'style' ) {
                        return realDom.style;
                    } else if ( obj === "nodeName" || obj === "tagName" ) {
                        return realDom.nodeName;
                    } else {
                        return realDom.getAttribute( obj );
                    }
                } else if ( isObjectLiteral(obj) ) {
                    attrObj( bb, null, dom, obj, false );
                } else {
                    fail( "invalid parameter given", obj );
                }
            } else if ( arguments.length === 3 ) {
                assertString( obj, "non-string given as key for attr", obj );
                attrOne( this, null, dom, obj, val, false );
            } else {
                if ( arguments.length < 2 ) {
                    throw new Error( "not enough parameters given" );
                } else {
                    throw new Error( "too many parameters given" );
                }
            }

            return dom;
        }

        var htmlElementsLen = HTML_ELEMENTS.length;
        for ( var i = 0; i < htmlElementsLen; i++ ) {
            var k = HTML_ELEMENTS[i];

            if ( bb.has(k) ) {
                console.log( 'BB function clash: ' + k );
            } else {
                bb[k] = new Function( "return this.createArray('" + k + "', arguments, 0);" );
            }
        }



/* ===============================================================================

Pre-provided Touch Events
-------------------------

Events for click, and hold, under touch interface, is pre-provided.

=============================================================================== */

        // test from Modernizer
        var IS_TOUCH = !! ( ('ontouchstart' in window) ||
                window.DocumentTouch &&
                document instanceof DocumentTouch );

        if ( IS_TOUCH ) {
            bb.setup.event( 'click', touchy.click );
        }

        bb.setup.event( 'hold', touchy.hold );

/* ===============================================================================

Pre-provided Keyboard Events
----------------------------

These events will bind when these keypresses have been pressed. If you want 
something more sophisticated, build it yourself.

===============================================================================



-------------------------------------------------------------------------------

### normalizeKeyName key:string -> string

Given the name of a key, this will return a normalized version for some common
alternative names for keys. For example 'esc' will be changed to 'escape', and
'ctrl' would return 'control'.

------------------------------------------------------------------------------- */

        var normalizeKeyName = function( key ) {
            if ( key === '' ) {
                return '';

            } else {
                key = key.toLowerCase().replace( /_/g, '' );

                // an escaped comma
                if ( key === "\\," ) {
                    return ',';

                } else if ( key === 'enter' ) {
                    return '\r';
                
                } else if ( key === 'space' ) {
                    return ' ';
                    
                } else if ( key === 'comma' ) {
                    return ',';
                    
                } else if ( key === 'fullstop' ) {
                    return '.';

                    
                } else if ( key === 'singlequote' ) {
                    return "'";
                    
                } else if ( key === 'doublequote' ) {
                    return '"';
                    
                } else if ( key === 'plus' ) {
                    return '+';
                    
                } else if ( key === 'multiply' ) {
                    return '*';

                    
                } else if ( key === 'del' ) {
                    return 'delete';
                    
                } else if ( key === 'menu' ) {
                    return 'contextmenu';
                    
                } else if ( key === 'esc' ) {
                    return 'escape';
                    
                } else if ( key === 'ctrl' ) {
                    return 'control';

                    
                } else if ( key === 'left' ) {
                    return 'arrowleft';
                    
                } else if ( key === 'leftarrow' ) {
                    return 'arrowleft';

                    
                } else if ( key === 'right' ) {
                    return 'arrowright';
                    
                } else if ( key === 'rightarrow' ) {
                    return 'arrowright';

                    
                } else if ( key === 'down' ) {
                    return 'arrowdown';
                    
                } else if ( key === 'downarrow' ) {
                    return 'arrowdown';

                    
                } else if ( key === 'up' ) {
                    return 'arrowup';
                    
                } else if ( key === 'uparrow' ) {
                    return 'arrowup';


                } else {
                    return key;
                }
            }
        }



/* -------------------------------------------------------------------------------

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
                var newLetter = normalizeKeyName( letter );

                keyCode = String.KEY_CODES[ newLetter.toUpperCase() ] || 0;

                if ( newLetter.length === 1 ) {
                    charCode = newLetter.charCodeAt( 0 );
                } else {
                    if ( newLetter === 'enter' ) {
                        charCode = "\r".charCodeAt( 0 );
                    } else if ( newLetter === 'tab' ) {
                        charCode = "\t".charCodeAt( 0 );
                    } else if ( newLetter === 'space' ) {
                        charCode = " ".charCodeAt( 0 );
                    }
                }

                if ( keyCode === 0 && charCode === 0 ) {
                    fail( "unknown letter given '" + letter + "'" );
                } else {
                    letter = newLetter;
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
                    if ( data.has(keyAlt) ) {
                        addCleverKeyEventOne( dom, key, keyAlt, data[keyAlt], useCapture, bb, eventName);
                    }
                }

            } else {
                fail( "unknown data given for '" + eventName + "'" );
            }
        };

        bb.setup.event( 'keypress', addKeyEventOne );
        bb.setup.event( 'keydown' , addKeyEventOne );
        bb.setup.event( 'keyup'   , addKeyEventOne );



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
                    if ( val.has(l) ) {
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

                if ( keyTest.letter === 'f12' ) {
                }

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
                        var evKey = ev.key;

                        if ( evKey.length > 1 ) {
                            return ( evKey.toLowerCase() === keyTest.letter || ev.char.toLowerCase() === keyTest.letter );
                        } else {
                            return ( evKey === keyTest.letter || ev.char === keyTest.letter );
                        }
                    }
                }
            }

            return false;
        }

        return bb;
    }

    window['bb'] = newBB();


})();
"use strict";(function() {

/* ===============================================================================

# BBGun

The higher level DOM alternative, BB-Gun.
It wraps doms, allowing you to do slightly more.

It is intended that you would extend this,
to create your own nodes.

=============================================================================== */

    var newBBGunType = function( bb ) {
        bb = bb || window['bb'];
        assert( bb, "bb.js is not loaded." );

        var prepEvent = function( ev ) {
            ev.doPropagate = false;

            ev.propagate = function() {
                this.doPropagate = true;
            }
        }



/* -------------------------------------------------------------------------------

#EventsManager

It works in two levels:
 - events do *not* propagate to parents by default.
 - events are passed to those on the same level, unless they return false.

------------------------------------------------------------------------------- */

        var EventsManager = function( xe ) {
            this.xe = xe;
            this.events = {};
        }

        EventsManager.prototype = {
            register: function( name, f ) {
                if ( name instanceof Array ) {
                    for ( var i = 0; i < name.length; i++ ) {
                        this.register( name, f );
                    }
                } else {
                    var bbGunName = bb.setup.normalizeEventName( name );

                    assert(
                            this.xe.__eventList.hasOwnProperty( bbGunName ) ||
                                    bb.setup.isEvent( name ),
                            "unknown event, " + name
                    );

                    if ( this.events.hasOwnProperty(bbGunName) ) {
                        this.events[bbGunName].push( f );
                    } else {
                        if ( bb.setup.isEvent(name) ) {
                            var self = this;

                            bb.on( this.xe.dom(), name, function(ev) {
                                self.fireDomEvent( bbGunName, ev );
                            });
                        }

                        this.events[bbGunName] = [ f ];
                    }
                }
            },

            unregister: function( name, fun ) {
                assert( this.xe.isEvent(name), "unknown event, " + name );

                var bbGunName = bb.setup.normalizeEventName( name );
                if ( this.events.hasOwnProperty(bbGunName) ) {
                    var evs = this.events[bbGunName];

                    for ( var i = 0; i < evs.length; i++ ) {
                        if ( evs[i] === fun ) {
                            evs.splice( i, 1 );

                            return true;
                        }
                    }
                }

                return false;
            },

            once: function( name, f ) {
                var self = this;
                var fun = function(ev) {
                    self.unregister( name, fun );
                    return f.call( this, ev );
                }

                this.register( name, fun );
            },

            fireEvent: function( name, args, startI ) {
                var bbGunName = bb.setup.normalizeEventName( name );

                if ( this.events.hasOwnProperty(bbGunName) ) {
                    var evs = this.events[bbGunName],
                        xe  = this.xe;

                    if ( args === null ) {
                        for ( var i = 0; i < evs.length; i++ ) {
                            if ( evs[i].call(xe) === false ) {
                                return false;
                            }
                        }
                    } else {
                        var newArgs;

                        if ( startI === undefined || startI === 0 ) {
                            newArgs = args;
                        } else {
                            newArgs = new Array( args.length-startI );

                            for ( var i = startI; i < args.length; i++ ) {
                                newArgs[i-startI] = args[i];
                            }
                        }
                        
                        for ( var i = 0; i < evs.length; i++ ) {
                            if ( evs[i].apply(xe, newArgs) === false ) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            },

            fireDomEvent: function( bbGunName, ev ) {
                if ( this.events.hasOwnProperty(bbGunName) ) {
                    var evs = this.events[bbGunName],
                        xe  = this.xe;

                    prepEvent( ev );

                    for ( var i = 0; i < evs.length; i++ ) {
                        if ( evs[i].call(xe, ev) === false ) {
                            ev.stopPropagation();
                            return false;
                        }
                    }

                    if ( ! ev.doPropagate ) {
                        ev.stopPropagation();
                    }
                }

                return true;
            }
        }

        var removeDomCycle = function( node, args ) {
            var shouldDelete = node.fireApply( 'beforeremove', args, 0 );
            if ( shouldDelete !== false ) {
                var nodeDom = node.dom();
                nodeDom.parentNode.removeChild( nodeDom );

                node.fireApply( 'remove', args, 0 );
            }
        }

        var removeOne = function( self, selfDom, node, args ) {
            if ( node.__isBBGun ) {
                var nodeParent = node.parent();

                if ( nodeParent === null ) {
                    fail( "removing node which does not have a parent", node );
                } else if ( nodeParent !== self ) {
                    fail( "removing node which is not a child of this node", node );
                }

                removeDomCycle( node, args );
            } else if ( node.nodeType !== undefined ) {
                if ( node.parentNode !== selfDom ) {
                    fail( "removing Element which is not a child of this node", node );
                } else {
                    delete node.__xe;
                    node.parentNode.removeChild( nodeDom );
                }
            } else {
                fail( "removing unsupported element", node );
            }
        }

        var beforeAfterChild = function( bbGun, current, args, isAfter ) {
            if ( args.length >= 2 ) {
                assert( current, "falsy parameter given" );
                assert( bbGun.child(current) !== null, "child given, is not a child of this node" );

                for ( var i = 1; i < args.length; i++ ) {
                    var arg = args[i];

                    assert( arg, "falsy parameter given" );

                    assertNot( (arg.nodeType !== undefined) && (arg.parentNode !== null), "HTML Element given already has a parent" );
                    assertNot( (arg.__isBBGun) && (arg.parent() !== null), "BBGun element given already has a parent" );
                }

                if ( isAfter ) {
                    bb.afterArray( current, args, 1 );
                } else {
                    bb.beforeArray( current, args, 1 );
                }
            } else {
                fail( "invalid number of parameters" );
            }
        }



/* -------------------------------------------------------------------------------

## BBGun

------------------------------------------------------------------------------- */

        var BBGun = function( domType ) {
            this.__xeEvents = null;
            this.__isBBGun  = true;
            this.__xeDom    = null;

            this.dom(
                    ( arguments.length !== 0 ) ?
                            bb.createBBGun( this, domType, arguments, 1 ) :
                            bb.div()
            )
        }



/* -------------------------------------------------------------------------------

## BBGun.clone( bb )

Clones the whole module, provided you with another copy.

@param Optional, the BB library copy this will be working with.

------------------------------------------------------------------------------- */

        BBGun.clone = function( bb ) {
            return newBBGunType( bb );
        }

        var registerEvent = function( bbGun, es, f, doOnce ) {
            assertString( es, "no event name(s) provided" );
            assertFunction( f, "no function provided" );

            if ( bbGun.__xeEvents === null ) {
                bbGun.__xeEvents = new EventsManager( bbGun );
            }

            if ( doOnce ) {
                bbGun.__xeEvents.once( es, f );
            } else {
                bbGun.__xeEvents.register( es, f );
            }

            return bbGun;
        }

        var duplicateEventList = function( oldList, newEvents ) {
            var eventList = {};

            for ( var k in oldList ) {
                if ( oldList.hasOwnProperty(k) ) {
                    eventList[k] = true;
                }
            }

            for ( var i = 0; i < newEvents; i++ ) {
                var name = bb.setup.normalizeEventName( newEvents[i] );
                eventList[ name ] = true;
            }

            return eventList;
        }

        var replaceNode = function( oldNode, newNode, args, startI ) {
            assert( newNode, "falsy newNode given" );

            var parentDom = oldNode.__xeDom.parentNode;
            var newDom;

            if ( newNode.nodeType !== undefined ) {
                newNode = bb( newNode );
            } else if ( ! newNode.__isBBGun ) {
                newNode = bb( newNode );
            }

            var newDom = newNode.dom();

            assert( parentDom !== null, "replacing this element, when it has no parent dom" );
            assert( newDom.parentNode === null, "replacing with node which already has a parent" );

            var shouldDelete;
            var hasArgs = ( args !== null && args.length > startI ),
                args;
            
            if ( hasArgs ) {
                var argsLen = arguments.length;
                var newArgs = new Array( (argsLen-startI) + 2 );

                newArgs[0] = newNode;
                newArgs[1] = newDom;

                for ( var i = startI; i < argsLen; i++ ) {
                    newArgs[i+2] = args[i];
                }

                shouldDelete = oldNode.fireApply( 'beforeReplace', newArgs, 0 );
            } else {
                shouldDelete = oldNode.fireApply('beforeReplace', [newNode, newDom], 0);
            }

            if ( shouldDelete ) {
                assert( oldNode.__xeDom.parentNode === parentDom, "parent has been changed within the 'beforeReplace' event" );
                parentDom.replaceChild( newDom, oldNode.__xeDom );

                if ( hasArgs ) {
                    oldNode.fireApply( 'replace', args );
                } else {
                    oldNode.fire( 'replace', newNode, newDom );
                }
            }
        }

        /**
         * Extends this BBGun prototype,
         * with a new version, which includes the
         * events given.
         *
         * These events must be added, for them to be
         * legal events.
         */
        BBGun.registerEvents = function() {
            return this.override({
                    __eventList: duplicateEventList( this.prototype.__eventList, arguments )
            })
        }

        /**
         * The same as 'registerEvents', only it also
         * adds no method stubs.
         *
         * If a method already exists, an error will be raised.
         */
        BBGun.events = function() {
            var methods = {};

            for ( var i = 0; i < arguments.length; i++ ) {
                var name = arguments[i];
                methods[name] = new Function( "f", "return this.on('" + name + "', f);" );
            }

            var extension = this.extend( methods );
            extension.prototype.__eventList =
                    duplicateEventList( this.prototype.__eventList, arguments );

            return extension;
        }

        BBGun.prototype = {


/* A list of all 'legal' events. */

            __eventList: {
                    'replace': true,
                    'beforereplace': true,

                    'remove': true,
                    'beforeremove': true
            },



/* -------------------------------------------------------------------------------

### bbgun.parent() -> BBGun | null

Returns the BBGun parent of this object, or null if this has no parent.

@return The BBGun parent above this one, or null.

### bbgun.parent( BBGun ) -> boolean

Given a BBGun instance, this returns true if it is the parent of this object, 
and false if not.

@param bbgun A BBGun object to test against.
@return True if the BBGun given is the parent of this, otherwise false.

### bbgun.parent( (BBGun) -> any ) -> BBGun | null | any

Given a function, it will call the function, if this has a parent. If there is 
no parent, then null is returned.

If the function returns a value other than undefined, this will be returned 
instead of the parent.

This means if the function returns 'false' or 'null', then 'false' or 'null' 
will be returned.

### bbgun.parent( string ) -> BBGun | null

Given a string description of a node, this will search for it, and return the 
first parent that matches, if found.

If not found, then this will return null.

### bbgun.parent( string, (BBGun) -> any ) -> BBGun | null | any

This is a mix of the function and string version of parent.

------------------------------------------------------------------------------- */

            parent: function( f, f2 ) {
                var argsLen = arguments.length;

                if ( argsLen === 0 ) {
                    for (
                            var upDom = this.dom().parentNode; 
                            upDom !== null;
                            upDom = upDom.parentNode
                    ) {
                        if ( upDom.__xe !== undefined && upDom.__xe !== null ) {
                            return upDom.__xe;
                        }
                    }
                } else if ( argsLen === 1 ) {
                    var p = this.parent();

                    if ( f instanceof Function ) {
                        if ( p !== null ) {
                            var r = f.call( this, p );

                            if ( r !== undefined ) {
                                return r;
                            }
                        }

                        return p;
                    } else if ( f.__isBBGun ) {
                        return ( p === f ) ? p : null ;
                    } else if ( isString(f) ) {
                        for (
                                var upDom = this.dom().parentNode; 
                                upDom !== null;
                                upDom = upDom.parentNode
                        ) {
                            if (
                                    upDom.__xe !== undefined &&
                                    upDom.__xe !== null &&
                                    upDom.matchesSelector( f )
                            ) {
                                return upDom.__xe;
                            }
                        }
                    } else {
                        fail( "invalid parameter given", f );
                    }
                } else if ( argsLen === 2 ) {
                    assertFunction( f2, "second parameter is expected to be a function" );

                    var p = this.parent( f );

                    if ( p !== null ) {
                        var r = f2.call( this, p );

                        if ( r !== undefined ) {
                            return r;
                        } else {
                            return p;
                        }
                    }
                } else {
                    fail( "too many parameters given" );
                }

                return null;
            },



/* -------------------------------------------------------------------------------

### bbgun.children() -> [ BBGun ]

### bbgun.children( (BBGun) -> any ) -> [ BBGun ]

@return An array containing all of the children of this BBGun.

------------------------------------------------------------------------------- */

            children: function( f, f2 ) {
                var argsLen = arguments.length;

                if ( argsLen === 0 ) {
                    var bbGuns = [];
                    var doms = this.dom().childNodes;

                    for ( var i = 0; i < doms.length; i++ ) {
                        var dom = doms[i];
                        var bbGun = dom.__xe;

                        if ( bbGun !== undefined && bbGun !== null && bbGun.__isBBGun ) {
                            bbGuns.push( bbGun );
                        }
                    }

                    return bbGuns;
                } else if ( argsLen === 1 ) {
                    if ( isFunction(f) ) {
                        var guns = this.children();

                        for ( var i = 0; i < guns.length; i++ ) {
                            f.call( this, guns[i] );
                        }

                        return guns;
                    } else if ( isString(f) ) {
                        assert( f !== '', "empty selector given" );

                        var bbGuns = [];
                        var doms = this.dom().childNodes;

                        for ( var i = 0; i < doms.length; i++ ) {
                            var dom = doms[i];
                            var bbGun = dom.__xe;

                            if (
                                    bbGun !== undefined    &&
                                    bbGun !== null         &&
                                    bbGun.__isBBGun &&
                                    dom.matchesSelector( f )
                            ) {
                                bbGuns.push( bbGun );
                            }
                        }

                        return bbGuns;
                    } else {
                        fail( "unknown parameter given", f );
                    }
                } else if ( argsLen === 3 ) {
                    assertString( f, "non string given for element selector" );
                    assertFunction( f2, "non function given for function callback" );

                    var guns = this.children( f );

                    for ( var i = 0; i < guns.length; i++ ) {
                        f2.call( this, guns[i] );
                    }

                    return guns;
                } else {
                    fail( "too many parameters given" );
                }

                return [];
            },

            child: function( obj, f ) {
                var argsLen = arguments.length;

                if ( argsLen === 1 ) {
                    if ( isString(obj) ) {
                        // if it look like a class, presume it's a class
                        if ( obj.search(/^[a-zA-Z-_0-9]+$/) === 0 && ! bb.setup.isElement(obj) ) {
                            obj = '.' + obj;
                        }

                        var child = this.dom().querySelector( obj );

                        if ( child !== null ) {
                            if ( child.__xe ) {
                                return child.__xe;
                            } else {
                                return child;
                            }
                        }
                    /*
                     * These are here as checks of existance,
                     * they are returned if found.
                     */
                    } else if ( obj.__isBBGun ) {
                        if ( obj.parent() === this ) {
                            return obj;
                        }
                    } else if ( obj.nodeType !== undefined ) {
                        var children = this.dom().childNodes;
                        for ( var i = 0; i < children.length; i++ ) {
                            if ( children[i] === obj ) {
                                return obj;
                            }
                        }
                    } else {
                        fail( "invalid parameter given as selector", obj );
                    }

                    return null;
                } else if ( argsLen === 2 ) {
                    var child = this.child( obj );

                    assertFunction( f, "none function given" );
                    var r = f.call( this, obj );

                    if ( r !== undefined ) {
                        return r;
                    } else {
                        return child;
                    }
                } else {
                    fail( "too many parameters given" );
                }

                return null;
            },

            /**
             * Inserts the nodes given before *this* element.
             */
            beforeThis: function() {
                bb.beforeArray( this, arguments, 0 )
                return this;
            },

            /**
             * Inserts the nodes given after *this* element.
             */
            afterThis: function() {
                bb.beforeArray( this, arguments, 0 )
                return this;
            },

            before: function( child ) {
                beforeAfterChild( this, child, arguments, false );
                return this;
            },

            after: function( child ) {
                beforeAfterChild( this, child, arguments, true );
                return this;
            },

            add: function() {
                bb.addArray( this.dom(), arguments, 0 );

                return this;
            },

            addTo: function( dest ) {
                assert( arguments.length === 1, "no destination node given" );
                bb.addOne( dest, this );

                return this;
            },

            /*
             * The event is called *before* the replacement.
             * This allows you to cancel the replacelement,
             * by returning false.
             */
            beforeReplace: function( f ) {
                assert( arguments.length === 1, "number of parameters is incorrect" );
                assertFunction( f );

                return this.on( 'beforeReplace', f );
            },

            replaceWith: function( node ) {
                replaceNode( this, node, arguments, 1 );

                return this;
            },



/* -------------------------------------------------------------------------------

Replaces this node with the one given,
or replaces one child with another.

### bbgun.replace( newNode ) -> this

Replaces this node, with the one given,
in the DOM.

### bbgun.replace( childNode, newNode ) -> this

Replaces the childNode given, with the nodeNode.
The child must be a child of this node.

### bbgun.replace( (newNode, newDom:Element) -> any ) -> this 

Adds a function to be called, when this node
is replaced by another.

@example
     foo.replace( function(newNode) {
         // on 'replace' event here
     } );

### bbgun.replace( (newNode, newDom:Element) -> any, (newNode, newDom:Element) -> any ) -> this 

@example
     foo.replace(
         function(newNode) {
             // on 'beforeReplace' event here
         },
         function(newNode) {
             // on 'replace' event here
         }
     );

The first parameter is whatever was given, for
the replacement. This could be text, an object
description, a BBGun node, or whatever.

The second parameter is the DOM node for that
newNode.

If an Element was given, then 'newNode' and 'newDom'
will be identical.

------------------------------------------------------------------------------- */

            replace: function( oldNode, newNode ) {
                var argsLen = arguments.length;
                assert( argsLen > 0, "not enough arguments given" );

                if ( isFunction(oldNode) ) {
                    assert( argsLen === 1, "too many arguments given" );
                    this.on( 'replace', oldNode );
                } else if ( argsLen === 1 ) {
                    replaceNode( this, oldNode, null, 0 );
                } else if ( argsLen >= 2 ) {
                    if ( isFunction(oldNode) ) {
                        assert( isFunction(newNode), "'replace' event is not a function" );
                        assert( argsLen === 2, "too many parameters provided" );

                        this.on( 'beforeReplace', newNode );
                        this.on( 'replace', newNode );
                    } else if ( isFunction(newNode) ) {
                        fail( "'beforeReplace' event is not a function" );
                    } else {
                        assert( oldNode, "falsy oldNode given" );
                        assert( newNode, "falsy newNode given" );

                        var oldDom, newDom;
                        if ( oldNode.nodeType !== undefined ) {
                            oldDom = oldNode;
                        } else if ( oldNode.__isBBGun ) {
                            oldDom = oldNode.dom();
                        } else {
                            fail( "node given, is not a HTML element", oldNode );
                        }

                        try {
                            var newDom = bb( newNode );
                        } catch ( err ) {
                            fail( "replacement node is not a HTML element (perhaps you meant 'replaceWith'?)", err, err.stack );
                        }

                        var dom = this.dom();
                        assert( oldDom.parentNode === dom , "removing node which is not a child of this element" );
                        assert( newDom.parentNode === null, "adding node which is already a child of another" );

                        fail( 'replacement events need to be sent to the child' );

                        replaceNode( oldDom, newDom, arguments, 2 );
                    }
                } else {
                    fail( "too many, or not enough, parameters provided", arguments );
                }

                return this;
            },



            beforeRemove: function( f ) {
                assert( arguments.length === 1, "number of parameters is incorrect" );
                assertFunction( f );

                return this.on( 'beforeremove', f );
            },



/* -------------------------------------------------------------------------------

## remove()

Removes this from it's parent DOM node.

## remove( Event )

Removes this from it's parent DOM node,
and passes the event to any listeners.

## remove( node )

Removes the node given, from this.
If it is not found, then an error is raised.

@example
    remove( function(ev) {
        // on remove code here
    } )

Adds an event to be called, when this node is
removed. Note that it only works if you are
working through BBGun objects API.

------------------------------------------------------------------------------- */

            remove: function() {
                var argsLen = arguments.length;

                if ( argsLen === 0 ) {
                    var dom = this.__xeDom;
                    assert( dom.parentNode !== null, "removing this when it has no parent" );

                    removeDomCycle( this, null );
                } else if ( argsLen === 1 ) {
                    var arg = arguments[0];

                    if ( isFunction(arg) ) {
                        this.on( 'remove', arg );
                    } else if ( arg instanceof Event ) {
                        removeDomCycle( this, [arg] );
                    } else {
                        removeOne( this, this.__xeDom, arguments[0], null );
                    }
                } else {
                    var a = arguments[0],
                        b = arguments[1];

                    if ( isFunction(a) ) {
                        assert( isFunction(a), "'remove' event is not a function" );
                        assert( argsLen === 2, "too many parameters provided" );

                        this.on( 'beforeRemove', a );
                        this.on( 'remove', b );
                    } else if ( isFunction(b) ) {
                        fail( "'beforeRemove' event is not a function" );
                    } else {
                        var newArgs = new Array( argsLen-1 );

                        for ( var i = startI; i < argsLen; i++ ) {
                            newArgs[i-1] = arguments[i];
                        }

                        removeOne( this, this.__xeDom, arguments[0], newArgs );
                    }
                }

                return this;
            },
                 
            unregister: function( es, f ) {
                if ( this.__xeEvents !== null ) {
                    this.__xeEvents.unregister( es, f );
                }

                return this;
            },

            fireApply: function( name, args, startI ) {
                if ( this.__xeEvents !== null ) {
                    return this.__xeEvents.fireEvent( name, args, startI );
                } else {
                    return true;
                }
            },

            fire: function( name ) {
                if ( this.__xeEvents !== null ) {
                    return this.fireApply( name, arguments, 1 );
                } else {
                    return true;
                }
            },

            click: function( fun ) {
                if ( arguments.length === 1 ) {
                    return this.on( 'click', fun );
                } else {
                    fail( "invalid number of arguments given" );
                }
            },

            isEvent: function( name ) {
                return this.__eventList.hasOwnProperty( bb.setup.normalizeEventName(name) ) || bb.setup.isEvent( name );
            },

            /**
             * 
             */
            on: function( es, f ) {
                return registerEvent( this, es, f, false )
            },

            once: function( es, f ) {
                return registerEvent( this, es, f, true )
            },

            style: function( obj, val ) {
                var argsLen = arguments.length;

                if (argsLen === 0) {
                    return this.dom().style;
                } else if (argsLen === 1) {
                    if (isString(obj)) {
                        return this.dom().style[obj];
                    } else if (isObjectLiteral(obj)) {
                        bb.style(this.dom(), obj);
                    } else {
                        fail("invalid style parameter", obj);
                    }
                } else if (argsLen === 2) {
                    assert(isString(obj) && isLiteral(val),
                            "invalid parameters")

                    this.dom().style[obj] = val;
                } else {
                    fail("too many parameters", arguments);
                }

                return this;
            },

            dom: function(newDom) {
                if ( arguments.length === 0 ) {
                    return this.__xeDom;
                } else {
                    if ( this.__xeDom !== newDom ) {
                        assert( newDom.__xe === undefined, "setting dom, which already has a BBGun parent" );

                        if ( this.__xeDom !== null ) {
                            delete this.__xeDom.__xe;
                        }

                        this.__xeDom = bb.createArray( arguments[0], arguments, 1 );
                        this.__xeDom.__xe = this;
                    }

                    return this;
                }
            },

            html: function() {
                if ( arguments.length === 0 ) {
                    return this.__xeDom.innerHTML;
                } else {
                    bb.htmlArray( this.__xeDom, arguments );

                    return this;
                }
            },

            attr: function( obj, val ) {
                if ( arguments.length === 1 ) {
                    if ( isString(obj) ) {
                        return bb.attr( obj );
                    } else {
                        bb.attr( obj );

                        return this;
                    }
                } else {
                    bb.attr( obj, val );
                }

                return this;
            },

            toggleClass: function() {
                bb.toggleClassArray( this.__xeDom, arguments, 0 );
                return this;
            },

            toggleClassInv: function() {
                bb.toggleClassInvArray( this.__xeDom, arguments, 0 );
                return this;
            },

            addClass: function() {
                bb.addClassArray( this.__xeDom, arguments, 0 );
                return this;
            },

            setClass: function() {
                bb.setClassArray( this.__xeDom, arguments, 0 );
                return this;
            },

            hasClass: function( klass ) {
                return bb.hasClass( this.__xeDom, klass );
            },
           
            removeClass: function() {
                bb.removeClassArray( this.__xeDom, arguments );
                return this;
            },

            toggle: function( klass, onExists, onRemove ) {
                var argsLen = arguments.length;

                if ( argsLen === 1 ) {
                    bb.toggle( klass );
                } else if ( argsLen === 2 ) {
                    bb.toggle( klass, onExists.bind(this) );
                } else if ( argsLen === 3 ) {
                    bb.toggle( klass, onExists.bind(this), onRemove.bind(this) );
                } else {
                    throw new Error( "invalid parameters given" );
                }

                return this;
            }
        }

        return BBGun;
    }

    window['BBGun'] = newBBGunType();




})();


===============================================================================

# shim.js

This is a collection of shims from around the internet,
and some built by me, which add support for missing JS features.

===============================================================================

    var __shim__ = window.__shim__;

===============================================================================

## Object

===============================================================================

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

===============================================================================

### Array

Note that 'map' is missing, because it is dealt with
in the 'extras' file.

===============================================================================

### forEach

Production steps of ECMA-262, Edition 5, 15.4.4.18
Reference: http://es5.github.com/#x15.4.4.18
    
-------------------------------------------------------------------------------

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
    );

===============================================================================

## String

===============================================================================

    var leftTrimSpaceRegex = /^\s\s*/;
    var spaceRegex = /\s/;

-------------------------------------------------------------------------------

### toArray

@see https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

-------------------------------------------------------------------------------

    __shim__( String.prototype,
            'toArray', function() {
                return this.split( '' );
            }
    );

    __shim__( String.prototype,
            'trim', function(check) {
                if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                    var str = this.replace(leftTrimSpaceRegex, '');
                    var i = str.length;

                    while (spaceRegex.test(str.charAt(--i)));

                    <- str.slice(0, i + 1);
                } else if ( check.length === 0 ) {
                    <- this;
                } else {
                    check = check.escapeRegExp();
                    var regex = new RegExp( "(^(" + check + ")(" + check + ")*)|((" + check + ")(" + check + ")*$)", 'i' );

                    <- this.replace( regex, '' );
                }
            }
    );

    __shim__( String.prototype,
            'trimLeft', function(check) {
                if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                    <- this.replace( leftTrimSpaceRegex, '' );
                } else if ( check.length === 0 ) {
                    <- this;
                } else {
                    var check = check.escapeRegExp();

                    <- this.replace(
                            new RegExp( "^(" + check + ")(" + check + ")*" ),
                            ''
                    );
                }
            }
    );

    __shim__( String.prototype,
            'trimRight', function() {
                if ( arguments.length === 0 || ( arguments.length === 1 && str === ' ' ) ) {
                    var	i = this.length;
                    while ( spaceRegex.test(this.charAt(--i)) );
                    return this.slice( 0, i + 1 );
                } else if ( check.length === 0 ) {
                    <- this;
                } else {
                    var check = check.escapeRegExp();

                    <- this.replace(
                            new RegExp( "(" + check + ")(" + check + ")*$" ),
                            ''
                    );
                }
            }
    );

    __shim__( String.prototype,
            'contains', function( str, index ) {
                if ( arguments.length === 1 ) {
                    return this.indexOf(str) !== -1;
                } else if ( arguments.length === 2 ) {
                    return this.indexOf(str, index) !== -1;
                } else if ( arguments.length === 0 ) {
                    throw new Error( "no search string provided" );
                }
            }
    );

    __shim__( String.prototype,
            // Fast repeat, uses the `Exponentiation by squaring` algorithm.
            'repeat', function(times) {
              if (times < 1) return '';
              if (times % 2) return this.repeat(times - 1) + this;
              var half = this.repeat(times / 2);
              return half + half;
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

===============================================================================

## document

===============================================================================

-------------------------------------------------------------------------------

### document.getElementsByClassName( name )

-------------------------------------------------------------------------------

    if ( document.getElementsByClassName === undefined ) {
        document.getElementsByClassName = function( klass ) {
            return document.querySelectorAll( '.' + klass );
        }
    };

===============================================================================

## textContent shim

===============================================================================

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


===============================================================================

## Element

These do *not* use __shim__, as it breaks in IE 8!

===============================================================================

-------------------------------------------------------------------------------

### element.addEventListener

-------------------------------------------------------------------------------

    if ( ! Element.prototype.addEventListener ) {
        Element.prototype.addEventListener = function( name, listener ) {
            return this.attachEvent( name, listener );
        }
    }



-------------------------------------------------------------------------------

### element.removeEventListener

-------------------------------------------------------------------------------

    if ( ! Element.prototype.removeEventListener ) {
        Element.prototype.removeEventListener = function( name, listener ) {
            return this.detachEvent( name, listener );
        }
    }



-------------------------------------------------------------------------------

### element.matchesSelector()

A new W3C selection tester, for testing if a node matches a selection. Very 
new, so it's either browser specific, or needs a shim.

@author termi https://gist.github.com/termi
@see https://gist.github.com/termi/2369850/f4022295bf19332ff17e79350ec06c5114d7fbc9

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

### element.matches

-------------------------------------------------------------------------------

    if ( ! Element.prototype.matches ) {
        Element.prototype.matches = Element.prototype.matchesSelector
    };

-------------------------------------------------------------------------------

### classList.js: Cross-browser full element.classList implementation.

2012-11-15

By Eli Grey, http://eligrey.com
Public Domain.

NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

@source http://purl.eligrey.com/github/classList.js/blob/master/classList.js

-------------------------------------------------------------------------------
  
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

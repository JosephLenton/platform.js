

extras
======

This is a page of extras, added onto the core datatypes, allowing you to do
more with them.

This includes extra array methods, methods on the object to allow it to be used in a
more array-like fashion.



===============================================================================

## Object

===============================================================================

    var __setProp__ = window.__setProp__;

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
        'invoke', function( method ) {
            <- this.invokeArray( method, arguments, 1 );
        }
    );

-------------------------------------------------------------------------------

### invokeArray

The same as invoke, only this will take an array of parameters instead.

-------------------------------------------------------------------------------

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
                    <- this[ method ]();
                } else if ( argsLen === 1 ) {
                    <- this[ method ]( args[1] );
                } else {
                    <- fun.apply( this, funArgs );
                }
            /*
             * obj.invoke( function() { } );
             */
            } else if ( isFunction(method) ) {
                if ( argsLen === 0 ) {
                    <- method.call( this );
                } else if ( argsLen === 1 ) {
                    <- method.call( this, args[1] );
                } else {
                    <- method.apply( this, funArgs );
                }
            } else {
                fail( method, "non-function provided" );
            }
        }
    );

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'getProp', function( name ) {
                return this[name];
            }
    );

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'setProp', function( obj, value ) {
                if ( arguments.length === 1 ) {
                    if ( ! isObject(obj) ) {
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

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'method', function( name ) {
                if ( !isString(name) && !isFunction(name) ) {
                    fail( "unknown value given for method 'name'" );
                } else {
                    return this.methodApply( name, arguments, 1 );
                }
            }
    );



-------------------------------------------------------------------------------

### methodApply

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### has

This is the same as 'hasOwnProperty', but is shorter, making it nicer to use.

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'has', Object.hasOwnProperty
    );

===============================================================================

## String

===============================================================================

    var stringHTMLElement = document.createElement( 'div' );

    var escapeRegExpRegExp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

    var repeatString = function( pattern, count ) {
        if (count < 1) {
            <- '';

        } else if ( count === 1 ) {
            <- pattern;

        } else if ( count === 2 ) {
            <- pattern + pattern ;

        } else if ( count === 3 ) {
            <- pattern + pattern + pattern ;

        } else if ( count === 4 ) {
            <- pattern + pattern + pattern + pattern ;

        } else {
            var result = '';

            while (count > 1) {
                if (count & 1) {
                    result += pattern;
                }

                count >>= 1, pattern += pattern;
            }

            <- result + pattern;
        }
    }



===============================================================================

### String.KEY_CODES

This is a full list of the majority of the keyboard character and key codes,
supported in the current browser.

===============================================================================

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



-------------------------------------------------------------------------------

### escapeRegExp

Returns a version of this string, where all special characters from a regular
expression, are escaped and made safe.

@return This string, with all RegExp characters escaped, so they no longer 
  affect any RegExp.

-------------------------------------------------------------------------------

    __setProp__( String.prototype,
            'escapeRegExp', function() {
                return this.replace( escapeRegExpRegExp, "\\$&" );
            }
    )



-------------------------------------------------------------------------------

### escapeHTML

Escapes this string, so it is safe within HTML. This alters all HTML characters
and entities, so they are safe.

If you are doing this to insert a string into an element; STOP! It is better to
set it using the elements 'textContent' property, than to escape with this, and
then set it.

However you can use this if you know better.

@return This string, with all HTML characters escaped, so they no longer affect
  HTML.

-------------------------------------------------------------------------------

    __setProp__( String.prototype,
            'escapeHTML', function() {
                stringHTMLElement.textContent = this.valueOf();
                var html = stringHTMLElement.innerHTML;
                stringHTMLElement.innerHTML = '';

                return html;
            }
    );

-------------------------------------------------------------------------------

### remove

Removes all of the strings given, from this string.

```
    // yields "he wrd"
    "hello world".remove( 'l', 'o' );

@param 1 or more strings to be removed.
@return A new string, with all occurrances of the string given, to be removed.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### lastSplit

This is the equivalent to:

```
     someString.split( str ).pop() || ''

What it does, is find the last occurance of
'str', and then returns a substring of
everything after that occurance.

@param str The string to look for.
@return The string found, or an empty string if not found.

-------------------------------------------------------------------------------

    __setProp__( String.prototype,
            'lastSplit', function( str ) {
                var index = this.valueOf().lastIndexOf( str );

                if ( index === -1 ) {
                    return '';
                } else {
                    return this.valueOf().substring( index+1 );
                }
            }
    );



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    __setProp__( String.prototype,
            'toHTML', function() {
                stringHTMLElement.innerHTML = this.valueOf();
                var child = stringHTMLElement.firstChild;
                stringHTMLElement.innerHTML = '';

                return child;
            }
    );



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### text

The same as String.html, only this places this string into the element as text,
instead of raw html.

```
    blogElement.add(
            "Welcome to my blog!".text( 'h1', 'blog-header' )
    );

@return A new HTML Element, with it's text containing this string.

-------------------------------------------------------------------------------

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


-------------------------------------------------------------------------------

### string.matches( regexp )

This is for an all or nothing test, to see if a string matches a whole regular
expression 100%, or not.

@return True if the regular expression matched the entire string, false if not.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### string.isInteger()

Tests if this string looks like an integer, and if so, then returns true or 
false accordingly.

Note this does not take into account hexadecimal, or any other special notation.
Numbers such as '0999' are also deemed to be not an integer, as it starts with
a trailing zero.

@return True if this string looks like an integer, and false if not.

-------------------------------------------------------------------------------

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
                        <- false;
                    // it's '-0 ... something', such as '-0939', return false
                    } else if ( thisVal.length > 2 && thisVal.charCodeAt(1) === '48' ) {
                        <- false;
                    } else {
                        i = 1;
                    }
                // it's '0 ... something', such as '0939', return false
                } else if ( thisVal.length > 1 && thisVal.charCodeAt(0) === '48' ) {
                    <- false
                } else {
                    i = 0;
                }

                for ( ; i < thisVal.length; i++ ) {
                    var c = thisVal.charCodeAt(0);

                    // if not an ASCII number (before or after 0-9)
                    if ( c < 48 || 57 < c ) {
                        <- false;
                    }
                }

                <- true;
            }
    );



-------------------------------------------------------------------------------

## string.padLeft

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

## string.padRight

-------------------------------------------------------------------------------

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



===============================================================================

## Array

===============================================================================

-------------------------------------------------------------------------------

### map shim

This is a shim for the Array.map method, *if* it is not yet implemented.

We fallback onto the old map for some of our behaviour, or define a new one, if
missing (IE 8).

@see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map#Compatibility

-------------------------------------------------------------------------------

    var oldMap = Array.prototype.map;
    if ( ! ('map' in Array.prototype) ) {
        oldMap = function(callback, thisArg) {
            var T, A, k;

            if (this == null) {
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

-------------------------------------------------------------------------------

### filterOutMethod

Same as 'filterMethod', however this will remove
all items which return 'true', rather than keep them.

This is useful for when things return 'true',
and you don't want them. For example:

```
    var nonEmptyNodes = nodes.filterOutMethod( 'isEmpty' )

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### filterMethod

Calls the given method against all elements in the array.
If it returns a non-falsy item (false, null, or undefined),
then it will be kept.

Otherwise, it will be removed.

```
    var emptyNodes = nodes.filterOutMethod( 'isEmpty' )

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### filterOutType

This is shorthand for using filterType,
where 'keepProto' is set to false.

-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'filterOutType', function( proto, thisObj ) {
                if ( arguments.length > 1 ) {
                    return this.filterType( proto, thisObj, false );
                } else {
                    return this.filterType( proto, false );
                }
            }
    );



-------------------------------------------------------------------------------

### filterType

Filters object based on the prototype given.
This can work in two ways:

 - keepProto = true - keep only object, of that type
 - keepProto = true - keep all objects, except for that type

By default, keepProto is true, and so will keep only items
which match the proto constructor given.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### each

Similar to 'forEach', except the optional 'thisArg' is the first parameter.

The thisArg is also returned if it is provided, and if not, then this array is
returned.

@param thisArg Optional, the value that will be 'this' in the callback.
@param callback The function to perform on each value.
@return This array if no 'thisArg', otherwise the 'thisArg' value given.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'inject', function( sum, fun ) {
                if ( arguments.length === 1 ) {
                    assertFunction( sum, "no inject function provided" );

                    <- this.reduce( sum );
                } else {
                    assertFunction( fun, "no inject function provided" );

                    <- this.reduce( fun, sum );
                }
            }
    );



-------------------------------------------------------------------------------

### array.first()

@return The first element in this array, or undefined if not found.

-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'first', function() {
                return this[0];
            }
    );



-------------------------------------------------------------------------------

### array.last()

@return The last element in this array, or undefined if not found.

-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'last', function() {
                return this[ this.length - 1 ];
            }
    );



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'get', function( index ) {
                <- ( index < 0 ) ?
                        this[ this.length + index ] :
                        this[ index ]               ;
            }
    );



-------------------------------------------------------------------------------

### array.set( index, value )

Sets an element to this array, just like with standard array notation.
This is useful for currying, and it also supports negative indexes.

@param index Where to store the element in this array.
@param value The value to store.
@return This array, for method chaining.

-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'set', function( index, value ) {
                if ( index < 0 ) {
                    this[ this.length + index ] = value;
                } else {
                    this[ index ] = value;
                }

                <- this;
            }
    );



-------------------------------------------------------------------------------

### array.drop( index )

Removes the item at the index given. This can be a negative or positive index.
The element is deleted from this array, and this array is then returned, 
allowing function chaining.

@param index The index of where to delete an item from this array.
@return this array.

-------------------------------------------------------------------------------

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

                <- this;
            }
    );



===============================================================================

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

===============================================================================

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




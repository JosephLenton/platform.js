

extras
======

This is a page of extras, added onto the core datatypes, allowing you to do
more with them.

This includes extra array methods, methods on the object to allow it to be used in a
more array-like fashion.



===============================================================================

## Object

===============================================================================

    var __setProp__ = window['__setProp__'];

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
    var getName = obj.method( 'getName' );

    // sometime later
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

    // some time later
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

#### call multiple methods

You can also provide array descriptions, to call multiple methods in order.
For example:

```
     var fun = this.foo.method(
             [ 'doA', a, b, c ],
             [ 'doB', x, y, z ]
     )

... instead of ...

```
    var fun = (function(foo) {
        return function() {
            foo.doA( a, b, c );
            return foo.doB( x, y, z );
        }
    })( this.foo );

When the function created is called, it's last method is used for the return
value.

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'method', function( name ) {
                if ( isString(name) ) {
                    return this.methodApply( name, arguments, 1 );
                } else {
                    var args = arguments;

                    for ( var i = 0; i < args.length; i++ ) {
                        var arg = args[i];

                        assert( isArray(arg) );
                        assert( arg.length > 0, "empty array given" );
                    }

                    var self = this;
                    return function() {
                        var lastR;

                        for ( var i = 0; i < args.length; i++ ) {
                            var arg = args[i];

                            if ( arg.length === 1 ) {
                                lastR = self[arg[0]]();
                            } else {
                                lastR = self.call.apply( self, args );
                            }
                        }

                        return lastR;
                    }
                }
            }
    );



-------------------------------------------------------------------------------

### methodApply

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'methodApply', function( name, args, startI ) {
                var fun = this[name];

                if ( (typeof fun !== 'function') || !(fun instanceof Function) ) {
                    throw new Error( "function " + name + " not found ", name );
                } else if ( startI >= args.length ) {
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

    var escaprRegExpRegExp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;


-------------------------------------------------------------------------------

### escapeRegExp

Returns a version of this string, where all special characters from a regular
expression, are escaped and made safe.

-------------------------------------------------------------------------------

    __setProp__( String.prototype,
            'escapeRegExp', function() {
                return this.replace(escapeRegExpRegExp, "\\$&");
            }
    )



-------------------------------------------------------------------------------

### remove

Removes all of the strings given, from this string.

```
    // yields "he wrld"
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

                    return this.replace( new RegExp(reg + ')', 'g'), '' );
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
                var index = this.lastIndexOf( str );

                if ( index === -1 ) {
                    return '';
                } else {
                    return this.substring( index+1 );
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
                var wrap = document.createElement( 'div' );
                wrap.innerHTML = this;
                return wrap.firstChild || wrap;
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
                if ( window['bb'] ) {
                    var comp = bb.createArray( arguments[0], arguments, 1 );
                    comp.innerHTML = this;
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
                if ( window['bb'] ) {
                    var comp = bb.createArray( arguments[0], arguments, 1 );
                    comp.textContent = this;
                    return comp;
                } else {
                    throw new Error( 'bb not found, and is required for this method' );
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
                    return this.reduce( sum );
                } else {
                    assertFunction( fun, "no inject function provided" );
                    return this.reduce( fun, sum );
                }
            }
    )


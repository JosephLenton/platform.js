
===============================================================================

## Object

===============================================================================

    var __setProp__ = window['__setProp__'];

-------------------------------------------------------------------------------

Maps the function given, against the items stored
within this object. Note that only the items *directly*
stored are included; prototype items are skipped.

The function is in the order:

 function( value, key )

This is so that it matches up with Array.map.

@param fun The function to apply against this object's properties.

-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'map', function( fun ) {
                var rs = [];

                for ( var k in this ) {
                    if ( this.has(k) ) {
                        rs.push( fun.call(this, this[k], k) );
                    }
                }

                return rs;
            }

    );



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'getProp', function( name ) {
                return this[name];
            }
    );



-------------------------------------------------------------------------------

Finds the method, and binds it to 'this' object.
This is so you can do:

```
     this.foo.bar.something().whatever.method( 'doWork' );

... instead of ...

```
     this.foo.bar.something().whatever.doWork.bind(
             this.foo.bar.something().whatever
     )

You can also provide array descriptions,
to call multiple methods in order.
For example:

```
     this.foo.method(
             [ 'doA', a, b, c ],
             [ 'doB', x, y, z ]
     )

When the function created is called,
it's last argument is executed.

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
-------------------------------------------------------------------------------

    __setProp__( Object.prototype,
            'has', Object.hasOwnProperty
    );

===============================================================================

## String

===============================================================================

-------------------------------------------------------------------------------

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



===============================================================================

## Array

===============================================================================

-------------------------------------------------------------------------------

We fallback onto the old map for some of our behaviour,
or define a new one, if missing (IE 8).

@see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map#Compatibility

-------------------------------------------------------------------------------

    var oldMap = Array.prototype.map;
    if ( oldMap === undefined ) {
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

Similar to 'forEach',
except that the target goes first in the parameter list.

The target is also returned if it is provided,
and if not, then this array is returned.

-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'each', function( target, callback ) {
                if ( arguments.length === 1 ) {
                    callback = target;
                    assertFunction( callback );

                    this.forEach( target );

                    return this;
                } else {
                    assertFunction( callback );

                    this.forEach( callback, target );

                    return target;
                }
            }
    );



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    __setProp__( Array.prototype,
            'map', function( fun ) {
                if ( typeof fun === 'string' || (fun instanceof String) ) {
                    var args = new Array( arguments.length-1 );
                    for ( var i = 0; i < args.length; i++ ) {
                        args[i] = arguments[i-1];
                    }

                    return oldMap.call( this, function(obj) {
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


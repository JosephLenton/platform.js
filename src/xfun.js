"use strict";

window['xfun'] = (function() {
    var xfun = function() {
        return xfun.protoConcatArray( arguments );
    }

    /**
     * Adds all of the methods of various prototypes,
     * onto the first one given.
     *
     * example:
     *
     *      var Enemy = function() { }
     *
     *      xfun.addProto( Enemey, Sprite, {
     *          kill: function() {}
     *      } );
     * 
     * The Sprite's methods and 'kill' function are
     * added to the Enemy fun.
     */
    xfun.addProto = function( obj ) {
        return xfun.addProtoArray( obj, arguments, 1 );
    }

    xfun.addProtoArray = function( obj, arr, i ) {
        if ( i === undefined ) {
            i = 0;
        }

        var dest = isFunction(obj) ?
                obj.prototype :
                obj ;

        for ( ; i < arr.length; i++ ) {
            var proto = arr[i];

            if ( isFunction(proto) ) {
                proto = proto.prototype;
            }

            for ( var k in proto ) {
                if ( proto.hasObjectProperty(k) ) {
                    dest[k] = proto[k];
                }
            }
        }

        return obj;
    }

    /**
     * Given multiple prototypes, this will concat all of their 
     * methods together, to create a single prototype.
     *
     *      var Enemy = function() { }
     *
     *      Enemy.prototype = xfun.protoConcat( Sprite, {
     *          kill: function() {}
     *      } );
     * 
     * This new prototype is then returned.
     */
    xfun.protoConcat = function() {
        return xfun.protoConcatArray( arguments );
    }

    xfun.protoConcatArray = function( arr, i ) {
        if ( i === undefined ) {
            i = 0;
        }

        var obj = {};

        for ( ; i < arr.length; i++ ) {
            var proto = arr[i];

            if ( isFunction(proto) ) {
                proto = proto.prototype;
            }

            for ( var k in proto ) {
                if ( proto.hasObjectProperty(k) ) {
                    obj[k] = proto[k];
                }
            }
        }

        return obj;
    }

    var hookup = function( fun, hooks, createFun ) {
        var proto = isFunction(fun) ?
                fun.prototype :
                fun ;

        for ( var k in hooks ) {
            if ( hooks.hasObjectProperty(k) ) {
                proto[k] = createFun( proto[k], hooks[k] );
            }
        }

        return fun;
    }

    xfun.pre = function( fun, hooks ) {
        return hookup( fun, hooks, function(method, postMethod) {
            return function() {
                postMethod.apply( this, arguments );
                return method.apply( this, arguments );
            }
        } );
    }

    /**
     * Injects functions, based on 'hooks', to run after
     * existing methods.
     *
     * This works of prototypes, and indevidual objects.
     */
    xfun.post = function( fun, hooks ) {
        return hookup( fun, hooks, function(method, postMethod) {
            return function() {
                var r = method.apply( this, arguments );
                postMethod.apply( this, arguments );
                return r;
            }
        } );
    }

    return xfun;
});

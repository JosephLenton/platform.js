"use strict";

/**
 * abc.js
 *
 * A debugging library based on Letters
 * for Ruby, http://lettersrb.com
 *
 * Adds methods to the Object prototype,
 * for quick debugging at runtime.
 *
 * a is for assertion
 * b is for block
 * c is for call method
 * d is for debug
 * e if for asserts if this is empty
 * f is for print field
 *
 * k is for printing keys
 *
 * l is for log console
 *
 * m is for mark object
 * n is for no mark (unmark object)
 *
 * p is for print
 *
 * s is for stack trace
 * t is for timestamp
 * u is for user alert
 *
 * v is for printing values
 *
 * ## Marking
 *
 * Some functions allow you to mark / unmark,
 * or filter based on mark.
 *
 * By 'mark' it means setting an identifier to
 * that object. Why? Sometimes in large systems,
 * you have lots of objects floating around,
 * and being pushed through single functions.
 *
 * Marking is a way for you to mark objects in
 * the data set before a function call, and then
 * easily see if they turn up later in other parts
 * of your program.
 *
 * 'true' represents 'all marks', and is used
 * when you ask to mark, but don't specify it.
 */
(function() {
    /**
     * Assertion
     *
     *      foo.a()
     *              // asserts 'this'
     *
     *      foo.a( function(f) { return f < 10 } )
     *              // throws assertion if f is not less than 10
     */
    Object.prototype.a = function( block, msg ) {
        if ( arguments.length === 1 ) {
            if ( !(typeof block === 'function') && !(block instanceof Function) ) {
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
                    (!(typeof block === 'function') && !(block instanceof Function)) &&
                    ( (typeof   msg === 'function') &&  (  msg instanceof Function))
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

    /**
     * Block
     *
     * Function is in the form:
     *
     *      f( obj, mark )
     *
     * If no mark has been placed,
     * then mark will be undefined.
     *
     * The return value is ignored.
     *
     * Example 1,
     *
     *      foo.
     *              b( function(obj) {
     *                  if ( obj ) {
     *                      console.log( obj );
     *                  }
     *              } ).
     *              doWork();
     *
     * Example 2,
     *
     *      bar.m( 'work-object' );
     *
     *      // some time later
     *
     *      foo.
     *              b( function(obj, mark) {
     *                  if ( mark === 'work-object' ) {
     *                      console.log( obj );
     *                  }
     *              } ).
     *              doWork();
     *
     * @param cmd A block to pass this object into.
     * @return This object.
     */
    Object.prototype.b = function( cmd ) {
        cmd.call( this, this, this.____mark____ );

        return this;
    }

    Object.prototype.c = function( method ) {
        var args = new Array( arguments.length-1 );
        for ( var i = 1; i < arguments.length; i++ ) {
            args[i-1] = arguments[i];
        }

        this[method].apply( this, args );

        return this;
    }

    /**
     * Debug
     *
     * Starts the debugger, if available.
     *
     * To select any object that is marked,
     * just pass in true.
     *
     * @param mark Optional, if provided the debugger is only hit if this has the same mark.
     * @return This.
     */
    Object.prototype.d = function( mark ) {
        if ( arguments.length === 0 ) {
            debugger;
        } else if ( mark === true || this.___mark___ === mark ) {
            debugger;
        }

        return this;
    }

    /**
     * Asserts this is empty.
     */
    Object.prototype.e = function() {
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

    Object.prototype.f = function( field ) {
        console.log( this[field] );

        return this;
    }

    /**
     * Prints all of the keys for this object.
     * This only includes keys which are on this
     * objects property; it ignores prototypal
     * properties.
     *
     * If a block is provided, then the keys will
     * passed into that on each iteration instead
     * of being outputted to the console.
     *
     * @param block Optional, a block for iterating across all keys.
     * @return This object.
     */
    Object.prototype.k = function( block ) {
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

    /**
     * Prints a message via console.log.
     * If a msg is provided, it is printed,
     * and otherwise this object is printed.
     *
     * @param Optional, a message to send to the console instead.
     * @return This.
     */
    Object.prototype.l = function( msg ) {
        console.log( msg || this );

        return this;
    }

    /**
     * Mark
     *
     * ## marking with a value
     *
     * The parameter given is the value to use
     * when marking.
     *
     * This allows you to mark different objects,
     * with different values, so they can be
     * identified in different ways.
     *
     * ## marking via block
     *
     * If called with a block,
     * the object is passed into that block.
     *
     * If the block returns a non-falsy object,
     * the object is then marked.
     *
     * If called with no block,
     * it is marked for certain.
     *
     * This is to allow marking specific objects 
     * in a large system, and then allow you to
     * retrieve them again later.
     *
     * @param block An optional filter for marking objects, or the value to mark them with.
     * @return This object.
     */
    Object.prototype.m = function( block ) {
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

    /**
     * No Mark
     *
     * If this has a mark, then it is unmarked.
     * The given block, like with mark,
     * allows you to filter unmarking objects.
     *
     * @param block An optional filter to use for unmarking.
     * @return This object.
     */
    Object.prototype.n = function( block ) {
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

    Object.prototype.p = function( msg ) {
        if ( arguments.length === 0 ) {
            console.log( this );
        } else {
            console.log( msg, this );
        }

        return this;
    }

    /**
     * Stack trace.
     *
     * Prints a stack trace to the console.
     * @return This object.
     */
    Object.prototype.s = function() {
        var err = new Error();

        if ( err.stack ) {
            console.log( err.stack );
        }

        return this;
    }

    /**
     * Timestamp
     *
     * A timestamp is dumped to the console.
     *
     * @return This object.
     */
    Object.prototype.t = function() {
        console.log( Date.now() );

        return this;
    }

    /**
     * User Alert
     *
     * Shows an alert to the user.
     *
     * @param msg Optional, a message to display, defaults to this object.
     * @return This.
     */
    Object.prototype.u = function( msg ) {
        if ( arguments.length > 0 ) {
            alert( msg );
        } else {
            alert( this );
        }

        return this;
    }

    /**
     * This will iterate over all of the key => value pairs
     * in this object. That is regardless of if this is
     * an Array, Object, or something else.
     *
     * By default, they are printed.
     *
     * If a block is provided, they are passed to the block
     * in turn.
     *
     *      foo.v( function(k, val) { ... } )
     *
     * @param block An optional block for iterating over the key-value pairs.
     * @return This object.
     */
    Object.prototype.v = function( block ) {
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
})();

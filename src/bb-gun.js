"use strict";

/**
 * The higher level DOM alternative, BB-Gun.
 * It wraps doms, allowing you to do slightly more.
 *
 * It is intended that you would extend this,
 * to create your own nodes.
 */
window['BBGun'] = (function() {
    var prepEvent = function( ev ) {
        ev.doPropagate = false;
        ev.propagate = function() {
            this.doPropagate = true;
        }
    }

    /**
     * The event handler.
     *
     * It works in two levels:
     *  - events do *not* propagate to parents by default.
     *  - events are passed to those on the same level, unless they return false.
     */
    var EventsManager = function( xe ) {
        this.xe = xe;
        this.events = {};

        var self = this;
        this.handleEvent = function( ev ) {
            self.fireDomEvent(
                    bb.setup.normalizeEventName( ev.type || ev.name ),
                    ev
            );
        }
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
                        bb.on( this.xe.dom(), name, this.handleEvent );
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
                logError( "removing node which does not have a parent", node );
            } else if ( nodeParent !== self ) {
                logError( "removing node which is not a child of this node", node );
            }

            removeDomCycle( node, args );
        } else if ( node instanceof Element ) {
            if ( node.parentNode !== selfDom ) {
                logError( "removing Element which is not a child of this node", node );
            } else {
                delete node.__xe;
                node.parentNode.removeChild( nodeDom );
            }
        } else {
            logError( "removing unsupported element", node );
        }
    }

    var beforeAfterChild = function( bbGun, current, args, isAfter ) {
        if ( args.length >= 2 ) {
            assert( current, "falsy parameter given" );
            assert( bbGun.child(current) !== null, "child given, is not a child of this node" );

            for ( var i = 1; i < args.length; i++ ) {
                var arg = args[i];

                assert( arg, "falsy parameter given" );

                assertNot( (arg instanceof Element) && (arg.parentNode !== null), "HTML Element given already has a parent" );
                assertNot( (arg.__isBBGun) && (arg.parent() !== null), "BBGun element given already has a parent" );
            }

            if ( isAfter ) {
                bb.afterArray( current, args, 1 );
            } else {
                bb.beforeArray( current, args, 1 );
            }
        } else {
            logError( "invalid number of parameters" );
        }
    }

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

        if ( newNode instanceof Element ) {
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
        /**
         * A list of all 'legal' events.
         */
        __eventList: {
                'replace': true,
                'beforereplace': true,

                'remove': true,
                'beforeremove': true
        },

        /**
         *      parent() -> BBGun | null
         *
         * Returns the BBGun parent of this object, or
         * null if this has no parent.
         *
         * @return The BBGun parent above this one,
         *         or null.
         *
         *      parent( BBGun ) -> boolean
         *
         * Given a BBGun instance, this returns true
         * if it is the parent of this object, and false
         * if not.
         *
         * @param bbgun A BBGun object to test against.
         * @return True if the BBGun given is the parent
         *         of this, otherwise false.
         *
         *      parent( (BBGun) -> any ) -> BBGun | null | any
         *
         * Given a function, it will call the function,
         * if this has a parent. If there is no parent,
         * then null is returned.
         *
         * If the function returns a value other than
         * undefined, this will be returned instead of
         * the parent.
         *
         * This means if the function returns 'false'
         * or 'null', then 'false' or 'null' will be
         * returned.
         *
         *      parent( string ) -> BBGun | null
         *
         * Given a string description of a node, this will
         * search for it, and return the first parent that
         * matches, if found.
         *
         * If not found, then this will return null.
         *
         *      parent( string, (BBGun) -> any ) -> BBGun | null | any
         *
         * This is a mix of the function and string version
         * of parent.
         */
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
                    logError( "invalid parameter given", f );
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
                logError( "too many parameters given" );
            }

            return null;
        },

        /**
         *      children() -> [ BBGun ]
         *
         *      children( (BBGun) -> any ) -> [ BBGun ]
         *
         * @return An array containing all of the children of this BBGun.
         */
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
                    logError( "unknown parameter given", f );
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
                logError( "too many parameters given" );
            }

            return [];
        },

        child: function( obj, f ) {
            var argsLen = arguments.length;

            if ( argsLen === 1 ) {
                if ( isString(obj) ) {
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
                } else if ( obj instanceof Element ) {
                    var children = this.dom().childNodes;
                    for ( var i = 0; i < children.length; i++ ) {
                        if ( children[i] === obj ) {
                            return obj;
                        }
                    }
                } else {
                    logError( "invalid parameter given as selector", obj );
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
                logError( "too many parameters given" );
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

        /**
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

        /**
         * Replaces this node with the one given,
         * or replaces one child with another.
         *
         *      replace( newNode ) -> this
         *
         * Replaces this node, with the one given,
         * in the DOM.
         *
         *      replace( childNode, newNode ) -> this
         *
         * Replaces the childNode given, with the nodeNode.
         * The child must be a child of this node.
         *
         *      replace( (newNode, newDom:Element) -> any ) -> this 
         *
         * Adds a function to be called, when this node
         * is replaced by another.
         *
         *      foo.replace( function(newNode) {
         *          // on 'replace' event here
         *      } );
         *
         *      replace( (newNode, newDom:Element) -> any,
         *               (newNode, newDom:Element) -> any ) -> this 
         *
         *      foo.replace(
         *          function(newNode) {
         *              // on 'beforeReplace' event here
         *          },
         *          function(newNode) {
         *              // on 'replace' event here
         *          }
         *      );
         *
         * The first parameter is whatever was given, for
         * the replacement. This could be text, an object
         * description, a BBGun node, or whatever.
         *
         * The second parameter is the DOM node for that
         * newNode.
         *
         * If an Element was given, then 'newNode' and 'newDom'
         * will be identical.
         *
         */
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
                    logError( "'beforeReplace' event is not a function" );
                } else {
                    assert( oldNode, "falsy oldNode given" );
                    assert( newNode, "falsy newNode given" );

                    var oldDom, newDom;
                    if ( oldNode instanceof Element ) {
                        oldDom = oldNode;
                    } else if ( oldNode.__isBBGun ) {
                        oldDom = oldNode.dom();
                    } else {
                        logError( "node given, is not a HTML element", oldNode );
                    }

                    try {
                        var newDom = bb( newNode );
                    } catch ( err ) {
                        logError( "replacement node is not a HTML element (perhaps you meant 'replaceWith'?)", err, err.stack );
                    }

                    var dom = this.dom();
                    assert( oldDom.parentNode === dom , "removing node which is not a child of this element" );
                    assert( newDom.parentNode === null, "adding node which is already a child of another" );

                    logError( 'replacement events need to be sent to the child' );

                    replaceNode( oldDom, newDom, arguments, 2 );
                }
            } else {
                logError( "too many, or not enough, parameters provided", arguments );
            }

            return this;
        },

        beforeRemove: function( f ) {
            assert( arguments.length === 1, "number of parameters is incorrect" );
            assertFunction( f );

            return this.on( 'beforeremove', f );
        },

        /**
         * remove()
         *
         *  Removes this from it's parent DOM node.
         *
         * remove( Event )
         *
         *  Removes this from it's parent DOM node,
         *  and passes the event to any listeners.
         *
         * remove( node )
         *
         *  Removes the node given, from this.
         *  If it is not found, then an error is raised.
         *
         * remove( function(ev) {
         *      // on remove code here
         * } )
         *
         *  Adds an event to be called, when this node is
         *  removed. Note that it only works if you are
         *  working through BBGun objects API.
         */
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
                    logError( "'beforeRemove' event is not a function" );
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
                logError( "invalid number of arguments given" );
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
                } else if (isObject(obj)) {
                    bb.style(this.dom(), obj);
                } else {
                    logError("invalid style parameter", obj);
                }
            } else if (argsLen === 2) {
                assert(isString(obj) && isLiteral(val),
                        "invalid parameters")

                this.dom().style[obj] = val;
            } else {
                logError("too many parameters", arguments);
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
})();


===============================================================================

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

===============================================================================

    var DEFAULT_ELEMENT = 'div';

    var TYPE_NAME_PROPERTY = 'nodeName';

    var listToMap = function() {
        var elements = {};

        for ( var i = 0; i < arguments.length; i++ ) {
            var el = arguments[i];

            assert( ! elements.hasOwnProperty(el), "duplicate entry found in list '" + el + "'" );
            elements[ el ] = true;
        }

        return elements;
    }

    var HTML_ELEMENTS = listToMap(
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
    )

-------------------------------------------------------------------------------

## HTML Events

All of the HTML events available.

-------------------------------------------------------------------------------

    var HTML_EVENTS = listToMap(
            /* CSS Events */

            // this is added manually as a custom event,
            // to deal with prefixes.
            
            //'transitionend',
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
    )

-------------------------------------------------------------------------------

### assertParent( dom:Element )

Throws an error, if the given dom element does not have a parent node.

-------------------------------------------------------------------------------

    var assertParent = function( dom ) {
        assert( dom.parentNode !== null, "dom is not in the document; it doesn't have a parentNode" );
    }

-------------------------------------------------------------------------------

### newRegisterMethod

Generates a register method.

We generate it, so we can avoid the cost of passing
in a callback method.

@param methodName The name of this method (for internal recursive calls).
@param methodNameOne The name of the callback to perform, on this object.

-------------------------------------------------------------------------------

    var newRegisterMethod = function( methodName, methodNameOne ) {
        return new Function( "name", "fun", [
                        '    var argsLen = arguments.length;',
                        '    ',
                        '    if ( argsLen === 1 ) {',
                        '        assertObject( name, "non-object given for registering" );',
                        '        ',
                        '        for ( var k in name ) {',
                        '            if ( name.hasOwnProperty(k) ) {',
                        '                this.' + methodName + '( k, name[k] );',
                        '            }',
                        '        }',
                        '    } else if ( argsLen === 2 ) {',
                        '        if ( name instanceof Array ) {',
                        '            for ( var i = 0; i < name.length; i++ ) {',
                        '                this.' + methodName + '( name[i], fun );',
                        '            }',
                        '        } else {',
                        '            assertString( name, "non-string given for name" );',
                        '            assertFunction( fun, "non-function given for function" );',
                        '            ',
                        '            this.' + methodNameOne + '( name, fun );',
                        '        }',
                        '    } else if ( argsLen === 0 ) {',
                        '        logError( "no parameters given" )',
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

    /**
     * Helper Methods, before, bb it's self!
     */

    var setOnObject = function( events, dom, obj, useCapture ) {
        assert( dom, "null or undefined dom given", dom );

        for ( var k in obj ) {
            if ( obj.hasOwnProperty(k) ) {
                setOn( events, dom, k, obj[k], useCapture )
            }
        }
    }

    var setOn = function( events, dom, name, fun, useCapture ) {
        assert( dom, "null or undefined dom given", dom );

        if ( name instanceof Array ) {
            for ( var i = 0; i < name.length; i++ ) {
                setOn( events, dom, name, fun, useCapture );
            }
        } else {
            if ( dom instanceof Element ) {
                if ( events.hasOwnProperty(name) ) {
                    events[name](dom, fun, useCapture);
                } else {
                    dom.addEventListener( name, fun, useCapture )
                }
            } else if ( dom instanceof Array ) {
                for ( var i = 0; i < dom.length; i++ ) {
                    setOn( events, dom[i], name, fun, useCapture );
                }
            }
        }
    }

    var iterateClasses = function( args, i, endI, fun ) {
        for ( ; i < endI; i++ ) {
            var arg = args[i];

            if ( isString(arg) ) {
                assertString( arg, "expected string for add DOM class" );

                arg = arg.trim();
                if ( arg.length > 0 ) {
                    if ( arg.indexOf(' ') !== -1 ) {
                        var klasses = arg.split( ' ' );

                        for ( var j = 0; j < klasses.length; j++ ) {
                            var klass = klasses[j];

                            if ( klass !== '' ) {
                                var dotI = klass.indexOf( '.' );
                                if ( dotI === 0 ) {
                                    klass = klass.substring(1);
                                }

                                if ( klass.indexOf('.') !== -1 ) {
                                    var klassParts = klass.split('.');

                                    for ( var k = 0; k < klassParts.length; i++ ) {
                                        if ( fun(klassParts[k]) === false ) {
                                            return;
                                        }
                                    }
                                } else if ( fun(klass) === false ) {
                                    return;
                                }
                            }
                        }
                    } else {
                        var dotI = arg.indexOf( '.' );
                        if ( dotI === 0 ) {
                            arg = arg.substring(1);
                        }

                        if ( arg.indexOf('.') !== -1 ) {
                            var argParts = arg.split('.');

                            for ( var k = 0; k < argParts.length; i++ ) {
                                if ( fun(argParts[k]) === false ) {
                                    return;
                                }
                            }
                        } else if ( fun(arg) === false ) {
                            return;
                        }
                    }
                }
            } else if ( isArray(arg) ) {
                iterateClasses( arg, 0, arg.length, fun );
            } else {
                logError( "invalid parameter", arg, args, i, endI );
            }
        }
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
                logError( 'unknown class given', c );
            }
        }

        return klass;
    }

    var applyArray = function(bb, bbGun, dom, args, startI) {
        var argsLen = args.length;

        for (var i = startI; i < argsLen; i++) {
            applyOne(bb, bbGun, dom, args[i], false);
        }

        return dom;
    }

    var applyOne = function(bb, bbGun, dom, arg, stringsAreContent) {
        if (arg instanceof Array) {
            applyArray( bb, bbGun, dom, arg, 0 );
        } else if ( arg instanceof Element ) {
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
                bb.addClassOne( dom, arg );
            }
        } else if ( isObject(arg) ) {
            attrObj( bb, bbGun, dom, arg, true );
        } else {
            logError( "invalid argument given", arg );
        }

        return dom
    }

    var createOneBBGun = function( bb, bbgun, obj ) {
        if ( isObject(obj) ) {
            return createObj( bb, bbgun, obj );
        } else {
            var dom = createOne( bb, obj );
            assert( ! dom.__isBBGun, "BBGun given as basis for new BBGun" );
            bbgun.dom( dom );
        }

        return dom;
    }

    var createOne = function( bb, obj ) {
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
        } else if ( obj instanceof Element ) {
            return obj;
        } else if ( obj.__isBBGun ) {
            return obj;
        } else if ( isObject(obj) ) {
            return createObj( bb, null, obj );
        } else {
            logError( "unknown parameter given", obj );
        }
    }

    var createObj = function( bb, bbGun, obj ) {
        var dom = obj.hasOwnProperty(TYPE_NAME_PROPERTY)      ?
                bb.createElement( obj[TYPE_NAME_PROPERTY] ) :
                bb.createElement()                          ;

        if ( bbGun !== null ) {
            bbGun.dom( dom );
        }

        for ( var k in obj ) {
            if ( obj.hasOwnProperty(k) ) {
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
            var dom = htmlToElement( obj );

            if ( dom === undefined ) {
                logError( "invalid html given", obj );
            } else {
                return dom;
            }
        } else if ( obj.charAt(0) === '.' ) {
            var dom = bb.createElement();
            dom.className = obj.substring(1)
            return dom;
        } else if ( obj === '' ) {
            return bb.createElement();
        } else {
            return bb.createElement( obj )
        }
    }

    var toggleClassArray = function( dom, args, startI, inv ) {
        if ( startI === undefined ) {
            startI = 0;
        }

        var argsLen = args.length;
        var endI = argsLen;

        assert( startI < argsLen, "no arguments provided" );

        var arg = args[startI];
        var onRemove = args[ argsLen-1 ],
            onAdd;
        if ( isFunction(onRemove) ) {
            assert( startI < argsLen-1, "not enough arguments provided" );

            onAdd = args[ argsLen-2 ];

            if ( isFunction(onAdd) ) {
                endI -= 2;
            } else {
                onAdd = onRemove;
                onRemove = null;

                endI -= 1;
            }
        } else {
            onAdd = null;
            onRemove = null;
        }
         
        if ( arg === true || (inv && arg === false) ) {
            assert( startI+1 < endI, "no classes provided" );

            iterateClasses( args, startI+1, endI, function(klass) {
                dom.classList.add( klass );
            } );

            if ( onAdd !== null ) {
                onAdd.call( dom, true );
            }
        } else if ( arg === false || (inv && arg === true) ) {
            assert( startI+1 < endI, "no classes provided" );

            iterateClasses( args, startI+1, endI, function(klass) {
                dom.classList.remove( klass );
            } );

            if ( onRemove !== null ) {
                onRemove.call( dom, false );
            }
        } else {
            var lastArg = args[args.length-1];

            if ( lastArg === true || (inv && lastArg === false) ) {
                assert( startI < endI-1, "no classes provided" );

                iterateClasses( args, startI, endI-1, function(klass) {
                    dom.classList.add( klass );
                } );
            } else if ( lastArg === false || (inv && lastArg === true) ) {
                assert( startI < endI-1, "no classes provided" );

                iterateClasses( args, startI, endI-1, function(klass) {
                    dom.classList.remove( klass );
                } );
            } else {
                var hasRemove = false,
                    hasAdd = false;

                iterateClasses( args, startI, endI, function(klass) {
                    if ( dom.classList.contains(klass) ) {
                        dom.classList.remove(klass);
                        hasRemove = true;
                    } else {
                        dom.classList.add(klass);
                        hasAdd = true;
                    }
                } );

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
        }

        return dom;
    }

    var beforeOne = function( bb, parentDom, dom, arg ) {
        if ( dom !== null ) {
            if ( arg instanceof Array ) {
                for ( var i = 0; i < arg.length; i++ ) {
                    beforeOne( bb, parentDom, dom, arg[i] );
                }
            } else if ( arg instanceof Element ) {
                parentDom.insertBefore( arg, dom );
            } else if ( arg.__isBBGun ) {
                parentDom.insertBefore( arg.dom(), dom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforebegin', arg );
            } else if ( isObject(arg) ) {
                parentDom.insertBefore( createObj(bb, null, arg), dom );
            } else {
                logError( "invalid argument given", arg );
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
            } else if ( arg instanceof Element ) {
                parentDom.insertAfter( arg, dom );
            } else if ( arg.__isBBGun ) {
                parentDom.insertAfter( arg.dom(), dom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'afterend', arg );
            } else if ( isObject(arg) ) {
                parentDom.insertAfter( createObj(bb, null, arg), dom );
            } else {
                logError( "invalid argument given", arg );
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
            } else if ( arg instanceof Element ) {
                assert( arg.parentNode === null, "adding element, which already has a parent" );
                dom.appendChild( arg );
            } else if ( arg.__isBBGun ) {
                var argDom = arg.dom();
                assert( argDom.parentNode === null, "adding element, which already has a parent" );
                dom.appendChild( argDom );
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforeend', arg );
            } else if ( isObject(arg) ) {
                dom.appendChild( createObj(bb, null, arg) );
            } else {
                logError( "invalid argument given", arg );
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

        bb.addClassOne( newDom, className );
    }

    var newOneNewChildInner = function( bb, bbGun, dom, domType, val, debugVal ) {
        var newDom;

        if ( isObject(val) ) {
            assert( bb.setup.isElement(domType), "invalid element type given, " + domType );
            val[TYPE_NAME_PROPERTY] = domType;

            newDom = createObj( bb, null, val );
        } else {
            newDom = bb.createElement( domType );

            if ( val instanceof Element ) {
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
            } else {
                logError( "invalid object description given for, " + debugVal, debugVal );
            }
        }

        dom.appendChild( newDom );

        return newDom;
    }

    var attrOne = function(bb, bbGun, dom, k, val, isApply) {
        var dotI = k.indexOf( '.' );

        if ( dotI !== -1 ) {
            attrOneNewChild( bb, bbGun, dom, k, val, dotI );
        } else if ( k === TYPE_NAME_PROPERTY ) {
            /* do nothing */
        } else if ( k === 'className' ) {
            if ( isApply ) {
                bb.addClass( dom, val );
            } else {
                bb.setClass( dom, val );
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
                dom.setAttribute( val );
            } else {
                bb.style( dom, val );
            }
        } else if ( k === 'text' ) {
            bb.textOne( dom, val );
        } else if ( k === 'html' ) {
            bb.htmlOne( dom, val );
        } else if ( k === 'value' ) {
            if ( val === undefined || val === null ) {
                dom.value = '';
            } else {
                dom.value = val
            }

        } else if ( k === 'self' || k === 'this' ) {
            assertFunction( val, "none function given for 'self' attribute" );

            if ( bbGun !== null ) {
                val.call( bbGun, dom );
            } else {
                val.call( dom, dom );
            }

        /* Events */

        /* custom HTML event */
        } else if ( bb.setup.data.events.hasOwnProperty(k) ) {
            if ( bbGun !== null ) {
                bbGun.on( k, val );
            } else {
                bb.setup.data.events[k]( dom, val );
            }
        /* standard HTML event */
        } else if ( HTML_EVENTS.hasOwnProperty(k) ) {
            if ( bbGun !== null ) {
                bbGun.on( k, val );
            } else {
                dom.addEventListener( k, val, false )
            }
        /* custom BBGun Event */
        } else if ( bbGun !== null && bbGun.__proto__.__eventList[k] === true ) {
            bbGun.on( k, val );

        /* new objet creation */
        } else if ( bb.setup.isElement(k) ) {
            newOneNewChildInner( bb, bbGun, dom, k, val, k );

        /* Arribute */
        } else {
            assertLiteral( val, "setting an object to a DOM attribute (probably a bug)," + k, k, val )
            dom.setAttribute( k, val );
        }
    }

    var attrObj = function(bb, bbGun, dom, obj, isApply) {
        var hasHTMLText = false;

        for ( var k in obj ) {
            if ( obj.hasOwnProperty(k) ) {
                if ( k === 'text' || k === 'html' ) {
                    if ( hasHTMLText ) {
                        logError( "cannot use text and html at the same time", obj );
                    } else {
                        hasHTMLText = true;
                    }
                }

                attrOne( bb, bbGun, dom, k, obj[k], isApply );
            }
        }
    }

===============================================================================

newBB
-----

Factory method for creating the bb module it's self. It's here for:

 - emphasize what bb actually declares as public (everything in here).
 - allow creating copies of bb through bb.clone().
 - if cloned, it avoids re-creating the helper methods used within (as they are
   defined above this, outside).

===============================================================================

    var newBB = function() {

-------------------------------------------------------------------------------

## bb()

Runs 'createArray' with the values given,
and then returns the result.

This is shorthand for creating new DOM elements.

bb also has a tonne of methods added on top, like jQuery, it is both a library
and a function.

-------------------------------------------------------------------------------

        var bb = function() {
            if ( this instanceof bb ) {
                return newBB( arguments );
            } else {
                return bb.createArray( arguments[0], arguments, 1 );
            }
        }

-------------------------------------------------------------------------------

## bb.clone()

Clones the bb module, giving you a fresh copy.

-------------------------------------------------------------------------------

        bb.clone = function() {
            return newBB();
        }

        /**
         * Deals with the global setup of bb.
         *
         * For example adding more default elements.
         */
        bb.setup = {
                data: {
                        classPrefix: '',

                        /**
                         *  Map< Element-Name, (Name) -> Element >
                         *
                         * These contain alternative names for custom elements.
                         * At the time of writing, it's just shorthand for input
                         * types. So a name with 'checkbox' returns an input box
                         * of type 'checkbox'.
                         */
                        elements: {},

                        /**
                         *  Map< Event-Name, (Element, Name, Callback) -> void >
                         *
                         * Holds mappings of event names, to the functions that
                         * define them.
                         */
                        events  : {}
                },

                /**
                 * Allows you to get or set a prefix,
                 * which is appended before all class names,
                 * when a class is set to this.
                 *
                 *      classPrefix() -> String
                 *      classPrefix( prefix ) -> this
                 */
                classPrefix: function( prefix ) {
                    if ( arguments.length === 0 ) {
                        return this.data.prefix;
                    } else {
                        this.data.prefix = prefix;
                        return this;
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
                 */
                event: newRegisterMethod( 'event', 'eventOne' ),

                eventOne: function( name, fun ) {
                    this.data.events[ name ] = fun;
                },

                normalizeEventName: function( name ) {
                    return name.
                            toLowerCase().
                            replace( /^webkit/, '' ).
                            replace( /^moz/, '' );
                },

                isEvent: function( name ) {
                    return this.data.events.hasOwnProperty( name ) ||
                           HTML_EVENTS.hasOwnProperty( name );
                },

                isElement: function( name ) {
                    return this.data.elements.hasOwnProperty(name) ||
                            HTML_ELEMENTS.hasOwnProperty(name);
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
                    this.data.elements[ name ] = fun;
                }
        }

        bb.setup.
                event( 'transitionend', function(dom, fun) {
                    dom.addEventListener( 'transitionend', fun );
                    dom.addEventListener( 'webkitTransitionEnd', fun );
                } ).
                element( 'a', function() {
                    var anchor = document.createElement('a');
                    anchor.setAttribute( 'href', '#' );
                    return anchor;
                } ).
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

-------------------------------------------------------------------------------

# bb.util

Utiliity fucntions available for use.

 * bb.util.htmlToElement()
 * bb.util.htmlToText()

-------------------------------------------------------------------------------

        bb.util = (function() {
                var element = document.createElement( 'div' );

                return {
                        htmlToElement : function( str ) {
                            element.innerHTML = str;
                            return element.childNodes[0];
                        },

                        htmlToText: function( html ) {
                            element.innerHTML = str;
                            return element.textContent;
                        }
                }
        })();

-------------------------------------------------------------------------------

## bb.on

Sets events to be run on this element.

These events include:

 * custom events
 * HTML Events

### Examples

```
    on( dom, "click"                        , fun, true  )
    on( dom, "click"                        , fun        )
    
    on( dom, ["mouseup", "mousedown"]       , fun, false )
    on( dom, ["mouseup", "mousedown"]       , fun        )
    
    on( dom, { click: fun, mousedown: fun } , true       )
    on( dom, { click: fun, mousedown: fun }              )

-------------------------------------------------------------------------------

        bb.on = function( dom, name, fun, useCapture ) {
            var argsLen = arguments.length;

            if ( argsLen === 4 ) {
                setOn( this.setup.data.events, dom, name, fun, useCapture )
            } else if ( argsLen === 3 ) {
                if ( fun === true ) {
                    setOnObject( this.setup.data.events, dom, name, true )
                } else if ( fun === false ) {
                    setOnObject( this.setup.data.events, dom, name, false )
                } else {
                    setOn( this.setup.data.events, dom, name, fun, false )
                }
            } else if ( argsLen === 2 ) {
                setOnObject( this.setup.data.events, dom, name, false )
            } else {
                logError( "unknown parameters given", arguments )
            }

            return dom;
        }

        bb.once = function( dom, name, fun, useCapture ) {
            var self = this;

            var funWrap = function() {
                self.unregister( dom, name, funWrap );
                return fun.apply( this, arguments );
            }

            return this.on( don, name, funWrap, useCapture );
        }

-------------------------------------------------------------------------------

## bb.create

Used as the standard way to 

```
      bb.create( html-element,
              info1,
              info2,
              info3,
              info4 ...
      )

-------------------------------------------------------------------------------

        bb.create = function() {
            return this.createArray( arguments[0], arguments, 1 );
        }

-------------------------------------------------------------------------------

## bb.createBBGun

-------------------------------------------------------------------------------

        bb.createBBGun = function(bbGun, obj, args, i) {
            if ( i === undefined ) {
                i = 0
            }

            return applyArray(
                    this,
                    bbGun,
                    createOneBBGun( this, bbGun, obj ),
                    args,
                    i
            )
        }

        bb.initBBGun = function( bbGun ) {
            var dom = bbGun.dom();

            return applyArray(
                    this,
                    bbGun,
                    bbGun.dom(),
                    arguments,
                    1
            );
        }

        bb.createArray = function( obj, args, i ) {
            if ( i === undefined ) {
                i = 0
            }

            return applyArray(
                    this,
                    null,
                    createOne( this, obj ),
                    args,
                    i
            )
        }

        bb.apply = function( dom ) {
            return applyArray(
                    this,
                    null,
                    this.get( dom, true ),
                    arguments,
                    1
            )
        }

        bb.applyArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0
            }

            return applyArray(
                    this,
                    null,
                    this.get( dom, true ),
                    args,
                    startI
            )
        }

-------------------------------------------------------------------------------

## bb.createOne

Just describes the dom, based on the object given,
and nothing more.

This is mostly for internal use, where I *only*
want to describe a dom. I don't want any of the
arguments-add-class stuff.

@param obj A JavaScript object literal describing an object to create.
@return A Element based on the object given.

-------------------------------------------------------------------------------

        bb.createOne = function( obj ) {
            return createOne( this, obj );
        }

        bb.createObj = function( obj ) {
            assertObject( obj );

            return createObj( this, null, obj );
        }

-------------------------------------------------------------------------------

## bb.createString

-------------------------------------------------------------------------------

        bb.createString = function( obj ) {
            return createString( this, obj );
        }

-------------------------------------------------------------------------------

## bb.createElement()

Creates just an element, of the given name.

What makes this special is that it also hooks into
the provided names, such as 'button' as shorthand
the input with type button.
 
@param name The name of the component to create.
@return A Element for the name given.

-------------------------------------------------------------------------------

        bb.createElement = function( name ) {
            if ( arguments.length === 0 ) {
                name = DEFAULT_ELEMENT;
            } else {
                assertString( name, "non-string provided for name", name );
                assert( name !== '', "empty string given for name", name );
            }

            if ( this.setup.data.elements.hasOwnProperty(name) ) {
                var dom = this.setup.data.elements[name]( name );

                if ( dom.__isBBGun ) {
                    return dom.dom();
                }  else {
                    assert( dom instanceof Element, "htmlToElement must return a HTML Element, or BBGun", dom );

                    return dom;
                }
            } else if ( HTML_ELEMENTS.hasOwnProperty(name) ) {
                return document.createElement( name );
            } else {
                return this.setClass(
                        document.createElement( DEFAULT_ELEMENT ),
                        name
                )
            }
        }

        bb.hasClass = function( dom, klass ) {
            return dom.classList.contains( klass );
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
            } )

            return isRemoved;
        }

        bb.removeClass = function( dom ) {
            return bb.removeClassArray( dom, arguments, 1 );
        }

        bb.removeClassArray = function( dom, klasses, i ) {
            if ( i === undefined ) {
                i = 0;
            }

            dom = bb.get(dom, false);

            iterateClasses( klasses, i, klasses.length, function(klass) {
                dom.classList.remove( klass );
            } )

            return dom;
        }

-------------------------------------------------------------------------------
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
             funciton( isAdded ) {
                 // show was removed
             }
     )

@param dom The element to add or remove the class from.
@param klass The klass to toggle.
@param onAddition Optional, a function called if the class gets added.
@param onRemoval Optional, a function called if the class gets removed.

-------------------------------------------------------------------------------

        bb.toggleClass = function( dom ) {
            return toggleClassArray( dom, arguments, 1, false );
        }

        bb.toggleClassInv = function( dom ) {
            return toggleClassArray( dom, arguments, 1, true );
        }

        bb.toggleClassArray = function( dom, args, startI ) {
            return toggleClassArray( dom, args, startI, false );
        }

        bb.toggleClassInvArray = function( dom, args, startI ) {
            return toggleClassArray( dom, args, startI, true );
        }

        bb.addClass = function( dom ) {
            if ( arguments.length === 2 ) {
                return this.addClassOne( dom, arguments[1] );
            } else {
                return this.addClassArray( dom, arguments, 1 );
            }
        }

        bb.addClassArray = function( dom, args, i ) {
            assertArray( args );

            if ( i === undefined ) {
                i = 0;
            }

            iterateClasses( args, i, args.length, function(klass) {
                dom.classList.add( klass );
            } )

            return dom;
        }

        bb.addClassOne = function(dom, klass) {
            dom = bb.get(dom, false);
            assert(dom instanceof Element, "falsy dom given");

            klass = klass.trim();
            if ( klass.length > 0 ) {
                if ( klass.indexOf(' ') === -1 ) {
                    dom.classList.add( klass );
                } else {
                    var klassParts = klass.split( ' ' );

                    for ( var i = 0; i < klassParts.length; i++ ) {
                        var part = klassParts[i];

                        if ( part !== '' ) {
                            dom.classList.add( part );
                        }
                    }
                }
            }

            return dom;
        }

        bb.setClass = function( dom ) {
            if ( arguments.length === 2 ) {
                dom.className = arguments[1];
                return dom;
            } else {
                return this.setClassArray( dom, arguments, 1 );
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
                        this.style( dom, k[i] );
                    }
                } else if ( isObject(k) ) {
                    for ( var i in k ) {
                        if ( k.hasOwnProperty(i) ) {
                            this.style( dom, i, k[i] );
                        }
                    }
                }
            } else if ( arguments.length === 3 ) {
                if ( isString(k) ) {
                    dom.style[k] = val;
                } else if ( k instanceof Array ) {
                    for ( var i = 0; i < k.length; i++ ) {
                        this.style( dom, k[i], val );
                    }
                }
            } else {
                logError( "unknown object given", arguments );
            }

            return dom;
        }

        bb.get = function(dom, performQuery) {
            if (performQuery !== false && isString(dom)) {
                return document.querySelector(dom) || null;
            } else if ( dom instanceof Element ) {
                return dom;
            } else if ( isObject(dom) ) {
                return createObj( this, null, dom );
            } else if ( dom && dom.__isBBGun ) {
                return dom.dom()
            } else {
                logError( "unknown object given", dom );
            }
        }

        bb.beforeOne = function( dom, node ) {
            var dom = bb.get( dom, true );
            assertParent( dom );

            return beforeOne( this, dom.parentNode, dom, node );
        }

        bb.afterOne = function( dom, node ) {
            var dom = bb.get( dom, true );
            assertParent( dom );

            return afterOne( this, dom.parentNode, dom, node );
        }

        bb.beforeArray = function( dom, args, i ) {
            if ( i === undefined ) {
                i = 0;
            }

            var dom = bb.get( dom, true );
            assertParent( dom );
            var parentDom = dom.parentNode;

            for ( ; i < args.length; i++ ) {
                beforeOne( this, parentDom, dom, args[i] );
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
                afterOne( this, parentDom, dom, node );
            }

            return dom;
        }

        bb.before = function( dom ) {
            return this.beforeArray( dom, arguments, 1 );
        }

        bb.after = function( dom ) {
            return this.afterArray( dom, arguments, 1 );
        }

        bb.add = function( dom ) {
            if ( arguments.length === 2 ) {
                return addOne( this, this.get(dom, true), arguments[1] );
            } else {
                return this.addArray( dom, arguments, 1 );
            }
        }

        bb.addArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0;
            }

            return addArray( bb, this.get(dom, true), args, startI );
        }

        bb.addOne = function( dom, dest ) {
            return addOne( this,
                    bb.get( dom ),
                    dest
            );
        }

-------------------------------------------------------------------------------

## bb.html

Sets the HTML content within this element.

-------------------------------------------------------------------------------

        bb.html = function( dom ) {
            return this.htmlArray( dom, arguments, 1 );
        }

        bb.htmlOne = function( dom, el ) {
            assert( el, "given element is not valid" );

            if ( isString(el) ) {
                dom.innerHTML = el;
            } else if ( el instanceof Element ) {
                dom.appendChild( el );
            } else if ( el.__isBBGun ) {
                dom.appendChild( el.dom() )
            } else if ( el instanceof Array ) {
                this.htmlArray( dom, el, 0 )
            } else if ( isObject(el) ) {
                dom.appendChild( this.describe(el) )
            } else {
                logError( "Unknown html value given", el );
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
                    this.htmlArray( dom, el, 0 );
                } else {
                    if ( content !== '' ) {
                        dom.insertAdjacentHTML( 'beforeend', content );
                        content = '';
                    }

                    if ( el instanceof Element ) {
                        dom.appendChild( el );
                    } else if ( el.__isBBGun ) {
                        dom.appendChild( el.dom() );
                    } else if ( isObject(el) ) {
                        dom.appendChild(
                                this.describe(el)
                        );
                    }
                }
            }

            if ( content !== '' ) {
                dom.insertAdjacentHTML( 'beforeend', content );
            }

            return dom;
        }

-------------------------------------------------------------------------------

## bb.text

Sets the text content within this dom,
to the text values given.

-------------------------------------------------------------------------------

        bb.text = function( dom ) {
            return this.textArray( dom, arguments, 1 );
        }

-------------------------------------------------------------------------------

## bb.textOne

-------------------------------------------------------------------------------

        bb.textOne = function( dom, text ) {
            if ( text instanceof Array ) {
                this.textArray( dom, text, 0 );
            } else if ( isString(text) ) {
                dom.textContent = text;
            } else {
                logError( "non-string given for text content", text );
            }

            return dom;
        }

-------------------------------------------------------------------------------

## bb.textArray

-------------------------------------------------------------------------------

        bb.textArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0;
            }

            for ( var i = startI; i < args.length; i++ ) {
                this.textOne( dom, args[i] );
            }

            return dom;
        }

-------------------------------------------------------------------------------

## bb.attr

### Special Properties

 - on, events
 - className
 - id
 - style
 - html
 - text

-------------------------------------------------------------------------------

        bb.attr = function( dom, obj, val ) {
            if ( arguments.length === 2 ) {
                if ( isString(obj) ) {
                    if ( obj === 'className' || obj === 'class' ) {
                        return dom.className;
                    } else if ( obj === 'value' ) {
                        return obj.value;
                    } else if ( obj === 'id' ) {
                        return dom.id;
                    } else if ( obj === 'html' ) {
                        return dom.innerHTML;
                    } else if ( obj === 'text' ) {
                        return dom.textContent;
                    } else if ( obj === 'style' ) {
                        return dom.style;
                    } else if ( obj === TYPE_NAME_PROPERTY ) {
                        return dom.nodeName;
                    } else {
                        return dom.getAttribute( obj );
                    }
                } else if ( isObject(obj) ) {
                    attrObj( this, null, dom, obj, false );
                } else {
                    logError( "invalid parameter given", obj );
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

        for ( var k in HTML_ELEMENTS ) {
            if ( HTML_ELEMENTS.hasOwnProperty(k) ) {
                if ( bb.hasOwnProperty(k) ) {
                    console.log( 'BB-Gun function clash: ' + k );
                } else {
                    bb[k] = new Function( "return this.createArray('" + k + "', arguments, 0);" );
                }
            }
        }

===============================================================================

Pre-provided Touch Events
-------------------------

Events for click, and hold, under touch interface,
is pre-provided.

===============================================================================

        var IS_TOUCH = !! ('ontouchstart' in window)  // works on most browsers 
                    || !!('onmsgesturechange' in window); // works on IE 10

        if ( IS_TOUCH ) {
            bb.setup.event( 'click', touch.click );
        }

        bb.setup.event( 'hold', touchy.hold );

        return bb;
    }

    window['bb'] = newBB();


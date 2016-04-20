
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

===============================================================================

    var DEFAULT_ELEMENT = 'div';

    var WHITESPACE_REGEX = / +/g;

    var STOP_PROPAGATION_FUN = function( ev ) {
        ev.stopPropagation();
    }

    var PREVENT_DEFAULT_FUN = function( ev ) {
        ev.preventDefault();
    }


The blank data is used internally for HTML events. All of the HTML events are
set to the same BROWSER_PROVIDED_DEFAULT object.

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

    var __initFunsArr = []
    var __initFunsI = 0
    var InitFuns_create = function() {
      if ( __initFunsI > 0 ) {
        return __initFunsArr[ --__initFunsI ]

      } else {
        return {
            length: 0,
            arr: []
        }
      }
    }

    var InitFuns_callAndFree = function( initFuns ) {
      var arr = initFuns.arr
      var len = initFuns.length

      for ( var i = 0; i < len; i++ ) {
        var initFun = arr[i]
        var dom = initFun.dom

        initFun.fun.call( dom, dom )

        // clear
        initFun.dom = initFun.fun = null
      }

      initFuns.length = 0
      __initFunsArr[ __initFunsI++ ] = initFuns
    }

    var InitFuns_add = function( initFuns, dom, f ) {
      assert( dom !== null, "null init dom given" )
      assert( f !== null, "null init function given" )

      var i = initFuns.length++
      var arr = initFuns.arr

      var initFun;
      if ( i < arr.length ) {
        initFun = arr[ i ]
        initFun.dom = dom
        initFun.fun = f
      } else {
        initFun = { dom: dom, fun: f }
        arr[ i ] = initFun
      }
    }

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



-------------------------------------------------------------------------------

## HTML Elements

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

## HTML Events

All of the HTML events available.

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

### assertParent( dom:Element )

Throws an error, if the given dom element does not have a parent node.

-------------------------------------------------------------------------------

    var assertParent = function( dom ) {
        assert( dom.parentNode !== null,
                "dom is not in the document; it doesn't have a parentNode" );
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



-------------------------------------------------------------------------------


## Helper Methods, before, bb it's self!


-------------------------------------------------------------------------------



-------------------------------------------------------------------------------

### setOnOffObject

-------------------------------------------------------------------------------

    var setOnOffObject = function( bb, nextSetFun, events, dom, obj, useCapture ) {
        assert( dom, "null or undefined dom given", dom );

        for ( var k in obj ) {
            if ( obj.has(k) ) {
                setOnOff( bb, nextSetFun, events, dom, k, obj[k], useCapture )
            }
        }
    }



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### setOnInner

This exists so that all of the event look up, splitting of the event name, and
some error checking has all been performed *before* we potentially iterate over
an array (if dom is an array of elements).

It also allows all of the error checking and lookup code to be done together,
before this code is called.

-------------------------------------------------------------------------------

    var setOnInner = function( bb, evFun, dom, evName, evParams, fun, useCapture ) {
        if ( dom instanceof Array || dom instanceof NodeList ) {
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



-------------------------------------------------------------------------------

### setOffInner

-------------------------------------------------------------------------------

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

    var applyArray = function( bb, dom, args, startI, initFuns ) {
        if ( args !== null ) {
            var argsLen = args.length;

            for (var i = startI; i < argsLen; i++) {
                applyOne( bb, dom, args[i], false, initFuns )
            }
        }

        return dom;
    }

    var applyOne = function( bb, dom, arg, stringsAreContent, initFuns ) {
        if (arg instanceof Array) {
            applyArray( bb, dom, arg, 0, initFuns )

        } else if ( arg.nodeType !== undefined ) {
            dom.appendChild( arg )

        /*
         * - html
         * - class names
         */
        } else if ( isString(arg) ) {
            if ( stringsAreContent || arg.trim().charAt(0) === '<' ) {
                dom.insertAdjacentHTML( 'beforeend', arg )
            } else {
                addClassOneString( dom, arg )
            }
        } else if ( isObjectLiteral(arg) ) {
            attrObj( bb, dom, arg, true, initFuns )
        } else {
            fail( "invalid argument given", arg )
        }

        return dom
    }

    var createOne = function( bb, obj, initFuns ) {
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
        } else if ( isObjectLiteral(obj) ) {
            return createObj( bb, obj, initFuns );
        } else {
            fail( "unknown parameter given", obj );
        }
    }

    var createObj = function( bb, obj, initFuns ) {
        var dom = obj.has("nodeName") ? bb.createElement( obj["nodeName"] ) :
                  obj.has("tagName")  ? bb.createElement( obj["tagName"]  ) :
                                        bb.createElement()                  ;

        for ( var k in obj ) {
            if ( obj.has(k) ) {
                attrOne( bb, dom, k, obj[k], false, initFuns );
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



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

@param startI Where the start iterating from in klass, if klass is an array.
@param endI Where to end iterating from in klass, if klass is an array.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

Takes a boolean flag and an array, and sets all the klasses in the array on or
off depending on the flag.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### toggleClassCallAddRemove

Calls the onAdd and onRemove event handlers for you based on if they exist.
This exists because this job is done about 4 times across 4 different functions,
so it's DRY'd up and placed here.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### toggleClassObj dom klass{ name:string => onOff:bool }

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### toggleClassString

-------------------------------------------------------------------------------

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
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforebegin', arg );
            } else if ( isObjectLiteral(arg) ) {
                parentDom.insertBefore( createObj(bb, arg), dom );
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
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'afterend', arg );
            } else if ( isObjectLiteral(arg) ) {
                parentDom.insertAfter( createObj(bb, arg), dom );
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
            } else if ( isString(arg) ) {
                dom.insertAdjacentHTML( 'beforeend', arg );
            } else if ( isObjectLiteral(arg) ) {
                dom.appendChild( createObj(bb, arg) );
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
    var attrOneNewChild = function( bb, dom, k, val, dotI, initFuns ) {
        assert( k.length > 1, "empty description given" );

        var className = k.substring(dotI+1);
        var domType =
                ( dotI > 0               ) ? k.substring( 0, dotI ) :
                ( val instanceof Element ) ? val.nodeName           :
                                            'div'                   ;

        var newDom = newOneNewChildInner( bb, dom, domType, val, k, initFuns )

        addClassOneString( newDom, className );
    }

    var newOneNewChildInner = function( bb, dom, domType, val, debugVal, initFuns ) {
        var newDom

        if ( isObjectLiteral(val) ) {
            assert( bb.setup.isElement(domType), "invalid element type given, " + domType )
            val["nodeName"] = domType

            newDom = createObj( bb, val, initFuns )

        } else if ( val instanceof Element ) {
            if ( domType !== '' && domType.toLowerCase() !== val.nodeName.toLowerCase() ) {
                fail( "Type of dom node does not match the type stated in the identifier, given '" + domType + "', got '" + val.nodeName + "'" )
            }

            newDom = val

        } else {
            newDom = bb.createElement( domType )

            if ( val.nodeType !== undefined ) {
                newDom.appendChild( val )

            } else if ( isString(val) ) {
                newDom.innerHTML = val

            } else if ( isArray(val) ) {
                applyArray(
                        this,
                        newDom,
                        val,
                        0,
                        initFuns
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



-------------------------------------------------------------------------------

@param isApply This is true when 'attrOne' is being called repeteadly over the
same DOM element. Namely this is done when DOM elements are described and
created.

-------------------------------------------------------------------------------

    var attrOne = function( bb, dom, k, val, isApply, initFuns ) {
        var dotI = k.indexOf( '.' );
        var ev;

        if ( dotI !== -1 ) {
            attrOneNewChild( bb, dom, k, val, dotI, initFuns )

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
                setText( dom, combineStringOne(val), true )
            } else if ( k === 'html' || k === 'innerHTML' || k === 'innerHtml' ) {
                setHTML( bb, dom, val, false )
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
                assertFunction( val, "none function given for 'init' attribute" )
                InitFuns_add( initFuns, dom, val )

            } else if ( k === 'addTo' ) {
                assert( dom.parentNode === null, "dom element already has a parent" )
                createOne( bb, val, initFuns ).appendChild( dom )

            /* Events, includes HTML and custom  */
            } else if ( (ev = bb.setup.getEvent(k)) !== null ) {
                if ( ev.isFunction ) {
                    ev.fun( dom, val, false, bb, k, rest );
                } else {
                    dom.addEventListener( k, val, false )
                }

            /* new objet creation */
            } else if ( bb.setup.isElement(k) ) {
                newOneNewChildInner( bb, dom, k, val, k, initFuns );

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



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var attrObj = function( bb, dom, obj, isApply, initFuns ) {
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

                attrOne( bb, dom, k, obj[k], isApply, initFuns );
            }
        }
    }



===============================================================================

### setHTML bb:BB dom:Element el:string|Element|string[]|Element[] append:boolean

===============================================================================

    var setHTML = function( bb, dom, el, append ) {
        assert( el, "given element is not valid" );

        if ( isString(el) ) {
            if ( append ) {
                dom.insertAdjacentHTML( 'beforeend', content )
            } else {
                dom.innerHTML = el
            }
        } else if ( el.nodeType !== undefined ) {
            dom.appendChild( el );
        } else if ( el instanceof Array ) {
            bb.htmlArray( dom, el, 0 )
        } else if ( isObjectLiteral(el) ) {
            dom.appendChild( bb.describe(el) )
        } else {
            fail( "Unknown html value given", el );
        }

        return dom;
    }



-------------------------------------------------------------------------------

### setText dom:Element text:string append:boolean

Sets the given string, to the dom element given. This is set to it's
textContent if it is a standard HTMLElement, and to it's value if it is a
HTMLInput.

@param dom The Element to set the text to.
@param text A string of the text being set.
@param append True if the text should be appended, false to replace.
@return The given dom, for function chaining of elements.

-------------------------------------------------------------------------------

    var setText = function( dom, text, append ) {
        if ( dom instanceof HTMLInputElement ) {
            if ( append ) {
                dom.value += text;
            } else {
                dom.value = text;
            }

        } else if ( append ) {
            dom.appendChild( document.createTextNode(text) )

        } else {
            dom.textContent = text;
        }

        return dom;
    }



-------------------------------------------------------------------------------

### combineStringOne text:array|string

If an array is given, then the array is joined, and the result is returned. If
the given value is a string, then this is just returned.

Anything else will cause an error to be raised.

This exists as a function for unifying strings and arrays of strings, as one.

@param text The text to combine.
@return Either the array of strings combined, or if given a string, it will
  just be returned.

-------------------------------------------------------------------------------

    var combineStringOne = function( text ) {
        if ( text instanceof Array ) {
            return combineStringArray( text, 0 )

        } else if ( isString(text) ) {
            return text

        } else {
            fail( "non-string given for text content", text )

        }
    }



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

    var combineStringArray = function( args, startI ) {
        if ( startI === undefined ) {
            startI = 0
        }

        var argsLen = args.length

        if ( startI > argsLen ) {
            fail( "start index is greater than the array length" )

        } else if ( startI === argsLen ) {
            return ''

        } else {
            var allText = combineStringOne( args[startI++] )

            while( startI++ < argsLen ) {
                allText += combineStringOne( args[startI] )
            }

            return allText
        }
    }



-------------------------------------------------------------------------------

### addClassOne dom klass:string|[klass]

-------------------------------------------------------------------------------

    var addClassOne = function( dom, klass ) {
        if ( isString(klass) ) {
            return addClassOneString( dom, klass )

        } else if ( isArray(klass) ) {
            return addClassArray( dom, klass, 0 )

        } else {
            fail("Unknown klass value given for adding a class")
        }
    }



-------------------------------------------------------------------------------

### addClassOneString dom klass

This is for when the DOM is *pre* known and verified as a HTMLElement.

-------------------------------------------------------------------------------

    var addClassOneString = function( dom, klass ) {
        assertString( klass, "Given class names are not a string." )

        /*
         * Take the class apart, and then append the pieces indevidually.
         * We have to split based on spaces, and based on '.'.
         */
        if ( klass.length > 0 ) {
            if ( klass.indexOf(' ') !== -1 ) {
                var parts = klass.split( ' ' )

                for ( var i = 0; i < parts.length; i++ ) {
                    var part = parts[i]

                    if ( part.length > 0 ) {
                        if ( part.indexOf('.') !== -1 ) {
                            var partParts = part.split('.')

                            for ( var j = 0; j < partParts.length; j++ ) {
                                var partPart = partParts[j]

                                if ( partPart.length > 0 ) {
                                    dom.classList.add( partPart )
                                }
                            }
                        } else {
                            dom.classList.add( part )
                        }
                    }
                }
            } else if ( klass.indexOf('.') !== -1 ) {
                var parts = klass.split( '.' )

                for ( var i = 0; i < parts.length; i++ ) {
                    var part = parts[i]

                    if ( part.length > 0 ) {
                        dom.classList.add( part )
                    }
                }
            } else if ( klass.length > 0 ) {
                dom.classList.add( klass )
            }
        }

        return dom
    }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var addClassArray = function( dom, args, i ) {
        if ( i === undefined ) {
            i = 0
        }

        iterateClasses( args, i, args.length, function(klass) {
            dom.classList.add( klass )
        } )

        return dom
    }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var setClassOne = function( dom, klass ) {
        if ( typeof klass === 'string' ) {
            dom.className = klass.replace(/\./g, ' ')

        } else if ( klass instanceof Array ) {
            // sub arrays will also get joined but with a comma
            // so we use the replace to remove the comma as well as the dots
            dom.className = klass.join(' ').replace(/\.|,/g, ' ')

        } else if ( isObjectLiteral(klass) ) {
            dom.className = ''

            for ( var k in klass ) {
                if ( klass.has(k) && klass[k] ) {
                    dom.classList.add( k )
                }
            }
        } else {
            fail( "Expected ClassName to be a string or array of strings, but it's something else." )
        }
    }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var removeClassOne = function( dom, klasses ) {
        iterateClassesString( klasses, function(klass) {
            dom.classList.remove( klass )
        } )

        return dom
    }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var removeClassArray = function( dom, klasses, i ) {
        if ( i === undefined ) {
            i = 0;
        }

        iterateClasses( klasses, i, klasses.length, function(klass) {
            dom.classList.remove( klass );
        } )

        return dom;
    }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var bbGet = function(dom) {
        assert( dom, "falsy dom given for bb.get" );

        if ( isString(dom) ) {
            return document.querySelector(dom) || null;

        } else if ( dom.nodeType !== undefined ) {
            return dom;

        } else {
            fail( "unknown object given", dom );
        }
    }

    var bbGetOrCreate = function( dom ) {
        if ( isObjectLiteral(dom) ) {
            var initFuns = InitFuns_create()
            var dom = createObj( bb, dom, initFuns )
            InitFuns_callAndFree( initFuns )

            return dom
        } else {
            return bbGet( dom )

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

Runs 'createArray' with the values given, and then returns the result. This is
shorthand for creating new DOM elements.

bb also has a tonne of methods added on top, like jQuery, it is both a library
and a function.

-------------------------------------------------------------------------------

        var bb = function() {
            if ( this instanceof bb ) {
                return newBB( arguments );
            } else if ( arguments.length === 1 ) {
                return bb.createArray( arguments[0], null, 0 );
            } else {
                return bb.createArray( arguments[0], arguments, 1 );
            }
        }

        bb.__initFuns = []



-------------------------------------------------------------------------------

## bb.setup

Deals with the global setup of bb. For example adding more default elements, or
adding new custom events which you can use on DOM elements.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

## bb.clone()

Clones the entire bb module, giving you a fresh copy. This is useful because it
will not have any of the setup changes you have made within bb.

-------------------------------------------------------------------------------

        bb.clone = function() {
            return newBB();
        }



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

        bb.on = function( dom, name, fun, useCapture ) {
            assert(
                    dom === window ||
                    (dom instanceof HTMLElement ) ||
                    (dom instanceof HTMLDocument) ||
                    (dom instanceof NodeList    ) ||
                    (dom instanceof Array       ),

                    "HTML Element expected in bb.on."
            )

            var argsLen = arguments.length

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



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

        bb.removeOn = function( dom, name, fun, useCapture ) {
            assert(
                    dom === window ||
                    (dom instanceof HTMLElement ) ||
                    (dom instanceof HTMLDocument) ||
                    (dom instanceof NodeList    ) ||
                    (dom instanceof Array       ),

                    "HTML Element expected in bb.on."
            )

            var argsLen = arguments.length

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



-------------------------------------------------------------------------------

### bb.onInternal

This does 2 things:

 * Sets the event given to the dom, as an event to be run. This *actually*
   happens inside here.
 * Builds a mapping between the original callback, and the one actually set.
   This is so it can be unregistered later using onRemoveInternal.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

        bb.once = function( dom, name, fun, useCapture ) {
            var funWrap = function() {
                bb.removeOn( dom, name, funWrap, useCapture );
                return fun.apply( this, arguments );
            }

            return bb.on( dom, name, funWrap, useCapture );
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
            if ( arguments.length === 1 ) {
                return bb.createArray( arguments[0], null, 0 );
            } else {
                return bb.createArray( arguments[0], arguments, 1 );
            }
        }

        bb.createArray = function( obj, args, i ) {
            if ( i === undefined ) {
                i = 0
            }

            var initFuns = InitFuns_create()
            var dom = applyArray(
                    bb,
                    createOne( bb, obj, initFuns ),
                    args,
                    i,
                    initFuns
            )
            InitFuns_callAndFree( initFuns )

            return dom
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
            var initFuns = InitFuns_create()
            var dom = createOne( bb, obj, initFuns )
            InitFuns_callAndFree( initFuns )

            return dom
        }

-------------------------------------------------------------------------------

## bb.createString

Creates a new element based on a given string.

This is normally used internally, to work out what the given string is for.

-------------------------------------------------------------------------------

        bb.createString = function( obj ) {
            return createString( bb, obj );
        }

-------------------------------------------------------------------------------

## bb.createElement()

Creates just an element, of the given name.

What makes this special is that it also hooks into the provided names, such as
'button' as shorthand the input with type button.

@param domName The name of the component to create.
@return A Element for the name given.

-------------------------------------------------------------------------------

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
                    dom = elEv.fun( type )

                    assert(
                            dom && dom.nodeType !== undefined,
                            "html element event must return a HTML Element",
                            dom
                    )
                } else {
                    dom = document.createElement( type )
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
                i = 0
            }

            var isRemoved = false
            iterateClasses( klasses, i, klasses.length, function(klass) {
                if ( ! isRemoved && dom.classList.contains(klass) ) {
                    isRemoved = true

                    return false
                }
            } )

            return isRemoved
        }

        bb.removeClass = function( dom ) {
            var innerDom = bbGet( dom );

            if ( arguments.length === 1 ) {
                return innerDom;
            } else if ( arguments.length === 2 ) {
                return removeClassOne( innerDom, arguments[1] );
            } else {
                return removeClassArray( innerDom, arguments, 1 );
            }
        }

        bb.removeClassArray = function( dom, klasses, i ) {
            return removeClassArray( bbGet(dom), klasses, i );
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

-------------------------------------------------------------------------------

        bb.toggleClass = function( dom ) {
            var argsLen = arguments.length;
            var dom = bbGet( dom );

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
            var dom = bbGet( dom );

            if ( arguments.length === 2 ) {
                return addClassOneString( dom, arguments[1] );
            } else {
                return addClassArray( dom, arguments, 1 );
            }
        }

        bb.addClassArray = function( dom, args, i ) {
            assertArray( args );
            var dom = bbGet( dom );

            return addClassArray( dom, args, i );
        }

        bb.addClassOne = function(dom, klass) {
            dom = bbGet(dom);
            assert( dom && dom.nodeType !== undefined, "falsy dom given for bb.addClassOne" );

            return addClassOne( dom, klass );
        }



-------------------------------------------------------------------------------

### bb.setClass

This sets and replaces all of the current classes with the ones given. So any
previous classes are gone.

-------------------------------------------------------------------------------

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

        bb.get = bbGet



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

        bb.next = function( dom, query, skip, wrap ) {
            assertString( query, "non-string given for query" );
            assert( query !== '', "blank query given" );

            if ( arguments.length < 3 ) {
                skip = 0;
            } else {
                assert( skip >= 0, "negative index given for bb.next" );
            }

            var dom = bbGet( dom )
            var next = dom.nextSibling

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



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

        bb.nextWrap = function( dom, query, skip ) {
            if ( arguments.length < 3 ) {
                skip = 0;
            }

            return bb.next( dom, query, skip, true );
        }

-------------------------------------------------------------------------------

### bb.previous dom query skip

The same as bb.next, but instead of searching forward, this will search
backwards.

This stops searching when it gets to the start of the element, unless 'wrap' is
set to true.

Otherwise, it is exactly the same.

-------------------------------------------------------------------------------

        bb.previous = function( dom, query, skip, wrap ) {
            assertString( query, "non-string given for query" );
            assert( query !== '', "blank query given" );

            if ( arguments.length < 3 ) {
                skip = 0;
            } else {
                assert( skip >= 0, "negative index given for bb.previous" );
            }

            var dom = bbGet( dom )
            var next = dom.previousSibling

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



-------------------------------------------------------------------------------

### bb.previousWrap

Just like bb.previous, but this has the wrap parameter on.

-------------------------------------------------------------------------------

        bb.previousWrap = function( dom, query, skip ) {
            if ( arguments.length < 3 ) {
                skip = 0;
            }

            return bb.previous( dom, query, skip, true );
        }



-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

        bb.beforeOne = function( dom, node ) {
            var dom = bbGet( dom );
            assertParent( dom );

            return beforeOne( bb, dom.parentNode, dom, node );
        }

        bb.afterOne = function( dom, node ) {
            var dom = bbGet( dom );
            assertParent( dom );

            return afterOne( bb, dom.parentNode, dom, node );
        }

        bb.beforeArray = function( dom, args, i ) {
            if ( i === undefined ) {
                i = 0;
            }

            var dom = bbGet( dom );
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

            var dom = bbGet( dom );
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
                return addOne( bb, bbGetOrCreate(dom), arguments[1] );
            } else {
                return bb.addArray( dom, arguments, 1 );
            }
        }

        bb.addArray = function( dom, args, startI ) {
            if ( startI === undefined ) {
                startI = 0;
            }

            return addArray( bb, bbGetOrCreate(dom), args, startI );
        }

        bb.addOne = function( dom, dest ) {
            return addOne( bb,
                    bbGetOrCreate( dom ),
                    dest
            );
        }

-------------------------------------------------------------------------------

## bb.html

Sets the HTML content within this element.

-------------------------------------------------------------------------------

        bb.html = function( dom ) {
            return bb.htmlArray( dom, arguments, 1 )
        }

        bb.htmlOne = function( dom, el ) {
            setHTML( bb, dom, el, false )
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
            var content = ''

            for ( ; i < htmls.length; i++ ) {
                var el = htmls[i]

                if ( isString(el) ) {
                    content += el

                } else {
                    if ( content !== '' ) {
                      dom.insertAdjacentHTML( 'beforeend', content )
                      content = ''
                    }

                    if ( el instanceof Array ) {
                        bb.htmlArray( dom, el, 0 )

                    } else if ( el.nodeType !== undefined ) {
                        dom.appendChild( el )

                    } else if ( isObjectLiteral(el) ) {
                        dom.appendChild( bb.describe(el) )
                    }
                }
            }

            if ( content !== '' ) {
                dom.insertAdjacentHTML( 'beforeend', content )
            }

            return dom
        }

-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

        bb.text = function( dom ) {
            return setText( dom, combineStringArray(arguments, 1), false )
        }



-------------------------------------------------------------------------------

## bb.textOne

-------------------------------------------------------------------------------

        bb.textOne = function( dom, text ) {
            return setText( dom, combineStringOne(text), false )
        }



-------------------------------------------------------------------------------

## bb.textArray

-------------------------------------------------------------------------------

        bb.textArray = function( dom, args, startI ) {
            return setText( dom, combineStringArray(args, startI), false )
        }



-------------------------------------------------------------------------------

## bb.attr dom

The dom it takes, can be a query for a dom, or a HTML Element.
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

-------------------------------------------------------------------------------

        bb.attr = function( dom, obj, val ) {
            if ( arguments.length === 2 ) {
                if ( isString(obj) ) {
                    var realDom = bbGetOrCreate( dom );

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
                    attrObj( bb, dom, obj, false, initFuns );
                } else {
                    fail( "invalid parameter given", obj );
                }
            } else if ( arguments.length === 3 ) {
                assertString( obj, "non-string given as key for attr", obj )

                var initFuns = InitFuns_create()
                attrOne( this, dom, obj, val, false, initFuns )
                InitFuns_callAndFree( initFuns )
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



===============================================================================

Normalize Transition End Event
------------------------------



===============================================================================

        bb.setup.event( 'transitionend', function( el, callback, useCapture, bb, eventName, rest ) {
            var handleTransitionEnd = function( ev ) {
                callback.call( el, ev )
            }

            el.addEventListener( 'webkitTransitionEnd', handleTransitionEnd, useCapture )
            el.addEventListener( 'transitionend'      , handleTransitionEnd, useCapture )
            el.addEventListener( 'msTransitionEnd'    , handleTransitionEnd, useCapture )
            el.addEventListener( 'oTransitionEnd'     , handleTransitionEnd, useCapture )
        })



===============================================================================

Pre-provided Touch Events
-------------------------

Events for click, and hold, under touch interface, is pre-provided.

===============================================================================

        // test from Modernizer
        var IS_TOUCH = !! ( ('ontouchstart' in window) ||
                window.DocumentTouch &&
                document instanceof DocumentTouch );

        if ( IS_TOUCH && false ) {
            bb.setup.event( 'click', touchy.click );
        }

        bb.setup.event( 'hold', touchy.hold );

===============================================================================

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### newKeyTest k:string

-------------------------------------------------------------------------------

        var NONE      = 0
        var SHIFT     = 0b00000001
        var CTRL      = 0b00000100
        var ALT       = 0b00010000
        var META      = 0b01000000
        var ANY       = 0b11111111

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



-------------------------------------------------------------------------------

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

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

@param k:string A string describing the key to press.

-------------------------------------------------------------------------------

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



-------------------------------------------------------------------------------

### testKeyboardEvent ev:KeyboardEvent keyTest

For building the test to see if the keyboard key given is the key we are after
or not.

-------------------------------------------------------------------------------

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
                        var evKey = ev.key || ev.keyIdentifier

                        if ( isString(evKey) && evKey.toLowerCase() === keyTest.letter ) {
                          return true
                        }

                        var c = ev.char
                        if ( isString(c) && c.toLowerCase() === keyTest.letter ) {
                          return true
                        }

                        return false
                    }
                }
            }

            return false;
        }

        return bb;
    }

    window['bb'] = newBB();


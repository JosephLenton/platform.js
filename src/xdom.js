"use strict";

/**
 *      xdom
 *
 * @author Joseph Lenton
 * 
 * This is a set of dom creation, and interaction, functions.
 * It aims to provide a more rich API than the standard
 * document API, with very little overhead added on top.
 * 
 * This does no DOM wrapping, or other functionality like that,
 * it mostly takes information to create a dom element which
 * is returned, or alter a given dom element.
 */



window['xdom'] = (function() {
    var htmlDiv = document.createElement('div');

    /**
     * These contain alternative names for custom elements.
     * At the time of writing, it's just shorthand for input
     * types. So a name with 'checkbox' returns an input box
     * of type 'checkbox'.
     */
    var prebuiltNames = (function() {
        var names = {};

        var newInputFun = function( type ) {
            return function() {
                var input = document.createElement('input');
                input.type = type;
                return input;
            }
        };

        var inputTypes = [
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
        ];
        
        for ( var i = 0; i < inputTypes.length; i++ ) {
            var type = inputTypes[i];
            names[ type ] = newInputFun( type );
        }

        return names;
    });

    /**
     * Runs 'createArray' with the values given,
     * and then returns the result.
     * 
     * This is shorthand for creating new DOM elements.
     */
    var xdom = function() {
        return xdom.createArray( arguments );
    }

    /**
     * Dom related features this supports.
     */
    xdom.supports = {
            classList : ( htmlDiv.classList !== undefined )
    };

    xdom.create = function() {
        return xdom.createArray( arguments, 0 );
    }

    xdom.createArray = function( args ) {
        if ( i === undefined ) {
            i = 0;
        }

        var argsLen = args.length;
        if ( argsLen > 0 ) {
            var dom = null;
            var first = args[0];
            var startI = 1;

            if ( first instanceof HTMLElement ) {
                dom = first;
            } else if ( isObject(first) ) {
                dom = xdom.describe( dom );
            } else if ( first instanceof XElement ) {
                dom = first.cloneDom();
            } else {
                dom = document.createElement('div');
                startI = 0;
            }

            dom.className = xdom.parseClassArray(arguments, startI);

            return dom;
        } else {
            return document.createElement('div');
        }
    }

    /**
     * Allows you to describe a component,
     * which is then created, and returned.
     * 
     * The description is done using JS Object literals.
     */
    xdom.describe = function( obj ) {
        return xdom.addClassesArray(
                xdom.describeDom( obj ),
                arguments,
                1
        );
    }

    /**
     * Just describes the dom, based on the object given,
     * and nothing more.
     * 
     * This is mostly for internal use, where I *only*
     * want to describe a dom. I don't want any of the
     * arguments-add-class stuff.
     * 
     * @param obj A JavaScript object literal describing an object to create.
     * @return A HTMLElement based on the object given.
     */
    xdom.describeDom = function( obj ) {
        assertObject( obj );

        var name = obj.name;
        var setup = prebuiltNames[ name ];

        return xdom.setAttributes(
                xdom.createElement( obj.name ),
                obj
        );
    }

    /**
     * Creates an element, of the given name.
     * 
     * What makes this special is that it also hooks into
     * the provided names, such as 'button' as shorthand
     * the input with type button.
     * 
     * @param name The name of the component to create.
     * @return A HTMLElement for the name given.
     */
    xdom.createElement = function( name ) {
        assert( name !== null, "Null name cannot be provided" );

        if ( name === undefined ) {
            name = 'div';
        }

        var setup = prebuiltNames[ name ];

        if ( setup !== undefined ) {
            return setup();
        } else {
            return document.createElement( name );
        }
    }

    xdom.removeClass = xdom.supports.classList ? 
            function( dom, klass ) {
                if ( dom.classList.contains(klass) ) {
                    dom.classList.remove( klass );

                    return true;
                } else {
                    return false;
                }
            } :
            function( dom, klass ) {
                var klasses = dom.getAttribute('class');

                if ( klasses !== undefined ) {
                    klasses = klasses.split( ' ' );

                    var newKlasses = [];
                    for ( var i = 0; i < klasses.length; i++ ) {
                        if ( klasses[i] !== klass ) {
                            newKlasses.push( klasses[i] );
                        } else {
                            isChange = true;
                        }
                    }

                    if ( isChange ) {
                        dom.setAttribute( 'class', newKlasses.join(' ') );

                        return true;
                    }
                }

                return false;
            }

    xdom.addClass = xdom.supports.classList ?
            function( dom, klass ) {
                dom.classList.add( klass );

                return dom;
            } :
            function( dom, klass ) {
                var klasses = dom.className;

                if ( klasses === undefined ) {
                    dom.className = klass;
                } else {
                    dom.className = klasses + ' ' + klass ;
                }

                return dom;
            }

    xdom.addClasses = function( dom ) {
        return xdom.addClassesArray( dom, arguments, 1 );
    }

    xdom.addClassesArray = function( dom, args, i ) {
        assertArray( args );

        var classes = xdom.parseClassesArray( args, i );

        if ( classes !== '' ) {
            var currentClasses = dom.className;

            if (
                    currentClasses === undefined ||
                    currentClasses === ''
            ) {
                dom.className = classes;
            } else {
                dom.className = currentClasses + ' ' + classes ;
            }
        }

        return dom;
    }

    xdom.setClasses = function( dom ) {
        return xdom.setClassesArray( dom, arguments, 1 );
    }

    xdom.setClassesArray = function( dom, args, i ) {
        assertArray( args );

        dom.className = xdom.parseClassesArray(args, i);

        return dom;
    }

    xdom.setHTML = function( dom ) {
        return xdom.setHTMLArray( dom, arguments, 1 );
    }

    xdom.setHTMLOne = function( dom, html ) {
        assert( htmls, "htmls is not valid" );

        if ( isString(html) ) {
            dom.innerHTML = html;
        } else if ( el instanceof HTMLElement ) {
            dom.appendChild( el );
        } else if ( el instanceof XElement ) {
            dom.appendChild( el.getDom() );
        } else if ( el instanceof Array ) {
            xdom.setHTMLArray( dom, el, 0 );
        } else if ( isObject(el) ) {
            dom.appendChild(
                    xdom.describe(el)
            );
        } else {
            throw new Error( "Unknown html value given" );
        }

        return dom;
    }

    xdom.setHTMLArray = function( dom, htmls, i ) {
        assertArray( htmls );

        if ( i === undefined ) {
            i = 0;
        }

        var content = '',
            children = [];
        for ( ; i < htmls.length; i++ ) {
            var el = htmls[i];

            if ( isString(el) ) {
                content += el;
            } else if ( el instanceof Array ) {
                xdom.setHTMLArray( dom, el, 0 );
            } else {
                if ( content !== '' ) {
                    dom.insertAdjacentHTML( 'beforeend', content );
                    content = '';
                } else if ( el instanceof HTMLElement ) {
                    dom.appendChild( el );
                } else if ( el instanceof XElement ) {
                    dom.appendChild( el.getDom() );
                } else if ( isObject(el) ) {
                    dom.appendChild(
                            xdom.describe(el)
                    );
                }
            }
        }

        if ( content !== '' ) {
            dom.insertAdjacentHTML( 'beforeend', content );
        }

        return dom;
    }

    xdom.setAttributes = function( dom, obj, val ) {
        if ( arguments.length === 1 ) {
            if ( obj.css !== undefined ) {
                xdom.setClasses( dom, obj.css );
            }
            if ( obj.html !== undefined ) {
                xdom.setHTMLOne( dom, obj.html );

                if ( obj.text !== undefined ) {
                    throw new Error("cannot use text and html at the same time");
                }
            }
            if ( obj.text !== undefined ) {
                xdom.setText( dom, obj.text );

                if ( obj.html !== undefined ) {
                    throw new Error("cannot use text and html at the same time");
                }
            }

            for ( var k in obj ) {
                if (
                        k !== 'name' &&
                        k !== 'css'  &&
                        k !== 'text' &&
                        k !== 'html' &&
                        obj.hasOwnProperty(k)
                ) {
                    if ( k === 'class' ) {
                        dom.className = obj[k];
                    } else {
                        dom[k] = obj[k];
                    }
                }
            }
        } else {
            dom[obj] = val;
        }

        return dom;
    }
})();

"use strict";

window['xcss'] = (function() {
    var PREFIX = '_xcss_class_';
    var count = 1;

    /**
     * Everytime this is called, it will return an entirely new name.
     */
    var generateName = function() {
        return PREFIX + count++;
    }

    /**
     * An object property to represent CSS Stylesheets.
     *
     * This allows you to creates styles dynamically,
     * on the fly, within your JavaScript.
     */
    var XStyle = function( xcssParent ) {
        this.parentXCss = xcssParent;
        this.internalName = generateName();
        this.styles = {};

        for ( var i = 1; i < arguments.length; i++ ) {
            this.css( arguments[i] );
        }
    };

    XStyle.prototype = {
        /**
         * @returns the name used internally, to represent this style.
         */
        name: function() {
            return this.internalName;
        },

        /**
         * Sets CSS values to this style.
         * 
         * Examples:
         *  var currentWidth = style.css( 'width' );
         *
         *  style.css( 'display', 'none' );
         *  style.css( ['transform', '-webkit-transform'], 'translateX(0)' );
         *  style.css({ width: '24px', height: '29px' });
         */
        css: function( key, value ) {
            var argsLen = arguments.length,
                styles = this.styles;

            if ( argsLen === 1 ) {
                if ( isString(key) ) {
                    return styles[key];
                } else if ( key instanceof XStyle ) {
                    this.css( key.styles );
                } else {
                    for ( var k in key ) {
                        if ( key.hasOwnProperty(k) ) {
                            this.css( k, key[k] );
                        }
                    }
                }
            } else if ( argsLen > 1 ) {
                if ( key instanceof Array ) {
                    for ( var i = 0; i < key.length; i++ ) {
                        var k = key[i];

                        var f;
                        if ( (f = parser[k]) !== undefined ) {
                            f.call( this, k, value, styles );
                        } else {
                            styles[key[i]] = value;
                        }
                    }
                } else {
                    var f;
                    if ( (f = parser[key]) !== undefined ) {
                        f.call( this, key, value, styles );
                    } else {
                        styles[ key ] = value;
                    }
                }
            }

            return this;
        },

        /**
         * @return A clone of this style, with extra given CSS properties added on.
         */
        extend: function() {
            return xcss( this, arguments );
        },

        /**
         * @return a copy of this class.
         */
        clone: function() {
            return xss( this );
        },

        /**
         * Removes this style from the document.
         *
         * If the style wasn't found in the document,
         * then this does nothing.
         */
        free: function() {
            // todo
        }
    };

    var numToPx = function( n ) {
        if ( n === 0 ) {
            return 0;
        } else if ( typeof n === 'number' || n instanceof Number ) {
            return n + 'px';
        } else {
            return n;
        }
    };

    var numToPxParser1 = function( k, args, styles ) {
        styles[k] = numToPx( args[0] );
    }
    var numToPxParserMany = function( k, args, styles ) {
        for ( var i = 0; i < args.length; i++ ) {
            args[0] = numToPx( args[0] );
        }

        styles[k] = args.join(' ');
    }


    /**
     * This is to create a new XCSS wrapper object.
     *
     * That is what the Style objects will attach to,
     * to find their stylesheets,
     * when they are created.
     */
    var newXCss = function( stylesheet ) {
        var name = '',
            sheet = null,
            prefixes = '';

        if ( isString(stylesheet) ) {
            name = stylesheet;
        } else if ( stylesheet instanceof CSSStyleSheet ) {
            sheet = stylesheet;
        }

        var parser = {
            /**
             * Offers both width and height.
             */
            size: function( k, args, styles ) {
                var w = args.length > 0 ? args[0] : 0,
                    h = args.length > 1 ? args[1] : w;

                styles['width']  = numToPx( w );
                styles['height'] = numToPx( h );
            },
            width : numToPxParser,
            height: numToPxParser,

            background-position: numToPxParserMany,
            backgroundPosition : numToPxParserMany
        };

        /**
         * The main user interface.
         *
         * This allows people to create new styles,
         * by passing in the arguments, and then the style is returned.
         */
        var xcss = function() {
            // being used as a constructor
            if ( this instanceof xcss ) {
                return newXCss( arguments[0] );
            } else {
                return new XStyle( xcss, arguments );
            }
        };

        /**
         * Allows you to change the 'prefix' used for 
         * class rules names. This way you can automatically
         * prefix all of the stylesheets that get created
         * with this object, allowing them to avoid clashes.
         *
         * The prefix defaults to an empty string.
         *
         * If no arguments are given, then the current prefix
         * is returned.
         *
         * If an argument is provided, then this xcss object
         * is returned.
         */
        xcss.prefix = function() {
            if ( arguments.length === 0 ) {
                return prefix;
            } else {
                prefix = arguments[0] || '';

                return this;
            }
        }

        /**
         * Adds a callback for when styles are set.
         *
         * This allows you to add custom parsing,
         * or add new style properties.
         */
        xcss.parseProperty = function( name, callback ) {
            parser[ name ] = callback;
        }

        /**
         * A mark, to just say this is an xcss object,
         * since there is no prototype for people to check against.
         */
        xcss.xcss = true;

        return xcss;
    }

    return newXCss();
})();

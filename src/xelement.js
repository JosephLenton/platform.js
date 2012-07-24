"use strict";

/**
 * The higher level DOM alternative, xelement.
 * It wraps doms, allowing you to do slightly more.
 * 
 * This offers optimizations for dom elements
 * which exist for a long time, and will have
 * alterations performed on them for all of that time.
 * 
 * It also allows you to have elements where the 
 * inside and outside are seperate DOM elements,
 * but allowing the whole element to look like
 * just one.
 */
/*
 * The class caching (add / remove class).
 * 
 * This is built on the presumption that there are
 * two kinds of classes.
 * 
 *   1) classes added and never removed
 *   2) classes added and removed a lot
 * 
 * So this segregates them into dirty and non-dirty
 * classes. If a class is dirty, it is automatically
 * non-dirty (so non-dirty is never tracked).
 * 
 * The non-dirty classes are then cached in a string,
 * so when a class is added, it just gets tacked onto
 * that.
 * 
 * It offers better performance for when there are
 * 3, 4 or 5 classes on the element, and continues to
 * improve as they are added. Especially with
 * 'hasClass'.
 */
window['xelement'] = (function() {
    var XElement = function( args ) {
        var dom = xdom.createArray( args );

        this._insideDom  =
        this._outsideDom =
                dom;

        /*
         * For the class building and caching.
         * 
         * ClassList essentially replaces it with a native,
         * in-built alternative, that does the same thing.
         */
        if ( ! xdom.supports.classList ) {
            var classes     = {},
                classStr    = '',
                numClasses  = 0;

            var domClasses = dom.className;
            if ( domClasses !== undefined ) {
                domClasses = domClasses.split(' ');

                for ( var i = 0; i < domClasses.length; i++ ) {
                    var domClass = domClasses[i];

                    if ( domClass !== '' ) {
                        classes[domClass] = true;
                        classStr += ' ' + domClass;
                        numClasses++;
                    }
                }
            }

            this._classes       = classes;
            this._numClasses    = numClasses;
            this._classesStr    = classStr;
            this._dirty         = {};
            this._dirtyArr      = [];
            this._dirtyArrLen   = 0;
        }
    }

    XElement.prototype = {
        dom: function( newDom ) {
            if ( newDom === undefined ) {
                if ( this._insideDom === this._outsideDom ) {
                    this._outsideDom = newDom;
                }

                this._insideDom = newDom;

                return this;
            } else {
                return this._insideDom;
            }
        },

        innerDom: function() {
            if ( newDom !== undefined ) {
                this._insideDom = newDom;

                return this;
            }

            return this._insideDom;
        },

        outerDom: function() {
            return this._outsideDom;
        },

        attr: function( obj, val ) {
            if ( arguments.length === 1 ) {
                return this._outsideDom[obj];
            } else {
                this.outsideDom[obj] = val;
            }

            return this;
        },

        setClass: (
                xdom.supports.classList ?
                        function() {
                            xdom.setClassesArray( this._outsideDom, arguments, 1 );

                            return this;
                        } :
                        function() {
                            xdom.setClassesArray( this._outsideDom, arguments, 1 );

                            return this.refreshClassCache();
                        }
        ),

        hasClass: (
                xdom.supports.classList ?
                        function( klass ) {
                            return this._outsideDom.classList.contains( klass );
                        } :
                        function( klass ) {
                            return this._classes[klass] === true;
                        }
        ),

        refreshClassCache: function() {
            var classes     = {},
                numClasses  = 0,
                dirtyArr    = [],
                classStr    = '';

            for ( var i = 1; i < arguments.length; i++ ) {
                var klass = arguments[i];

                if ( klass !== '' ) {
                    classes[klass] = true;
                    numClasses++;

                    if ( this._dirty[klass] ) {
                        dirtyArr.push( klass );
                    } else {
                        classStr += ' ' + klass;
                    }
                }
            }

            this._classes       = classes;
            this._numClasses    = 0;
            this._classesStr    = classStr;
            this._dirtyArr      = dirtyArr;
            this._dirtyArrLen   = dirtyArr.length;

            return this;
        },

        addClass: (
                xdom.supports.classList ?
                        function( klass ) {
                            this.dom.classList.add( klass );

                            return this;
                        } :
                        function( klass ) {
                            if ( this._classes[klass] !== true ) {
                                this._classes[klass] = true;

                                if ( this._dirty[klass] === true ) {
                                    this._dirtyArr[ this._dirtyArrLen++ ] = klass;
                                } else {
                                    this._numClasses++;
                                    this._classesStr += ' ' + klass;
                                }

                                this._outsideDom.className = this._classesStr + ' ' + this._dirtyArr.join(' ');
                            }

                            return this;
                        }
        ),
        
        removeClass: (
                xdom.supports.classList ?
                        function( klass ) {
                            this._outsideDom.classList.remove( klass );

                            return this;
                        } :
                        function( klass ) {
                            if ( this._classes[klass] === true ) {
                                this._classes[klass] = false;

                                var dirty       = this._dirty;
                                var dirtyLen    = this._dirtyLen;
                                var dirtyArr    = this._dirtyArr;
                                var classesStr  = this._classesStr;

                                /**
                                 * First time we have seen this in the dirty pool.
                                 */
                                if ( dirty[klass] === undefined ) {
                                    this._numClasses--;

                                    // regenerate the internal string cache
                                    if ( this._numClasses === 0 ) {
                                        this._classesStr = classesStr = '';
                                    } else {
                                        var classes = this._classes;
                                        var classesStrArr = new Array( this._numClasses );
                                        var i = 0;

                                        for ( var k in classes ) {
                                            if (
                                                    classes[k] === true &&
                                                    dirty[k] === undefined &&
                                                    classes.hasOwnProperty(k) 
                                            ) {
                                                classesStrArr[i++] = k;
                                            }
                                        }

                                        classesStr = classesStrArr.join( ' ' );
                                        this._classesStr = classesStr;
                                    }
                                    
                                    dirty[klass] = true;
                                } else {
                                    var dirtyArrLen = this._dirtyArrLen;

                                    for ( var i = 0; i < dirtyArrLen; i++ ) {
                                        if ( dirtyArr[i] === klass ) {
                                            for ( var j = i+1; j < dirtyArrLen; j++ ) {
                                                dirtyArr[j-1] = dirtyArr[j];
                                            }

                                            break;
                                        }
                                    }

                                    dirtyArr[ dirtyArrLen-1 ] = '';
                                    this._dirtyArrLen--;
                                }

                                this._outsideDom.className = classesStr + ' ' + this._dirtyArr.join(' ');
                            }

                            return this;
                        }
        ),

        toggle: (
                xdom.supports.classList ?
                        function( klass ) {
                            this._outsideDom.classList.toggle( klass );

                            return this;
                        } :
                        function( klass ) {
                            if ( this._classes[klass] === true ) {
                                this._removeClass( klass );
                            } else {
                                this._addClass( klass );
                            }

                            return this;
                        }
        )
    }

    var xelement = function() {
        return new XElement( arguments );
    }

    return xelement;
})();

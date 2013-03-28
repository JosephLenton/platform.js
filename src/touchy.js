"use strict";

(function() {
    var IS_TOUCH = !! ('ontouchstart' in window)  // works on most browsers 
                || !!('onmsgesturechange' in window); // works on IE 10

    /**
     * How quickly someone must tap,
     * for it to be a 'fast click'.
     *
     * In milliseconds.
     */
    var FAST_CLICK_DURATION = 150,
        FAST_CLICK_DIST = 20,
        SLOW_CLICK_DIST = 15;

    var startTouch = function( xy, touch ) {
        if ( touch ) {
            xy.finger = touch.identifier;
            xy.timestart = Date.now();

            updateXY( xy, touch, false );

            return true;
        } else {
            return false;
        }
    };

    var updateXY = function( xy, ev, updateMove ) {
        var x,
            y;

        if ( ev.offsetX !== undefined ) { // Opera
            x = ev.offsetX;
            y = ev.offsetY;
        } else if ( ev.layerX !== undefined ) { // Firefox
            x = ev.layerX;
            y = ev.layerY;
        } else if ( ev.clientX !== undefined ) {
            x = ev.clientX;
            y = ev.clientY;

            for (
                    var tag = ev.target;
                    tag.offsetParent;
                    tag = tag.offsetParent
            ) {
                x -= tag.offsetLeft;
                y -= tag.offsetTop;
            }
        // fail, so just put no movement in
        } else {
            x = 0;
            y = 0;
        }

        if ( updateMove ) {
            xy.moveX += (xy.x - x)
            xy.moveY += (xy.y - y)
        } else {
            xy.moveX = 0;
            xy.moveY = 0;
        }

        xy.x = x;
        xy.y = y;
    }

    var pressBuilder = function( el, onDown, onMove, onUp ) {
        if ( ! (el instanceof HTMLElement) ) {
            throw new Error( "non-html element given" );
        }

        var xy = {
                timestart : 0,
                finger    : 0,

                x: 0,
                y: 0,

                moveX: 0,
                moveY: 0
        };

        if ( IS_TOUCH ) {
            var touchstart = function( ev ) {
                var touch = ev.changedTouches[ 0 ];
        
                if ( startTouch(xy, touch) ) {
                    onDown.call( el, ev, touch );
                }
            }

            el.addEventListener( 'touchstart', touchstart, false );

            el.addEventListener( 'touchmove', function(ev) {
                if ( xy.finger === -1 ) {
                    touchstart( ev );
                } else {
                    for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                        var touch = ev.changedTouches[ i ];
                    
                        if ( touch && touch.identifier === xy.finger ) {
                            onMove.call( el, ev, touch );
                            return;
                        }
                    }
                }
            }, false );

            var touchEnd = function(ev) {
                for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                    var touch = ev.changedTouches[ i ];
                
                    if ( touch && touch.identifier === xy.finger ) {
                        xy.finger = -1;

                        updateXY( xy, touch, true );

                        var duration = Date.now() - xy.timestart;
                        var dist = Math.sqrt( xy.moveX*xy.moveX + xy.moveY*xy.moveY )

                        if (
                                ( dist < FAST_CLICK_DIST && duration < FAST_CLICK_DURATION ) ||
                                  dist < SLOW_CLICK_DIST
                        ) {
                            // true is a click
                            onUp.call( el, ev, touch, true );
                        } else {
                            // false is a hold
                            onUp.call( el, ev, touch, false );
                        }

                        return;
                    }
                }
            }

            document.getElementsByTagName('body')[0].
                    addEventListener( 'touchend', touchEnd );
            el.addEventListener( 'touchend', touchEnd, false );

            el.addEventListener( 'click', function(ev) {
                if ( (ev.which || ev.button) === 1 ) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            } );
        } else {
            var isDown = false;

            el.addEventListener( 'mousedown', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 ) {
                    isDown = true;
                    onDown.call( el, ev, ev );
                }
            } );

            el.addEventListener( 'mousemove', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 && isDown ) {
                    onMove.call( el, ev, ev );
                }
            } );

            el.addEventListener( 'mouseup', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 && isDown ) {
                    isDown = false;
                    onUp.call( el, ev, ev );
                }
            } );
        }

        return el;
    };

    var clickBuilder = function( el, callback ) {
        if ( ! (el instanceof HTMLElement) ) {
            throw new Error( "non-html element given" );
        }

        var xy = { finger: -1, timestart: 0, x: 0, y: 0, moveX: 0, moveY: 0 };

        if ( IS_TOUCH ) {
            var touchstart = function(ev) {
                startTouch( xy, ev.changedTouches[0] );
            };

            el.addEventListener( 'touchstart', touchstart, false );

            el.addEventListener( 'touchmove', function(ev) {
                if ( xy.finger === -1 ) {
                    touchstart( ev );
                } else {
                    for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                        var touch = ev.changedTouches[ i ];
                    
                        if ( touch && touch.identifier === xy.finger ) {
                            updateXY( xy, touch, true );
                            return;
                        }
                    }
                }
            }, false )

            el.addEventListener( 'touchend', function(ev) {
                for ( var i = 0; i < ev.changedTouches.length; i++ ) {
                    var touch = ev.changedTouches[ i ];
                    
                    if ( touch && touch.identifier === xy.finger ) {
                        xy.finger = -1;

                        updateXY( xy, touch, true );

                        var duration = Date.now() - xy.timestart;
                        var dist = Math.sqrt( xy.moveX*xy.moveX + xy.moveY*xy.moveY )

                        if (
                                ( dist < FAST_CLICK_DIST && duration < FAST_CLICK_DURATION ) ||
                                  dist < SLOW_CLICK_DIST
                        ) {
                            callback.call( el, ev );
                            ev.preventDefault();
                        }

                        return;
                    }
                }
            }, false )

            var killEvent = function(ev) {
                if ( (ev.which || ev.button) === 1 ) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }

            el.addEventListener( 'click'    , killEvent );
            el.addEventListener( 'mouseup'  , killEvent );
            el.addEventListener( 'mousedown', killEvent );
        } else {
            el.addEventListener( 'click', function(ev) {
                ev = ev || window.event;

                if ( (ev.which || ev.button) === 1 ) {
                    ev.preventDefault();
                
                    callback.call( el, ev, ev );
                }
            } );
        }

        return el;
    };

    var holdBuilder = IS_TOUCH ?
            function( el, fun ) {
                pressBuilder(
                        el,

                        // goes down
                        function(ev) {
                            fun.call( el, ev, true, false );
                        },

                        // moves
                        function(ev) {
                            // do nothing
                        },

                        function(ev, touchEv, isClick) {
                            fun.call( el, ev, false, isClick );
                        }
                )

                return el;
            } :
            function( el, fun ) {
                var isDown = false;

                el.addEventListener( 'mousedown', function(ev) {
                    ev = ev || window.event;

                    if ( (ev.which || ev.button) === 1 ) {
                        ev.preventDefault();
                    
                        isDown = true;
                        fun.call( el, ev, true );
                    }
                } );

                el.addEventListener( 'mouseup', function(ev) {
                    ev = ev || window.event;

                    if ( (ev.which || ev.button) === 1 && isDown ) {
                        ev.preventDefault();
                    
                        isDown = false;
                        fun.call( el, ev, false );
                    }
                } );

                return el;
            } ;

    var touchy = window['touchy'] = {
            click: clickBuilder,
            press: pressBuilder,
            hold : holdBuilder
    }
})();

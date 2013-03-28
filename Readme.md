
platform.js
===========

This is essentially a collection of smaller libraries,
which aim to work togther, for the purpose of building large JS web applications.

bb.js, DOM Creation &; Manipulation
-----------------------------------

JSON is supported for describing, and creating, views in very terse code.
This is so you can have your views described in code, along side the code that hooks them up.

    function createTextPane( dom ) {
        bb(
                '.myApp-scroll-wrap', {
                    // add to the parent dom given
                    addTo: dom,

                    // .properties describe a new child div
                    '.myApp-text': {
                        '.myApp-text-gutter': { },

                        '.myApp-text-content': {
                            contenteditable : true,
                            spellcheck      : false
                        }
                    }
                },

                // clicks in the pane are killed
                preventDefault : 'click',
                stopPropagation: 'click'
        );

        var button = bb.a( 'myApp-button', 'disabled', {
            click: function() {
                alert( 'click me' );
            }
        });
    }

For when you are working at the element level;
setting up and manipulating HTML elements,
you'd use bb.js.

bbgun.js, High-Level class based DOM library
--------------------------------------------

Messing with HTML elements often doesn't cut it, for large core sections of your application.
Sometimes you want to build a large, heavy weight component, which looks like a single HTML element,
but may have multiple ones inside.

BBGun.js, is designed to do that.
It's for the big core components,
that make up your app,
but are also HTML elements in their own right.

Shims & Extras
--------------

 * ECMAScript 5 and (some) 6 methods included
 * assertions
 * type checking function (i.e. isNumeric())

### Function composition

A lot of JS, breaks down into boiler plate. Connecting a to b.
Methods are added to Object and Function prototypes,
to make this easier.

    var buttons = bb( '.buttons-pane', {
            'a.undo-button', {
                click: myApp.method('undo')
            },
            'a.redo-button', {
                click: myApp.method('redo')
            }
    } );

Currying, and partial application, is built in.
This includes leaving parameters blank,
to be filled.

    app.mousedown(
            canvas.method( 'paint', brushes, _ ).
                    bindLater()
    );
    
    // same as ...
    app.mousedown( function(ev) {
        setTimeout( function() {
            canvas.paint( brushes, ev );
        } );
    } );

A little shorter, and a little clearer.
The aim is you write less boiler plate,
and more descriptions of what should happen.


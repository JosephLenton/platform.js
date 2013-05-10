
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

### bb()

The main function for creating new DOM elements, is the 'bb' function.
Like the jQuery dollar, it also holds functions as properties, which you can call.

You pass in the details describing a new element,
and you get returned a browser DOM HTMLElement object.
Note I mean the actual HTMLElement object that the browser uses,
not an intermediate object I have created.

If not stated, it is presumed that the element should be a div.

#### string parameters

Strings are always presumed to be class names. So for example:

    // equivalent to ...
    //      <div class="text-pane right disabled"></div>

    var el = bb( 'text-pane', 'right', 'disabled' );

Strings can also take dots, for denoting the string is a class ...

    var el = bb( '.text-pane', '.right', '.disabled' );

This can also be given as one string ...

    // these are all the same
    var el = bb(  'text-pane',  'right',  'disabled' );
    var el = bb( '.text-pane', '.right', '.disabled' );
    
    var el = bb(  'text-pane  right  disabled' );
    var el = bb( '.text-pane .right .disabled' );

    var el = bb( '.text-pane  right', '.disabled' );

#### arrays

Arrays are presumed to just carry more parameters.
So these are the same:

    var el = bb(  'text-pane',  'right',  'disabled'  );
    var el = bb( ['text-pane',  'right',  'disabled'] );
    var el = bb(  'text-pane', ['right',  'disabled'] );

#### functions

Functions can be given, which are then called straight away.
**Any DOM elements created inside the function, are automatically appended to the object!**

The above might sound odd, but it's the whole point you can pass in functions.
For example:

    var inner;
    var outer = bb( 'outer-wrap', function() {
        inner = bb( 'inner-wrap' );
    } );

Here an inner wrap is created, and then stored, inside of the outer wrap, automatically.

#### Object

Objects can also be given, listing attributes for the object being created.

    var el = bb( 'some-button', {
            'data-some-value': 'blah-foo'
    } );

There are also special attributes which can be used, such as the names of events:

    var el = bb( 'some-button', {
            click: function(ev) {
                // handle click here
            }
    } );

You can also specify children, through making the attribute look like a class selector:

    var el = bb( 'outer-wrap', {
            '.some-button': {
                    click: function(ev) {
                        // handle click on 'some-button'
                    }
            }
    } );

The last one, allows you to begin nesting components, one within another.
This is where the power of bb really starts to become useful,
for building complex objects from code.

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

JSX
---

Platform.js is written in it's own language, JSX,
which is JavaScript + Markdown for comments.
This makes the code look more readable,
and laid out more like documentation.

It also includes a few language extensions,
such as inserting "use strict" and a wrapping self-executing function around all code.

Otherwise, JSX is just JavaScript.



===============================================================================

# JSX Compiler

JSX are the language extensions on top of JavaScript, which most of platform.js
is written in (most at the time of writing).

This file contains the code to attach in the JSX compiler, so JSX can compile 
JSX.

### autocompile jsx files

If you set 'data-autocompile="true"' on the platform.js script tag, for example

```
    <script src="platform.js" data-autocompile="true"></script>

then all of your jsx scripts will be extracted from the head, compiled, and
then executed automatically.

===============================================================================

-------------------------------------------------------------------------------

## jsx( code )

The jsx module is a self executing function, which also has properties on it
you can execute. Like the $ in jQuery.

Given JSX code, this will return it compiled into JS.

-------------------------------------------------------------------------------

    var jsx = window['jsx'] = function( code ) {
        return jsx.compile( code );
    }

-------------------------------------------------------------------------------

## orderCallbacks

Helper function, which pushes callbacks into an array, and then returns a 
function to replace that callback. This function ensures that when the function
is called, the callbacks in the array are called in the order they were placed
there.

-------------------------------------------------------------------------------

    var scriptOrderArray = [];

    var orderCallbacks = function( arr, callback ) {
        var i = arr.length;
        arr.push({ callback: callback, args: undefined, self: undefined });

        return function() {
            if ( arr[0].callback === callback ) {
                arr.shift().callback.apply( this, arguments );

                while ( arr.length > 0 && arr[0].args !== undefined ) {
                    var obj = arr.shift();

                    obj.callback.apply( obj.self, obj.args );
                }
            } else {
                var obj = arr[i];

                obj.args = arguments;
                obj.self = this;
            }
        }
    }

-------------------------------------------------------------------------------

## jsx.executeScripts

-------------------------------------------------------------------------------

    jsx.executeScripts = function() {
        setTimeout( function() {
            var scripts = document.getElementsByTagName( 'script' );

            for ( var i = 0; i < scripts.length; i++ ) {
                var src = scripts[i].getAttribute( 'src' );
                var type = scripts[i].getAttribute('type');

                if ( src ) {
                    if ( isJSXScriptType(type) ) {
                        jsx.executeUrl( src );
                   }
                } else if ( isJSXScriptType(type) ) {
                    jsx.executeCode( script.innerHTML );
                }
            }
        }, 0 );
    }


-------------------------------------------------------------------------------

## jsx.executeUrl( url )

Note that you can provide a single url as a string, or multiple urls in an 
array.

-------------------------------------------------------------------------------

    jsx.executeUrl = function( url ) {
        if ( typeof url === 'string' ) {
            jsx.compileUrl( url, orderCallbacks(scriptOrderArray, function(err, code) {
                if ( err ) {
                    throw err;
                } else {
                    newScriptCode( code, url );
                }
            }) );
        } else if ( url instanceof Array ) {
            for ( var i = 0; i < url.length; i++ ) {
                jsx.executeUrl( url[i], callback );
            }
        } else {
            throw new Error( 'unknown value given for url, ' + url );
        }
    }


-------------------------------------------------------------------------------

## jsx.executeCode( code )

Parses the given code, and then inserts it into a script tag.

-------------------------------------------------------------------------------

    jsx.executeCode = function( code ) {
        setTimeout( orderCallbacks(scriptOrderArray, function() {
            newScriptCode( code, url );
        }), 0);
    }


-------------------------------------------------------------------------------

## jsx.compileUrl( url, callback )

Callback must take the form

```
    function( ex:Error, code:string, url:string, ajaxObj:XMLHttpRequest )

 * 'Ex' will be null if there was no error, and non-null if there was an error.

 * 'url' is the url you gave to the compileUrl function.

 * 'code' is the compiled code, which will only be present if the request was
   successful. It will be null if it was not successful.

 * 'ajaxObj' is the object used to make the request, and is provided for 
   completeness. If for some reason the ajax object failed to be created, then
   this will be null.

-------------------------------------------------------------------------------

    jsx.compileUrl = function( url, callback ) {
        try {
            var ajaxObj = new window.XMLHttpRequest();

            ajaxObj.onreadystatechange = function() {
                if ( ajaxObj.readyState === 4 ) {
                    var err    = undefined,
                        status = ajaxObj.status;

                    if ( ! (status >= 200 && status < 300 || status === 304) ) {                    
                        err = new Error(
                                "error connecting to url " +
                                slate.util.htmlSafe(url) + ', ' + status
                        );
                        callback( err, null, url, ajaxObj );
                    } else {
                        var code = jsx.compile( ajaxObj.responseText );
                        callback( null, code, url, ajaxObj );
                    }
                }
            }

            ajaxObj.open( 'GET', url, true );
            ajaxObj.send();
        } catch ( ex ) {
            /*
             * If access using XMLHttpRequest failed, try the ActiveX file
             * system instead (for .hta files or JScript).
             */
            if ( ex.message.toLowerCase().indexOf("access is denied.") === 0 ) {
                if ( "ActiveXObject" in window ) {
                    try {
                        var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
                        var path;

                        if ( url.search(/^(\/|\\|file:\/\/|http:\/\/|https:\/\/)/) === 0 ) {
                            path = url.replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '');
                        } else {
                            path = document.URL.
                                    replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '').
                                    replace(/\\/g, "/").
                                    split("/").
                                    drop(-1).
                                    join( "/" ) + "/" + url;
                        }

                        var file = fileSystem.OpenTextFile( path, 1, false );
                        if ( file ) {
                            var code = jsx.compile( file.readAll() );
                            file.Close();

                            // this *must* be done in the future
                            setTimeout( function() {
                                callback( null, code, url, null );
                            }, 0 );

                            return;
                        }
                    } catch ( ex ) {
                        // do nothing
                    }
                }
            }

            callback(ex, null, url, null);
        }
    };

-------------------------------------------------------------------------------

## jsx.compile( code )

-------------------------------------------------------------------------------

    var replaceIndentationWithOpenDoubleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return '    "';
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + '"';
        } else {
            return match;
        }
    };

    var replaceIndentationWithOpenSingleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return "    '";
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + "'";
        } else {
            return match;
        }
    };

    jsx.compile = function( code ) {
        var lines = code.split(/\n\r|\r\n|\n|\r/);

        var isMarkdown      = true,
            commentStarted  = false,
            isExample       = false,
            seenExample     = false,
            isList          = false;

        var code = [ '"use strict";(function() {' ];

        var isDoubleComment = false;
        var inDoubleString = false;
        var inSingleString = false;

        for ( var i = 0; i < lines.length; i++ ) {
            var line = lines[i];

            /*
             * Work out what to build.
             */

            if ( isMarkdown ) {
                if (
                        seenExample &&
                        line.length < 4
                ) {
                    isExample   = false;
                    seenExample = false;
                } else if (
                    line.length === 3 &&
                    line.charAt(0) === '`' &&
                    line.charAt(1) === '`' &&
                    line.charAt(2) === '`'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if (
                    line.length >= 8 &&
                    line.charAt(0) === '@' &&
                    line.charAt(1) === 'e' &&
                    line.charAt(2) === 'x' &&
                    line.charAt(3) === 'a' &&
                    line.charAt(4) === 'm' &&
                    line.charAt(5) === 'p' &&
                    line.charAt(6) === 'l' &&
                    line.charAt(7) === 'e'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if ( isExample && !seenExample && line.trim() !== '' ) {
                    seenExample = true;

                } else if (
                        line.length > 4 &&
                        line.charAt(0) === ' ' &&
                        line.charAt(1) === ' ' &&
                        line.charAt(2) === ' ' &&
                        line.charAt(3) === ' '
                ) {
                    if ( isList && line.trim() !== '' ) {
                        // ignore, if this is a continuation of a list
                    } else if ( ! isExample ) {
                        isMarkdown = false;
                    }
                } else if ( isList ) {
                    if ( line.trim() === '' ) {
                        isList = false;
                    } else if ( ! isListTest(line) ) {
                        isList = false;
                    }
                } else if ( isListTest(line) ) {
                    isList = true;
                }
            } else {
                if (
                            line.trim().length > 0 &&
                            (
                                line.charAt(0) !== ' ' ||
                                line.charAt(1) !== ' ' ||
                                line.charAt(2) !== ' ' ||
                                line.charAt(3) !== ' '
                            )
                ) {
                    isMarkdown = true;
                }
            }

            /*
             * Now actually build the new line.
             */
            
            if ( isMarkdown ) {
                var codeLine;

                if ( ! commentStarted ) {
                    codeLine = " /* ";
                    commentStarted = true;
                } else {
                    codeLine = '';
                }

                code.push( codeLine + line.replace( /\*\//g, "* /" ) )
            } else {
                // end the 'previous' line
                if ( commentStarted ) {
                    code[i-1] += " */";
                    commentStarted = false;
                }

                for ( ; i < lines.length; i++ ) {
                    var l = lines[i];

                    /*
                     * we chomp till we reach markdown,
                     * so when we reach it, back up (with i--),
                     * and deal with the markdown on the next outer loop.
                     */
                    // if the line has content, and does not start with 4 spaces ...
                    if ( 
                            l.trim().length > 0 &&
                            (
                                l.charAt(0) !== ' ' ||
                                l.charAt(1) !== ' ' ||
                                l.charAt(2) !== ' ' ||
                                l.charAt(3) !== ' '
                            )
                    ) {
                        isMarkdown = true;
                        i--;
                        break;
                    }

                    var lLen = l.length;
                    for ( var k = 0; k < lLen; k++ ) {
                        var c = l.charAt(k);

                        // these are in order of precedence
                        if ( inDoubleString ) {
                            if (
                                                c === '"' &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inDoubleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenDoubleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( inSingleString ) {
                            if (
                                                c === "'" &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inSingleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenSingleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( isDoubleComment ) {
                            if (
                                                c === '*' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                isDoubleComment = false;

                                // +1 so we include this character too

                                k++;
                            }
                        } else {
                            /*
                             * Look to enter a new type of block,
                             * such as comments, strings, inlined-JS code.
                             */

                            // multi-line comment
                            if (
                                    c === '/' &&
                                    l.charAt(k+1) === '*'
                            ) {
                                k++;

                                isDoubleComment = true;
                            } else if (
                                    c === '/' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                /* skip the rest of the line for parsing */
                                break;

                            // look for strings
                            } else if ( c === '"' ) {
                                inDoubleString = true;
                            } else if ( c === "'" ) {
                                inSingleString = true;

                            } else if ( c === '/' ) {
                                // todo
                                // replace with '#' for ecmascript 6
                               
                            // change '!=' to '!=='
                            } else if (
                                                c === '!' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '!==' + l.substring( k+2 );
                                }

                                // skip past the '!=='
                                k += 3 - 1;

                            // change '==' to '==='
                            } else if (
                                                c === '=' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '===' + l.substring( k+2 );
                                }

                                // skip past the '==='
                                k += 3 - 1;

                            // change '<-' to 'return'
                            } else if (
                                                c === '<' &&
                                    l.charAt(k+1) === '-' &&
                                    l.charAt(k+2) === ' ' &&
                                    l.charAt(k-1) !== '<'
                            ) {
                                l = l.substring( 0, k ) + 'return' + l.substring( k+2 );
                                k += 6 - 1; // length of 'return' - 1
                             // ?? -> arguments[arguments.i = ++arguments.i || 0]
                            } else if (
                                                c === '?' &&
                                    l.charAt(k+1) === '?' &&
                                    l.charAt(k-1) !== '?' &&
                                    l.charAt(k+2) !== '?'
                            ) {
                                var newString = '(arguments[arguments.i = ++arguments.i||0])';
                                l = l.substring( 0, k ) + newString + l.substring( k+2 );
                                k += newString.length + 1;
                            }
                        }
                    } // for c in line

                    code.push( l );
                }
            }
        }

        code.push( '})();' );
        code.push( '' );

        return code.join( "\n" );
    }

-------------------------------------------------------------------------------

### newScriptCode( code:string, src:string )

Creates a new script tag, and adds it to the head, for it to be executed.

-------------------------------------------------------------------------------

    var newScriptCode = function( code, src ) {
        src = src || "<anonymous script tag>";

        var exception = null;
        var catchException = function(ex) {
            exception = ex;
            return true;
        }

        window.addEventListener( 'error', catchException, true );

        var script = document.createElement('script');
        script.innerHTML = code;
        document.head.appendChild( script );

        window.removeEventListener( 'error', catchException, true );

        if ( exception !== null ) {
            throw new Error( 
                    src + "\n" +
                    "line " + (exception.lineno || exception.lineNumber) + "\n" +
                    (exception.message || exception.description)
            );
        }
    }

-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

    var isListTest = function( line ) {
        return (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '-' &&
                                line.charAt(2) !== '-'
                        ) || (
                                line.charAt(0) === '-' &&
                                line.charAt(1) !== '-' &&
                                line.length > 2
                        )
                ) || (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '*' &&
                                line.charAt(2) !== '*'
                        ) || (
                                line.charAt(0) === '*' &&
                                line.charAt(1) !== '*' &&
                                line.length > 2
                        )
                );
    }


-------------------------------------------------------------------------------

### isJSXScriptType( type:string )

Used to test if the 'type' attribute of a script tag, is the correct type for
a JSX file.

@param The type returned from calling 'getAttribute("type")' on a script tag.
@return True if there is a type, and it's a JSX type, otherwise false.

-------------------------------------------------------------------------------

    var isJSXScriptType = function( type ) {
        if ( type !== null && type !== undefined && type !== '' ) {
            type = type.toLowerCase();

            return (
                    type === 'jsx' ||
                    type === 'text/jsx' ||
                    type === 'text\\jsx' ||
                    type === 'application/jsx' ||
                    type === 'application\\jsx'
            );
        } else {
            return false;
        }
    }

-------------------------------------------------------------------------------

Automatically parse scripts if the 'data-autocompile="true"' is set on this
script tag.

-------------------------------------------------------------------------------

    var script = document.currentScript;
    if ( ! script ) {
        var scripts = document.getElementsByTagName( 'script' );
        script = scripts[ scripts.length - 1 ];
    }

    if ( script && script.getAttribute('data-autocompile') === 'true' ) {
        jsx.executeScripts();
    }


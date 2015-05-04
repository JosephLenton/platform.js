
jsx.jsx

===============================================================================

    var jsx = window['jsx'] = function( code ) {
        return jsx.compile( code );
    }

    /**
     * ASCII codes for characters.
     *
     * @type {number}
     * @const
     */
    var TAB = 9, // \t
        SLASH_N = 10, // \n
        SLASH_R = 13, // \r

        SPACE = 32,
        EXCLAMATION = 33,
        DOUBLE_QUOTE = 34,
        HASH = 35,
        DOLLAR = 36,
        PERCENT = 37,
        AMPERSAND = 38,
        SINGLE_QUOTE = 39,
        LEFT_PAREN = 40,
        RIGHT_PAREN = 41,
        STAR = 42, // *
        PLUS = 43,
        COMMA = 44,
        MINUS = 45,
        FULL_STOP = 46,
        SLASH = 47,

        ZERO = 48,
        ONE = 49,
        TWO = 50,
        THREE = 51,
        FOUR = 52,
        FIVE = 53,
        SIX = 54,
        SEVEN = 55,
        EIGHT = 56,
        NINE = 57,

        COLON = 58,
        SEMI_COLON = 59,

        LESS_THAN = 60,
        EQUAL = 61,
        GREATER_THAN = 62,
        QUESTION_MARK = 63,
        AT = 64,

        UPPER_A = 65,
        UPPER_F = 70,
        UPPER_Z = 90,

        LEFT_SQUARE = 91,
        BACKSLASH = 92,
        RIGHT_SQUARE = 93,
        CARET = 94,
        UNDERSCORE = 95,

        LOWER_A = 97,
        LOWER_B = 98,
        LOWER_C = 99,
        LOWER_D = 100,
        LOWER_E = 101,
        LOWER_F = 102,
        LOWER_G = 103,
        LOWER_H = 104,
        LOWER_I = 105,
        LOWER_J = 106,
        LOWER_K = 107,
        LOWER_L = 108,
        LOWER_M = 109,
        LOWER_N = 110,
        LOWER_O = 111,
        LOWER_P = 112,
        LOWER_Q = 113,
        LOWER_R = 114,
        LOWER_S = 115,
        LOWER_T = 116,
        LOWER_U = 117,
        LOWER_V = 118,
        LOWER_W = 119,
        LOWER_X = 120,
        LOWER_Y = 121,
        LOWER_Z = 122,

        LEFT_BRACE = 123,
        BAR = 124,
        RIGHT_BRACE = 125,
        TILDA = 126;



    /**
     * Note this doesn't tell you in full if something is numeric because it
     * also depends on the context of the whole word. 
     *
     * For example 'b' will fail with this test, however '0b1111' is numeric.
     * Only rely on this for checking a single character and not the whole word.
     *
     * @return True or False if the code is for an ASCII character between 0 and 9.
     */
    var isNumeric = function( code ) {
        return ( code >= ZERO && code <= NINE ) ;
    }



    /**
     *
     */
    var isAlphaNumeric = function( code ) {
        return (
            ( code >= LOWER_A && code <= LOWER_Z ) || // lower case letter
            ( code >= UPPER_A && code <= UPPER_Z ) || // upper case letter
            ( code === UNDERSCORE ) ||
            ( code >= ZERO && code <= NINE )     // a number
            );
    }



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



    jsx.executeCode = function( code ) {
        setTimeout( orderCallbacks(scriptOrderArray, function() {
            newScriptCode( code, url );
        }), 0);
    }


    jsx.compileUrl = function( url, callback ) {
        try {
            var ajaxObj = new window.XMLHttpRequest();

            ajaxObj.onreadystatechange = function() {
                if ( ajaxObj.readyState === 4 ) {
                    var err    = undefined,
                        status = ajaxObj.status;

                    if ( ! (status >= 200 && status < 300 || status === 304) ) {                    
                        err = new Error( "error connecting to url " + url.escapeHTML() + ', ' + status );
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

    var parseInjectedVariables = function( injectedVariables ) {
        var str = '';

        for ( var k in injectedVariables ) {
            if ( injectedVariables.hasOwnProperty(k) ) {
                str += 
                        "window['" +
                                k.replace(/'/g, "\\'").replace(/\\/g, "\\\\") +
                        "'] = " + 
                        injectedVariables[k] +
                        ";";
            }
        }

        return str;
    }

    jsx.compile = function( code, injectedVariables ) {
        var injectedCode = '';
        if ( injectedVariables ) {
            injectedCode = parseInjectedVariables( injectedVariables );
        }

        var lines = code.split(/\n\r|\r\n|\n|\r/);

        var isMarkdown      = true,
            commentStarted  = false,
            isExample       = false,
            seenExample     = false,
            isList          = false;

        var code = [ '"use strict";(function() {' + injectedCode ];

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

                            // 0b010101 number literal
                            } else if (
                                                    c === '0' &&
                                    l.charCodeAt(k+1) === LOWER_B &&
                                    ! isAlphaNumeric(l.charCodeAt(k-1))
                            ) {
                                // +2 is to skip the '0b' we have already seen
                                var charI = k + 2;
                                while ( charI < lLen ) {
                                    var charC = l.charCodeAt( charI++ );

                                    if ( charC !== ZERO && charC !== ONE ) {
                                        break;
                                    }
                                }

                                if ( charI > k + 3 ) {
                                    var num = l.substring( k+2, charI );
                                    var numString = parseInt( num, 2 ) + '';
                                    l = l.substring( 0, k ) + numString + l.substring( charI );

                                    k += numString.length;
                                }

                            // numbers that are actually strings
                            //  i.e. 100%, 10px
                            } else if ( isNumeric(l.charCodeAt(k)) ) {
                                var charI = k+1;
                                var isString = false;

                                while ( charI < lLen ) {
                                    var charC = l.charCodeAt( charI++ );

                                    if (
                                            charC === SPACE ||
                                            charC === TAB   ||
                                            charC === SLASH_N ||
                                            charC === SLASH_R
                                    ) {
                                        break;

                                    } else if ( ! isNumeric(charC) ) {
                                        isString = true;

                                    }
                                }

                                if ( isString ) {
                                    var newStr = '"' + l.substring( k+2, charI ) + '"' ;
                                    l = l.substring( 0, k ) + newStr + l.substring( charI );
                                    k += newStr.length;
                                }

                            // for css colours like #aaa
                            } else if ( c === '#' ) {
                                var charI = k+1;

                                while ( charI < lLen && isBreakCharCode(l.charCodeAt(charI)) ) {
                                    charI++
                                }

                                var newStr = '"' + l.substring( k+2, charI ) + '"' ;
                                l = l.substring( 0, k ) + newStr + l.substring( charI );
                                k += newStr.length;
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

    var script = document.currentScript;
    if ( ! script ) {
        var scripts = document.getElementsByTagName( 'script' );
        script = scripts[ scripts.length - 1 ];
    }

    if ( script && script.getAttribute('data-autocompile') === 'true' ) {
        jsx.executeScripts();
    }


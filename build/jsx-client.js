"use strict";

/**
 * jsx.js (javascriptX)
 *
 * Markdown mixed with JavaScript, like literte coffeescript.
 */
(function() {
    var jsx = function( code ) {
        return jsx.parse( code );
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

    var isAlphaNumeric = function( code ) {
        return (
            ( code >= LOWER_A && code <= LOWER_Z ) || // lower case letter
            ( code >= UPPER_A && code <= UPPER_Z ) || // upper case letter
            ( code === UNDERSCORE ) ||
            ( code >= ZERO && code <= NINE )     // a number
            );
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

    /**
     * Given a character, this will count how many times it occurres to the
     * left of the position given.
     *
     * This is so you can do things like count how many slashes are on the left
     * of the quote in '\\\\"'.
     */
    var countCharsToLeft = function( line, i, searchChar ) {
        var count = 0;

        while ( i --> 0 ) {
            if ( line.charAt(i) === searchChar ) {
                count++;
            } else {
                break;
            }
        }

        return count;
    }

    var isNotSlashEscaped = function( line, i ) {
        return (countCharsToLeft( line, i, '\\' ) % 2) === 0;
    }

    jsx.parse = function( code, injectedVariables ) {
        var injectedCode = '';
        if ( injectedVariables ) {
            injectedCode = parseInjectedVariables( injectedVariables );
        }

        var lines = ( code.indexOf("\n") !== -1 ) ?
                code.replace( /\r/g, "" ).split( "\n" ) :
                code.split( "\r" ) ;

        //
        // Flags to tell which mode we are currently in.
        // By 'mode' I mean are we a string? a list? a comment? markdown comment?.
        //
        // isMarkdown       States the text we are currently looking at is a
        //                  Markdown comment.
        //
        // commentStarted   We are outputting a JS comment version of the
        //                  current code.
        //                  Essentially we started /* on the current section,
        //                  and when this ends we'll add a */ to the end.
        //
        var isMarkdown      = false,
            commentStarted  = false,
            isExample       = false,
            seenExample     = false,
            isList          = false;

        var code = [ '"use strict";(function() {' + injectedCode ];

        var isDoubleComment = false;
        var inDoubleString  = false;
        var inSingleString  = false;
        var isRegex         = false;

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
                    codeLine = "/* ";
                    commentStarted = true;
                } else {
                    codeLine = '';
                }

                code.push( codeLine + line.replace( /\*\//g, "* /" ) )
            } else {
                // end the 'previous' line
                if ( commentStarted ) {
                    var lastLine = lines[i-1];

                    // if last line was blank
                    if ( lastLine.length === 0 || lastLine.trim().length === 0 ) {
                        code[i-1] += " */";
                    } else {
                        code[i] += " */";
                    }

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
                    for ( var k = 0; k < l.length; k++ ) {
                        var c = l.charAt(k);

                        // these are in order of precedence
                        if ( inDoubleString ) {
                            // check for "
                            // do not accept \"     (an escaped double quote)
                            // but do accept \\"    (a single slash and then a closing double quote)
                            // do not accept \\\"
                            // but do accept \\\\"
                            // do not accept \\\\\"
                            //
                            //   ... and so on ...
                            //
                            // That is achieved using the 'countCharsToLeft % 2' check.
                            if (
                                                c === '"' &&
                                    ( l.charAt(k-1) !== '\\' || isNotSlashEscaped(l, k) )
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
                                    ( l.charAt(k-1) !== '\\' || isNotSlashEscaped(l, k) )
                            ) {
                                inSingleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + "\\n' + ";

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenSingleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                isSingleString = false;
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
                        } else if ( isRegex ) {
                            if ( c === '/' && isNotSlashEscaped(l, k) ) {
                                isRegex = false;
                            }

                        } else {
                            /*
                             * Look to enter a new type of block,
                             * such as comments, strings, inlined-JS code.
                             */

                            if ( c === '/' ) {
                                // multi-line comment
                                if ( l.charAt(k+1) === '*' ) {
                                    k++;

                                    isDoubleComment = true;

                                // single line comment starting with a //
                                } else if ( l.charAt(k+1) === '/' ) {
                                    /* skip the rest of the line for parsing */
                                    break;

                                } else {
                                    isRegex = true;

                                }

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
                                k += newString.length;

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

    if ( typeof window !== 'undefined' ) {
        window.jsx = jsx;
    } else if ( typeof global !== 'undefined' ) {
        global.jsx = jsx;
    } else {
        throw new Error( "no idea where to put jsx into the global state" );
    }
})();
"use strict";

/**
 * JSX Compiler Client
 *
 * This is the main entry point for the standalone JSX client, for when it is
 * run on the command line.
 *
 * This will run the jsx file, turning JavaScript + extensions into just
 * JavaScript.
 */

(function() {



    /*
     * SETUP
     */

    var PATH    = require( 'path' );
    var FS      = require( 'fs' );

    var VERSION_NUMBER = "0.2";
    var VERSION_NAME   = "first time it's a proper compiler"

    var VERSION_MESSAGE = "JSX Compiler, v. " + VERSION_NUMBER + "\n" + VERSION_NAME ;
    var HELP_MESSAGE =
            "JSX Compiler\n" +
            "by Joseph Lenton\n" +
            "  \n" +
            "This is essentially JavaScript, with some extra language features.\n" +
            "JSX source files to be compiled by this, are expected to be using the extension\n" +
            "'.jsx'.\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "  Options\n" +
            "  \n" +
            "    -h --help    Prints this message.\n" +
            "       --verbose Prints out detailed information about the compilation steps.\n" +
            "    -v --version Prints the version number, and something major about it.\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "    -s --src     One or more source files, seperated by commas, which lists the\n" +
            "                 files to be compiled.\n" +
            "                       jsx -s ./script.jsx\n" +
            "                       jsx -s ./src/*.jsx -o my-project.js\n" +
            "                       jsx -s main.jsx project.jsx logger.jsx -o my-project.js\n" +
            "  \n" +
            "    -o --out     Name of the file to save content to.\n" +
            "                 Not required if you are only compiling one file.\n" +
            "                       jsx -s ./script.jsx -o ./script.js\n" +
            "                       jsx -s ./script.jsx -o script\n" +
            "  \n" +
            "    -f --folder  One or more folders, containing .jsx files to use as source.\n" +
            "                 By default this does *not* include sub-folders, but will if\n" +
            "                 the '-r' recursive flag is used in conjunction with it.\n" +
            "                       jsx -f ./my-project -o ./my-project.js\n" +
            "  \n" +
            "    -r --recurse If a folder is supplied, then this will search them \n" +
            "                 recursively. Otherwise it's not recursive by default.\n" +
            "                       jsx -r -f ./my-project -o ./my-project.js\n" +
            "  \n" +
            "  \n" +
            "    --Xtimestamp Adds the global variable __COMPILE_TIMESTAMP__ which holds\n" +
            "                 the compilers local unix time of when the file was compiled.\n" +
            "                       jsx -s my-script.jsx --Xtimestamp\n" +
            "  \n" +
            "    --Xversion   Adds the global variable __VERSION__ to the code, which holds\n" +
            "                 the value given as a string.\n" +
            "                       jsx -s my-script.jsx --Xversion 3.92\n" +
            "  \n" +
            "  \n" +
            "  \n" ;

    var OPTIONS_SETUP = {
            help: {
                    short       : 'h',
                    takesValue  : false
            },

            version: {
                    short       : 'v',
                    takesValue  : false
            },

            verbose: {
                    takesValue  : false
            },

            out: {
                    short       : 'o',
                    takesValue  : true
            },

            src: {
                    isDefault   : true,
                    short       : 's',
                    takesValue  : true,
                    multipleValues: true
            },

            folder: {
                    short       : 'f',
                    takesValue  : true,
                    multipleValues: true
            },

            recurse: {
                    short       : 'r',
                    takesValue  : false
            },

            Xtimestamp: {
                    takesValue  : false
            },

            Xversion: {
                    takesValue  : true
            }
    };



    /**
     * These are to test if a file name has the .js
     * or .jsx file extension. That's it.
     */

    var IS_JS_REGEX  = /^.+\.js$/i ,
        IS_JSX_REGEX = /^.+\.jsx$/i;



    /*
     * FUNCTIONS
     */

    /**
     * Searches for files to use from the folder option.
     */
    var findFolderFiles = function( seenFiles, src, dest, recursive, log ) {
        log.debug();
        log.debug( 'searching ... ' + src );

        var files = FS.readdirSync( src );

        for ( var i = 0; i < files.length; i++ ) {
            var fileName = files[i];

            // skip hidden files, folders, . and ..
            if ( fileName.charAt(0) !== '.' ) {
                var file  = src + '/' + fileName;
                var stats = FS.lstatSync( file );

                // collect up all jsx and js files
                if ( stats.isFile() ) {
                    if (
                            IS_JS_REGEX.test(fileName) ||
                            IS_JSX_REGEX.test(fileName)
                    ) {
                        // only store files we have not yet seen
                        var filePath = PATH.resolve( file );

                        if ( ! seenFiles.hasOwnProperty(filePath) ) {
                            log.debug( '\tfound ' + filePath );

                            seenFiles[ filePath ] = true;
                            dest.push( filePath );
                        }
                    }

                // or search for more files in a subfolder
                } else if ( recursive && stats.isDirectory() ) {
                    findFolderFiles( seenFiles, file, dest, recursive, log );

                }
            }
        }
    }

    /**
     * The main entry point for the application.
     *
     * This is run sometime in the future, after the script has loaded up.
     */
    var main = function() {

        /*
         * CHECK OPTIONS,
         * HANDLE ERRORS,
         * GATHER UP FILES
         */

        var options = global.CommandLineOptions.parse( OPTIONS_SETUP, process.argv, 2 );
        var params = options.params;
        var hasError = false;
        var log = new global.Logger();

        if ( params.verbose ) {
            log.enableMode('debug');
            log.debug( 'verbose logging is on' );
            log.debug();
        }

        if ( params.help ) {
            console.log();
            console.log( HELP_MESSAGE );

            return;
        } else if ( params.version ) {
            console.log();
            console.log( VERSION_MESSAGE );

            return;
        }



        // check errors from the options given
        if ( options.errors.length > 0 ) {
            for ( var i = 0; i < options.errors.length; i++ ) {
                log.error( options.errors[i] );
            }

            console.log();
            return;
        }

        var src       = params.src || [];
        var folders   = params.folder;
        var out       = params.out;
        var seenFiles = {};

        // -s / --src validation
        if ( src !== undefined ) {
            log.debug( '--src validation' );

            for ( var i = 0; i < src.length; i++ ) {
                var file = src[i];

                if ( ! FS.existsSync( file ) ) {
                    log.error( "cannot find file " + file );
                    hasError = true;

                } else {
                    var stats = FS.lstatSync( file );

                    if ( stats.isDirectory() ) {
                        log.error( "directory given as file " + file );
                        hasError = true;

                    } else if ( ! stats.isFile() ) {
                        log.error( "file given is not a file " + file );
                        hasError = true;

                    } else {
                        var realPath = PATH.resolve( file );

                        if ( ! seenFiles.hasOwnProperty(realPath) ) {
                            seenFiles[ realPath ] = true;
                            src[i] = realPath;
                        } else {
                            src.splice( i, 1 );
                            i--;
                        }
                    }
                }
            }

            log.debug( '--src END' );
            log.debug();
        }



        // -f / --folder validation
        var folderFiles = [];
        if ( folders !== undefined ) {
            log.debug( '--folder validation' );

            for ( var i = 0; i < folders.length; i++ ) {
                var folder = folders[i];

                if ( ! FS.existsSync(folder) ) {
                    log.error( "cannot find folder " + folder );
                    hasError = true;

                } else {
                    var stats = FS.lstatSync( folder );

                    if ( stats.isFile() ) {
                        log.error( "folder given is a file " + folder );
                        hasError = true;

                    } else if ( ! stats.isDirectory() ) {
                        log.error( "folder given is not a folder " + folder );
                        hasError = true;

                    // success! grab all files from the folder
                    } else {
                        findFolderFiles( seenFiles, folders[i], folderFiles, !! params.recurse, log );
                    }
                }
            }

            log.debug();
            log.debug( '--folder END' );
            log.debug();
        }

        if ( hasError ) {
            console.log();
            return;
        }



        // group src + folder together into one collection of files

        var srcFirst = false;
        for ( var k in params ) {
            if ( k === 'src' ) {
                srcFirst = true;
                break;
            } else if ( k === 'folder' ) {
                break;
            }
        }

        var allFiles = srcFirst ?
                allFiles = src.concat( folderFiles ) :
                allFiles = folderFiles.concat( src ) ;

        if ( allFiles.length === 0 ) {
            log.error( "no .jsx files found to compile" );
            hasError = true;
        }



        // -o / --out property validation

        if ( ! out ) {
            if ( ! folder && src && src.length >= 1 ) {
                out = src[0].replace(/\.jsx$/i, '') + '.js';
                log.debug( "--out no output file named, using src file" );
                log.debug( "--out using file " + out );
            } else {
                log.error( "no file given for where to save output, see the --out command" );
                hasError = true;
            }
        }

        if ( out ) {
            log.debug( '--out validation' );
            log.debug( 'using,', out );

            if ( ! IS_JS_REGEX.test(out) ) {
                log.debug( 'out file is not a JS file, adding ".js" to the end' );
                out += '.js';
            }

            var outPath = PATH.resolve( out );
            if ( seenFiles.hasOwnProperty(outPath) ) {
                log.error( "src file is also being used as destination for outputting code " + out );
                hasError = true;
            }

            log.debug( '--out END' );
            log.debug();
        }



        // the X-Options.

        var injects = {};
        if ( params.Xtimestamp ) {
            var time = Date.now();
            injects['__COMPILE_TIMESTAMP__'] = time;
            log.debug( '--Xtimestamp is on, time is ' + time );
        }

        if ( params.Xversion ) {
            injects['__VERSION__'] = params.Xversion;
            log.debug( '--Xversion is on, version is ' + params.Xversion );
        }


        // One final has error check. Always leave this here in case we failed to
        // quit at some point above, when there is an error to quit on.
        if ( hasError ) {
            console.log();
            return;
        }



        /**
         * COMPILE FILES,
         * CONCATE FILES,
         * SAVE
         */

        /**
         * This file takes a folder of scripts, concats them together,
         * and then outputs the result to a destination script.
         *
         * The key thing is that it works on both .jsx and .js files.
         */

        if ( params.verbose ) {
            log.debug( "JSX plan's to work on the files ..." );

            for ( var i = 0; i < allFiles.length; i++ ) {
                log.debug( "           " + allFiles[i] );
            }

            log.debug();
        }


        log.debug( "Actually compiling now ..." );

        var code = '';
        for ( var i = 0; i < allFiles.length; i++ ) {
            var file = allFiles[i];

            if ( IS_JS_REGEX.test(file) ) {
                log.debug( " - as JS  ", file );

                var jsCode = FS.readFileSync( file, 'utf8' );

                // Use \n, always. No \r's.
                if ( jsCode.indexOf("\r") !== -1 ) {
                    if ( jsCode.indexOf("\n") === -1 ) {
                        jsCode = jsCode.replace( /\r/g, "\n" );
                    } else {
                        jsCode = jsCode.replace( /\r/g, "" );
                    }
                }

                code += jsCode;

            } else if ( IS_JSX_REGEX.test(file) ) {
                log.debug( " - as JSX ", file );

                code += global.jsx.parse(
                        FS.readFileSync( file, 'utf8' ),
                        injects
                );

            } else {
                log.debug( "-- File Ignored --", file );
            }
        }

        // finally, write it all to disk
        log.debug();
        log.debug( 'Write to output ...' )
        log.debug( '           ' + out );
        FS.writeFileSync( out, code, { encoding: 'utf-8' } );
        log.debug();
        log.debug( '# # # FINISHED # # #' );
        log.debug();
    };

    setTimeout( main, 1 );
})()

"use static";

/**
 * A simple logging system.
 *
 * Three modes are provided: 'log', 'error' and 'debug'.
 *
 * Do not think of this as an alternative to console.log. If you want to write
 * to the console, use that. This is if you want something more complicated on
 * top, which is specifically for logging.
 */

(function() {

    /**
     * Used to handle the binding of 'here is a log message' to 'should we give
     * it to the onLog subset'. Looks up if the type of message is enabled or
     * not, and if it is, passes it on.
     *
     * This is a function to keep it out of the Logger API.
     */
    var handleLog = function( type, any, modes, onLog, msgs, startI ) {
        if ( any || (modes.hasOwnProperty(type) && modes[type] === true) ) {
            if ( startI === 0 ) {
                onLog( type, msgs );
            } else {
                if ( startI >= msgs.length ) {
                    onLog( type, [] );
                } else {
                    var arr = new Array( msgs.length - startI );

                    for ( var i = startI; i < msgs.length; i++ ) {
                        arr[ i - startI ] = msgs[ i ]
                    }

                    onLog( type, arr );
                }
            }
        }
    }



    /**
     * @onLog Optional, the function to handle how the logging messages are
     *        displayed.
     */
    var Logger = function( onLog ) {
        if ( onLog === undefined ) {
            onLog = function( type, msgs ) {
                type = " " + "\t";
                var temp = null;

                if ( msgs.length > 1 ) {
                    temp = new Array( msgs.length+1 );

                    temp[ 0 ] = type;
                    for ( var i = 0; i < msgs.length; i++ ) {
                        temp[ i + 1 ] = msgs[ i ];
                    }
                }

                if ( type === 'error' ) {
                    if ( msgs.length === 0 ) {
                        console.error( type );
                    } else if ( msgs.length === 1 ) {
                        console.error( type, msgs[0] );
                    } else {
                        console.error.apply( console, temp );
                    }
                } else {
                    if ( msgs.length === 0 ) {
                        console.log( type );
                    } else if ( msgs.length === 1 ) {
                        console.log( type, msgs[0] );
                    } else {
                        console.log.apply( console, temp );
                    }
                }
            };
        }

        this.onLog = onLog;
        this.anyMode = false;
        this.modes = {
                error     : true,
                log     : true,
                debug   : false
        };
    }

    Logger.prototype = {
        /**
         * Enables for any message to be logged, regardless of message.
         * This is useful for turning on a debug mode.
         */
        enableAny: function() {
            this.anyMode = true;
            return this;
        },

        /**
         * Disables the 'any' mode which is enabled with 'enableAny'. It will
         * not change the state of any modes indevidually enabled or disabled.
         */
        disableAny: function() {
            this.anyMode = false;
            return this;
        },



        enableMode: function(mode) {
            this.modes[mode] = true;
            return this;
        },

        enableDebug: function() {
            return this.enableMode( 'debug' );
        },

        enableLog: function() {
            return this.enableMode( 'log' );
        },

        enableerror: function() {
            return this.enableMode( 'error' );
        },



        disableMode: function(mode) {
            this.modes[mode] = false;
            return this;
        },

        disableDebug: function() {
            return this.disableMode( 'debug' );
        },

        disableLog: function() {
            return this.disableMode( 'log' );
        },

        disableError: function() {
            return this.disableMode( 'error' );
        },



        /**
         * Posts messages for the type given.
         *
         * Any type can be provided.
         */
        post: function(type) {
            handleLog( type.toLowerCase(), this.anyMode, this.modes, this.onLog, arguments, 1 );
            return this;
        },

        debug: function() {
            handleLog( 'debug', this.anyMode, this.modes, this.onLog, arguments, 0 );
            return this;
        },

        error: function() {
            handleLog( 'error', this.anyMode, this.modes, this.onLog, arguments, 0 );
            return this;
        },

        log: function() {
            handleLog( 'log', this.anyMode, this.modes, this.onLog, arguments, 0 );
            return this;
        }
    }



    // exports
    global.Logger = Logger;

})();

"use static";

/**
 * A Command Line Options parser.
 */
(function() {


    var startOption = function( currentOption, defaultOption, options, key, errors ) {
        var nextOption = options[key];

        if ( nextOption === undefined ) {
            errors.push( "unknown option given " + key );

            return defaultOption;
        } else {
            endOption( currentOption, errors );

            // This can hit if nextOption is used multiple times
            // or if the current and next were the same (but only takes 1 value).
            if ( nextOption.hasOwnProperty('result') ) {
                errors.push( "duplicate option seen" );
            }

            return nextOption;
        }
    }

    var endOption = function( currentOption, errors ) {
        // deal with the old result
        if ( currentOption !== null && currentOption['isDefault'] !== true && !currentOption.hasOwnProperty('result') ) {
            if ( currentOption.value === false ) {
                currentOption.result = true;
            } else {
                errors.push( "value missing for option '" + currentOption.longName + "'" );
            }

            if ( currentOption.hasOwnProperty('defaultValue') ) {
                currentOption.result = currentOption['defaultValue'];
            }
        }
    }

    var addToOption = function( currentOption, defaultOption, val, errors ) {
        if ( currentOption === null ) {
            errors.push( "unknown option given " + val );

        // foo.js,bar.js,foobar.js
        } else if ( val.indexOf(',') !== -1 ) {
            var valParts = val.split( ',' );

            for ( var i = 0; i < valParts.length; i++ ) {
                currentOption = addToOption( currentOption, defaultOption, valParts[i], errors );
            }

        // foo.js
        } else {
            if ( currentOption.check ) {
                var newVal = check( val );

                if ( newVal !== undefined ) {
                    val = newVal;
                }
            }

            if ( ! currentOption.multipleValues ) {
                if ( currentOption.hasOwnProperty('result') ) {
                    errors.push( "more than 1 value given for option '" + currentOption.longName + "'" );
                } else {
                    currentOption.result = val;
                }

                currentOption = defaultOption;
            } else {
                if ( ! currentOption.hasOwnProperty('result') ) {
                    currentOption.result = [ val ];
                } else {
                    currentOption.result.push( val );
                }
            }
        }

        return currentOption;
    }

    /**
     * Ensures the string has at least a given number of hyphens at the start,
     * and if not, adds some.
     *
     * A resulting string with at least the number of hyphens asked for, is
     * returned.
     *
     * If the string has more hyphens than asked for, they are ignored.
     *
     * @param str The string to check.
     * @param num The minimum number of hyphens asked for.
     * @return A string which has the minimum number of hyphens asked for.
     */
    var ensureHyphens = function( str, num ) {
        for ( var i = 0; i < num; i++ ) {
            if ( str.charAt(i) !== '-' ) {
                num -= i;
                break;
            }
        }

        for ( var i = 0; i < num; i++ ) {
            str = '-' + str;
        }

        return str;
    }



    /**
     * @param str The string to test.
     * @return True if the given string is in the form '--option'
     */
    var isLongOption = function( str ) {
        return str.length > 2 &&
               str.charAt(0) === '-' &&
               str.charAt(0) === '-'
    }

    /**
     * @param str The string to test.
     * @return True if the given string is in the form '-o'
     */
    var isShortOption = function( str ) {
        return str.length > 1 &&
               str.charAt(0) === '-';
    }



    /**
     * This is essentially the 'main loop' which does the actual parsing of the
     * options available.
     *
     * The result returned is in the form:
     *
     *      { results: { [key:str]: any }, errors: str[] }
     */
    var parseOptions = function( setup, arr, startI ) {
        var shortOptions   = {},
            longOptions    = {},
            defaultOption  = undefined,
            currentOption  = undefined,
            errors         = [];

        for ( var k in setup ) {
            if ( setup.hasOwnProperty(k) ) {
                var option = setup[k];
                var clone = {
                        name            : k,
                        longName        : ensureHyphens(k, 2),
                        check           : option.check          || null,
                        value           : option.takesValue     || false,
                        multipleValues  : option.multipleValues || false,
                        isDefault       : !! option.isDefault   || false
                }

                if ( option.hasOwnProperty('isDefault') && option.isDefault === true ) {
                    if ( defaultOption ) {
                        throw new Error( 'more than 1 command line option marked as a default parameter' );
                    }

                    defaultOption = clone;
                }

                if ( option.hasOwnProperty('defaultValue') ) {
                    clone['defaultValue'] = option['defaultValue'];
                }

                if ( option.hasOwnProperty('short') ) {
                    clone['short'] = ensureHyphens( option['short'], 1 );
                    shortOptions[ clone['short'] ] = clone;
                }

                longOptions[ clone.longName ] = clone;
            }
        }

        var currentOption = defaultOption || null ;



        // Set to process args if array not supplied.
        // Params at 0 and 1 are 'node' and the name of the script. So skip
        // them to get to the actual args.
        if ( arr === undefined ) {
            arr = process.argv;
            startI = 2;

        // give startI a default if not supplied
        } else if ( startI === undefined ) {
            if ( arr === process.argv ) {
                startI = 2;

            } else {
                startI = 0;

            }
        }



        // now do the actual processing
        for ( var i = startI; i < arr.length; i++ ) {
            var key = arr[ i ];

            // --option
            if ( key.charAt(0) === '-' ) {
                var optionsGroup = isLongOption( key ) ? longOptions : shortOptions ;

                // --option=value
                //  -o=value
                var equalI = key.indexOf('=');

                if ( equalI !== -1 ) {
                    var val = key.substring( equalI+1 );
                    key = key.substring( 0, equalI );

                    currentOption = startOption( currentOption, defaultOption, optionsGroup, key, errors );
                    currentOption = addToOption( currentOption, defaultOption, val, errors );
                } else {
                    currentOption = startOption( currentOption, defaultOption, optionsGroup, key, errors );
                }

            // it is not an option, so just add it to our current one
            } else {
                currentOption = addToOption( currentOption, defaultOption, key, errors );
            }
        }

        endOption( currentOption, errors );



        // finally compile the results into a pretty object to return
        var results = {};
        for ( var k in longOptions ) {
            if ( longOptions.hasOwnProperty(k) ) {
                var option = longOptions[k];

                if ( option.hasOwnProperty('result') ) {
                    results[option.name] = option.result;
                }
            }
        }



        return {
                params: results,
                errors: errors
        };
    }



    global.CommandLineOptions = {
        parse : parseOptions
    }
})();

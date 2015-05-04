
Math.jsx
========

@author Joseph Lenton

Adds on extras for extra mathematical operations.


    var __setProp__ = window.__setProp__;
    
    __setProp__( Math, {
            'TAO': Math.PI*2  ,
            'π'  : Math.PI    ,
            'τ'  : Math.PI*2
    } );
    
    __setProp__( window, {
            'π'  : Math.PI    ,
            'τ'  : Math.PI*2
    } );

-------------------------------------------------------------------------------

# Math.round

The 'nearest' value is so you can round to the nearest 0.5, 0.3, 0.1, 10, or
any other value.

```
    Math.round( 55.4      ) // returns 55
    Math.round( 55.4, 1   ) // returns 55 (same as above)
    Math.round( 55.4, 0.5 ) // returns 55.5
    Math.round( 55.4, 5   ) // returns 55
    Math.round( 55.4, 10  ) // returns 60
    Math.round( 55.4, 100 ) // returns 100 (rounds to nearest 100)
    Math.round( 55.4, 0   ) // returns 55.4 (always returns the number given)

One useful feature is that it is trivial to round to the nearest set number of
decimal places.

```
    // round PI to the nearest 3 decimal places, 3.142
    Math.round( π, 0.001 )

@param num The number to round.
@param nearest Optional, another number to 'round nearest to'. By default, this is 1.
@return The number given, rounded.

-------------------------------------------------------------------------------

    var oldRound = Math.round;

    __setProp__( Math,
            'round', function( num, within ) {
                if ( arguments.length === 1 ) {
                    return oldRound( num );
                } else if ( within === 0 ) {
                    return num;
                } else {
                    return oldRound(num/within) * within
                }
            }
    );



-------------------------------------------------------------------------------

# Math.parse

This is a small parser for parsing and evaluating simple math expressions.

Note this is *not*, and *never* intends to be, a full language.

The point is so you can have a public facing input that allows inputs such as 
"200" or "190+12". This means the user can enter a simple mathematical 
expression instead of working it out by hand.

So far this only supports ...
 - integers 
 - decimal values
 - hexadecimal values, 0xabc34
 - binary values, 0b010101011010
 - parenthesis, (1+2) * 3
 - add, subtract, divide, and multiply (with correct associativity)

No variables, no functions, because this isn't a mini programming language.

You chuck the maths into parse and it either gives you the result, or null. 
Null is returned if there is some issue with the input and it's designed to ask
no questions and just fail fast.

If null is not good enough; well again this is not intended to be a fully 
functioning language. So if you want an in-depth maths AST builder and error
checker then tbh use something else because this ain't that.

Users may also be interested that internally this does *not* use eval or any
alternative. It parses and then runs the maths.

@param str A string containing a mathematical expression to parse and run.
@param null if an error occurred, otherwise the result.

-------------------------------------------------------------------------------

    __setProp__( Math,
            'parse', (function() {
            var TERM_ZERO            = 1
            var TERM_NINE            = 2
            var TERM_PLUS            = 3
            var TERM_SUB             = 4
            var TERM_MULT            = 5
            var TERM_DIVIDE          = 6
            var TERM_LEFT_BRACKET    = 7
            var TERM_RIGHT_BRACKET   = 8
            
            /// Token for whole int numbers.
            /// It will also push 1 extra integer into the tokens array.
            ///     - the integer value
            var TERM_INT_NUMBER      = 9
            
            /// Token for decimal numbers.
            /// It will also push 3 extra integers onto the tokens array
            ///     - the integer value
            ///     - it's decimal part as an int
            ///     - the number of digits in the decimal part
            var TERM_DECIMAL_NUMBER  = 10

            var SPACE           = ' '.charCodeAt(0);
            var TAB             = "\t".charCodeAt(0);
            var LOWER_B         = 'b'.charCodeAt(0);
            var LOWER_X         = 'x'.charCodeAt(0);
            var UPPER_B         = 'B'.charCodeAt(0);
            var UPPER_X         = 'X'.charCodeAt(0);

            var FULL_STOP       = '.'.charCodeAt(0);
            var UNDERSCORE      = '_'.charCodeAt(0);

            var ZERO            = '0'.charCodeAt(0);
            var ONE             = '1'.charCodeAt(0);
            var NINE            = '9'.charCodeAt(0);

            var PLUS            = '+'.charCodeAt(0);
            var SUB             = '-'.charCodeAt(0);
            var MULT            = '*'.charCodeAt(0);
            var DIVIDE          = '/'.charCodeAt(0);

            var LEFT_BRACKET    = '('.charCodeAt(0);
            var RIGHT_BRACKET   = ')'.charCodeAt(0);

            var parseTokenNumber = function( str, state, code, i, tokens ) {
                // stuff for iteration
                var strLen = str.length;
                var secondCode = str.charCodeAt( i+1 );

                var hasMore = false;

                var num = 0;
                var decimalNum = 0;
                var decimalLen = 0;
                var isDecimal = false;

                /*
                 * 0x - Hexadecimal
                 */
                if ( 
                        (secondCode === LOWER_X || secondCode === UPPER_X) && 
                        code === ZERO 
                ) {
                    base = 16;
                    hasMore = false;

                    i += 2;
                    for ( ; i < strLen; i++ ) {
                        code = str.charCodeAt( i );

                        if ( ZERO <= code && code <= NINE ) {
                            num = num*16 + (code - ZER0   );
                            hasMore = true;
                        } else if ( LOWER_A <= code && code <= LOWER_F ) {
                            num = num*16 + (code - LOWER_A);
                            hasMore = true;
                        } else if ( UPPER_A <= code && code <= UPPER_F ) {
                            num = num*16 + (code - LOWER_A);
                            hasMore = true;

                        // decimal hexidecimal, not supported
                        } else if (code === FULL_STOP ) {
                            state.fail = true;
                            return 0;
                        } else if ( code !== UNDERSCORE ) {
                            break;
                        }
                    }

                    if ( ! hasMore ) {
                        state.fail = true;
                        return 0;
                    }

                /*
                 * 0b - Binary number
                 */
                } else if (
                        (secondCode === LOWER_B || secondCode === UPPER_B)
                        && code === ZERO 
                ) {
                    base = 2;

                    for ( var i = 2; i < strLen; i++ ) {
                        code = str.charCodeAt( i );

                        if ( code === ZERO ) {
                            num = num*2;
                            hasMore = true;
                        } else if ( code === ONE ) {
                            num = num*2 + 1;
                            hasMore = true;
                        
                        // decimal binary, not supported
                        } else if (code === FULL_STOP ) {
                            state.fail = true;
                            return 0;

                        } else if ( code !== UNDERSCORE ) {
                            break;
                        }
                    }

                    if ( ! hasMore ) {
                        state.fail = true;
                        return 0;
                    }

                /*
                 * regular base 10 number
                 */
                } else {
                    // this is for the whole number section
                    // this is optional, as long as there is a decimal section
                    if ( code !== FULL_STOP ) {
                        for ( ; i < strLen; i++ ) {
                            code = str.charCodeAt( i );

                            if ( ZERO <= code && code <= NINE ) {
                                num = num*10 + (code - ZERO);
                                hasMore = true;

                            // check for a decimal place,
                            // and a double decimal stop (which should never happen, but just to be safe)
                            } else if ( code === FULL_STOP ) {
                                break;

                            // look for numbers outside of the 0 to 9 range
                            } else if ( code !== UNDERSCORE ) {
                                break;
                            }
                        }

                        if ( ! hasMore ) {
                            state.fail = true;
                            return 0;
                        }
                    }

                    // this is for the decimal section, if there is one
                    if ( code === FULL_STOP ) {
                        decimalNum = 0;
                        isDecimal = true;
                        hasMore = false;

                        i++;
                        for ( ; i < strLen; i++ ) {
                            code = str.charCodeAt( i );

                            if ( ZERO <= code && code <= NINE ) {
                                num = num*10 + (code - ZERO);
                                decimalLen++;
                                hasMore = true;

                            // double decimal, like 123.456.789
                            } else if ( code === FULL_STOP ) {
                                state.fail = true;
                                return 0;

                            // look for numbers outside of the 0 to 9 range
                            } else if ( code !== UNDERSCORE ) {
                                break;
                            }
                        }

                        if ( ! hasMore ) {
                            state.fail = true;
                            return 0;
                        }
                    }
                }

                if ( isDecimal ) {
                    tokens.push( TERM_DECIMAL_NUMBER );
                    tokens.push( num|0 );
                    tokens.push( decimalNum|0 );
                    tokens.push( decimalLen|0 );
                } else {
                    tokens.push( TERM_INT_NUMBER );
                    tokens.push( num|0 );
                }

                return i;
            }

            var parseTokens = function( str, state ) {
                var tokens = [];
                var strLen = str.length;
                var numTokens = 0;

                for ( var i = 0; i < strLen; i++ ) {
                    var c = str.charCodeAt( i );

                    // trim whitespace
                    while ( c === SPACE || c === TAB ) {
                        c = str.charCodeAt( ++i );
                    }

                    if ( i < strLen ) {
                        // match precise terminals
                        if ( c === LEFT_BRACKET ) {
                            tokens.push( TERM_LEFT_BRACKET );

                        } else if ( c === RIGHT_BRACKET ) {
                            tokens.push( TERM_RIGHT_BRACKET );

                        } else if ( c === PLUS ) {
                            tokens.push( TERM_PLUS );

                        } else if ( c === SUB ) {
                            tokens.push( TERM_SUB );

                        } else if ( c === MULT ) {
                            tokens.push( TERM_MULT );

                        } else if ( c === DIVIDE ) {
                            tokens.push( TERM_DIVIDE );

                        // is number, supports
                        //  0-9 integer values
                        //  0x  hexadecimal values
                        } else if ( c >= ZERO && c <= NINE ) {
                            var newI = parseTokenNumber( str, state, c, i, tokens );

                            if ( newI > i ) {
                                i = newI-1;
                            } else {
                                state.fail = true;
                                break;
                            }

                        // we don't know what this is o _ O
                        } else {
                            state.fail = true;
                            break;
                        }

                        numTokens++;
                    }
                }

                state.tokensLen = numTokens;

                return tokens;
            }

            var evalExpr = function( tokens, state ) {
                return evalSub( tokens, state );
            }

            var evalSub = function( tokens, state ) {
                var num = evalPlus( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_SUB ) {
                    state.i++;

                    return num - evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalPlus = function( tokens, state ) {
                var num = evalMult( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_PLUS ) {
                    state.i++;

                    return num + evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalMult = function( tokens, state ) {
                var num = evalDivide( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_MULT ) {
                    state.i++;

                    return num * evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalDivide = function( tokens, state ) {
                var num = evalBrackets( tokens, state );

                if ( state.fail )
                    return 0;

                var token = tokens[ state.i ];
                if ( token === TERM_DIVIDE ) {
                    state.i++;

                    return num / evalExpr( tokens, state );
                } else {
                    return num;
                }
            }

            var evalBrackets = function( tokens, state ) {
                var token = tokens[ state.i ];

                if ( token === TERM_PLUS ) {
                    state.i++;
                    return   evalBrackets( tokens, state );
                } else if ( token === TERM_SUB ) {
                    state.i++;
                    return - evalBrackets( tokens, state );
                } else if ( token === TERM_LEFT_BRACKET ) {
                    state.i++;
                    var num = evalExpr( tokens, state );

                    if ( state.fail )
                        return 0;

                    // closing bracket expected
                    var token = tokens[ state.i++ ];
                    if ( token !== TERM_RIGHT_BRACKET ) {
                        state.fail = true;
                    }

                    return num;
                } else {
                    return evalNumber( tokens, state );
                }
            }

            var evalNumber = function( tokens, state ) {
                var i = state.i;
                var token = tokens[ i ];

                var r = 0;
                if ( token === TERM_INT_NUMBER ) {
                    var num = tokens[ i+1 ];
                    state.i += 2;

                    r = num;
                } else if ( token === TERM_DECIMAL_NUMBER ) {
                    var num = tokens[ i+1 ];
                    var decimalNum = tokens[ i+2 ];
                    var decimalLen = tokens[ i+3 ];
                    state.i += 3;

                    var divider = 1;
                    while ( decimalLen --> 0 ) {
                        divider *= 10;
                    }

                    r = num + (decimalNum / divider);
                } else {
                    state.fail = true;
                }

                return r;
            }


            return function(str) {
                var state = {
                    // where we are currently parsing in the string
                    i: 0,

                    // set to true when parsing has failed somehow
                    fail: false,

                    tokensLen: 0
                };

                var tokens = parseTokens( str, state );

                if ( tokens.length > 0 && state.fail === false ) {
                    var result = evalExpr( tokens, state );

                    if ( ! state.fail && state.i === tokens.length ) {
                        return result;
                    }
                }

                return null;
            }
        })()
    );

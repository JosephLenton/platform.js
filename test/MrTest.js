"use strict";

(function() {

    /**
     * MrTest, a tiny testing API/framework.
     *
     * This is the entry point to the testing API.
     * Everything else is offered via the functions on this object.
     */
    var MrTest = window['MrTest'] = {
        /**
         * @private
         * @param str:string The string to output.
         */
        __outputFun: function( str ) {
            console.log( str );
        },

        /**
         * Use to set the function used, when this will output it's result.
         * By default, this will just use 'console.log'.
         *
         * @param callback : ( str:string ) -> void
         *        The function which will be printed, when this outputs text.
         */
        onPrint: function( callback ) {
            MrTest.__outputFun = callback;
        },

        test: function(name, setupFun) {
            var testo = new TestGroup(name, MrTest.__outputFun);
            setupFun( testo );
            testo.run();
        }
    };

    var TestGroup = function( name, outputFun ) {
        this.name = name;
        this.tests = [];

        if ( outputFun ) {
            this.output = outputFun;
        }
    }

    TestGroup.prototype = {
        add: function(name, test) {
            if ( arguments.length === 1 ) {
                test = name;
                name = "test " + (this.tests.length+1);
            }

            this.tests.push({ name: name, test: test });
        },

        run: function() {
            var self = this;

            var successes = 0;
            var fails = 0;

            var str = '';
            for ( var i = 0; i < this.name.length; i++ ) {
                str += '=';
            }

            this.outputWrap();
            this.outputWrap( this.name );
            this.outputWrap( str );
            this.outputWrap();

            var str, testsSuccess;
            var reportFunction = function(success, msg) {
                if ( success ) {
                    str += "    pass \t" + msg + "\n";
                } else {
                    testsSuccess = false;
                    str += "   *FAIL \t" + msg + "\n";
                }
            };

            for ( var i = 0; i < this.tests.length; i++ ) {
                str = '';
                testsSuccess = true;

                var test = this.tests[i];

                try {
                    test.test( new Test(reportFunction) );
                } catch ( ex ) {
                    testsSuccess = false;

                    str += '-------------------------------------------------------------------------------\n' +
                            '  ! ERR  \t' + ex.message + "\n" +
                            '  ' + ex.stack + "\n" +
                            '-------------------------------------------------------------------------------\n';
                }

                if ( testsSuccess ) {
                    this.outputWrap( '  --- ' + test.name );
                    successes++;
                } else {
                    this.outputWrap( '  !-- ' + test.name );
                    fails++;
                }

                this.outputWrap( str );
            }

            this.outputWrap( '          fails ' + fails             );
            this.outputWrap( '        success ' + successes         );
            this.outputWrap( '          tests ' + this.tests.length );
            this.outputWrap();
        },

        outputWrap: function( str ) {
            if ( str === undefined || str === null ) {
                str = '';
            }

            this.output( str );
        },

        output: function( str ) {
            console.log( str );
        }
    };

    /**
     * This is the interface used to allow tests to report back to TestGroup.
     */
    var Test = function( reportBack ) {
        var currentOrder = Number.NEGATIVE_INFINITY;
        var orders = [];

        return {
            assertEqual: function(testVal, expected, msg) {
                if ( testVal !== expected ) {
                    reportBack( false, msg || "assertEqual expected " + expected + ", got " + testVal );
                } else {
                    reportBack( true, msg || "assertEqual " + testVal );
                }
            },

            assertNotEqual: function(testVal, expected, msg) {
                if ( testVal === expected ) {
                    reportBack( false, msg || "assertNotEqual expected " + expected + ", got " + testVal );
                } else {
                    reportBack( true, msg || "assertNotEqual " + testVal );
                }
            },

            assert: function(cond, msg) {
                if ( ! cond ) {
                    reportBack( cond, msg || "assert() failed" );
                } else {
                    reportBack( cond, msg || "assert()" );
                }
            },

            fail: function( msg ) {
                reportBack( false, msg || "test failed" );
            },

            success: function( msg ) {
                reportBack( true, msg || 'success!' );
            },

            /**
             * This is used for code that should run in a specific order.
             *
             * You provide a number, and for each subsequent call, you should
             * provide a higher or equal number.
             *
             * If a lower number is given, due to functions being called in the
             * wrong order, then this will raise an error.
             */
            assertOrder: function( order, msg ) {
                if ( currentOrder <= order ) {
                    currentOrder = order;
                    orders.push( order );

                    reportBack( true , msg || "in order, " + order );
                } else {
                    reportBack( false, msg || "ordering failed, current " + currentOrder + ', got ' + order );
                }
            },

            assertOrderEqual: function( order, msg ) {
                if ( order instanceof Array ) {
                    if ( order.length > orders.length ) {
                        reportBack( false, msg || "more call orders asked to check, than were stored" );
                    } else {
                        var success = true;

                        for ( var i = 1; i <= order.length; i++ ) {
                            if ( order[ order.length-i ] !== orders[ orders.length-i ] ) {
                                success = false;
                                break;
                            }
                        }

                        reportBack( success, msg || ("assert call orders are ... " + order.join(', ')) );
                    }
                } else {
                    reportBack( currentOrder === order, msg || ("assert current call order is " + order) );
                }
            }
        }
    }
})();

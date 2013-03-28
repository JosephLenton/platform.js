"use strict";

/**
 * This file takes a folder of scripts, concats them together,
 * and then outputs the result to a destination script.
 *
 * The key thing is that it works on both .jsx and .js files.
 */

var SRC_FOLDER = process.argv[2];
var OUTPUT_FILE = process.argv[3];

var jsx = require( './../jsx.js' ).jsx;

var fs = require( 'fs' );

var concatFiles = function( src ) {
    var str = '';

    var files = fs.readdirSync( src );
    for ( var i = 0; i < files.length; i++ ) {
        var f = src + '/' + files[i];

        var stats = fs.lstatSync( f );

        if ( f.charAt(0) !== '.' ) {
            if ( stats.isDirectory() !== '.' ) {
                if ( f.search(/\.js$/) !== -1 ) {
                    str += fs.readFileSync( f, 'utf8' );
                } else if ( f.search(/\.jsx$/) !== -1 ) {
                    str += jsx.parse(
                            fs.readFileSync( f, 'utf8' )
                    );
                }
            } else if ( stats.isFile() ) {
                str += concatFiles( f );
            }
        }
    }

    return str;
}

fs.writeFileSync( OUTPUT_FILE, concatFiles(SRC_FOLDER) );


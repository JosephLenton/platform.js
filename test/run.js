"use strict";

/**
 *
 *      run.js - this runs the tests. 
 *
 * It is designed to be used with Phantom, however MrTest.js is not. So that
 * can be used seperately with it's own script runner.
 *
 * You can run this by doing
 *
 *  .\phantom\phantom.exe run.js
 *
 * Options ...
 *
 *  run.js                  - Run on it's own, this will recursively run all
 *                            .js tests this can find within the 'src' folder.
 *
 *  run.js .\src\folder     - Will run all .js tests within the given folder.
 *                            It will *not* search recursively.
 *
 *  run.js .\src\test.js    - Will load and run the named .js file to run.
 *
 * You can list multiple files and folders as command line arguments.
 *
 */
(function() {
    require( './MrTest.js' );
    require( './../dist/platform.js' );

    var fs     = require( 'fs' );
    var system = require( 'system' );

    var files = [];
    var notFoundFiles = [];
    var emptyFolders = [];

    if ( system.args.length <= 1 ) {
        runFolderTestsRecursive( './src' );
    } else {
        for ( var i = 1; i < system.args.length; i++ ) {
            var file = system.args[i];

            if ( fs.isDirectory(file) ) {
                if ( fs.list( file ).some( function(f) { return isJSFile(file + '\\' + f); } ) ) {
                    files.push( file );
                } else {
                    emptyFolders.push( file );
                }
            } else if ( fs.isFile(file) ) {
                files.push( file );
            } else {
                notFoundFiles.push( file );
            }
        }
    }

    if ( notFoundFiles.length > 0 ) {
        console.log( '' );
        console.log( "  files not found," );
        console.log( "        " + notFoundFiles.join( "        \n" ) );
    }

    if ( emptyFolders.length > 0 ) {
        console.log( '' );
        console.log( "  these folders have no tests," );
        console.log( "        " + emptyFolders.join( "        \n" ) );
    }

    if ( notFoundFiles.length === 0 && emptyFolders.length === 0 ) {
        for ( var i = 0; i < files.length; i++ ) {
            var file = files[i];

            if ( fs.isDirectory(file) ) {
                runFolderTests( file );
            } else {
                require( file );
            }
        }
    }

    console.log( '' );

    phantom.exit();

    /*
     *
     *              Functions
     *
     */

    function runFolderTests( folder ) {
        fs.list( folder ).forEach( function(file) {
            file = folder + '\\' + file;

            if ( isJSFile(file) ) {
                require( file );
            }
        } );
    }

    function isJSFile( file ) {
        return fs.isFile(file) && file.search(/\.js$/i) !== -1 ;
    }

    function runFolderTestsRecursive( folder ) {
        recursiveFiles( folder, function(path) {
            require( path );
        });
    }

    function recursiveFiles( src, callback ) {
         fs.list(src).forEach(function (fileName) {
            if ( fileName !== "." && fileName !== ".." ) {
                var path = src + '/' + fileName;

                if ( fs.isDirectory(path) ) {
                    recursiveFiles( path, callback );
                } else if ( path.search(/\.js$/) !== -1 ) {
                    callback( path );
                }
            }
        });
    }
})();


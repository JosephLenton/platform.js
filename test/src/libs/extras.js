"use strict";

(function() {
function drop( array, index ) {
  var len = array.length;
  var delIndex = index;
  var args = arguments;
  var argsLen = args.length;

  if ( argsLen === 0 ) {
    fail( "no indexes given" );
  } else if ( argsLen === 2 ) {
    if ( delIndex < 0 ) {
      delIndex = len + delIndex;

      if ( delIndex < 0 ) {
        fail( "index out of range, " + index );
      }
    } else if ( delIndex >= len ) {
      fail( "index out of range, " + index );
    }

    for ( var i = delIndex+1; i < len; i++ ) {
      array[ i-1 ] = array[ i ];
    }

    array.length = len-1;
  } else {
    /*
                     * Sort the arguments so they are in order.
                     *
                     * array uses insertion sort, which is fine for very small
                     * arrays which is what I expect.
                     */
    for ( var i = 1; i < args.length; i++ ) {
      var sortVal = args[i],
          wasNegative = false;

      if ( sortVal < 0 ) {
        sortVal = len + sortVal;
        wasNegative = true;

        if ( sortVal < 0 ) {
          fail( "index out of range, " + sortVal );
        }
      } else if ( sortVal >= len ) {
        fail( "index out of range, " + sortVal );
      }

      var j = i;
      while ( j > 1 ) {
        var temp = args[j-1];

        if ( temp > sortVal ) {
          args[j] = temp;

          j--;
        } else {
          break;
        }
      }

      if ( j !== i || wasNegative ) {
        args[j] = sortVal;
      }
    }

    // now apply the deletions
    var last = -1;
    var offset = 0;
    for ( var i = 1; i < argsLen; i++ ) {
      var delIndex = args[i];

      // skip duplicates
      if ( last !== delIndex ) {
        for ( var i = last+1; i < delIndex; i++ ) {
          array[ i-offset ] = array[ i ];
        }

        last = delIndex;

        offset++;
      }
    }

    for ( var i = last+1; i < len; i++ ) {
      array[ i-offset ] = array[ i ];
    }

    array.length = len - offset;
  }

  return array;
}
    MrTest.test("Array.prototype.drop", function(t) {
        t.test("1, drop 1 element", function(t) {
            var arr = [ 1, 2, 3, 4 ];
            var arr2 = [ 1, 2, 3, 4 ];

            for ( var i = 0; i < 4; i++ ) {
                arr.drop( 0 );
                t.assertEqual( arr.length, arr2.length - (i+1), "ensure the length is changed each time" );
                t.assertEqual( arr[0], arr2[i+1], "ensure the item changes over time" );
            }
        });

        t.test("2, drop element at -1", function(t) {
            var arr = [ 1, 2, 3, 4 ];
            var arr2 = [ 1, 2, 3, 4 ];

            for ( var i = 0; i < 4; i++ ) {
                arr.drop( -1 );
                t.assertEqual( arr.length, arr2.length - (i+1), "ensure the length is changed each time" );
                t.assertEqual( arr[arr.length-1], arr2[(arr2.length-1) - (i+1)], "ensure the item changes over time" );
            }
        });

        t.test("3, drop first 2 elements", function(t) {
            var arr = [ 1, 2, 3, 4 ];

            arr.drop( 0, 1 );
            t.assertEqual( arr.length, 2, "ensure the length is correct" );
            t.assertEqual( arr[0], 3 );
            t.assertEqual( arr[1], 4 );

            arr.drop( 0, 1 );
            t.assertEqual( arr.length, 0, "ensure the length is correct" );
        });

        t.test("3.b, drop first 2 elements, opposite order", function(t) {
            var arr = [ 1, 2, 3, 4 ];

            arr.drop( 1, 0 );
            t.assertEqual( arr.length, 2, "ensure the length is correct" );
            t.assertEqual( arr[0], 3 );
            t.assertEqual( arr[1], 4 );

            arr.drop( 0, 1 );
            t.assertEqual( arr.length, 0, "ensure the length is correct" );
        });

        t.test("4, drop 3 elements", function(t) {
            var arr = [ 1, 2, 3, 4 ];
            drop( arr, 1, 2, -1 );

            t.assertEqual( arr[0], 1, "array still has correct element left, " + arr[0] );
            t.assertEqual( arr.length, 1, "array has 1 element left" );
        });

        t.test("5, drop middle 2 elements", function(t) {
            var arr = [ 1, 2, 3, 4 ];
            drop( arr, 1, -2 );

            t.assertEqual( arr[0], 1, "array still has correct element left, " + arr[0] );
            t.assertEqual( arr.length, 2, "array has 2 element left" );
        });

        t.test("5.b, drop middle 2 elements, opposite order", function(t) {
            var arr = [ 1, 2, 3, 4 ];
            drop( arr, -2, 1 );

            t.assertEqual( arr[0], 1, "array still has correct element left, " + arr[0] );
            t.assertEqual( arr.length, 2, "array has 2 element left" );
        });
    });
})();

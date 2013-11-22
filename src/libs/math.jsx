
Math.jsx
========

@author Joseph Lenton

Adds on extras for extra mathematical operations.

    var __setProp__ = window.__setProp__;
    
    __setProp__( Math.prototype, 
            'TAO'   , Math.prototype.PI*2,
            'π'     , Math.prototype.PI,
            'τ'     , Math.prototype.PI*2
    );
    
    __setProp__( window, {
            'π'     , Math.prototype.PI,
            'τ'     , Math.prototype.PI*2
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

    __setProp__( Math.prototype,
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


Core
====

The absolute core bootstrap, used by everything.

===============================================================================

-------------------------------------------------------------------------------

Object.defineProperty is present for IE 8 and above,
it just doesn't work in IE 8 for non-HTMLElements.

So don't bother emulating it!

-------------------------------------------------------------------------------

-------------------------------------------------------------------------------

### OBJECT_DESCRIPTION

A re-usable object, for setting descriptions. It's re-used to avoid object
creation.

-------------------------------------------------------------------------------

    var OBJECT_DESCRIPTION = {
        value           : undefined,
        enumerable      : false,
        writable        : true,
        configurable    : true
    };
    
-------------------------------------------------------------------------------

### __shim__

Same as __setProp__, only the item only gets set, *if* it is not already there.
This is for setting shims, hence why it's called 'shim'.

-------------------------------------------------------------------------------

    window.__shim__ = function( obj, name, fun ) {
        if ( ! obj.hasOwnProperty(name) ) {
            __setProp__( obj, name, fun );
        }
    }

-------------------------------------------------------------------------------

### __setProp__

-------------------------------------------------------------------------------

    window.__setProp__ = function( obj, name, fun ) {
        if ( typeof name === 'string' ) {
            OBJECT_DESCRIPTION.value = fun;

            try {
                Object.defineProperty( obj, name, OBJECT_DESCRIPTION );
            } catch ( ex ) {
                obj[name] = fun;
            }
        } else {
            for ( var trueName in name ) {
                if ( name.hasOwnProperty(trueName) ) {
                    OBJECT_DESCRIPTION.value = trueName;

                    try {
                        Object.defineProperty( obj, name[trueName], OBJECT_DESCRIPTION );
                    } catch ( ex ) {
                        obj[trueName] = name[trueName];
                    }
                }
            }
        }
    }


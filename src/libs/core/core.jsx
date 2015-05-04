
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

### window.__shim__ obj:Object name:string val:any

Same as __setProp__, only the item only gets set, *if* it is not already there.
This is for setting shims, hence why it's called 'shim'.

@param obj The object to set the property to.
@param name The name of the property to set.
@param val The item to set at that property, 99% of the time this is a function.

-------------------------------------------------------------------------------

    window.__shim__ = function( obj, name, val ) {
        if ( ! obj.hasOwnProperty(name) ) {
            __setProp__( obj, name, val );
        }
    }



-------------------------------------------------------------------------------

### window.__setProp__ obj:Object name:string val:any

-------------------------------------------------------------------------------

    window.__setProp__ = function( obj, name, val ) {
        if ( typeof name === 'string' ) {
            OBJECT_DESCRIPTION.value = val;

            try {
                Object.defineProperty( obj, name, OBJECT_DESCRIPTION );
            } catch ( ex ) {
                obj[name] = val;
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



===============================================================================

# user agent testing globals

These are global variables which are set to the version of the browser, if this
is running in that browser.

Only rely on these sparingly; always feature detect where possible!

===============================================================================

    var IS_IE       = false;
    var IS_HTA      = false;
    var IS_OPERA    = false;
    var IS_MOZILLA  = false;
    var IS_CHROME   = false;
    var IS_SAFARI   = false;

    var getUAVersion = function(userAgent, browserName) {
        var test = new RegExp(browserName + "([\\d.]+)", 'i');
        var match = userAgent.match( test );

        if ( match !== null && match.length > 0 ) {
            var strMatch = match[0];
            var splitI = strMatch.indexOf("/");

            if ( splitI === -1 ) {
                splitI = strMatch.indexOf(":");
            }

            if ( splitI !== -1 ) {
                return parseInt( strMatch.substring(splitI+1) ) || -1;
            }
        }

        return -1;
    }

    var userAgent = navigator.userAgent.toString();

    if (userAgent.indexOf("MSIE/") !== -1) {
        IS_IE = getUAVersion( userAgent, "MSIE/" );

        if ( window.external === null || window.external === undefined ) {
            IS_HTA = IS_IE;
        }

    } else if (userAgent.indexOf("Trident/") !== -1) {
        if ( userAgent.indexOf(" rv:") !== -1 ) {
            IS_IE = getUAVersion( userAgent, "rv:" );
        } else {
            IS_IE = getUAVersion( userAgent, "Trident/" );
        }

        if ( window.external === null || window.external === undefined ) {
            IS_HTA = IS_IE;
        }

    } else if (userAgent.indexOf("Chrome/") !== -1) {
        IS_CHROME = getUAVersion( userAgent, "Chrome/" );

    } else if (userAgent.indexOf("Safari/") !== -1) {
        IS_SAFARI = getUAVersion( userAgent, "Safari/" );

    } else if (userAgent.indexOf("Firefox/") !== -1) {
        IS_MOZILLA = getUAVersion( userAgent, "Firefox/" );

    } else if (userAgent.indexOf("Iceweasel/") !== -1) {
        IS_MOZILLA = getUAVersion( userAgent, "Iceweasel/" );

    } else if (userAgent.indexOf("Netscape/") !== -1) {
        IS_MOZILLA = getUAVersion( userAgent, "Netscape/" );
    }



-------------------------------------------------------------------------------

## IS_IE

A global property which is truthy when this is running in IE holding the 
version of IE we are running on.

When it's not IE this will hold false.

-------------------------------------------------------------------------------

    window.IS_IE        = IS_IE         ;



-------------------------------------------------------------------------------

## IS_HTA

This is truthy if this is running as a .hta application. .HTA applications are
presumed to be IE powered (Trident, Chakra, etc).

As a result this will either be false for when it is not a .HTA, or the same
value as 'IS_IE'.

-------------------------------------------------------------------------------

    window.IS_HTA       = IS_HTA        ;



-------------------------------------------------------------------------------

## IS_MOZILLA

-------------------------------------------------------------------------------

    window.IS_MOZILLA   = IS_MOZILLA    ;



-------------------------------------------------------------------------------

## IS_CHROME

-------------------------------------------------------------------------------

    window.IS_CHROME    = IS_CHROME     ;



-------------------------------------------------------------------------------

## IS_SAFARI

-------------------------------------------------------------------------------

    window.IS_SAFARI    = IS_SAFARI     ;



-------------------------------------------------------------------------------

## IS_OPERA

-------------------------------------------------------------------------------

    window.IS_OPERA     = IS_OPERA      ;




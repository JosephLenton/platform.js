
MrTest.test('Function.prototype.then', function(t) {
    window['__function__test__fun__'] = function(t, num) {
        t.assertOrder( num );
        return num;
    }

    var buildOrder = function( t, num, text ) {
        return function() {
            t.assertOrder( num );
            return text;
        }
    };

    var OrderObject = function( t, num, text ) {
        this.t = t;

        this.num = num;
        this.lastNum = num;

        // this is a total of all of the numbers given to doNum, added up
        this.totalNum = 0;

        this.text = text;
    }

    var doNum = function( n ) {
        var last = this.lastNum;

        var num;
        if ( arguments.length === 0 ) {
            num = this.num;
        } else {
            num = n;
        }

        this.lastNum = num;
        this.totalNum += num;

        this.t.assertOrder( num );

        return last;
    }

    OrderObject.prototype.doNum = doNum;

    t.add( '1, function.then( fun )', function(t) {
        var first   = buildOrder( t, 1, 'first'  );
        var second  = buildOrder( t, 2, 'second' );
        var third   = buildOrder( t, 3, 'third'  );

        var funs = first.then( second ).then( third );
        t.assertEqual( funs(), 'third' );
        t.assertOrderEqual([1, 2, 3], "ensure all funs got called" );
    });

    t.add( '2, function.then( fun ), with nesting', function(t) {
        var first   = buildOrder( t, 1, 'first'  );
        var second  = buildOrder( t, 2, 'second' );
        var third   = buildOrder( t, 3, 'third'  );
        var fourth  = buildOrder( t, 4, 'fourth' );

        var funs = first.then( second.then(third) ).then( fourth );

        t.assertEqual( funs(), 'fourth' );
        t.assertOrderEqual([1, 2, 3, 4], "ensure all funs got called" );
    });

    t.add( '3, obj.method( string ).then( string )', function(t) {
        var obj = new OrderObject( t, 1, 'first' );
        var doNum = obj.method( 'doNum' );

        var funs = doNum.then( 'doNum', 2 );
        t.assertEqual( funs(), 1 );

        t.assertOrderEqual([1, 2]);
    });

    t.add( '4, obj.method( string ).then( fun )', function(t) {
        var obj = new OrderObject( t, 1, 'first' );

        var doNum = obj.method( 'doNum' );
        var funs = doNum.then( doNum, 3 );

        t.assertEqual( funs(2), 2, 'ensure the last number, 2, was stored and then returned via the second doNum call' );
        t.assertEqual( obj.lastNum, 3, "ensure the second number, 3, got stored onto the object, provind 'doNum' was correctly bound to 'obj'" );
    });

    t.add( '5, obj.method( string ).then( string ).then( string )', function(t) {
        var obj = new OrderObject( t, 1, 'first' );

        var fun = obj.
                method( 'doNum', 1 ).
                  then( 'doNum', 2 ).
                  then( 'doNum', 3 );

        fun();

        t.assertEqual( obj.lastNum, 3 );
        t.assertEqual( obj.totalNum, 1 + 2 + 3 );
        t.assertOrderEqual([1, 2, 3]);
    });

    t.add( '6, obj.method( fun ).then( fun ).then( fun )', function(t) {
        var obj = new OrderObject( t, 1, 'first' );

        var fun = obj.method( doNum, 1 ).
                then( doNum, 2 ).
                then( doNum, 3 );

        fun();

        t.assertEqual( obj.lastNum, 3 );
        t.assertEqual( obj.totalNum, 1 + 2 + 3 );
        t.assertOrderEqual([1, 2, 3]);
    });

    t.add( '7, window.function.then( fun )', function(t) {
        var fun = buildOrder( t, 0, 'zero' );

        fun();
        t.assertOrderEqual( 0 );

        var funTestFun = fun.then( '__function__test__fun__', t, 1 );

        var r = funTestFun();

        t.assertOrderEqual( 1 );
    });
});


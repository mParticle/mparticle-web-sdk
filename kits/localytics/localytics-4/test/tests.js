describe('Localytics Forwarder', function () {

    var ReportingService = function () {
        var self   = this;
        this.id    = null;
        this.event = null;

        this.cb = function (forwarder, event) {
            self.id    = forwarder.id;
            self.event = event;
        };

        this.reset = function () {
            this.id    = null;
            this.event = null;
        };
    },
    MessageType = {
        SessionStart: 1,
        SessionEnd  : 2,
        PageView    : 3,
        PageEvent   : 4,
        CrashReport : 5,
        OptOut      : 6,
        Commerce    : 16
    },
    EventType = {
        Unknown       : 0,
        Navigation    : 1,
        Location      : 2,
        Search        : 3,
        Transaction   : 4,
        UserContent   : 5,
        UserPreference: 6,
        Social        : 7,
        Other         : 8,
        Media         : 9,
        getName: function () {
            return 'blahblah';
        }
    },
    ProductActionType = {
        Unknown           : 0,
        AddToCart         : 1,
        RemoveFromCart    : 2,
        Checkout          : 3,
        CheckoutOption    : 4,
        Click             : 5,
        ViewDetail        : 6,
        Purchase          : 7,
        Refund            : 8,
        AddToWishlist     : 9,
        RemoveFromWishlist: 10,
        getName: function () {
            return 'Action';
        }
    },
    IdentityType = {
        Other                   : 0,
        CustomerId              : 1,
        Facebook                : 2,
        Twitter                 : 3,
        Google                  : 4,
        Microsoft               : 5,
        Yahoo                   : 6,
        Email                   : 7,
        Alias                   : 8,
        FacebookCustomAudienceId: 9,
        getName: function () {
            return 'CustomerID';
        }
    },
    reportService = new ReportingService();

    function MPMock () {
        var self          = this;
        var calledMethods = ['tagEvent', 'tagScreen', 'setCustomerEmail', 'setCustomerId', 'setCustomerName', 'setCustomDimension'];

        for (var i = 0; i < calledMethods.length; i++) {
            this[calledMethods[i] + '.tracker-name.called'] = false;
        }

        this.data = [];

        function setCalledAttributes(attr, args) {
            self[attr] = true;
            
            self.data.length = 0;
            if(args.length > 1) {
                for (var i = 1; i < args.length; i++) {
                    self.data.push(args[i]);                    
                }
            }
        }
        
        function ll(fnName) {
            setCalledAttributes(fnName + '.called', arguments);
        }
        
        return {
            ll      : ll,
            llObj   : this 
        }
    }

    beforeEach(function () {
        mParticle.forwarder.init({
            appKey: '923a7d5e3c9a43ca31a3854-9ade667e',
            appVersion: '1.2',
            sessionTimeout: 1800,
            domain: 'test.com',
            trackPageView: 'False',
            customDimensions: '[{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 0&quot;,&quot;map&quot;:&quot;test user attr&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;test user tag&quot;}]'
        }, reportService.cb, true, 'tracker-name');
        
        mParticle.EventType         = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.IdentityType      = IdentityType;
        
        var mock = new MPMock();
        window.ll = mock.ll;
        window.llObj = mock.llObj;
    });

    describe('Logging events', function() {
        
        it('should log pageview', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageView,
                EventName     : 'TestPage'
            });

            window.llObj.should.have.property('tagScreen.tracker-name.called', true);
            Should(window.llObj.data[0]).eql('TestPage');
            done();
        });
        
        it('should log pageview with screen name', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageView,
                EventName     : 'TestPage',
                CustomFlags   : {"Localytics.ScreenName" : "Screen 1"}
            });

            window.llObj.should.have.property('tagScreen.tracker-name.called', true);
            Should(window.llObj.data[0]).eql('Screen 1');
            done();
        });
        
        it('should log pageview with no screen name', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageView,
                EventName     : 'TestPage',
                CustomFlags   : {}
            });

            window.llObj.should.have.property('tagScreen.tracker-name.called', true);
            Should(window.llObj.data[0]).eql('TestPage');
            done();
        });
        
        it('should log event', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageEvent,
                EventName     : 'Test Page Event'
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            Should(window.llObj.data[0]).eql('Test Page Event');
            done();
        });
        
        it('should log event with ltv', function(done) {
            mParticle.forwarder.process({
                EventDataType   : MessageType.PageEvent,
                EventName       : 'Test Page Event with LTV',
                EventAttributes : {'$Amount': 100},
                EventCategory   : EventType.Transaction
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            window.llObj.data[0].should.equal('Test Page Event with LTV');
            window.llObj.data[1].should.have.property('$Amount', 100);
            window.llObj.data[2].should.equal(10000);
            done();
        });
        
        
        it('should log event with invalid amount', function(done) {
            mParticle.forwarder.process({
                EventDataType   : MessageType.PageEvent,
                EventName       : 'Test Page Event',
                EventAttributes : {'$Amount': 'a100'},
                EventCategory   : EventType.Transaction
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            window.llObj.data[0].should.equal('Test Page Event');
            window.llObj.data[1].should.have.property('$Amount', 'a100');
            Should(window.llObj.data[2]).be.undefined;
            done();
        });
        
        it('should log event with ltv and raw value', function(done) {
            mParticle.forwarder.init({
                appKey: '923a7d5e3c9a43ca31a3854-9ade667e',
                trackClvAsRawValue: true
            }, reportService.cb, true, 'tracker-name');
        
            mParticle.forwarder.process({
                EventDataType   : MessageType.PageEvent,
                EventName       : 'Test Page Event with LTV',
                EventAttributes : {'$Amount': 99},
                EventCategory   : EventType.Transaction
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            window.llObj.data[0].should.equal('Test Page Event with LTV');
            window.llObj.data[1].should.have.property('$Amount', 99);
            window.llObj.data[2].should.equal(99);
            done();
        });
        
        it('should log event with no ltv', function(done) {
            mParticle.forwarder.process({
                EventDataType   : MessageType.PageEvent,
                EventName       : 'Test Page Event with no LTV',
                EventAttributes : {attr1: 'val1'}
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            window.llObj.data[0].should.be.equal('Test Page Event with no LTV');
            window.llObj.data[1].should.be.instanceof(Object);
            window.llObj.data[1].attr1.should.be.equal('val1');
            done();
        });
        
    });
    
    describe('User Events', function() { 
        
        it('should set user identity with id', function(done) {
            mParticle.forwarder.setUserIdentity('testcustomerid', mParticle.IdentityType.CustomerId);

            window.llObj.should.have.property('setCustomerId.tracker-name.called', true);
            done();
        });
        
        it('should set user identity with id 2', function(done) {
            mParticle.forwarder.setUserIdentity('testcustomerid');

            window.llObj.should.have.property('setCustomerId.tracker-name.called', true);
            done();
        });
        
        it('should set user identity with email', function(done) {
            mParticle.forwarder.setUserIdentity('test@test.com', mParticle.IdentityType.Email);

            window.llObj.should.have.property('setCustomerEmail.tracker-name.called', true);
            done();
        });
        
        it('should set customer name', function(done) {
            mParticle.forwarder.setUserAttribute('Localytics.CustomerName','Test Name');

            window.llObj.should.have.property('setCustomerName.tracker-name.called', true);
            done();
        });
        
        it('should set custom dimensions', function(done) {
            mParticle.forwarder.setUserAttribute('test user attr','Test Value');

            window.llObj.should.have.property('setCustomDimension.tracker-name.called', true);
            Should(window.llObj.data[0]).eql(0);
            Should(window.llObj.data[1]).eql('Test Value');
            done();
        });
        
        it('should clear custom dimensions', function(done) {
            mParticle.forwarder.removeUserAttribute('test user attr');

            window.llObj.should.have.property('setCustomDimension.tracker-name.called', true);
            window.llObj.data[0].should.be.equal(0);
            Should(window.llObj.data[1]).be.undefined;
            done();
        });
        
        it('should not call any user events', function(done) {
            mParticle.forwarder.setUserAttribute('UserAttr1','Test Value');

            window.llObj.should.have.property('setCustomerName.tracker-name.called', false);
            done();
        });
        
    });
    
    describe('Transaction Events', function() { 
        
        it('should track Purchase event', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.Commerce,
                EventName     : 'Test charge',
                ProductAction : {
                    ProductActionType: mParticle.ProductActionType.Purchase,
                    TotalAmount      : 10
                }
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            Should(window.llObj.data[2]).eql(1000);

            done();
        });
        
        it('should track Refund event', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.Commerce,
                EventName     : 'Test refund',
                ProductAction : {
                    ProductActionType: mParticle.ProductActionType.Refund,
                    TotalAmount      : 10
                }
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            Should(window.llObj.data[2]).eql(-1000);

            done();
        });
        
        
        it('should log commerce event with no ltv', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.Commerce,
                EventName     : 'Test AddToCart',
                ProductAction : {
                    ProductActionType   : mParticle.ProductActionType.AddToCart,
                    Quantity            : 5
                }
            });

            window.llObj.should.have.property('tagEvent.tracker-name.called', true);
            window.llObj.data[0].should.equal('Test AddToCart');
            Should(window.llObj.data[1]).be.undefined;;

            done();
        });
    });
    
});

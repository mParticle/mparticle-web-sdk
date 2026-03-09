describe('KissMetrics Forwarder', function () {
    var ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null
                this.event = null;
            };
        },
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            getName: function () {
                return 'blahblah';
            }
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10,
            getName: function () {
                return 'Action';
            }
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2,
            getName: function () {
                return 'promotion action type';
            }
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            Alias: 8,
            FacebookCustomAudienceId: 9,
            getName: function () {return 'CustomerID';}
        },
        reportService = new ReportingService();

    before(function () {
        mParticle.ProductActionType = ProductActionType;
        mParticle.EventType = EventType;
        mParticle.IdentityType = IdentityType;
        mParticle.PromotionType = PromotionActionType;

        mParticle.forwarder.init({
            useCustomerId: 'True',
            includeUserAttributes: 'True'
        }, reportService.cb, 1, true);
    });

    beforeEach(function () {
        window.KM = {
            set: function() {},
            ts: function () {}
        };
        window._kmq = [];
    });

    it('should log event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'Test Event'
        });

        window._kmq[0][0].should.equal('record');
        window._kmq[0][1].should.equal('Test Event');
        window._kmq[0][2].should.have.property('MPEventType', 'blahblah');

        done();
    });

    it('should log transaction', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Transaction,
            EventAttributes: {
                $MethodName: 'LogEcommerceTransaction'
            }
        });

        window._kmq[0][0].should.equal('record');
        window._kmq[0][1].should.equal('Purchased');

        done();
    });

    it('should set user identity', function(done) {
        mParticle.forwarder.setUserIdentity('tbreffni@mparticle.com', mParticle.IdentityType.CustomerId);

        window._kmq[0][0].should.equal('identify');

        done();
    });

    it('should set user attribute', function(done) {
        mParticle.forwarder.setUserAttribute('gender', 'male');

        window._kmq[0][0].should.equal('set');
        window._kmq[0][1].should.have.property('gender', 'male');

        done();
    });

    it('should log product purchase', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                TransactionId: 1234567,
                TotalAmount: 500,
                ShippingAmount: 50,
                TaxAmount: 50,
                ProductList: [
                    {
                        Sku: 12345,
                        Price: 500
                    }
                ]
            }
        });

        window._kmq[1][0].should.equal('record');
        window._kmq[1][1].should.equal('Product Action');

        done();
    });

    it('should log promotion', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionClick,
                PromotionList: [{
                    Id: '12345',
                    Name: 'My Promotion',
                    Creative: 'My Creative',
                    Position: 1
                }]
            }
        });

        window._kmq[1][0].should.equal('record');
        window._kmq[1][1].should.equal('promotion action type');

        done();
    });

    it('should log impressions', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductImpressions: [{
                Name: 'My Impression',
                ProductList: []
            }]
        });

        window._kmq[1][0].should.equal('record');
        window._kmq[1][1].should.equal('Product Impression');

        done();
    });

    it('should log checkout step', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Checkout,
                CheckoutStep: 1,
                CheckoutOptions: 'blah'
            }
        });

        window._kmq[0][0].should.equal('record');
        window._kmq[0][1].should.equal('Product Action');

        done();
    });
});

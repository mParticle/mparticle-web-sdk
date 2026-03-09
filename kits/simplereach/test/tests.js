describe('SimpleReach Forwarder', function () {

    var MessageType = {
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
            ProductPurchase: 16,
            getName: function () {
                return 'blahblah';
            }
        },
        CommerceEventType = {
            ProductAddToCart: 10,
            ProductRemoveFromCart: 11,
            ProductCheckout: 12,
            ProductCheckoutOption: 13,
            ProductClick: 14,
            ProductViewDetail: 15,
            ProductPurchase: 16,
            ProductRefund: 17,
            PromotionView: 18,
            PromotionClick: 19,
            ProductAddToWishlist: 20,
            ProductRemoveFromWishlist: 21,
            ProductImpression: 22
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
            getName: function () {  return 'CustomerID';}
        },
        ReportingService = function () {
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
        SPRMock = function () {
            var self = this;
            
            this.collectCalled = false;
            this.collectEvent = null;
            
            this.Reach = {
                collect: function (data) {
                    self.collectCalled = true;
                    self.collectEvent = data;
                }   
            };
        },
        reportService = new ReportingService();

    before(function () {
        mParticle.EventType = EventType;
        mParticle.IdentityType = IdentityType;
        
        mParticle.forwarder.init({
            pid: 'TestPID'
        }, reportService.cb, 
            true, 
            null,
            null,
            null,
            null,
            null,
            {
                'SimpleReach.Title' : 'init_title',
                'SimpleReach.Url': 'init_url',
                'SimpleReach.Date': 'init_date',
                'SimpleReach.Authors': 'init_authors',
                'SimpleReach.Channels': 'init_channels',
                'SimpleReach.Tags': 'init_tags',
                'SimpleReach.ContentHeight': 'init_contentheight'
            });
    });

    beforeEach(function () {
        window.SPR = new SPRMock();        
    });
    
    it('Should log page event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventAttributes: {
                title: 'Test title'
            }
        });
        
        window.SPR.should.have.property('collectCalled', true);
        
        done();      
    });
    
    it('should set custom flags when logging event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventAttributes: {
                title: 'Test title'
            },
            CustomFlags: {
                'SimpleReach.Title' : 'title',
                'SimpleReach.Url': 'url',
                'SimpleReach.Date': 'date',
                'SimpleReach.Authors': 'authors',
                'SimpleReach.Channels': 'channels',
                'SimpleReach.Tags': 'tags',
                'SimpleReach.ContentHeight': 'contentheight'
            }
        });
        
        window.SPR.should.have.property('collectCalled', true);
        window.SPR.collectEvent.should.have.property('title', 'title');
        window.SPR.collectEvent.should.have.property('url', 'url');
        window.SPR.collectEvent.should.have.property('date', 'date');
        window.SPR.collectEvent.should.have.property('authors', 'authors');
        window.SPR.collectEvent.should.have.property('channels', 'channels');
        window.SPR.collectEvent.should.have.property('tags', 'tags');
        window.SPR.collectEvent.should.have.property('content_height', 'contentheight');
        
        done(); 
    });
    
    it('should set custom flags on initialization', function(done) {
        window.__reach_config.should.have.property('title', 'init_title');
        window.__reach_config.should.have.property('url', 'init_url');
        window.__reach_config.should.have.property('date', 'init_date');
        window.__reach_config.should.have.property('authors', 'init_authors');
        window.__reach_config.should.have.property('channels', 'init_channels');
        window.__reach_config.should.have.property('tags', 'init_tags');
        window.__reach_config.should.have.property('content_height', 'init_contentheight');
        
        done(); 
    });
});

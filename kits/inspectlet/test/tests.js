describe('Inspectlet Forwarder', function () {
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
            getName: function () {
                return 'blahblah';
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
        reportService = new ReportingService();

    before(function () {
        mParticle.EventType = EventType;
        mParticle.IdentityType = IdentityType;
        mParticle.forwarder.init({}, reportService.cb, true);
        mParticle.forwarder.id = 1;
    });

    beforeEach(function () {
        window.__insp = [];
    });

    it('should report forwarding stats', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Navigation
        });

        reportService.should.have.property('id', 1);

        done();
    });

    it('should log navigation event', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Navigation
        });

        window.__insp[0][0].should.equal('virtualPage');

        done();
    });

    it('should log transaction event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Transaction
        });

        window.__insp[0][0].should.equal('tagSession');
        window.__insp[0][1].should.equal('purchase');

        done();
    });

    it('should log commerce event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce
        });

        window.__insp[0][0].should.equal('tagSession');
        window.__insp[0][1].should.equal('purchase');

        done();
    });

    it('should set user attribute', function(done) {
        mParticle.forwarder.setUserAttribute('gender', 'male');

        window.__insp[0][0].should.equal('tagSession');
        window.__insp[0][1].should.have.property('gender', 'male');

        done();
    });

    it('should set user tag', function(done) {
        mParticle.forwarder.setUserAttribute('mytag');

        window.__insp[0][0].should.equal('tagSession');
        window.__insp[0][1].should.equal('mytag');

        done();
    });

    it('should set user identity', function (done) {
        mParticle.forwarder.setUserIdentity('tbreffni@mparticle.com', mParticle.IdentityType.CustomerId);

        window.__insp[0][0].should.equal('tagSession');
        window.__insp[0][1].should.have.property('CustomerID', 'tbreffni@mparticle.com');

        done();
    });
});

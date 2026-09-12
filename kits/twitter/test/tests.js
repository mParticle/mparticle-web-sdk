describe('Twitter Forwarder', function () {

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
    reportService = new ReportingService();

    function MPMock () {
        var self          = this;
        var calledMethods = ['trackPid'];

        for (var i = 0; i < calledMethods.length; i++) {
            this[calledMethods[i] + 'Called'] = false;
        }

        this.data = null;
        this.conversion = {};

        this.conversion.trackPid = function (data) {
            setCalledAttributes(data, 'trackPidCalled');
        };

        function setCalledAttributes(data, attr) {
            self.data  = data;
            self[attr] = true;
        }
    }

    before(function () {
        mParticle.forwarder.init({
            projectId: 'nupfn'
        }, reportService.cb, true);
    });

    beforeEach(function () {
        window.twttr = new MPMock();
    });

    describe('Logging events', function() {

        it('should log page view events', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageView
            });

            window.twttr.should.have.property('trackPidCalled', true);
            done();
        });

        it('should log custom events', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageEvent
            });

            window.twttr.should.have.property('trackPidCalled', true);
            done();
        });

        it('should not log event', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.SessionStart
            });

            window.twttr.should.have.property('trackPidCalled', false);
            done();
        });
        
    });
    
});

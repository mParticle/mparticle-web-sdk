describe('Intercom Forwarder', function () {
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
    reportService = new ReportingService(),
    icMock;


    function ICMock() {
        var self = this,
            calledMethods = ['boot', 'update', 'trackEvent'];

        for (var i = 0; i < calledMethods.length; i++) {
            self[calledMethods[i] + 'Called'] = false;
        }

        this.data = null;

        this.boot       = function(data) {
            setCalledAttributes(data, 'bootCalled');
        };

        this.update     = function(data) {
            setCalledAttributes(data, 'updateCalled');
        };

        this.trackEvent = function(data) {
            setCalledAttributes(data, 'trackEventCalled');
        };


        function setCalledAttributes(data, attr) {
            self.data  = data;
            self[attr] = true;
        }

        this.Intercom = function(name, eventAttributes) {
            if(name === 'trackEvent') {
                self.trackEvent(eventAttributes);
            }
            else if(name === 'boot') {
                self.boot(eventAttributes);
            }
            else if (name === 'update') {
                self.update(eventAttributes);
            }
            else {
                return 'Incorrect name called';
            }
        };
    }

    before(function () {
        mParticle.EventType    = EventType;
        mParticle.IdentityType = IdentityType;

        mParticle.forwarder.init({
            appid: 'mn2fsx4v'
        }, reportService.cb, 1, true);
    });

    beforeEach(function () {
        icMock = new ICMock();
        window.Intercom = icMock.Intercom;
    });

    describe('Init the Intercom SDK', function() {
        var obj = {
            appid: 'mn2fsx4v'
        };

        it('should boot on init', function(done) {
            mParticle.forwarder.init(obj, reportService.cb, 1, true);

            icMock.should.have.property('bootCalled', true);
            icMock.data.should.be.instanceof(Object);

            done();
        });

        it('should boot if given a widgetId', function (done) {
            obj.widgetId = 'myWidgetId';

            mParticle.forwarder.init(obj, reportService.cb, 1, true);

            icMock.should.have.property('bootCalled', true);
            icMock.data.should.be.instanceof(Object);

            done();
        });

    });

    describe('trackEvent', function() {

        it('should log event to track event', function(done) {
            var obj = {
                EventDataType  : MessageType.PageEvent,
                EventName      : 'Test Page Event',
                EventAttributes: {
                    'Email': 'dpatel@mparticle.com'
                }
            };
            mParticle.forwarder.process(obj);

            icMock.should.have.property('trackEventCalled', true);
            icMock.should.have.property('data', 'Test Page Event');

            done();
        });

        it('should not log event without an event name', function(done) {
            mParticle.forwarder.process({
                EventDataType : MessageType.PageEvent
            });

            icMock.should.have.property('trackEventCalled', false);
            icMock.should.have.property('data', null);

            done();
        });

    });

    describe('setUserAttribute events', function() {

        it('should update with user details using setUserAttribute', function(done) {
            mParticle.forwarder.setUserAttribute({'name': 'updateName'});

            icMock.should.have.property('updateCalled', true);
            icMock.data.should.be.instanceof(Object);

            done();
        });

        it('should update without user details using setUserAttribute', function(done) {
            mParticle.forwarder.setUserAttribute();

            icMock.should.have.property('updateCalled', true);
            Should(icMock.data).eql({undefined: undefined});

            done();
        });
    });


    describe('setUserIdentity events', function() {

        it('should update with user email using setUserIdentity', function(done) {
            mParticle.forwarder.setUserIdentity('dpatel@mparticle.com', mParticle.IdentityType.Email);

            icMock.should.have.property('updateCalled', true);
            icMock.data.should.be.instanceof(Object);
            Should(icMock.data).eql({'email': 'dpatel@mparticle.com'});

            done();
        });

        it('should update with user id using setUserIdentity', function(done) {
            mParticle.forwarder.setUserIdentity('1234567', mParticle.IdentityType.CustomerId);

            icMock.should.have.property('updateCalled', true);
            icMock.data.should.be.instanceof(Object);
            Should(icMock.data).eql({'user_id': '1234567'});

            done();
        });

        it('should not update without correct IdentityType', function(done) {
            mParticle.forwarder.setUserIdentity('test', mParticle.IdentityType.Facebook);

            icMock.should.have.property('updateCalled', false);
            icMock.should.have.property('data', null);

            done();
        });

    });

});

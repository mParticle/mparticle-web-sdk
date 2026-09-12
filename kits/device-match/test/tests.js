describe('Device Match Forwarder', function() {
    var ReportingService = function() {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function(forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function() {
                self.id = null;
                self.event = null;
            };
        },
        reportService = new ReportingService();

    beforeEach(function() {
        reportService.reset();
        mParticle.forwarder.init(
            {
                partnerId: 123456,
            },
            reportService.cb,
            false
        );
    });

    describe('Init the Device Match forwarder', function() {
        it('should init', function(done) {
            var noscript = document.getElementsByTagName('noscript')[0];
            noscript.should.not.be.undefined();

            var img = document.getElementsByTagName('img')[0];
            var imgDisplay = img.style.display;
            var imgHeight = img.getAttribute('height');
            var imgWidth = img.getAttribute('width');

            imgDisplay.should.be.equal('none');
            imgHeight.should.be.equal('1');
            imgWidth.should.be.equal('1');

            done();
        });
    });
});

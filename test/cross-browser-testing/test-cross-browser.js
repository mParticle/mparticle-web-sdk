describe('test browserstack integration', function() {
    it('should pass', function() {
        true.should.equal(true);
    });
    it('should not pass on older browsers', function() {
        'foo-bar'.replaceAll('o', 0).should.equal('f00-bar');
    });
});
import TestsCore from './tests-core';

var apiKey = TestsCore.apiKey,
    MPConfig = TestsCore.MPConfig,
    forwarderDefaultConfiguration = TestsCore.forwarderDefaultConfiguration,
    MockForwarder = TestsCore.MockForwarder;

describe('mParticleUser', function() {
    it('should call forwarder onUserIdentified method with a filtered user identity list', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userIdentityFilters = [4]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        mParticle.Identity.login(userIdentityRequest);

        window.MockForwarder1.instance.onUserIdentifiedUser
            .getUserIdentities()
            .userIdentities.should.not.have.property('google');
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getUserIdentities()
            .userIdentities.should.have.property('customerid', 'id1');
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getUserIdentities()
            .userIdentities.should.have.property('other', 'id2');

        done();
    });

    it('should call forwarder onUserIdentified method with a filtered user attributes list', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        mParticle.Identity.login(userIdentityRequest);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('color', 'blue');
        mParticle.Identity.login(userIdentityRequest);
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getAllUserAttributes()
            .should.not.have.property('gender');
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getAllUserAttributes()
            .should.have.property('color', 'blue');

        done();
    });

    it('should call forwarder onIdentifyComplete/onLoginComplete/onLogoutComplete/onModifyComplete method with the proper identity method passed through', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        mParticle.Identity.getCurrentUser().setUserAttribute('color', 'blue');
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.login(userIdentityRequest);
        window.MockForwarder1.instance.onLoginCompleteCalled.should.equal(true);
        window.MockForwarder1.instance.onLoginCompleteUser
            .getAllUserAttributes()
            .should.not.have.property('gender');
        window.MockForwarder1.instance.onLoginCompleteUser
            .getAllUserAttributes()
            .should.have.property('color', 'blue');

        mParticle.Identity.logout(userIdentityRequest);
        window.MockForwarder1.instance.onLogoutCompleteCalled.should.equal(
            true
        );
        window.MockForwarder1.instance.onLogoutCompleteUser
            .getAllUserAttributes()
            .should.not.have.property('gender');
        window.MockForwarder1.instance.onLogoutCompleteUser
            .getAllUserAttributes()
            .should.have.property('color', 'blue');

        mParticle.Identity.modify(userIdentityRequest);
        window.MockForwarder1.instance.onModifyCompleteCalled.should.equal(
            true
        );
        window.MockForwarder1.instance.onModifyCompleteUser
            .getAllUserAttributes()
            .should.not.have.property('gender');
        window.MockForwarder1.instance.onModifyCompleteUser
            .getAllUserAttributes()
            .should.have.property('color', 'blue');

        mParticle.Identity.identify(userIdentityRequest);
        window.MockForwarder1.instance.onIdentifyCompleteCalled.should.equal(
            true
        );
        window.MockForwarder1.instance.onIdentifyCompleteUser
            .getAllUserAttributes()
            .should.not.have.property('gender');
        window.MockForwarder1.instance.onIdentifyCompleteUser
            .getAllUserAttributes()
            .should.have.property('color', 'blue');

        done();
    });
});

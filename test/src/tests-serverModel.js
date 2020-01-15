import Types from '../../src/types';

describe('Server Model', function() {
    it('Should convert complete consent object', function(done) {
        var consentState = mParticle
            .getInstance()
            ._Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo',
            mParticle
                .getInstance()
                ._Consent.createPrivacyConsent(
                    true,
                    10,
                    'foo document',
                    'foo location',
                    'foo hardware id'
                )
        );
        var consent = mParticle
            .getInstance()
            ._ServerModel.convertToConsentStateDTO(consentState);
        consent.should.be.ok();

        consent.should.have.property('gdpr');
        consent.gdpr.should.have.property('foo');
        consent.gdpr.foo.should.have.property('c', true);
        consent.gdpr.foo.should.have.property('ts', 10);
        consent.gdpr.foo.should.have.property('d', 'foo document');
        consent.gdpr.foo.should.have.property('l', 'foo location');
        consent.gdpr.foo.should.have.property('h', 'foo hardware id');
        done();
    });

    it('Should not append user info when no user', function(done) {
        mParticle.getInstance()._Store.should.be.ok;

        let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(
                Types.MessageType.PageEvent,
                'foo page',
                { 'foo-attr': 'foo-val' },
                Types.EventType.Navigation,
                { 'foo-flag': 'foo-flag-val' }
            );

        sdkEvent.should.be.ok;
        Should(sdkEvent.UserIdentities).not.be.ok;
        Should(sdkEvent.UserAttributes).not.be.ok;
        Should(sdkEvent.ConsentState).not.be.ok;
        done();
    });

    it('Should append all user info when user is present', function(done) {
        mParticle.getInstance()._Store.should.be.ok;
        var consentState = mParticle
            .getInstance()
            ._Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo',
            mParticle
                .getInstance()
                ._Consent.createPrivacyConsent(
                    true,
                    10,
                    'foo document',
                    'foo location',
                    'foo hardware id'
                )
        );

        window.mParticle.getInstance().Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {
                        userIdentities: {
                            customerid: '1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4',
                        },
                    };
                },
                getAllUserAttributes: () => {
                    return {
                        'foo-user-attr': 'foo-attr-value',
                        'foo-user-attr-list': ['item1', 'item2'],
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return consentState;
                },
            };
        };
        let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(
                Types.MessageType.PageEvent,
                'foo page',
                { 'foo-attr': 'foo-val' },
                Types.EventType.Navigation,
                { 'foo-flag': 'foo-flag-val' }
            );

        sdkEvent.should.be.ok;
        sdkEvent.UserIdentities.should.be.ok;
        sdkEvent.MPID.should.be.ok;
        sdkEvent.UserAttributes.should.be.ok;
        sdkEvent.ConsentState.should.be.ok;

        done();
    });

    it('Should append identities when user present', function(done) {
        let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(
                Types.MessageType.PageEvent,
                'foo page',
                { 'foo-attr': 'foo-val' },
                Types.EventType.Navigation,
                { 'foo-flag': 'foo-flag-val' }
            );

        sdkEvent.should.be.ok;
        Should(sdkEvent.UserIdentities).not.be.ok;

        var user = {
            getUserIdentities: () => {
                return {
                    userIdentities: {
                        customerid: '1234567',
                        email: 'foo-email',
                        other: 'foo-other',
                        other2: 'foo-other2',
                        other3: 'foo-other3',
                        other4: 'foo-other4',
                        not_a_valid_id: 'foo',
                    },
                };
            },
            getAllUserAttributes: () => {
                return null;
            },
            getMPID: () => {
                return null;
            },
            getConsentState: () => {
                return null;
            },
        };

        var identityMapping = {};
        identityMapping[Types.IdentityType.CustomerId] = '1234567';
        identityMapping[Types.IdentityType.Email] = 'foo-email';
        identityMapping[Types.IdentityType.Other] = 'foo-other';
        identityMapping[Types.IdentityType.Other2] = 'foo-other2';
        identityMapping[Types.IdentityType.Other3] = 'foo-other3';
        identityMapping[Types.IdentityType.Other4] = 'foo-other4';

        mParticle.getInstance()._ServerModel.appendUserInfo(user, sdkEvent);
        sdkEvent.UserIdentities.should.be.ok;
        sdkEvent.UserIdentities.length.should.equal(6);

        sdkEvent.UserIdentities.forEach(function(id) {
            var type = id.Type;
            var value = id.Identity;
            identityMapping[type].should.equal(value);
        });

        done();
    });

    it('Should append user attributes when user present', function(done) {
        let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(
                Types.MessageType.PageEvent,
                'foo page',
                { 'foo-attr': 'foo-val' },
                Types.EventType.Navigation,
                { 'foo-flag': 'foo-flag-val' }
            );

        sdkEvent.should.be.ok;
        Should(sdkEvent.UserAttributes).not.be.ok;
        var attributes = { foo: 'bar', 'foo-arr': ['bar1', 'bar2'] };
        var user = {
            getUserIdentities: () => {
                return { userIdentites: {} };
            },
            getAllUserAttributes: () => {
                return attributes;
            },
            getMPID: () => {
                return null;
            },
            getConsentState: () => {
                return null;
            },
        };

        mParticle.getInstance()._ServerModel.appendUserInfo(user, sdkEvent);
        sdkEvent.UserAttributes.should.be.ok;
        sdkEvent.UserAttributes.should.deepEqual(attributes);

        done();
    });

    it('Should append mpid when user present', function(done) {
        let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(
                Types.MessageType.PageEvent,
                'foo page',
                { 'foo-attr': 'foo-val' },
                Types.EventType.Navigation,
                { 'foo-flag': 'foo-flag-val' }
            );

        sdkEvent.should.be.ok;
        Should(sdkEvent.MPID).not.be.ok;

        var user = {
            getUserIdentities: () => {
                return { userIdentites: {} };
            },
            getAllUserAttributes: () => {
                return null;
            },
            getMPID: () => {
                return '98765';
            },
            getConsentState: () => {
                return null;
            },
        };
        mParticle.getInstance()._ServerModel.appendUserInfo(user, sdkEvent);
        sdkEvent.MPID.should.be.ok;
        sdkEvent.MPID.should.equal('98765');
        done();
    });
});

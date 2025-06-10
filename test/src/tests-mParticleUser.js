import Utils from './config/utils';
import { urls, apiKey, MPConfig } from './config/constants';
import fetchMock from 'fetch-mock/esm/client';

const { waitForCondition, fetchMockSuccess } = Utils;

// https://go.mparticle.com/work/SQDSDKS-6849
const hasIdentifyReturned = () => {
    return mParticle.Identity.getCurrentUser()?.getMPID() === 'identifyMPID';
};
const forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    MockForwarder = Utils.MockForwarder;

// https://go.mparticle.com/work/SQDSDKS-6508
describe('mParticleUser', function () {
    beforeEach(function () {
        fetchMockSuccess(urls.identify, {
            mpid: 'identifyMPID',
            is_logged_in: false,
        });

        fetchMockSuccess(urls.login, {
            mpid: 'loginMPID',
            is_logged_in: true,
        });

        fetchMockSuccess(urls.logout, {
            mpid: 'logoutMPID',
            is_logged_in: false,
        });

        fetchMockSuccess(
            'https://jssdks.mparticle.com/v1/JS/test_key/Forwarding',
        );
        fetchMock.post(urls.events, 200);
    });

    afterEach(function () {
        fetchMock.restore();
    });

    it('should call forwarder onUserIdentified method with a filtered user identity list', function (done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userIdentityFilters = [4]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        waitForCondition(hasIdentifyReturned).then(() => {
            const userIdentityRequest = {
                userIdentities: {
                    google: 'test',
                    customerid: 'id1',
                    other: 'id2',
                },
            };
            mParticle.Identity.login(userIdentityRequest);
            waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'loginMPID'
                );
            }).then(() => {
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
        });
    });

    it('should call forwarder onUserIdentified method with a filtered user attributes list', function (done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [mParticle.generateHash('gender')];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            const userIdentityRequest = {
                userIdentities: {
                    google: 'test',
                    customerid: 'id1',
                    other: 'id2',
                },
            };

            mParticle.Identity.login(userIdentityRequest);
            waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'loginMPID'
                );
            }).then(() => {});
            mParticle.Identity.getCurrentUser().setUserAttribute(
                'gender',
                'male',
            );
            mParticle.Identity.getCurrentUser().setUserAttribute(
                'color',
                'blue',
            );
            mParticle.Identity.login(userIdentityRequest);
            window.MockForwarder1.instance.onUserIdentifiedUser
                .getAllUserAttributes()
                .should.not.have.property('gender');
            window.MockForwarder1.instance.onUserIdentifiedUser
                .getAllUserAttributes()
                .should.have.property('color', 'blue');

            done();
        });
    });

    it('should call forwarder onIdentifyComplete', function (done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [mParticle.generateHash('gender')]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            window.MockForwarder1.instance.onIdentifyCompleteCalled.should.equal(
                true,
            );
            done();
        });
    });

    it('should call forwarder onLoginComplete', function (done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [mParticle.generateHash('gender')]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            const userIdentityRequest = {
                userIdentities: {
                    google: 'test',
                    customerid: 'id1',
                    other: 'id2',
                },
            };

            mParticle.Identity.login(userIdentityRequest);
            waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'loginMPID'
                );
            }).then(() => {
                window.MockForwarder1.instance.onLoginCompleteCalled.should.equal(
                    true,
                );
                done();
            });
        });
    });

    it('should call forwarder onLogoutComplete', function (done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [mParticle.generateHash('gender')]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            const userIdentityRequest = {
                userIdentities: {
                    google: 'test',
                    customerid: 'id1',
                    other: 'id2',
                },
            };

            mParticle.Identity.logout(userIdentityRequest);
            waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'logoutMPID'
                );
            }).then(() => {
                window.MockForwarder1.instance.onLogoutCompleteCalled.should.equal(
                    true,
                );
                done();
            });
        });
    });

    it('should call forwarder onModifyComplete method with the proper identity method passed through', function (done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [mParticle.generateHash('gender')]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            const userIdentityRequest = {
                userIdentities: {
                    google: 'test',
                    customerid: 'id1',
                    other: 'id2',
                },
            };

            fetchMockSuccess(
                'https://identity.mparticle.com/v1/identifyMPID/modify',
                {
                    mpid: 'modifyMPID',
                    is_logged_in: false,
                },
            );

            mParticle.Identity.modify(userIdentityRequest);
            waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'modifyMPID'
                );
            }).then(() => {
                window.MockForwarder1.instance.onModifyCompleteCalled.should.equal(
                    true,
                );
                done();
            });
        });
    });
});

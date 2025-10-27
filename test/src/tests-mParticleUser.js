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
describe.only('mParticleUser', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true;
        
        fetchMockSuccess(urls.identify, {
            mpid: 'identifyMPID', is_logged_in: false
        });

        fetchMockSuccess(urls.login, {
            mpid: 'loginMPID', is_logged_in: true
        });

        fetchMockSuccess(urls.logout, {
            mpid: 'logoutMPID', is_logged_in: false
        });

        fetchMockSuccess('https://jssdks.mparticle.com/v1/JS/test_key/Forwarding');
        fetchMock.post(urls.events, 200);
    });

    afterEach(function() {
        fetchMock.restore();
    });

    it('should call forwarder onUserIdentified method with a filtered user identity list', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userIdentityFilters = [4]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        
        const userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };
        mParticle.Identity.login(userIdentityRequest);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'loginMPID'
            );
        });
        
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getUserIdentities()
            .userIdentities.should.not.have.property('google');
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getUserIdentities()
            .userIdentities.should.have.property('customerid', 'id1');
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getUserIdentities()
            .userIdentities.should.have.property('other', 'id2');
    });

    it('should call forwarder onUserIdentified method with a filtered user attributes list', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        
        const userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        mParticle.Identity.login(userIdentityRequest);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'loginMPID'
            );
        });
        
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('color', 'blue');
        mParticle.Identity.login(userIdentityRequest);
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getAllUserAttributes()
            .should.not.have.property('gender');
        window.MockForwarder1.instance.onUserIdentifiedUser
            .getAllUserAttributes()
            .should.have.property('color', 'blue');
    });

    it('should call forwarder onIdentifyComplete', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ]),
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        
        window.MockForwarder1.instance.onIdentifyCompleteCalled.should.equal(true);
    });

    it('should call forwarder onLoginComplete', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        
        const userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        mParticle.Identity.login(userIdentityRequest);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'loginMPID'
            );
        });
        
        window.MockForwarder1.instance.onLoginCompleteCalled.should.equal(true);
    });

    it('should call forwarder onLogoutComplete', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ]),
            window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        
        const userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        mParticle.Identity.logout(userIdentityRequest);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'logoutMPID'
            );
        });
        
        window.MockForwarder1.instance.onLogoutCompleteCalled.should.equal(true);
    });

    it('should call forwarder onModifyComplete method with the proper identity method passed through', async () => {
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        (config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
        ]),
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        
        const userIdentityRequest = {
            userIdentities: {
                google: 'test',
                customerid: 'id1',
                other: 'id2',
            },
        };

        fetchMockSuccess('https://identity.mparticle.com/v1/identifyMPID/modify', {
            mpid: 'modifyMPID', is_logged_in: false
        });

        mParticle.Identity.modify(userIdentityRequest);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() ===
                'modifyMPID'
            );
        });
        
        window.MockForwarder1.instance.onModifyCompleteCalled.should.equal(true);
    });
});
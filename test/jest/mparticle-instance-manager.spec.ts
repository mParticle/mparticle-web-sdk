import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
import { EventTimingNames } from '../../src/eventTimingService';

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;;

describe('mParticle instance manager', () => {

    beforeEach(() => {
        // Reset instances before each test
        if (mParticle._instances) {
            mParticle._instances = {};
        }
        
        fetchMock.restore();
        fetchMock.get(
            'https://jssdkcdns.mparticle.com/JS/v2/apiKey1/config?env=0',
            {
                status: 200,
                body: JSON.stringify({ workspaceToken: 'wtTest1' }),
            }
        );

        console.warn = () => {};
        console.error = () => {};
        window.mParticle.config = { };
    });

    afterEach(() => {
        fetchMock.restore();
    });

    it('sets sdkStart event timing', async () => {
        mParticle.init('apiKey', {});

        const timings = mParticle.getAllTimings();

        expect(timings).to.have.keys(EventTimingNames.SdkStart);
        expect(timings[EventTimingNames.SdkStart]).to.be.a('number');
    });

    it('should set IsSelfHosted to false when config is picked from window.mParticle.config', () => {
        mParticle.init('dummyApiKey', { requestConfig: false });

        expect(mParticle.IsSelfHosted()).to.equal(false);
    });

    it('should set IsSelfHosted to true when config is not passed and window.mParticle.config is not defined', () => {
        mParticle.init('dummyApiKey', {});
        
        expect(mParticle.IsSelfHosted()).to.equal(true);
    });
});

import { expect } from "chai";
import { SDKInitConfig } from "../../src/sdkRuntimeModels";
import Store, { IStore } from "../../src/store";
import { MPConfig, apiKey } from './config';

describe.only('Store', ()=> {
    beforeEach(function() {
        window.mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        window.mParticle._resetForTests(MPConfig);
    });

	it('should just work', () => {
        let sampleConfig = {
            appName: 'Foo'
        } as SDKInitConfig;
        const store: IStore = new Store(sampleConfig, window.mParticle);

        expect(store).to.be.ok;
        expect(store.isEnabled).to.eq(true);
        expect(store.SDKConfig.appName).to.eq('Foo');

        
    });

});
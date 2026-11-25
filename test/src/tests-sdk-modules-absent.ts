import { expect } from 'chai';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import Utils from './config/utils';
import { IKitConfigs } from '../../src/configAPIClient';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import type { ISDKModuleRegistry } from '../../src/sdkModuleTypes';

const { waitForCondition, fetchMockSuccess } = Utils;

// Runs against the lean SDK alone (npm run test:lean): no module file on the page.
describe('the lean SDK without the button tracking module', () => {
    const roktConfig = { name: 'Rokt', moduleId: 181 } as IKitConfigs;
    const hasIdentifyReturned = () => window.mParticle.Identity.getCurrentUser()?.getMPID() === testMPID;
    let warnings: string[];
    let reports: any[];

    const init = async (flags: Record<string, string>) => {
        window.mParticle.init(apiKey, {
            ...MPConfig,
            flags,
            kitConfigs: [roktConfig],
            logLevel: 'warning',
            logger: { warning: (message: string) => warnings.push(message) },
        } as SDKInitConfig);
        await waitForCondition(hasIdentifyReturned);
        return window.mParticle.getInstance();
    };

    beforeEach(() => {
        warnings = [];
        reports = [];
        fetchMockSuccess(urls.identify, { mpid: testMPID, is_logged_in: false });
        window.mParticle._resetForTests(MPConfig);
    });

    afterEach(() => {
        fetchMock.restore();
    });

    it('turns both tracking flags off, with one warning and one report per init', async () => {
        const instance = await init({ autoButtonTracking: 'True', autoLinkTracking: 'True' });
        window.mParticle._registerErrorReportingService({ report: (error: any) => reports.push(error) });
        await init({ autoButtonTracking: 'True', autoLinkTracking: 'True' });

        const { flags } = instance._Store.SDKConfig;
        expect(flags.autoButtonTracking).to.equal(false);
        expect(flags.autoLinkTracking).to.equal(false);
        expect(instance._ButtonTracker).to.equal(undefined);
        expect(instance._RoktManager.isCheckoutIntentLive()).to.equal(false);
        expect(warnings.filter(warning => warning.indexOf('Button tracking off') === 0)).to.deep.equal([
            'Button tracking off: no module',
            'Button tracking off: no module',
        ]);
        expect(reports.map(report => report.code)).to.deep.equal(['BUTTON_TRACKING_OFF', 'BUTTON_TRACKING_OFF']);
    });

    it('stays silent with both tracking flags off', async () => {
        const instance = await init({});

        expect(instance._ButtonTracker).to.equal(undefined);
        expect(warnings.filter(warning => warning.indexOf('Button tracking off') === 0)).to.deep.equal([]);
    });

    it('still opts out', async () => {
        await init({ autoButtonTracking: 'True' });
        window.mParticle.setOptOut(true);

        expect(window.mParticle.getInstance()._Store.isEnabled).to.equal(false);
    });

    it('uses a module registered later from the next init', async () => {
        await init({ autoButtonTracking: 'True' });
        expect(window.mParticle.getInstance()._ButtonTracker).to.equal(undefined);

        // The full SDK's build of the module is the closest stand-in for the module file.
        ((window.mParticle as unknown) as ISDKModuleRegistry)._registerModule('buttonTracking', {
            version: window.mParticle.getVersion(),
            createTracker: () => ({ init: () => undefined, teardown: () => undefined, clearPending: () => undefined }),
            reset: () => undefined,
        } as any);
        const instance = await init({ autoButtonTracking: 'True' });

        expect(instance._ButtonTracker).to.not.equal(undefined);
    });
});

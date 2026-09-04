import Events from '../../src/events';
import { IEvents } from '../../src/events.interfaces';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import {
    IQueryParamConfig,
    parseQueryParamConfig,
} from '../../src/pageViewTracker';
import { MessageType } from '../../src/types';

// _Events.logPageView is the auto page view for the LANDING page — the SPA
// navigations that follow it come from PageViewTracker instead. The two emitters
// share only the pure helpers, so the allowlist needs pinning on both or one of
// them can silently stop attaching params.
describe('Events#logPageView', () => {
    let events: IEvents;
    let createEventObject: jest.Mock;
    let originalUrl: string;
    let configuredQueryParams: IQueryParamConfig | undefined;

    const loggedPageView = (): any => createEventObject.mock.calls[0][0];

    beforeEach(() => {
        originalUrl = window.location.pathname + window.location.search;

        configuredQueryParams = undefined;
        createEventObject = jest.fn(event => event);

        const mpInstance = ({
            Logger: { verbose: jest.fn() },
            _Helpers: {
                canLog: () => true,
                // No configured additions; individual tests override this.
                getFeatureFlag: () => configuredQueryParams,
            },
            _ServerModel: { createEventObject },
            _APIClient: { sendEventToServer: jest.fn() },
        } as unknown) as IMParticleWebSDKInstance;

        events = {} as IEvents;
        Events.call(events, mpInstance);
    });

    afterEach(() => {
        window.history.replaceState({}, '', originalUrl);
    });

    it('should log a PageView carrying hostname and title', () => {
        window.document.title = 'Landing';

        events.logPageView();

        expect(loggedPageView()).toEqual({
            messageType: MessageType.PageView,
            name: 'PageView',
            eventType: 0,
            data: { hostname: 'localhost', title: 'Landing' },
        });
    });

    it('should attach the allowlisted query params as flat attributes', () => {
        window.document.title = 'Landing';
        window.history.replaceState(
            {},
            '',
            '/?page=2&q=boots&ref=google'
        );

        events.logPageView();

        expect(loggedPageView().data).toEqual({
            hostname: 'localhost',
            title: 'Landing',
            page: '2',
            q: 'boots',
            ref: 'google',
        });
    });

    it('should attach a configured additional query param', () => {
        // processFlags parses the customer's string once, at the config boundary,
        // and the flag holds the whole result — so that is what logPageView reads.
        configuredQueryParams = parseQueryParamConfig('promo_code');
        window.history.replaceState({}, '', '/?promo_code=SAVE20&ref=g');

        events.logPageView();

        expect(loggedPageView().data).toMatchObject({
            ref: 'g',
            promo_code: 'SAVE20',
        });
    });

    it('should ignore the param when nothing is configured', () => {
        window.history.replaceState({}, '', '/?promo_code=SAVE20');

        events.logPageView();

        expect(loggedPageView().data.promo_code).toBeUndefined();
    });

    // getFeatureFlag returns null for an absent flag, which is the common case, and
    // a default parameter would not catch it. A throw here lands inside logPageView
    // and takes the landing page view with it.
    it('should not throw when the flag is absent', () => {
        configuredQueryParams = null;
        window.history.replaceState({}, '', '/?ref=google');

        expect(() => events.logPageView()).not.toThrow();
        expect(loggedPageView().data.ref).toBe('google');
    });

    // The allowlist is the point: a partner URL carrying an email or an order id
    // must not leak into the event stream just because nobody excluded it.
    it('should drop params that are not allowlisted', () => {
        window.history.replaceState(
            {},
            '',
            '/?ref=google&email=someone@example.com&order_id=42'
        );

        events.logPageView();

        const { data } = loggedPageView();
        expect(data.ref).toBe('google');
        expect(data).not.toHaveProperty('email');
        expect(data).not.toHaveProperty('order_id');
    });
});

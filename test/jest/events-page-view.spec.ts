import Events from '../../src/events';
import { IEvents } from '../../src/events.interfaces';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import {
    IQueryParamAllowlist,
    parseQueryParamAllowlist,
} from '../../src/pageViewTracker';
import { MessageType } from '../../src/types';

// _Events.logPageView is the auto page view for the LANDING page — the SPA
// navigations that follow it come from PageViewTracker instead, and the two share
// only the pure helpers, so the allowlist needs its own coverage here.
describe('Events#logPageView', () => {
    let events: IEvents;
    let createEventObject: jest.Mock;
    let originalUrl: string;
    let configuredQueryParams: IQueryParamAllowlist | undefined;

    const loggedPageView = (): any => createEventObject.mock.calls[0][0];

    beforeEach(() => {
        originalUrl = window.location.pathname + window.location.search;

        configuredQueryParams = undefined;
        createEventObject = jest.fn(event => event);

        const mpInstance = ({
            Logger: { verbose: jest.fn() },
            _Helpers: {
                canLog: () => true,
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

    // Spelled out rather than imported, so renaming the constant fails here
    // instead of silently changing a key consumers already query on.
    it('should stamp is_auto_page_view when told the view is automatic', () => {
        window.document.title = 'Landing';

        events.logPageView({ isAutoPageView: true });

        expect(loggedPageView().data).toEqual({
            hostname: 'localhost',
            title: 'Landing',
            is_auto_page_view: true,
        });
    });

    // Absent, not false: only the automatic emitters add the attribute, so a
    // caller that passes nothing produces the same event as before.
    it('should omit is_auto_page_view when not told', () => {
        events.logPageView();

        expect(loggedPageView().data).not.toHaveProperty('is_auto_page_view');
    });

    it('should attach a configured additional query param', () => {
        configuredQueryParams = parseQueryParamAllowlist('promo_code');
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

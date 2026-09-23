import Events from '../../src/events';
import { IEvents } from '../../src/events.interfaces';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { MessageType } from '../../src/types';

// _Events.logPageView is the auto page view for the LANDING page — the SPA
// navigations that follow it come from PageViewTracker instead. It is therefore
// the emitter that carries campaign attribution, since utm_*/gclid live on the
// entry URL, and it needs its own coverage for the query-param allowlist.
describe('Events#logPageView', () => {
    let events: IEvents;
    let createEventObject: jest.Mock;
    let originalUrl: string;

    const loggedPageView = (): any => createEventObject.mock.calls[0][0];

    beforeEach(() => {
        originalUrl = window.location.pathname + window.location.search;

        createEventObject = jest.fn(event => event);

        const mpInstance = ({
            Logger: { verbose: jest.fn() },
            _Helpers: { canLog: () => true },
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
            '/?utm_source=google&utm_medium=cpc&gclid=Cj0KC'
        );

        events.logPageView();

        expect(loggedPageView().data).toEqual({
            hostname: 'localhost',
            title: 'Landing',
            utm_source: 'google',
            utm_medium: 'cpc',
            gclid: 'Cj0KC',
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

    // The allowlist is the point: a partner URL carrying an email or an order id
    // must not leak into the event stream just because nobody excluded it.
    it('should drop params that are not allowlisted', () => {
        window.history.replaceState(
            {},
            '',
            '/?utm_source=google&email=someone@example.com&order_id=42'
        );

        events.logPageView();

        const { data } = loggedPageView();
        expect(data.utm_source).toBe('google');
        expect(data).not.toHaveProperty('email');
        expect(data).not.toHaveProperty('order_id');
    });
});

import Events from '../../src/events';
import { IEvents } from '../../src/events.interfaces';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { MessageType } from '../../src/types';

// _Events.logPageView is the auto page view for the LANDING page — the SPA
// navigations that follow it come from PageViewTracker instead. It is therefore
// the emitter that carries campaign attribution, since utm_*/gclid live on the
// entry URL, and it needs its own coverage for the query-param capture.
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

    it('should attach campaign query params as flat attributes', () => {
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

    it('should attach arbitrary query params and preserve core fields', () => {
        window.document.title = 'Landing';
        window.history.replaceState(
            {},
            '',
            '/?utm_source=google&custom_filter=blue&order_id=42&empty=&hostname=spoofed&title=spoofed'
        );

        events.logPageView();

        expect(loggedPageView().data).toEqual({
            hostname: 'localhost',
            title: 'Landing',
            utm_source: 'google',
            custom_filter: 'blue',
            order_id: '42',
            empty: '',
        });
    });
});

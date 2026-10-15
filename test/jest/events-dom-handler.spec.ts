import Events from '../../src/events';
import { IEvents } from '../../src/events.interfaces';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { EventType } from '../../src/types';

describe('Events#addEventHandler', () => {
    const navigationDelay = 300;
    let events: IEvents;
    let logEvent: jest.Mock;
    let originalUrl: string;

    const trackedName = (element: { id: string }): string =>
        'Tracked ' + element.id;
    const trackedData = (element: { id: string }) => ({
        trackedId: element.id,
    });
    const loggedEvents = () =>
        logEvent.mock.calls.map(([event]) => ({
            name: event.name,
            data: event.data,
        }));
    const loggedFor = (id: string) => ({
        name: 'Tracked ' + id,
        data: { trackedId: id },
    });

    beforeEach(() => {
        jest.useFakeTimers();
        originalUrl = window.location.pathname + window.location.search;

        const mpInstance = ({
            Logger: { verbose: jest.fn(), error: jest.fn() },
            _Store: { SDKConfig: { timeout: navigationDelay } },
        } as unknown) as IMParticleWebSDKInstance;

        events = {} as IEvents;
        Events.call(events, mpInstance);
        logEvent = jest.fn();
        events.logEvent = logEvent;
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        document.body.innerHTML = '';
        window.history.replaceState({}, '', originalUrl);
    });

    it('navigates to and logs the clicked link when one selector matches two links', () => {
        document.body.innerHTML =
            '<a id="first" class="tracked" href="#first"></a>' +
            '<a id="second" class="tracked" href="#second"></a>';
        const clickIsDeferred = (id: string): boolean =>
            !document
                .getElementById(id)
                .dispatchEvent(
                    new MouseEvent('click', { bubbles: true, cancelable: true })
                );

        events.addEventHandler(
            'click',
            '.tracked',
            trackedName,
            trackedData,
            EventType.Navigation
        );

        expect(clickIsDeferred('first'), 'first click deferred').toBe(true);
        jest.advanceTimersByTime(navigationDelay);
        expect(window.location.hash, 'after first click').toBe('#first');
        expect(loggedEvents()).toEqual([loggedFor('first')]);

        expect(clickIsDeferred('second'), 'second click deferred').toBe(true);
        jest.advanceTimersByTime(navigationDelay);
        expect(window.location.hash, 'after second click').toBe('#second');
        expect(loggedEvents()).toEqual([
            loggedFor('first'),
            loggedFor('second'),
        ]);
    });

    it.each([
        {
            binding: 'attachEvent',
            legacyForm: (id: string) => {
                let submitListener: EventListener = null;
                return {
                    id,
                    submit: jest.fn(),
                    attachEvent(type: string, listener: EventListener) {
                        if (type === 'onsubmit') {
                            submitListener = listener;
                        }
                    },
                    dispatchSubmit: (event: Event) => submitListener(event),
                };
            },
        },
        {
            binding: 'an onsubmit property',
            legacyForm: (id: string) => {
                const form = {
                    id,
                    submit: jest.fn(),
                    onsubmit: null as EventListener,
                    dispatchSubmit: (event: Event) => form.onsubmit(event),
                };
                return form;
            },
        },
    ])(
        'submits and logs the submitted form when two forms are bound through $binding',
        ({ legacyForm }) => {
            const first = legacyForm('first');
            const second = legacyForm('second');
            jest.spyOn(document, 'querySelectorAll').mockReturnValue(
                ([first, second] as unknown) as NodeListOf<Element>
            );

            events.addEventHandler(
                'submit',
                '.tracked',
                trackedName,
                trackedData,
                EventType.Other
            );

            const firstSubmit = {} as Event;
            first.dispatchSubmit(firstSubmit);
            jest.advanceTimersByTime(navigationDelay);
            expect(firstSubmit.returnValue, 'first submit deferred').toBe(
                false
            );
            expect(first.submit, 'first form').toHaveBeenCalledTimes(1);
            expect(second.submit, 'second form').not.toHaveBeenCalled();
            expect(loggedEvents()).toEqual([loggedFor('first')]);

            second.dispatchSubmit({} as Event);
            jest.advanceTimersByTime(navigationDelay);
            expect(first.submit, 'first form').toHaveBeenCalledTimes(1);
            expect(second.submit, 'second form').toHaveBeenCalledTimes(1);
            expect(loggedEvents()).toEqual([
                loggedFor('first'),
                loggedFor('second'),
            ]);
        }
    );
});

import Mediator from '../../../src/NextGen/Mediator';
import { IEventLogging } from '../../../src/NextGen/EventLogging';
import { IStore } from '../../../src/store';
import { Logger } from '@mparticle/web-sdk';
import { MParticleWebSDK } from '../../../src/sdkRuntimeModels';
import { MessageType, EventTypeEnum } from '../../../src/types.interfaces';
import APIClient, { IAPIClient } from '../../../src/apiClient';

describe('Next Gen', () => {
    describe('Mediator', () => {
        describe('constructor', () => {
            it('initializes with event logging', () => {
                const logEventSpy = jest.fn();
                const eventLogger: IEventLogging = {
                    logEvent: logEventSpy,
                };

                const mockStore: IStore = ({} as unknown) as IStore;
                const mockLogger: Logger = ({} as unknown) as Logger;
                const mockMPInstance: MParticleWebSDK = ({} as unknown) as MParticleWebSDK;
                const mediator = new Mediator(
                    eventLogger,
                    mockStore,
                    mockLogger,
                    mockMPInstance
                );

                expect(mediator.eventLogging).toBeDefined();
                expect(mediator.eventLogging.logEvent).toBeDefined();
            });
        });

        describe('#eventLogging', () => {
            it('should send events to eventApiClient', () => {
                const logEventSpy = jest.fn();
                const eventLogger: IEventLogging = {
                    logEvent: logEventSpy,
                };

                const mockMPInstance: MParticleWebSDK = ({} as unknown) as MParticleWebSDK;

                const mockEventApiClient: IAPIClient = new APIClient(
                    mockMPInstance,
                    null
                );

                const mockStore: IStore = ({} as unknown) as IStore;
                const mockLogger: Logger = ({} as unknown) as Logger;
                const mediator = new Mediator(
                    eventLogger,
                    mockStore,
                    mockLogger,
                    mockMPInstance
                );

                expect(mediator.eventLogging).toBeDefined();

                mediator.eventLogging.logEvent({
                    name: 'Test Event',
                    messageType: MessageType.PageEvent,
                    eventType: EventTypeEnum.Navigation,
                    data: { mykey: 'myvalue' },
                    customFlags: {},
                });

                expect(logEventSpy).toHaveBeenCalledWith({
                    name: 'Test Event',
                    messageType: MessageType.PageEvent,
                    eventType: EventTypeEnum.Navigation,
                    data: { mykey: 'myvalue' },
                    customFlags: {},
                });
            });
        });
    });
});

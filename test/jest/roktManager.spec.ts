import { IKitConfigs } from "../../src/configAPIClient";
import { IMParticleUser } from "../../src/identity-user-interfaces";
import { SDKIdentityApi } from "../../src/identity.interfaces";
import { IMParticleWebSDKInstance } from "../../src/mp-instance";
import RoktManager, { IRoktKit, IRoktSelectPlacementsOptions } from "../../src/roktManager";
import { testMPID } from '../src/config/constants';


describe('RoktManager', () => {
    let roktManager: RoktManager;
    let currentUser: IMParticleUser;

    const mockMPInstance = ({
        Identity: {
            getCurrentUser: jest.fn().mockReturnValue({
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {}
                }),
                setUserAttributes: jest.fn(),
            }),
            identify: jest.fn().mockReturnValue({
                context: null,
                matched_identities: {
                    device_application_stamp: 'my-das',
                },
                is_ephemeral: true,
                mpid: testMPID,
                is_logged_in: false,
            }),
        },
        Logger: {
            verbose: jest.fn(),
            error: jest.fn(),
            warning: jest.fn(),
        },
    } as unknown) as IMParticleWebSDKInstance;

    beforeEach(() => {
        roktManager = new RoktManager();
        currentUser = {
            setUserAttributes: jest.fn(),
            getUserIdentities: jest.fn().mockReturnValue({
                userIdentities: {}
            })
        } as unknown as IMParticleUser;

        // Initialize with required dependencies
        roktManager.init(
            {} as IKitConfigs,
            {} as IMParticleUser,
            mockMPInstance.Identity,
            mockMPInstance.Logger
        );
    });

    describe('constructor', () => {
        it('should be initialized', () => {
            expect(roktManager).toBeDefined();
        });

        it('should have a null kit', () => {
            expect(roktManager['kit']).toBeNull();
        });
    });

    describe('#hashAttributes', () => {
        beforeEach(() => {
            roktManager['currentUser'] = currentUser;
        });

        it('should call kit.hashAttributes with empty attributes', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                userAttributes: undefined,
            };

            roktManager.attachKit(kit);

            const attributes = {};

            roktManager.hashAttributes(attributes);
            expect(kit.hashAttributes).toHaveBeenCalledWith(attributes);
        });

        it('should call kit.hashAttributes with passed in attributes', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                userAttributes: undefined,
            };

            roktManager.attachKit(kit);

            const attributes = {
                email: 'test@example.com',
                phone: '1234567890'
            };

            roktManager.hashAttributes(attributes);
            expect(kit.hashAttributes).toHaveBeenCalledWith(attributes);
        });

        it('should queue the hashAttributes method if no launcher or kit is attached', () => {
            const attributes = {
                email: 'test@example.com'
            };

            roktManager.hashAttributes(attributes);

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('hashAttributes');
            expect(roktManager['messageQueue'][0].payload).toBe(attributes);
        });

        it('should process queued hashAttributes calls once the launcher and kit are attached', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                userAttributes: undefined,
            };

            const attributes = {
                email: 'test@example.com'
            };

            roktManager.hashAttributes(attributes);
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('hashAttributes');
            expect(roktManager['messageQueue'][0].payload).toBe(attributes);
            expect(kit.hashAttributes).not.toHaveBeenCalled();

            roktManager.attachKit(kit);
            expect(roktManager['kit']).not.toBeNull();
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(kit.hashAttributes).toHaveBeenCalledWith(attributes);
        });

        it('should pass through the correct attributes to kit.launcher.hashAttributes', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },

                // We are mocking the hashAttributes method to return the
                // launcher's hashAttributes method and verify that
                // both the kit's and the launcher's methods
                // are called with the correct attributes.
                // This will happen through the Web Kit's hashAttributes method
                hashAttributes: jest.fn().mockImplementation((attributes) => {
                    return kit.launcher.hashAttributes(attributes);
                })
            };

            roktManager.attachKit(kit as IRoktKit);

            const attributes = {
                email: 'test@example.com',
                phone: '1234567890'
            };

            roktManager.hashAttributes(attributes);
            expect(kit.hashAttributes).toHaveBeenCalledWith(attributes);
            expect(kit.launcher.hashAttributes).toHaveBeenCalledWith(attributes);
        });
    });

    describe('#init', () => {
        it('should initialize the manager with defaults when no config is provided', () => {
            roktManager.init({} as IKitConfigs, {} as IMParticleUser, mockMPInstance.Identity);
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['filters']).toEqual({
                userAttributeFilters: undefined,
                filterUserAttributes: expect.any(Function),
                filteredUser: {},
            });
            expect(roktManager['kit']).toBeNull();
        });

        it('should initialize the manager with user attribute filters from a config', () => {
            const kitConfig: Partial<IKitConfigs> = {
                name: 'Rokt',
                moduleId: 181,
                userAttributeFilters: [816506310, 1463937872, 36300687],
            };

            roktManager.init(kitConfig as IKitConfigs, {} as IMParticleUser, mockMPInstance.Identity);
            expect(roktManager['filters']).toEqual({
                userAttributeFilters: [816506310, 1463937872, 36300687],
                filterUserAttributes: expect.any(Function),
                filteredUser: {},
            });
        });

        it('should initialize the manager with sandbox from options as launcherOptions', () => {
            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                undefined,
                {
                    sandbox: true,
                }
            );
            expect(roktManager['launcherOptions']).toEqual({ sandbox: true });
        });

        it('should initialize the manager with placement attributes mapping from a config', () => {
            const kitConfig: Partial<IKitConfigs> = {
                name: 'Rokt',
                moduleId: 181,
                settings: {
                    placementAttributesMapping: JSON.stringify([
                        {
                            jsmap: null,
                            map: 'f.name',
                            maptype: 'UserAttributeClass.Name',
                            value: 'firstname',
                        },
                        {
                            jsmap: null,
                            map: 'last_name',
                            maptype: 'UserAttributeClass.Name',
                            value: 'lastname',
                        }
                    ])
                },
            };
            roktManager.init(kitConfig as IKitConfigs, {} as IMParticleUser, mockMPInstance.Identity);
            expect(roktManager['placementAttributesMapping']).toEqual([
                { 
                    jsmap: null,
                    map: 'f.name',
                    maptype: 'UserAttributeClass.Name',
                    value: 'firstname',
                },
                {
                    jsmap: null,
                    map: 'last_name', 
                    maptype: 'UserAttributeClass.Name',
                    value: 'lastname',
                }
            ]);
        });

        it('should initialize the manager with launcher options from options', () => {
            const launcherOptions = {
                integrationName: 'customName',
                noFunctional: true,
                noTargeting: true
            };

            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance.Logger,
                {
                    launcherOptions
                }
            );

            const expectedOptions = {
                sandbox: false,
                ...launcherOptions
            };

            expect(roktManager['launcherOptions']).toEqual(expectedOptions);
        });

        it('should initialize the manager with default launcher options not provided', () => {
            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance.Logger,
                undefined,
            );

            const expectedOptions = {
                sandbox: false,
            };

            expect(roktManager['launcherOptions']).toEqual(expectedOptions);
        });

        it('should set the domain property when passed in options', () => {
            const domain = 'custom.domain.com';
            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance.Logger,
                {
                    domain,
                }
            );
            expect(roktManager['domain']).toBe(domain);
        });
    });

    describe('#attachKit', () => {
        it('should attach a kit', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn()
            };

            roktManager.attachKit(kit);
            expect(roktManager['kit']).not.toBeNull();
        });
    });

    describe('#processMessageQueue', () => {
        it('should not call kit methods when queue is empty', async () => {
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };
            
            roktManager.kit = kit;
            expect(roktManager['messageQueue'].length).toBe(0);
            
            // Should return early without calling any kit methods
            await roktManager['processMessageQueue']();
            
            expect(kit.selectPlacements).not.toHaveBeenCalled();
            expect(kit.hashAttributes).not.toHaveBeenCalled();
            expect(kit.setExtensionData).not.toHaveBeenCalled();
        });

        it('should not call kit methods when kit is not attached', async () => {
            // Queue some messages but don't attach kit
            roktManager['queueMessage']({ methodName: 'selectPlacements', payload: {} });
            roktManager['queueMessage']({ methodName: 'hashAttributes', payload: {} });
            
            expect(roktManager['messageQueue'].length).toBe(2);
            expect(roktManager.kit).toBeNull();
            
            // Should return early without processing queue
            await roktManager['processMessageQueue']();
            
            // Queue should remain unchanged
            expect(roktManager['messageQueue'].length).toBe(2);
        });

        it('should process messages sequentially in order', async () => {
            const executionOrder: string[] = [];
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockImplementation(async () => {
                    executionOrder.push('selectPlacements');
                    return {};
                }),
                hashAttributes: jest.fn().mockImplementation(async () => {
                    executionOrder.push('hashAttributes');
                    return {};
                }),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn().mockImplementation(async () => {
                    executionOrder.push('setExtensionData');
                })
            };

            // Queue multiple messages
            roktManager['queueMessage']({ methodName: 'selectPlacements', payload: {} });
            roktManager['queueMessage']({ methodName: 'hashAttributes', payload: {} });
            roktManager['queueMessage']({ methodName: 'setExtensionData', payload: {} });
            
            roktManager.kit = kit;
            await roktManager['processMessageQueue']();
            
            // Should execute in FIFO order
            expect(executionOrder).toEqual(['selectPlacements', 'hashAttributes', 'setExtensionData']);
            
            // Should clear queue
            expect(roktManager['messageQueue'].length).toBe(0);
        });

        it('should process the message queue if a launcher and kit are attached', async () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };


            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            
            expect(roktManager['messageQueue'].length).toBe(3);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(0);

            // Attach kit using proper API - this should process the message queue
            await roktManager.attachKit(kit);
            
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(3);
        });

        it('should return deferred promises that resolve with real results when kit is attached', async () => {
            // Queued calls return deferred promises that wait for real results
            const options = { attributes: { test: 'value' } } as IRoktSelectPlacementsOptions;
            
            // Call selectPlacements before kit is ready - this should create a deferred promise
            const promise = roktManager.selectPlacements(options);
            
            // Verify message is queued
            expect(roktManager['messageQueue'].length).toBe(1);
            
            // Set up kit with real result
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockResolvedValue({ realResult: 'data' }),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };
            
            // Attach kit - this processes the queue and resolves deferred promises
            await roktManager.attachKit(kit);
            
            // The deferred promise resolves with the real result
            const result = await promise;
            expect(result).toEqual({ realResult: 'data' });
            
            // Kit method was called with correct options
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
            expect(roktManager['messageQueue'].length).toBe(0);
        });

        it('should handle errors gracefully in processMessageQueue with proper logging', async () => {
            // Set up kit with methods that throw errors
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockRejectedValue(new Error('Kit method failed')),
                hashAttributes: jest.fn().mockRejectedValue(new Error('Hash failed')),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };

            // Mock logger to verify error handling
            const mockLogger = {
                error: jest.fn(),
                warning: jest.fn(),
                verbose: jest.fn(),
                setLogLevel: jest.fn()
            };
            roktManager['logger'] = mockLogger;

            // Queue some messages (capture the deferred promises)
            const promise1 = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            const promise2 = roktManager.hashAttributes({ test: 'value' });
            
            expect(roktManager['messageQueue'].length).toBe(2);

            // Attach kit - this triggers processMessageQueue with error handling
            await roktManager.attachKit(kit);
            
            // Queue is cleared regardless of individual operation failures
            expect(roktManager['messageQueue'].length).toBe(0);
            
            // Both methods are called despite errors
            expect(kit.selectPlacements).toHaveBeenCalled();
            expect(kit.hashAttributes).toHaveBeenCalled();
            
            // Errors are logged properly
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to process queued message \'selectPlacements\''));
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to process queued message \'hashAttributes\''));
            
            // Deferred promises reject with the actual errors
            await expect(promise1).rejects.toThrow('Kit method failed');
            await expect(promise2).rejects.toThrow('Hash failed');
        });

        it('should await all queued operations before attachKit completes', async () => {
            let operationOrder: string[] = [];
            
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockImplementation(async () => {
                    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
                    operationOrder.push('selectPlacements completed');
                }),
                hashAttributes: jest.fn().mockImplementation(async () => {
                    await new Promise(resolve => setTimeout(resolve, 5)); // Smaller delay
                    operationOrder.push('hashAttributes completed');
                }),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };

            // Queue messages
            roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            roktManager.hashAttributes({ test: 'value' });
            
            // attachKit waits for all operations to complete before returning
            await roktManager.attachKit(kit);
            operationOrder.push('attachKit returned');
            
            // attachKit completes after all queued operations
            expect(operationOrder).toEqual([
                'selectPlacements completed',    // Processed first (queued first)
                'hashAttributes completed',      // Processed second (queued second)
                'attachKit returned'             // Completed last as expected
            ]);
        });

        it('should continue processing all operations even when some fail', async () => {
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn().mockRejectedValue(new Error('Middle operation fails')),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn().mockResolvedValue(undefined)
            };

            // Mock logger to verify error handling
            const mockLogger = {
                error: jest.fn(),
                warning: jest.fn(),
                verbose: jest.fn(),
                setLogLevel: jest.fn()
            };
            roktManager['logger'] = mockLogger;

            // Queue multiple different operations (capture the deferred promises)
            const promise1 = roktManager.selectPlacements({ attributes: { test1: 'value1' } } as IRoktSelectPlacementsOptions);
            const promise2 = roktManager.hashAttributes({ test2: 'value2' });
            const promise3 = roktManager.setExtensionData({ extension: 'data' });
            
            expect(roktManager['messageQueue'].length).toBe(3);
            
            // Process queue using proper API - middle operation fails but processing continues
            await roktManager.attachKit(kit);
            
            // Queue is cleared regardless of individual operation failures
            expect(roktManager['messageQueue'].length).toBe(0);
            
            // All methods are called despite middle failure - sequential processing continues
            expect(kit.selectPlacements).toHaveBeenCalled();
            expect(kit.hashAttributes).toHaveBeenCalled(); // Called despite error
            expect(kit.setExtensionData).toHaveBeenCalled(); // Continues after error
            
            // Error is logged properly
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to process queued message \'hashAttributes\''));
            
            // Handle the deferred promises to prevent unhandled rejections
            await expect(promise1).resolves.toBeDefined(); // Should succeed
            await expect(promise2).rejects.toThrow('Middle operation fails'); // Should fail
            await expect(promise3).resolves.toBeUndefined(); // Should succeed (void return)
        });

        it('should expose the method-not-found silent failure bug', () => {
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };

            // Manually add a message with a non-existent method
            roktManager['queueMessage']({
                methodName: 'nonExistentMethod',
                payload: { some: 'data' }
            });
            roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            
            expect(roktManager['messageQueue'].length).toBe(2);
            
            // Process queue using proper API - should handle non-existent method gracefully
            // But current implementation doesn't log or handle this properly
            expect(() => roktManager.attachKit(kit)).not.toThrow();
            expect(roktManager['messageQueue'].length).toBe(0);
            
            // Valid method should still be called
            expect(kit.selectPlacements).toHaveBeenCalled();
        });

        it('should handle race conditions when messages are added during processing', async () => {
            let resolveFirstCall: () => void;
            const firstCallPromise = new Promise<void>(resolve => { resolveFirstCall = resolve; });
            
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockImplementation(async () => {
                    // Wait for signal before completing first call
                    await firstCallPromise;
                    return { result: 'first' };
                }),
                hashAttributes: jest.fn().mockResolvedValue({ result: 'second' }),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };

            // Queue first message and start processing
            roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            roktManager.kit = kit;
            
            // Start processing queue (but don't await yet)
            const processingPromise = roktManager['processMessageQueue']();
            
            // While first message is processing, directly add message to queue (bypass normal flow)
            roktManager['queueMessage']({ methodName: 'hashAttributes', payload: { test: 'value' } });
            
            // Now allow first call to complete
            resolveFirstCall!();
            await processingPromise;
            
            // Second message should still be in queue
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('hashAttributes');
            
            // Process the remaining message
            await roktManager['processMessageQueue']();
            expect(roktManager['messageQueue'].length).toBe(0);
        });

        it('should clean up pendingPromises Map after successful resolution', async () => {
            const promise = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            const messageId = roktManager['messageQueue'][0].messageId!;
            
            // Verify promise is stored
            expect(roktManager['pendingPromises'].has(messageId)).toBe(true);
            expect(roktManager['pendingPromises'].size).toBe(1);
            
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockResolvedValue({ success: true }),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };
            
            roktManager.kit = kit;
            await roktManager['processMessageQueue']();
            await promise; // Wait for promise to resolve
            
            // Map should be cleaned up
            expect(roktManager['pendingPromises'].has(messageId)).toBe(false);
            expect(roktManager['pendingPromises'].size).toBe(0);
        });

        it('should clean up pendingPromises Map after error rejection', async () => {
            const promise = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            const messageId = roktManager['messageQueue'][0].messageId!;
            
            // Verify promise is stored
            expect(roktManager['pendingPromises'].has(messageId)).toBe(true);
            expect(roktManager['pendingPromises'].size).toBe(1);
            
            const kit: IRoktKit = {
                launcher: { selectPlacements: jest.fn(), hashAttributes: jest.fn() },
                filters: undefined,
                selectPlacements: jest.fn().mockRejectedValue(new Error('Test error')),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };
            
            roktManager.kit = kit;
            await roktManager['processMessageQueue']();
            
            try {
                await promise; // This should reject
            } catch (error) {
                // Expected to catch error
            }
            
            // Map should be cleaned up even after error
            expect(roktManager['pendingPromises'].has(messageId)).toBe(false);
            expect(roktManager['pendingPromises'].size).toBe(0);
        });

        it('should process the message queue if a launcher and kit are attached', async () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn()
            };


            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            
            expect(roktManager['messageQueue'].length).toBe(3);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(0);

            // Attach kit using proper API - this should process the message queue
            await roktManager.attachKit(kit);
            
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(3);
        });
    });

    describe('#deferredCall', () => {
        it('should create a deferred promise with unique messageId', () => {
            const promise = roktManager['deferredCall']<string>('testMethod', { test: 'payload' });
            
            // Should return a promise
            expect(promise).toBeInstanceOf(Promise);
            
            // Should queue a message with messageId
            expect(roktManager['messageQueue'].length).toBe(1);
            const message = roktManager['messageQueue'][0];
            expect(message.methodName).toBe('testMethod');
            expect(message.payload).toEqual({ test: 'payload' });
            expect(message.messageId).toMatch(/^testMethod_\d+_0\.\d+$/);
            
            // Should store pending promise resolvers
            expect(roktManager['pendingPromises'].has(message.messageId!)).toBe(true);
        });

        it('should generate unique messageIds for multiple calls', () => {
            const promise1 = roktManager['deferredCall']<string>('method1', {});
            const promise2 = roktManager['deferredCall']<string>('method2', {});
            
            const message1 = roktManager['messageQueue'][0];
            const message2 = roktManager['messageQueue'][1];
            
            expect(message1.messageId).not.toBe(message2.messageId);
            expect(roktManager['pendingPromises'].size).toBe(2);
        });
    });

    describe('#completePendingPromise', () => {
        it('should resolve pending promise with success result', async () => {
            const promise = roktManager['deferredCall']<string>('testMethod', {});
            const messageId = roktManager['messageQueue'][0].messageId!;
            
            // Complete the promise with success
            roktManager['completePendingPromise'](messageId, 'success result', true);
            
            // Promise should resolve with the result
            await expect(promise).resolves.toBe('success result');
            
            // Should clean up the pending promise
            expect(roktManager['pendingPromises'].has(messageId)).toBe(false);
        });

        it('should reject pending promise with error', async () => {
            const promise = roktManager['deferredCall']<string>('testMethod', {});
            const messageId = roktManager['messageQueue'][0].messageId!;
            const error = new Error('test error');
            
            // Complete the promise with error
            roktManager['completePendingPromise'](messageId, error, false);
            
            // Promise should reject with the error
            await expect(promise).rejects.toThrow('test error');
            
            // Should clean up the pending promise
            expect(roktManager['pendingPromises'].has(messageId)).toBe(false);
        });

        it('should handle missing messageId gracefully', () => {
            // Should not throw when messageId is undefined
            expect(() => {
                roktManager['completePendingPromise'](undefined, 'result', true);
            }).not.toThrow();
            
            // Should not throw when messageId does not exist
            expect(() => {
                roktManager['completePendingPromise']('nonexistent', 'result', true);
            }).not.toThrow();
        });
    });

    describe('#selectPlacements', () => {
        beforeEach(() => {
            roktManager['currentUser'] = currentUser;
        });

        it('should call kit.selectPlacements with empty attributes', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.attachKit(kit);

            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should call kit.selectPlacements with passed in attributes', async () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.attachKit(kit);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    age: 25,
                    score: 100.5,
                    isSubscribed: true,
                    isActive: false,
                    interests: 'sports,music,books'
                }
            };

            await roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should queue the selectPlacements method if no launcher or kit is attached', () => {
            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('selectPlacements');
            expect(roktManager['messageQueue'][0].payload).toBe(options);
        });

        it('should process queued selectPlacements calls once the launcher and kit are attached', async () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('selectPlacements');
            expect(roktManager['messageQueue'][0].payload).toBe(options);

            roktManager.attachKit(kit);
            expect(roktManager['kit']).not.toBeNull();
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should pass through the correct attributes to kit.selectPlacements', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,

                // We are mocking the selectPlacements method to return the
                // launcher's selectPlacements method and verify that
                // both the kit's and the launcher's selectPlacements methods
                // are called with the correct options
                // This will happen through the Web Kit's selectPlacements method
                selectPlacements: jest.fn().mockImplementation((options) => {
                    return kit.launcher.selectPlacements(options);
                }),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.attachKit(kit);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    age: 25,
                    score: 100.5,
                    isSubscribed: true,
                    isActive: false,
                    interests: 'sports,music,books'
                }
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
            expect(kit.launcher.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should pass sandbox flag as an attribute through to kit.selectPlacements', ()=> {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                hashAttributes: jest.fn(),
                userAttributes: undefined,
            };

            roktManager.attachKit(kit);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value',
                    sandbox: true
                },
                identifier: 'test-identifier'
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options); 
        });

        it('should NOT override global sandbox in placement attributes when initialized as true', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.attachKit(kit);
            roktManager['sandbox'] = true;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value',
                    sandbox: false
                }
            };

            roktManager.selectPlacements(options);

            expect(roktManager['sandbox']).toBeTruthy();
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should set sandbox in placement attributes when not initialized globally', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                hashAttributes: jest.fn(),
                userAttributes: undefined,
            };

            roktManager.attachKit(kit);
            // Not initializing sandbox, so it remains null

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value',
                    sandbox: true
                },
                identifier: 'test-identifier'
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should pass mapped attributes to kit.launcher.selectPlacements', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn()
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['placementAttributesMapping'] = [
                {
                    jsmap: null,
                    map: 'f.name',
                    maptype: 'UserAttributeClass.Name',
                    value: 'firstname'
                },
                {
                    jsmap: null,
                    map: 'last_name',
                    maptype: 'UserAttributeClass.Name',
                    value: 'lastname'
                }
            ];

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'f.name': 'John',
                    'last_name': 'Doe',
                    'score': 42,
                }
            };

            const expectedOptions = {
                attributes: {
                    firstname: 'John',
                    lastname: 'Doe',
                    score: 42,
                }
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should pass original attributes to kit.launcher.selectPlacements if no mapping is provided', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['placementAttributesMapping'] = [];

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'f.name': 'John',
                    'last_name': 'Doe',
                    'score': 42,
                    'age': 25,
                }
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should set the mapped attributes on the current user via setUserAttributes', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['currentUser'] = {
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            roktManager['placementAttributesMapping'] = [
                {
                    jsmap: null,
                    map: 'f.name',
                    maptype: 'UserAttributeClass.Name',
                    value: 'firstname'
                },
                {
                    jsmap: null,
                    map: 'last_name',
                    maptype: 'UserAttributeClass.Name',
                    value: 'lastname'
                }
            ];

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'f.name': 'John',
                    'last_name': 'Doe',
                    'age': 25,
                    'score': 42,
                }
            };

            await roktManager.selectPlacements(options);
            expect(roktManager['currentUser'].setUserAttributes).toHaveBeenCalledWith({
                firstname: 'John',
                lastname: 'Doe',
                age: 25,
                score: 42,
            });
        });

        it('should not set reserved attributes on the current user', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['currentUser'] = {
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'sandbox': true
                }
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
            expect(roktManager['currentUser'].setUserAttributes).not.toHaveBeenCalledWith({
                sandbox: true
            });
        });

        it('should call identify with new email when it differs from current user email', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            // Set up fresh mocks for this test
            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'old@example.com'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn().mockImplementation((data, callback) => {
                    // Call callback with no error to simulate success
                    callback();
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'new@example.com'
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockIdentity.identify).toHaveBeenCalledWith({
                userIdentities: {
                    email: 'new@example.com'
                }
            }, expect.any(Function));
            expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(
                'Email mismatch detected. Current email, old@example.com differs from email passed to selectPlacements call, new@example.com. Proceeding to call identify with new@example.com. Please verify your implementation.'
            );
        });

        it('should not call identify when email matches current user email', () => {
            // Reset mocks
            jest.clearAllMocks();
            
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            // Set up fresh mocks for this test
            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'same@example.com'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            };

            roktManager['identityService'] = mockIdentity as unknown as SDKIdentityApi;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'same@example.com'
                }
            };

            roktManager.selectPlacements(options);

            expect(mockIdentity.identify).not.toHaveBeenCalled();
            expect(mockMPInstance.Logger.warning).not.toHaveBeenCalled();
        });

        it('should call identify with new email when current user has no email', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {}
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn().mockImplementation((data, callback) => {
                    // Call callback with no error to simulate success
                    callback();
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'new@example.com'
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockIdentity.identify).toHaveBeenCalledWith({
                userIdentities: {
                    email: 'new@example.com'
                }
            }, expect.any(Function));
            expect(mockMPInstance.Logger.warning).not.toHaveBeenCalled();
        });

        it('should log error when identify fails with a 500 but continue execution', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn()
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const mockError = { error: 'Identity service error', code: 500 };
            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'old@example.com'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn().mockImplementation(() => {
                    throw mockError;
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'new@example.com'
                }
            };

            // Should not reject since we're catching and logging the error
            await expect(roktManager.selectPlacements(options)).resolves.toBeDefined();
            
            // Verify error was logged
            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                'Failed to identify user with new email: ' + JSON.stringify(mockError)
            );

            // Verify selectPlacements was still called
            expect(kit.selectPlacements).toHaveBeenCalled();
        });
    });

    describe('#setExtensionData', () => {
        it('should call kit.setExtensionData with the correct extension data', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn(),
                },
                setExtensionData: jest.fn()
            };

            roktManager.attachKit(kit as IRoktKit);

            const extensionData = {
                'my-extension': {
                    option1: '#value1',
                    option2: '#value2'
                }
            };

            roktManager.setExtensionData(extensionData);
            expect(kit.setExtensionData).toHaveBeenCalledWith(extensionData);
        });

        it('should queue the setExtensionData method if no kit is attached', () => {
            const extensionData = { 'test-ext': { config: 'value' } };

            roktManager.setExtensionData(extensionData);

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('setExtensionData');
            expect(roktManager['messageQueue'][0].payload).toBe(extensionData);
        });

        it('should process queued setExtensionData calls once the kit is attached', () => {
            const extensionData = { 'queue-test': { setting: true } };

            roktManager.setExtensionData(extensionData);
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);

            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn()
                },
                setExtensionData: jest.fn()
            };

            roktManager.attachKit(kit as IRoktKit);

            expect(roktManager['kit']).not.toBeNull();
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(kit.setExtensionData).toHaveBeenCalledWith(extensionData);
        });

        it('should reject with an error if kit.setExtensionData fails', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn()
                },
                setExtensionData: jest.fn()
            };

            await roktManager.attachKit(kit as IRoktKit);

            const mockError = new Error('Mock error message');
            // Mock the setExtensionData implementation to throw an error,
            // so that we can test the error handling behavior
            (kit.setExtensionData as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            const extensionData = {
                'my-extension': {
                    option1: '#value1',
                    option2: '#value2'
                }
            };

            await expect(roktManager.setExtensionData(extensionData)).rejects.toThrow('Error setting extension data: ' + mockError.message);
        });
    });
});
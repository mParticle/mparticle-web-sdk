import { IKitConfigs } from "../../src/configAPIClient";
import { IMParticleUser } from "../../src/identity-user-interfaces";
import { SDKIdentityApi } from "../../src/identity.interfaces";
import { IMParticleWebSDKInstance } from "../../src/mp-instance";
import RoktManager, { IRoktKit, IRoktSelectPlacementsOptions } from "../../src/roktManager";
import { IStore } from "../../src/store";
import { testMPID, apiKey, urls, workspaceToken } from '../src/config/constants';
import { IdentityType, PerformanceMarkType } from "../../src/types";
import Constants from "../../src/constants";
import { IMParticleInstanceManager, KitBlockerDataPlan, SDKInitConfig } from "../../src/sdkRuntimeModels";
import filteredMparticleUser from "../../src/filteredMparticleUser";
import Helpers from "../../src/helpers";
import KitBlocker from "../../src/kitBlocking";
import { Dictionary } from "../../src/utils";
import IntegrationCapture from "../../src/integrationCapture";
import { deleteAllCookies } from './utils';
import { resetRouteChangeMonitor } from "../../src/routeChangeMonitor";

const resolvePromise = () => new Promise(resolve => setTimeout(resolve, 0));

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
        _Store: {
            setLocalSessionAttributes: jest.fn(),
            getLocalSessionAttributes: jest.fn().mockReturnValue({}),
            getTimeOnSite: jest.fn().mockReturnValue(undefined),
            identityCallInFlight: false,
        },
        Logger: {
            verbose: jest.fn(),
            error: jest.fn(),
            warning: jest.fn(),
            isVerbose: jest.fn().mockReturnValue(false),
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
            mockMPInstance._Store,
            mockMPInstance.Logger,
            undefined,
        );
        
        roktManager['store'].identityCallInFlight = false;
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Reset identityCallInFlight to ensure clean state
        if (mockMPInstance._Store) {
            mockMPInstance._Store.identityCallInFlight = false;
        }
        roktManager = null;
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
        const nodeCrypto = require('crypto');
        let shaSpy: jest.SpyInstance;

        beforeEach(() => {
            roktManager['currentUser'] = currentUser;
            shaSpy = jest.spyOn(roktManager as any, 'sha256Hex');
            shaSpy.mockImplementation((s: string) =>
                Promise.resolve(nodeCrypto.createHash('sha256').update(s).digest('hex')),
            );
        });

        afterEach(() => {
            shaSpy.mockRestore();
        });

        it('should hash attributes with passed in attributes', async () => {
            const attributes = {
                email: 'test@example.com',
                phone: '1234567890'
            };

            const result = await roktManager.hashAttributes(attributes);

            expect(result).toEqual({
                email: 'test@example.com',
                emailsha256: nodeCrypto.createHash('sha256').update('test@example.com').digest('hex'),
                phone: '1234567890',
                phonesha256: nodeCrypto.createHash('sha256').update('1234567890').digest('hex'),
            });
        });

        it('should hash all non-null string, number, and boolean values', async () => {
            const attributes = {
                email: 'Test@Example.COM',
                age: 25,
                active: true,
                nullable: null,
                undefinedVal: undefined
            };

            const result = await roktManager.hashAttributes(attributes);

            expect(result).toEqual({
                email: 'Test@Example.COM',
                emailsha256: nodeCrypto.createHash('sha256').update('test@example.com').digest('hex'),
                age: 25,
                agesha256: nodeCrypto.createHash('sha256').update('25').digest('hex'),
                active: true,
                activesha256: nodeCrypto.createHash('sha256').update('true').digest('hex'),
                nullable: null,
                undefinedVal: undefined
            });
        });

        it('should return empty object if attributes is null', async () => {
            const result = await roktManager.hashAttributes(null as any);
            expect(result).toEqual({});
        });

        it('should return empty object if attributes is undefined', async () => {
            const result = await roktManager.hashAttributes(undefined as any);
            expect(result).toEqual({});
        });

        it('should handle empty attributes object', async () => {
            const result = await roktManager.hashAttributes({});
            expect(result).toEqual({});
        });

        it('should log error if hashSha256 throws an error', async () => {
            shaSpy.mockRestore();
            
            // Mock hashSha256 to throw an error
            const hashError = new Error('Hashing failed');
            jest.spyOn(roktManager, 'hashSha256').mockRejectedValue(hashError);

            const attributes = { email: 'test@example.com' };
            const result = await roktManager.hashAttributes(attributes);

            expect(result).toEqual({});
            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to hashAttributes, returning an empty object: Hashing failed')
            );
        });
    });

    describe('#hashSha256', () => {
        const nodeCrypto = require('crypto');
        let shaSpy: jest.SpyInstance;

        beforeEach(() => {
            shaSpy = jest.spyOn(roktManager as any, 'sha256Hex');
            shaSpy.mockImplementation((s: string) =>
                Promise.resolve(nodeCrypto.createHash('sha256').update(s).digest('hex')),
            );
        });

        afterEach(() => {
            shaSpy.mockRestore();
        });

        it('should hash a single string value using SHA-256', async () => {
            const result = await roktManager.hashSha256('test@example.com');
            const expected = nodeCrypto.createHash('sha256').update('test@example.com').digest('hex');

            expect(result).toBe(expected);
            expect(shaSpy).toHaveBeenCalledWith('test@example.com');
            expect(shaSpy).toHaveBeenCalledTimes(1);
        });

        it('should hash values without kit being attached', async () => {
            // Verify kit is not attached
            expect(roktManager['kit']).toBeNull();

            const result = await roktManager.hashSha256('user@example.com');
            const expected = nodeCrypto.createHash('sha256').update('user@example.com').digest('hex');

            expect(result).toBe(expected);
        });

        it('should handle empty string', async () => {
            const emptyStringHash = await roktManager.hashSha256('');
            
            // Empty string after trim becomes '', hash of empty string
            expect(emptyStringHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
        });

        it('should return null and log warning when value is null', async () => {
            const result = await roktManager.hashSha256(null);
            
            expect(result).toBeNull();
            expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith('hashSha256 received null/undefined as input');
        });

        it('should return undefined and log warning when value is undefined', async () => {
            const result = await roktManager.hashSha256(undefined);
            
            expect(result).toBeUndefined();
            expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith('hashSha256 received null/undefined as input');
        });

        it('should return undefined and log error when hashing fails', async () => {
            shaSpy.mockRejectedValue(new Error('Hash failed'));

            const result = await roktManager.hashSha256('test@example.com');
            
            expect(result).toBeUndefined();
            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to hashSha256, returning undefined: Hash failed')
            );
        });

        it('should hash firstName to known SHA-256 value', async () => {
            const hashedFirstName = await roktManager.hashSha256('jane');
            
            // Expected SHA-256 hash of 'jane'
            expect(hashedFirstName).toBe('81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2');
        });

        it('should produce same hash for different case and whitespace variations', async () => {
            const lowercaseEmail = await roktManager.hashSha256('jane.doe@gmail.com');
            const mixedCaseEmail = await roktManager.hashSha256('Jane.Doe@gmail.com');
            const emailWithWhitespace = await roktManager.hashSha256(' jane.doe@gmail.com   ');

            // All should normalize to same hash
            expect(lowercaseEmail).toBe(mixedCaseEmail);
            expect(mixedCaseEmail).toBe(emailWithWhitespace);
            expect(lowercaseEmail).toBe('831f6494ad6be4fcb3a724c3d5fef22d3ceffa3c62ef3a7984e45a0ea177f982');
        });

        it('should handle numeric values and match known SHA-256', async () => {
            const hashedNumber = await roktManager.hashSha256(42);
            const hashedString = await roktManager.hashSha256('42');

            // Numeric value should be converted to string and produce same hash
            expect(hashedNumber).toBe(hashedString);
            // Expected SHA-256 hash of '42'
            expect(hashedNumber).toBe('73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049');
        });

        it('should handle boolean values and match known SHA-256', async () => {
            const hashedBoolean = await roktManager.hashSha256(true);
            const hashedString = await roktManager.hashSha256('true');

            // Boolean value should be converted to string and produce same hash
            expect(hashedBoolean).toBe(hashedString);
            // Expected SHA-256 hash of 'true'
            expect(hashedBoolean).toBe('b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b');
        });

        it('should hash phone number to known SHA-256 value', async () => {
            const hashedPhone = await roktManager.hashSha256('1234567890');
            
            // Expected SHA-256 hash of '1234567890'
            expect(hashedPhone).toBe('c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646');
        });
    });

    describe('#init', () => {
        it('should initialize the manager with defaults when no config is provided', () => {
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
            );
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

            roktManager.init(
                kitConfig as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
            );
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
                mockMPInstance._Store,
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
            roktManager.init(
                kitConfig as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
            );
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
            };

            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance._Store,
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

        it('should preserve sessionId and sessionToken in launcher options', () => {
            const launcherOptions = {
                sessionId: '0198c1a2-3b4c-7d5e-8f90-1a2b3c4d5e6f',
                sessionToken: 'header.payload.signature',
            };

            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
                {
                    launcherOptions,
                }
            );

            expect(roktManager['launcherOptions']).toEqual({
                sandbox: false,
                ...launcherOptions,
            });
        });

        it('should initialize the manager with default launcher options not provided', () => {
            roktManager.init(
                {} as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance._Store,
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
                mockMPInstance._Store,
                mockMPInstance.Logger,
                {
                    domain,
                }
            );
            expect(roktManager['domain']).toBe(domain);
        });
        
        it('should set mappedEmailShaIdentityType as a lowercase hashedEmailUserIdentityType when passed as a setting', () => {
            roktManager.init(
                {settings: {hashedEmailUserIdentityType: 'Other5'}} as unknown as IKitConfigs,
                undefined,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
            );
            expect(roktManager['mappedEmailShaIdentityType']).toBe('other5');
        });

        it('should pass through Rokt privacy flags (noTargeting and noFunctional) from launcher options', () => {
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
                { launcherOptions: { noTargeting: true, noFunctional: false } },
            );
            expect(roktManager['launcherOptions'].noTargeting).toBe(true);
            expect(roktManager['launcherOptions'].noFunctional).toBe(false);
        });

        it('should expand noDeviceID launcher option casing before attaching the Rokt kit', () => {
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
                {
                    launcherOptions: {
                        noDeviceID: true,
                        noFunctional: false,
                        noTargeting: false,
                    },
                },
            );

            expect(roktManager['launcherOptions'].noDeviceId).toBe(true);
            expect(roktManager['launcherOptions'].noDeviceID).toBe(true);
            expect(roktManager['launcherOptions'].noFunctional).toBe(true);
            expect(roktManager['launcherOptions'].noTargeting).toBe(true);
        });

        it('should capture jointSdkRoktKitInit timing when init is called with captureTiming', () => {
            const mockCaptureTiming = jest.fn();
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
                undefined,
                mockCaptureTiming
            );
            expect(mockCaptureTiming).toHaveBeenCalledWith(PerformanceMarkType.JointSdkRoktKitInit);
            expect(mockCaptureTiming).toHaveBeenCalledTimes(1);
        });

    });

    describe('#attachKit', () => {
        let kit: IRoktKit;

        beforeEach(() => {
            kit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };
        });

        it('should attach a kit', () => {
            roktManager.attachKit(kit);
            expect(roktManager['kit']).not.toBeNull();
        });

        it('should call processMessageQueue when kit is attached', () => {
            const processMessageQueueSpy = jest.spyOn(roktManager as any, 'processMessageQueue');
            
            roktManager.attachKit(kit);
            
            expect(processMessageQueueSpy).toHaveBeenCalledTimes(1);
            processMessageQueueSpy.mockRestore();
        });

        it('should call onReadyCallback when kit is attached', () => {
            const onReadyCallback = jest.fn();
            roktManager.setOnReadyCallback(onReadyCallback);
            
            roktManager.attachKit(kit);
            
            expect(onReadyCallback).toHaveBeenCalledTimes(1);
        });

        it('should not throw if onReadyCallback is not set', () => {
            expect(() => roktManager.attachKit(kit)).not.toThrow();
        });

        it('should call processMessageQueue before onReadyCallback', () => {
            const callOrder: string[] = [];
            const processMessageQueueSpy = jest.spyOn(roktManager as any, 'processMessageQueue')
                .mockImplementation(() => callOrder.push('processMessageQueue'));
            const onReadyCallback = jest.fn(() => callOrder.push('onReadyCallback'));
            
            roktManager.setOnReadyCallback(onReadyCallback);
            roktManager.attachKit(kit);
            
            expect(callOrder).toEqual(['processMessageQueue', 'onReadyCallback']);
            
            processMessageQueueSpy.mockRestore();
        });

        it('should catch and log errors if onReadyCallback throws', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Callback error');
            });
            roktManager.setOnReadyCallback(errorCallback);
            
            // Should not throw
            expect(() => roktManager.attachKit(kit)).not.toThrow();
            
            // Callback was called
            expect(errorCallback).toHaveBeenCalledTimes(1);
            
            // Kit should still be attached
            expect(roktManager['kit']).toBe(kit);
        });

        it('should log error when onReadyCallback throws and logger is available', () => {
            const mockLogger = { error: jest.fn(), verbose: jest.fn(), warning: jest.fn(), isVerbose: jest.fn().mockReturnValue(false), setLogLevel: jest.fn() };
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockLogger,
                undefined,
            );
            
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            roktManager.setOnReadyCallback(errorCallback);
            
            roktManager.attachKit(kit);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('RoktManager: Error in onReadyCallback')
            );
        });
    });

    describe('#processMessageQueue', () => {
        let kit: IRoktKit;

        beforeEach(() => {
            kit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined,
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };
        });

        it('should process the message queue if a launcher and kit are attached', () => {


            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            
            expect(roktManager['messageQueue'].size).toBe(3);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(0);

            // Indirectly attach the launcher and kit to test the message queue
            roktManager.kit = kit;

            roktManager['processMessageQueue']();
            expect(roktManager['messageQueue'].size).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(3);
        });

        it('should call RoktManager methods (not kit methods directly) when processing queue', () => {
            // Queue some calls before kit is ready (these will be deferred)
            const selectOptions = { attributes: { test: 'value' } } as IRoktSelectPlacementsOptions;
            const extensionData = { 'test-ext': { config: true } };
            const useName = 'TestExtension';

            roktManager.selectPlacements(selectOptions);
            roktManager.setExtensionData(extensionData);
            roktManager.use(useName);

            // Verify calls were queued
            expect(roktManager['messageQueue'].size).toBe(3);
            expect(kit.selectPlacements).not.toHaveBeenCalled(); // Kit methods not called yet
            expect(kit.setExtensionData).not.toHaveBeenCalled(); // Kit methods not called yet
            expect(kit.use).not.toHaveBeenCalled(); // Kit methods not called yet

            // Spy on RoktManager methods AFTER initial calls to track queue processing
            const selectPlacementsSpy = jest.spyOn(roktManager, 'selectPlacements');
            const setExtensionDataSpy = jest.spyOn(roktManager, 'setExtensionData');
            const useSpy = jest.spyOn(roktManager, 'use');

            // Attach kit (triggers processMessageQueue)
            roktManager.attachKit(kit);

            // Verify RoktManager methods were called during queue processing
            expect(selectPlacementsSpy).toHaveBeenCalledTimes(1);
            expect(selectPlacementsSpy).toHaveBeenCalledWith(selectOptions);
            
            expect(setExtensionDataSpy).toHaveBeenCalledTimes(1);
            expect(setExtensionDataSpy).toHaveBeenCalledWith(extensionData);
            
            expect(useSpy).toHaveBeenCalledTimes(1);
            expect(useSpy).toHaveBeenCalledWith(useName);

            // Verify queue was cleared
            expect(roktManager['messageQueue'].size).toBe(0);

            // Clean up spies
            selectPlacementsSpy.mockRestore();
            setExtensionDataSpy.mockRestore();
            useSpy.mockRestore();
        });

        it('should resolve all queued promises correctly even after queue is cleared', async () => {
            const result1 = { placements: ['placement1'] };
            const result2 = { placements: ['placement2'] };
            const result3 = { placements: ['placement3'] };

            kit.selectPlacements = jest.fn()
                .mockResolvedValueOnce(result1)
                .mockResolvedValueOnce(result2)
                .mockResolvedValueOnce(result3);

            roktManager['store'].identityCallInFlight = false;
            roktManager['placementAttributesMapping'] = [];

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({ userIdentities: {} }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            // Queue multiple selectPlacements calls
            const promise1 = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            const promise2 = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);
            const promise3 = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);

            // Verify all are queued
            expect(roktManager['messageQueue'].size).toBe(3);
            expect(kit.selectPlacements).not.toHaveBeenCalled();

            // Process the queue (this clears the queue immediately)
            roktManager.kit = kit;
            roktManager['processMessageQueue']();

            // Verify queue is cleared synchronously
            expect(roktManager['messageQueue'].size).toBe(0);

            // Wait for async processing to complete
            await resolvePromise();

            // Verify all promises resolve correctly (even though queue was cleared)
            const resolved1 = await promise1;
            const resolved2 = await promise2;
            const resolved3 = await promise3;

            expect(resolved1).toEqual(result1);
            expect(resolved2).toEqual(result2);
            expect(resolved3).toEqual(result3);

            // Verify all methods were called
            expect(kit.selectPlacements).toHaveBeenCalledTimes(3);
        });

        it('should handle promise rejections correctly even after queue is cleared', async () => {
            const testError = new Error('Test error');
            kit.selectPlacements = jest.fn().mockRejectedValue(testError);

            roktManager['store'].identityCallInFlight = false;
            roktManager['placementAttributesMapping'] = [];

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({ userIdentities: {} }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            // Queue a selectPlacements call
            const promise = roktManager.selectPlacements({ attributes: {} } as IRoktSelectPlacementsOptions);

            // Catch the rejection to prevent unhandled rejection warnings
            promise.catch(() => {});

            // Verify it's queued
            expect(roktManager['messageQueue'].size).toBe(1);

            // Process the queue (this clears the queue immediately)
            roktManager.kit = kit;
            roktManager['processMessageQueue']();

            // Verify queue is cleared synchronously
            expect(roktManager['messageQueue'].size).toBe(0);

            // Wait for async processing to complete
            await resolvePromise();

            // Verify promise rejects correctly (even though queue was cleared)
            await expect(promise).rejects.toThrow('Test error');
        });

        it('should resolve queued promises when kit method returns a plain value (not a Promise)', async () => {
            const returnValue = 'test-result';
            kit.use = jest.fn().mockReturnValue(returnValue);

            // Queue a method call that returns a value synchronously
            const promise = roktManager.use<string>('TestExtension');

            // Verify it's queued
            expect(roktManager['messageQueue'].size).toBe(1);

            // Process the queue (this clears the queue immediately)
            roktManager.kit = kit;
            roktManager['processMessageQueue']();

            // Verify queue is cleared synchronously
            expect(roktManager['messageQueue'].size).toBe(0);

            // Wait for async processing to complete
            await resolvePromise();

            // Verify promise resolves correctly (even though queue was cleared)
            const result = await promise;
            expect(result).toBe(returnValue);
            expect(kit.use).toHaveBeenCalledWith('TestExtension');
        });

        it('should handle synchronous method throws correctly after queue is cleared', async () => {
            const testError = new Error('Synchronous throw');
            kit.use = jest.fn().mockImplementation(() => {
                throw testError;
            });

            // Queue a method call that will throw synchronously
            const promise = roktManager.use<string>('TestExtension');

            // Catch the rejection to prevent unhandled rejection warnings
            promise.catch(() => {});

            // Verify it's queued
            expect(roktManager['messageQueue'].size).toBe(1);

            // Process the queue (this clears the queue immediately)
            roktManager.kit = kit;
            roktManager['processMessageQueue']();

            // Verify queue is cleared synchronously
            expect(roktManager['messageQueue'].size).toBe(0);

            // Wait for async processing to complete
            await resolvePromise();

            // Verify promise rejects correctly (even though queue was cleared)
            await expect(promise).rejects.toThrow('Synchronous throw');
        });

        it('should handle empty queue gracefully', () => {
            // Process an empty queue
            roktManager['processMessageQueue']();

            // Should not throw and queue should remain empty
            expect(roktManager['messageQueue'].size).toBe(0);
        });

        it('should preserve RoktManager preprocessing logic when processing deferred selectPlacements calls', () => {
            // Set up placement attributes mapping to test preprocessing
            roktManager['placementAttributesMapping'] = [
                {
                    jsmap: null,
                    map: 'original_key',
                    maptype: 'UserAttributeClass.Name',
                    value: 'mapped_key'
                }
            ];

            // Set up current user mock
            roktManager['currentUser'] = {
                setUserAttributes: jest.fn(),
                getUserIdentities: jest.fn().mockReturnValue({
                    userIdentities: {}
                })
            } as unknown as IMParticleUser;

            // Queue a selectPlacements call with attributes that need mapping
            const originalOptions: IRoktSelectPlacementsOptions = {
                attributes: {
                    original_key: 'test_value',
                    other_attr: 'other_value'
                }
            };

            roktManager.selectPlacements(originalOptions);
            expect(roktManager['messageQueue'].size).toBe(1);

            // Attach kit (triggers processMessageQueue)
            roktManager.attachKit(kit);

            // Verify the kit method was called with MAPPED attributes (proving preprocessing occurred)
            const expectedMappedOptions = {
                attributes: {
                    mapped_key: 'test_value',  // This key should be mapped
                    other_attr: 'other_value'  // This key should remain unchanged
                }
            };

            expect(kit.selectPlacements).toHaveBeenCalledWith(expectedMappedOptions);
            expect(roktManager['currentUser'].setUserAttributes).toHaveBeenCalledWith({
                mapped_key: 'test_value',
                other_attr: 'other_value'
            });
        });


        it('should skip processing if method does not exist on RoktManager', () => {
            // Manually add a message with a non-existent method name
            roktManager['queueMessage']({
                messageId: 'test_123',
                methodName: 'nonExistentMethod',
                payload: { test: 'data' },
                resolve: jest.fn(),
                reject: jest.fn()
            });

            expect(roktManager['messageQueue'].size).toBe(1);

            // Attach kit (triggers processMessageQueue)
            roktManager.attachKit(kit);

            // Verify error was logged for non-existent method
            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                'RoktManager: Method nonExistentMethod not found'
            );

            // Verify message was removed from queue even though method didn't exist
            expect(roktManager['messageQueue'].size).toBe(0);
        });
    });

    describe('#selectPlacements', () => {
        // Stands in for a Rokt connection that filters no identity.
        const allowEveryIdentity = (manager: RoktManager) => {
            manager['createFilteredUser'] = () => manager['currentUser'];
        };

        beforeEach(() => {
            roktManager['currentUser'] = currentUser;
            jest.clearAllMocks();
        });

        it('should capture jointSdkSelectPlacements timing when selectPlacements is called', () => {
            const mockCaptureTiming = jest.fn();
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
                undefined,
                mockCaptureTiming
            );
            mockCaptureTiming.mockClear();
 
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.attachKit(kit);

            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;
 
            roktManager.selectPlacements(options);
            expect(mockCaptureTiming).toHaveBeenCalledWith(PerformanceMarkType.JointSdkSelectPlacements);
            expect(mockCaptureTiming).toHaveBeenCalledTimes(1);
        });
 
        it('should capture jointSdkSelectPlacements timing even when kit is not ready (deferred call)', () => {
            const mockCaptureTiming = jest.fn();
            roktManager.init(
                {} as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
                undefined,
                mockCaptureTiming
            );
            mockCaptureTiming.mockClear();
 
            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;
 
            roktManager.selectPlacements(options);
            expect(mockCaptureTiming).toHaveBeenCalledWith(PerformanceMarkType.JointSdkSelectPlacements);
            expect(mockCaptureTiming).toHaveBeenCalledTimes(1);
        });

        it('should call kit.selectPlacements with empty attributes', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
            expect(roktManager['messageQueue'].size).toBe(1);
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            expect(queuedMessage.methodName).toBe('selectPlacements');
            expect(queuedMessage.payload).toBe(options);
        });

        it('should process queued selectPlacements calls once the launcher and kit are attached', async () => {
            const expectedResult = { placements: ['placement1', 'placement2'] };
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn().mockResolvedValue(expectedResult),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            // Ensure store has identityCallInFlight set to false (from beforeEach)
            // This prevents re-queuing when selectPlacements is called from the queue
            roktManager['store'].identityCallInFlight = false;

            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            // Start the async operation (doesn't await yet)
            const selectionPromiseTask = (async () => await roktManager.selectPlacements(options))();

            expect(selectionPromiseTask).toBeInstanceOf(Promise);

            // Give it a moment to queue the message
            await resolvePromise();
            
            // Verify the call was queued
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].size).toBe(1);
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            expect(queuedMessage.methodName).toBe('selectPlacements');
            expect(queuedMessage.payload).toBe(options);
            expect(queuedMessage.messageId).toBeDefined();

            // Attach kit (should trigger processing of queued messages)
            roktManager.attachKit(kit);
            
            // Now await the promise task to verify the actual result
            const result = await selectionPromiseTask;
            
            expect(roktManager['kit']).not.toBeNull();
            expect(roktManager['messageQueue'].size).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
            expect(result).toEqual(expectedResult);
        });

        it('should pass through the correct attributes to kit.selectPlacements', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
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
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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

        it('should pass sandbox flag as an attribute through to kit.selectPlacements', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                hashAttributes: jest.fn(),
                userAttributes: undefined,
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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

        it('should pass mapped attributes to kit.launcher.selectPlacements', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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

        it('should not set reserved attributes on the current user', async () => {
            const setUserAttributesSpy = jest.fn();
            // Configure current user with matching email to bypass identify flow so
            // we can focus on testing that reserved attributes are filtered out
            mockMPInstance.Identity.getCurrentUser = jest.fn().mockReturnValue({
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'test@example.com'
                    }
                }),
                setUserAttributes: setUserAttributesSpy,
            });

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'sandbox': true,
                    'email': 'test@example.com'
                }
            };

            await roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
            expect(setUserAttributesSpy).not.toHaveBeenCalledWith({
                sandbox: true
            });
        });

        it('should stringify array attributes and preserve primitives when setting on current user', async () => {
            const setUserAttributesSpy = jest.fn();
            mockMPInstance.Identity.getCurrentUser = jest.fn().mockReturnValue({
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'test@example.com'
                    }
                }),
                setUserAttributes: setUserAttributesSpy,
            });
            mockMPInstance.Identity.identify = jest.fn().mockImplementation((data, callback) => {
                callback();
            });

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'favorite_colors': ['blue', 'green'],
                    'cartItems': ['item 1', 'item 2', 'item 3'],
                    'email': 'test@example.com',
                    'age': 29,
                    'active': true,
                    'nullValue': null
                }
            };

            await roktManager.selectPlacements(options);
            expect(setUserAttributesSpy).toHaveBeenCalledWith({
                favorite_colors: JSON.stringify(['blue', 'green']),
                cartItems: JSON.stringify(['item 1', 'item 2', 'item 3']),
                email: 'test@example.com',
                age: 29,
                active: true,
                nullValue: null
            });
        });

        it('should not stringify reserved attributes and should filter them out', async () => {
            const setUserAttributesSpy = jest.fn();
            // Configure current user with matching email to bypass identify flow so
            // we can focus on the interaction between setting user attributes when making
            // a selectPlacements call.
            mockMPInstance.Identity.getCurrentUser = jest.fn().mockReturnValue({
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'test@example.com'
                    }
                }),
                setUserAttributes: setUserAttributesSpy,
            });

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    'sandbox': ['test', 'array'],
                    'email': 'test@example.com',
                    'favorite_colors': ['blue', 'green']
                }
            };

            await roktManager.selectPlacements(options);
            expect(setUserAttributesSpy).toHaveBeenCalledWith({
                email: 'test@example.com',
                favorite_colors: JSON.stringify(['blue', 'green'])
            });
            expect(setUserAttributesSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    sandbox: expect.anything()
                })
            );
        });

        it('should call identify with new email when it differs from current user email', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
                'Email mismatch detected. Current email differs from email passed to selectPlacements call. Proceeding to call identify with email from selectPlacements call. Please verify your implementation.'
            );
        });

        it('should not call identify when email matches current user email', () => {
            // Reset mocks
            jest.clearAllMocks();
            
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
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
            expect(mockMPInstance.Logger.warning).toHaveBeenCalled();
        });

        it('should not call identify when user has current email but no email is passed to selectPlacements', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };
            
            roktManager['placementAttributesMapping'] = [];
            roktManager.kit = kit as IRoktKit;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'existing@example.com'
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
                    // No email attribute passed
                    // customAttribute: 'some-value'
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockIdentity.identify).not.toHaveBeenCalled();
            expect(mockMPInstance.Logger.warning).not.toHaveBeenCalled();
        });

        it('should call identify with emailsha256 mapped to other5 when it differs from current user other5 identity', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['mappedEmailShaIdentityType'] ='other5';

            // Set up fresh mocks for this test
            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            other5: 'old-other-value'
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
                    emailsha256: 'new-emailsha256-value'
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockIdentity.identify).toHaveBeenCalledWith({
                userIdentities: {
                    other5: 'new-emailsha256-value'
                }
            }, expect.any(Function));
            expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(
                "emailsha256 mismatch detected. Current mParticle hashedEmail differs from hashedEmail passed to selectPlacements call. Proceeding to call identify with hashedEmail from selectPlacements call. Please verify your implementation."
            );
        });

        it('should not call identify when emailsha256 matches current user other5 identity', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['mappedEmailShaIdentityType'] = 'other5';

            // Set up fresh mocks for this test
            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            other5: 'same-emailsha256-value'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            };

            roktManager['identityService'] = mockIdentity as unknown as SDKIdentityApi;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    emailsha256: 'same-emailsha256-value'
                }
            };

            roktManager.selectPlacements(options);

            expect(mockIdentity.identify).not.toHaveBeenCalled();
            expect(mockMPInstance.Logger.warning).not.toHaveBeenCalled();
        });

        it('should call identify with emailsha256 mapped to other when current user has no other identity', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['mappedEmailShaIdentityType'] = 'other';

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
                    emailsha256: 'new-emailsha256-value'
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockIdentity.identify).toHaveBeenCalledWith({
                userIdentities: {
                    other: 'new-emailsha256-value'
                }
            }, expect.any(Function));
            expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(
                "emailsha256 mismatch detected. Current mParticle hashedEmail differs from hashedEmail passed to selectPlacements call. Proceeding to call identify with hashedEmail from selectPlacements call. Please verify your implementation."
            );
        });

        it('should not call identify when current user has other identity but emailsha256 is null', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['hashedEmailUserIdentityType'] = 'Other';

            // Set up fresh mocks for this test
            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            other: 'existing-other-value'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            };

            roktManager['identityService'] = mockIdentity as unknown as SDKIdentityApi;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    // emailsha256 is not provided (null/undefined)
                }
            };

            roktManager.selectPlacements(options);

            expect(mockIdentity.identify).not.toHaveBeenCalled();
            expect(mockMPInstance.Logger.warning).not.toHaveBeenCalled();
        });

        it('should propagate email from current user identities to kit.selectPlacements when not in attributes', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };
            
            roktManager['placementAttributesMapping'] = [];
            roktManager.kit = kit as IRoktKit;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => testMPID,
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'user@example.com'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;
            allowEveryIdentity(roktManager);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    firstname: 'John',
                    lastname: 'Doe'
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockIdentity.identify).not.toHaveBeenCalled();
            expect(kit.selectPlacements).toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: expect.objectContaining({
                        email: 'user@example.com',
                        firstname: 'John',
                        lastname: 'Doe'
                    })
                })
            );
        });

        it('should propagate emailsha256 from current user identities to kit.selectPlacements when not in attributes', async () => {
            const testRoktManager = new RoktManager();
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };
            
            testRoktManager.init(
                {
                    settings: {
                        hashedEmailUserIdentityType: 'other5'
                    }
                } as unknown as IKitConfigs,
                {} as IMParticleUser,
                mockMPInstance.Identity,
                mockMPInstance._Store,
                mockMPInstance.Logger,
            );
            testRoktManager['placementAttributesMapping'] = [];
            testRoktManager.kit = kit as IRoktKit;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => testMPID,
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'user@example.com',
                            other5: 'hashed-email-value-12345'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            testRoktManager['identityService'] = mockIdentity;
            allowEveryIdentity(testRoktManager);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    firstname: 'John'
                }
            };

            await testRoktManager.selectPlacements(options);

            expect(mockIdentity.identify).not.toHaveBeenCalled();
            expect(kit.selectPlacements).toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: expect.objectContaining({
                        email: 'user@example.com',
                        emailsha256: 'hashed-email-value-12345',
                        firstname: 'John'
                    })
                })
            );
        });

        it('should propagate email after identify completes when identify is called during init', async () => {
            // Set initial currentUser with first email to mimic real user flow
            roktManager['currentUser'] = {
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'first@gmail.com'
                    }
                }),
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };
            
            roktManager['placementAttributesMapping'] = [];
            roktManager.kit = kit as IRoktKit;

            let identifyCallback: (() => void) | null = null;
            let identifyResolve: (() => void) | null = null;
            const identifyPromise = new Promise<void>((resolve) => {
                identifyResolve = resolve;
            });

            const userWithEmail = {
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'user@example.com'
                    }
                }),
                setUserAttributes: jest.fn()
            };
            
            const mockIdentity = {
                getCurrentUser: jest.fn()
                    .mockReturnValueOnce({
                        getMPID: () => testMPID,
                        getUserIdentities: () => ({
                            userIdentities: {}
                        }),
                        setUserAttributes: jest.fn()
                    })
                    .mockReturnValue(userWithEmail),
                identify: jest.fn().mockImplementation((data, callback) => {
                    identifyCallback = callback;
                    setTimeout(() => {
                        if (identifyCallback) {
                            identifyCallback();
                        }
                        if (identifyResolve) {
                            identifyResolve();
                        }
                    }, 150);
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;
            allowEveryIdentity(roktManager);

            // Create a store mock that simulates identity call in flight
            const mockStore: any = {
                identityCallInFlight: true
            };
            roktManager['store'] = mockStore as IStore;

            mockIdentity.identify({
                userIdentities: {
                    email: 'user@example.com'
                }
            }, () => {});

            // Simulate identity call completing after a delay
            const identityCompletePromise = new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockStore.identityCallInFlight = false;
                    resolve();
                }, 150);
            });

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    firstname: 'John'
                }
            };

            const selectPlacementsPromise = roktManager.selectPlacements(options);
            
            // Verify it was queued (not called yet)
            expect(kit.selectPlacements).not.toHaveBeenCalled();
            expect(roktManager['messageQueue'].size).toBe(1);

            // Wait for identity to complete
            await identityCompletePromise;
            await identifyPromise;
            
            // Ensure setTimeout has completed
            await new Promise(resolve => setTimeout(resolve, 10));

            // Process queued messages (simulating what identity.js does)
            roktManager.onIdentityComplete();
            
            // Wait for async processing to complete
            await resolvePromise();

            // Wait for selectPlacements to finish
            await selectPlacementsPromise;

            expect(kit.selectPlacements).toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: expect.objectContaining({
                        email: 'user@example.com',
                        firstname: 'John'
                    })
                })
            );
        });

        it('should not override email in attributes with current user email', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };
            
            roktManager['placementAttributesMapping'] = [];
            roktManager.kit = kit as IRoktKit;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'current@example.com'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn().mockImplementation((data, callback) => {
                    // Call the callback immediately to resolve the Promise
                    if (callback) {
                        callback();
                    }
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'explicit@example.com',
                    firstname: 'John'
                }
            };

            await roktManager.selectPlacements(options);

            expect(kit.selectPlacements).toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: expect.objectContaining({
                        email: 'explicit@example.com',
                        firstname: 'John'
                    })
                })
            );
            expect(kit.selectPlacements).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: expect.objectContaining({
                        email: 'current@example.com'
                    })
                })
            );
        });

        it('should log error when identify callback reports an error but continue execution', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

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
                    // Simulate identify completing with an HTTP 500 error via the callback
                    callback({ httpCode: 500 });
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'new@example.com'
                }
            };

            // Should not reject since identify is fire-and-forget
            await expect(roktManager.selectPlacements(options)).resolves.toBeDefined();
            
            // Verify error was logged from the background callback
            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                'Background identify failed with HTTP 500'
            );

            // Verify selectPlacements was still called
            expect(kit.selectPlacements).toHaveBeenCalled();
        });

        it('should log error and continue when identify throws synchronously', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const mockError = new Error('Identity service unavailable');
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

            // Should not reject — the try/catch absorbs the synchronous throw
            await expect(roktManager.selectPlacements(options)).resolves.toBeDefined();

            // Verify the synchronous throw was logged
            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                'Background identify threw an error: ' + mockError.message
            );

            // Verify selectPlacements was still called
            expect(kit.selectPlacements).toHaveBeenCalled();
        });

        it('should update filters.filteredUser with current user before calling kit.selectPlacements', async () => {
            const mockUser = {
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'test@example.com'
                    }
                }),
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['placementAttributesMapping'] = [];

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue(mockUser),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;
            allowEveryIdentity(roktManager);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {}
            };

            await roktManager.selectPlacements(options);

            // Verify filters.filteredUser was updated with current user
            expect(roktManager.filters.filteredUser).toBe(mockUser);
            expect(kit.selectPlacements).toHaveBeenCalled();
        });

        it('should update filters.filteredUser when getCurrentUser returns a different user', async () => {
            const initialUser = {
                getMPID: () => 'initial-mpid',
                getUserIdentities: () => ({ userIdentities: {} }),
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            const updatedUser = {
                getMPID: () => testMPID,
                getUserIdentities: () => ({
                    userIdentities: {
                        email: 'updated@example.com'
                    }
                }),
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['placementAttributesMapping'] = [];
            roktManager.filters.filteredUser = initialUser;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue(updatedUser),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;
            allowEveryIdentity(roktManager);

            const options: IRoktSelectPlacementsOptions = {
                attributes: {}
            };

            await roktManager.selectPlacements(options);

            // Verify filters.filteredUser was updated to the new user
            expect(roktManager.filters.filteredUser).toBe(updatedUser);
            expect(roktManager.filters.filteredUser).not.toBe(initialUser);
        });

        it('should queue selectPlacements when identity call is in flight', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['placementAttributesMapping'] = [];

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({ userIdentities: {} }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;
            
            // Use the store from beforeEach and set identityCallInFlight to true
            roktManager['store'].identityCallInFlight = true;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {}
            };

            // Call selectPlacements while identity is in flight - should be queued
            const selectPlacementsPromise = roktManager.selectPlacements(options);
            
            // Give it a moment to queue the message
            await resolvePromise();
            
            // Verify it was queued (not called yet)
            expect(kit.selectPlacements).not.toHaveBeenCalled();
            expect(roktManager['messageQueue'].size).toBe(1);

            // Simulate identity call completing
            roktManager['store'].identityCallInFlight = false;
            
            // Process queued messages (simulating what identity.js does)
            roktManager.onIdentityComplete();
            
            // Wait for async processing to complete
            await resolvePromise();
            
            // Now await the promise task to verify the actual result
            await selectPlacementsPromise;

            // Verify selectPlacements was called after processing the queue
            expect(roktManager['messageQueue'].size).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalled();
        });

        it('should set filters.filteredUser with the current user at call time when identify is fired in background', async () => {
            const anonymousUser = {
                getMPID: () => 'anonymous-mpid',
                getUserIdentities: () => ({
                    userIdentities: {}
                }),
                setUserAttributes: jest.fn()
            } as unknown as IMParticleUser;

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;
            roktManager['placementAttributesMapping'] = [];
            
            // Start with anonymous user (no email)
            roktManager.filters.filteredUser = anonymousUser;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue(anonymousUser),
                identify: jest.fn().mockImplementation((data, callback) => {
                    // Simulate identify completing in background
                    callback();
                })
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'user@example.com'
                }
            };

            await roktManager.selectPlacements(options);

            // Verify identify was fired
            expect(mockIdentity.identify).toHaveBeenCalledWith({
                userIdentities: {
                    email: 'user@example.com'
                }
            }, expect.any(Function));

            // filters.filteredUser reflects the user at call time (before identify completes)
            expect(roktManager.filters.filteredUser).toBe(anonymousUser);
            expect(roktManager.filters.filteredUser?.getMPID()).toBe('anonymous-mpid');

            // Verify kit was still called
            expect(kit.selectPlacements).toHaveBeenCalled();
        });

        describe("when the Rokt connection's filters or the data plan exclude identities", () => {
            const storedCustomerId = 'customer-1';
            const storedEmail = 'stored@example.com';
            const storedHashedEmail = 'stored-email-sha256';
            const dataPlanAllowingOnlyCustomerId = ({
                document: {
                    dtpn: {
                        blok: { ev: false, ea: false, ua: false, id: true },
                        vers: {
                            version_document: {
                                data_points: [
                                    {
                                        match: { type: 'user_identities' },
                                        validator: {
                                            type: 'json_schema',
                                            definition: {
                                                additionalProperties: false,
                                                properties: { customerid: {} },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            } as unknown) as KitBlockerDataPlan;

            let storedIdentities: Dictionary<string>;
            let currentUserIdentities: Dictionary<string>;
            let identityService: SDKIdentityApi;
            let kit: Partial<IRoktKit>;

            const sentAttributes = () => (kit.selectPlacements as jest.Mock).mock.calls[0][0].attributes;
            const kitUserIdentities = () => roktManager.filters.filteredUser.getUserIdentities().userIdentities;
            const verboseLogs = () =>
                (mockMPInstance.Logger.verbose as jest.Mock).mock.calls.map(([message]) => message).join('\n');

            const initWithFilters = (userIdentityFilters: number[], dataPlan?: KitBlockerDataPlan) => {
                const mpInstance = ({
                    _Store: {
                        getUserIdentities: () => storedIdentities,
                        getUserAttributes: () => ({}),
                    },
                    Logger: mockMPInstance.Logger,
                } as unknown) as IMParticleWebSDKInstance;
                mpInstance._Helpers = new Helpers(mpInstance);
                const kitBlocker = dataPlan ? new KitBlocker(dataPlan, mpInstance) : undefined;

                roktManager.init(
                    ({
                        userIdentityFilters,
                        userAttributeFilters: [],
                        settings: { hashedEmailUserIdentityType: 'Other5' },
                    } as unknown) as IKitConfigs,
                    {} as IMParticleUser,
                    identityService,
                    mockMPInstance._Store,
                    mockMPInstance.Logger,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    (mpid) =>
                        (filteredMparticleUser(
                            mpid,
                            { userAttributeFilters: [], userIdentityFilters },
                            mpInstance,
                            kitBlocker
                        ) as unknown) as IMParticleUser
                );
                roktManager.kit = kit as IRoktKit;
            };

            beforeEach(() => {
                storedIdentities = {
                    [IdentityType.CustomerId]: storedCustomerId,
                    [IdentityType.Email]: storedEmail,
                    [IdentityType.Other5]: storedHashedEmail,
                };
                currentUserIdentities = {
                    customerid: storedCustomerId,
                    email: storedEmail,
                    other5: storedHashedEmail,
                };
                identityService = ({
                    getCurrentUser: jest.fn(() => ({
                        getMPID: () => testMPID,
                        getUserIdentities: () => ({ userIdentities: currentUserIdentities }),
                        setUserAttributes: jest.fn(),
                    })),
                    identify: jest.fn(),
                } as unknown) as SDKIdentityApi;
                kit = {
                    launcher: {
                        selectPlacements: jest.fn(),
                        hashAttributes: jest.fn(),
                        use: jest.fn(),
                    },
                    selectPlacements: jest.fn().mockResolvedValue({}),
                    hashAttributes: jest.fn(),
                    setExtensionData: jest.fn(),
                };
            });

            it("should leave identities filtered on the Rokt connection out of the kit's user and the enriched attributes", async () => {
                initWithFilters([IdentityType.Email, IdentityType.Other5]);

                await roktManager.selectPlacements({ attributes: {} });

                expect(sentAttributes()).not.toHaveProperty('email');
                expect(sentAttributes()).not.toHaveProperty('emailsha256');
                expect(kitUserIdentities()).toEqual({ customerid: storedCustomerId });
            });

            it("should leave identities the data plan blocks out of the kit's user and the enriched attributes", async () => {
                initWithFilters([], dataPlanAllowingOnlyCustomerId);

                await roktManager.selectPlacements({ attributes: {} });

                expect(sentAttributes()).not.toHaveProperty('email');
                expect(sentAttributes()).not.toHaveProperty('emailsha256');
                expect(kitUserIdentities()).toEqual({ customerid: storedCustomerId });
            });

            it('should still send an email that an identify call in flight adds when the connection allows it', async () => {
                const freshEmail = 'fresh@example.com';
                storedIdentities = { [IdentityType.CustomerId]: storedCustomerId };
                currentUserIdentities = { customerid: storedCustomerId };
                initWithFilters([IdentityType.CustomerId]);
                roktManager['store'].identityCallInFlight = true;

                const selection = roktManager.selectPlacements({ attributes: {} });
                expect(kit.selectPlacements).not.toHaveBeenCalled();

                storedIdentities = { ...storedIdentities, [IdentityType.Email]: freshEmail };
                currentUserIdentities = { ...currentUserIdentities, email: freshEmail };
                roktManager['store'].identityCallInFlight = false;
                roktManager.onIdentityComplete();
                await selection;

                expect(sentAttributes()).toHaveProperty('email', freshEmail);
                expect(kitUserIdentities()).toEqual({ email: freshEmail });
                expect(verboseLogs()).not.toContain('did not add');
            });

            it('should still send a hashed email that an identify call in flight adds when the connection allows it', async () => {
                const freshEmail = 'fresh@example.com';
                const freshHashedEmail = 'fresh-email-sha256';
                storedIdentities = { [IdentityType.CustomerId]: storedCustomerId };
                currentUserIdentities = { customerid: storedCustomerId };
                initWithFilters([IdentityType.CustomerId, IdentityType.Email]);
                roktManager['store'].identityCallInFlight = true;

                const selection = roktManager.selectPlacements({ attributes: {} });
                expect(kit.selectPlacements).not.toHaveBeenCalled();

                storedIdentities = {
                    ...storedIdentities,
                    [IdentityType.Email]: freshEmail,
                    [IdentityType.Other5]: freshHashedEmail,
                };
                currentUserIdentities = { ...currentUserIdentities, email: freshEmail, other5: freshHashedEmail };
                roktManager['store'].identityCallInFlight = false;
                roktManager.onIdentityComplete();
                await selection;

                expect(sentAttributes()).toHaveProperty('emailsha256', freshHashedEmail);
                expect(sentAttributes()).not.toHaveProperty('email');
                expect(kitUserIdentities()).toEqual({ other5: freshHashedEmail });
            });

            it('should log the type of each identity the connection filters, never its value', async () => {
                initWithFilters([IdentityType.Email, IdentityType.Other5]);

                await roktManager.selectPlacements({ attributes: {} });

                expect(verboseLogs()).toContain('did not add the email user identity');
                expect(verboseLogs()).toContain('did not add the other5 user identity');
                expect(verboseLogs()).not.toContain(storedEmail);
                expect(verboseLogs()).not.toContain(storedHashedEmail);
            });

            it("should add no identity and keep the startup user for the kit when init gets no filtered user builder", async () => {
                const startupUser = {} as IMParticleUser;
                roktManager.init(
                    ({ userAttributeFilters: [], settings: { hashedEmailUserIdentityType: 'Other5' } } as unknown) as IKitConfigs,
                    startupUser,
                    identityService,
                    mockMPInstance._Store,
                    mockMPInstance.Logger
                );
                roktManager.kit = kit as IRoktKit;

                await roktManager.selectPlacements({ attributes: {} });

                expect(sentAttributes()).not.toHaveProperty('email');
                expect(sentAttributes()).not.toHaveProperty('emailsha256');
                expect(roktManager.filters.filteredUser).toBe(startupUser);
            });

            it("should pass the partner's own attributes through and identify with every identity", async () => {
                const passedAttributes = {
                    email: 'partner@example.com',
                    emailsha256: 'partner-email-sha256',
                };
                initWithFilters([IdentityType.CustomerId, IdentityType.Email, IdentityType.Other5]);

                await roktManager.selectPlacements({ attributes: passedAttributes });

                expect(sentAttributes()).toEqual(passedAttributes);
                expect(identityService.identify).toHaveBeenCalledWith(
                    {
                        userIdentities: {
                            customerid: storedCustomerId,
                            email: passedAttributes.email,
                            other5: passedAttributes.emailsha256,
                        },
                    },
                    expect.any(Function)
                );
            });
        });

        describe('user attributes when the passed email starts an identify', () => {
            type IdentifyCallback = (result?: unknown) => void;

            const currentEmail = 'current@example.com';
            const passedEmail = 'passed@example.com';
            const passedAttributes = {
                email: passedEmail,
                firstname: 'Jane',
                interests: ['books', 'music'],
                sandbox: true,
            };
            const expectedUserAttributes = {
                email: passedEmail,
                firstname: 'Jane',
                interests: JSON.stringify(['books', 'music']),
            };
            const expectedLauncherOptions = JSON.stringify([{ attributes: passedAttributes }]);
            const unresolvedIdentityWarning =
                'selectPlacements attributes were not set because identify did not resolve to a user with the passed email or hashed email.';
            const noUserWarning = 'selectPlacements attributes were not set because there is no user to set them on.';

            let kit: Partial<IRoktKit>;
            let identify: jest.Mock;
            let completeIdentify: IdentifyCallback;

            const createUser = (mpid: string, userIdentities: Record<string, string>) =>
                ({
                    getMPID: () => mpid,
                    getUserIdentities: () => ({ userIdentities }),
                    setUserAttributes: jest.fn(),
                } as unknown as IMParticleUser);

            const identifyResult = (httpCode: number, user: IMParticleUser | null) => ({
                httpCode,
                getUser: () => user,
            });

            const useIdentityService = (currentUser: IMParticleUser) => {
                identify = jest.fn((_identityApiData, callback: IdentifyCallback) => {
                    completeIdentify = callback;
                });
                roktManager['identityService'] = {
                    getCurrentUser: jest.fn().mockReturnValue(currentUser),
                    identify,
                } as unknown as SDKIdentityApi;
            };

            const writesByMPID = (...users: IMParticleUser[]) => {
                const writes: Record<string, unknown[]> = {};
                users.forEach((user) => {
                    (user.setUserAttributes as jest.Mock).mock.calls.forEach(([attributes]) => {
                        writes[user.getMPID()] = [...(writes[user.getMPID()] || []), attributes];
                    });
                });
                return writes;
            };

            const launcherOptions = () =>
                JSON.stringify((kit.selectPlacements as jest.Mock).mock.calls.map(([options]) => options));

            beforeEach(() => {
                kit = {
                    launcher: {
                        selectPlacements: jest.fn(),
                        hashAttributes: jest.fn(),
                        use: jest.fn(),
                    },
                    selectPlacements: jest.fn().mockResolvedValue({}),
                    hashAttributes: jest.fn(),
                    setExtensionData: jest.fn(),
                    use: jest.fn(),
                    onShoppableAdsReady: jest.fn(),
                };
                roktManager.kit = kit as IRoktKit;
                roktManager['placementAttributesMapping'] = [];
                allowEveryIdentity(roktManager);
            });

            it('writes them to the user identify resolves to, not to the current user', async () => {
                const currentUser = createUser('current-mpid', { email: currentEmail });
                const resolvedUser = createUser('resolved-mpid', { email: passedEmail });
                useIdentityService(currentUser);

                const selection = roktManager.selectPlacements({ attributes: passedAttributes });

                expect(launcherOptions()).toBe(expectedLauncherOptions);
                expect(writesByMPID(currentUser, resolvedUser), 'nothing is written before identify completes').toEqual({});

                completeIdentify(identifyResult(200, resolvedUser));
                await selection;

                expect(writesByMPID(currentUser, resolvedUser)).toEqual({
                    'resolved-mpid': [expectedUserAttributes],
                });
                expect(launcherOptions()).toBe(expectedLauncherOptions);
            });

            it('writes the values they had when selectPlacements was called', async () => {
                const currentUser = createUser('current-mpid', { email: currentEmail });
                const resolvedUser = createUser('resolved-mpid', { email: passedEmail });
                const interests = ['books'];
                useIdentityService(currentUser);

                const selection = roktManager.selectPlacements({ attributes: { email: passedEmail, interests } });
                interests.push('music');
                completeIdentify(identifyResult(200, resolvedUser));
                await selection;

                expect(writesByMPID(resolvedUser)).toEqual({
                    'resolved-mpid': [{ email: passedEmail, interests: JSON.stringify(['books']) }],
                });
            });

            it('writes them to the same MPID once identify completes when an anonymous user gains a first email', async () => {
                const anonymousUser = createUser('anonymous-mpid', {});
                const identifiedUser = createUser('anonymous-mpid', { email: passedEmail });
                useIdentityService(anonymousUser);

                const selection = roktManager.selectPlacements({ attributes: passedAttributes });

                expect(identify).toHaveBeenCalledTimes(1);
                expect(writesByMPID(anonymousUser, identifiedUser), 'nothing is written before identify completes').toEqual({});

                completeIdentify(identifyResult(200, identifiedUser));
                await selection;

                expect(writesByMPID(anonymousUser, identifiedUser)).toEqual({
                    'anonymous-mpid': [expectedUserAttributes],
                });
                expect(launcherOptions()).toBe(expectedLauncherOptions);
            });

            it.each([202, 400, -1])(
                'does not write them when identify completes with code %s and the current user keeps a different email',
                async (httpCode) => {
                    const currentUser = createUser('current-mpid', { email: currentEmail });
                    useIdentityService(currentUser);

                    const selection = roktManager.selectPlacements({ attributes: passedAttributes });
                    completeIdentify(identifyResult(httpCode, currentUser));
                    await selection;

                    expect(writesByMPID(currentUser)).toEqual({});
                    expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(unresolvedIdentityWarning);
                    expect(launcherOptions()).toBe(expectedLauncherOptions);
                }
            );

            it('writes them to an anonymous current user when identify fails', async () => {
                const anonymousUser = createUser('anonymous-mpid', {});
                useIdentityService(anonymousUser);

                const selection = roktManager.selectPlacements({ attributes: passedAttributes });
                completeIdentify(identifyResult(-1, anonymousUser));
                await selection;

                expect(writesByMPID(anonymousUser)).toEqual({
                    'anonymous-mpid': [expectedUserAttributes],
                });
                expect(mockMPInstance.Logger.warning).not.toHaveBeenCalledWith(unresolvedIdentityWarning);
                expect(launcherOptions()).toBe(expectedLauncherOptions);
            });

            it('does not write them when identify throws and the current user has a different email', async () => {
                const currentUser = createUser('current-mpid', { email: currentEmail });
                useIdentityService(currentUser);
                identify.mockImplementation(() => {
                    throw new Error('identify unavailable');
                });

                await roktManager.selectPlacements({ attributes: passedAttributes });

                expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                    'Background identify threw an error: identify unavailable'
                );
                expect(writesByMPID(currentUser)).toEqual({});
                expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(unresolvedIdentityWarning);
                expect(launcherOptions()).toBe(expectedLauncherOptions);
            });

            it('writes them to an anonymous current user when identify throws', async () => {
                const anonymousUser = createUser('anonymous-mpid', {});
                useIdentityService(anonymousUser);
                identify.mockImplementation(() => {
                    throw new Error('identify unavailable');
                });

                await roktManager.selectPlacements({ attributes: passedAttributes });

                expect(writesByMPID(anonymousUser)).toEqual({
                    'anonymous-mpid': [expectedUserAttributes],
                });
                expect(launcherOptions()).toBe(expectedLauncherOptions);
            });

            it.each([
                ['no result', undefined],
                ['a result without getUser', { httpCode: 200 }],
                ['a result whose user is null', identifyResult(200, null)],
            ])('does not write them when identify completes with %s', async (_description, result) => {
                const currentUser = createUser('current-mpid', { email: currentEmail });
                useIdentityService(currentUser);

                const selection = roktManager.selectPlacements({ attributes: passedAttributes });
                completeIdentify(result);
                await selection;

                expect(writesByMPID(currentUser)).toEqual({});
                expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(noUserWarning);
                expect(mockMPInstance.Logger.error).not.toHaveBeenCalledWith(
                    expect.stringContaining('Error setting user attributes')
                );
                expect(launcherOptions()).toBe(expectedLauncherOptions);
            });

            it('does not write them, and logs no error, when there is no current user and no passed email', () => {
                useIdentityService(null);

                void roktManager.selectPlacements({ attributes: { firstname: 'Jane' } });

                expect(identify).not.toHaveBeenCalled();
                expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(noUserWarning);
                expect(mockMPInstance.Logger.error).not.toHaveBeenCalledWith(
                    expect.stringContaining('Error setting user attributes')
                );
                expect(launcherOptions()).toBe(JSON.stringify([{ attributes: { firstname: 'Jane' } }]));
            });

            it('does not write them, and still runs queued calls, when the resolved user cannot report its identities', async () => {
                const currentUser = createUser('current-mpid', { email: currentEmail });
                const unreadableUser = {
                    getMPID: () => 'resolved-mpid',
                    getUserIdentities: () => {
                        throw new Error('identities unavailable');
                    },
                    setUserAttributes: jest.fn(),
                } as unknown as IMParticleUser;
                const laterUser = createUser('later-mpid', {});
                useIdentityService(currentUser);

                const selection = roktManager.selectPlacements({ attributes: passedAttributes });
                roktManager['store'].identityCallInFlight = true;
                const queuedSelection = roktManager.selectPlacements({ attributes: { firstname: 'Janet' } });
                roktManager['store'].identityCallInFlight = false;
                (roktManager['identityService'].getCurrentUser as jest.Mock).mockReturnValue(laterUser);

                expect(() => completeIdentify(identifyResult(200, unreadableUser))).not.toThrow();
                await Promise.all([selection, queuedSelection]);

                expect(writesByMPID(currentUser, unreadableUser, laterUser)).toEqual({
                    'later-mpid': [{ firstname: 'Janet' }],
                });
                expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                    'Error setting user attributes: Error: identities unavailable'
                );
                expect(launcherOptions()).toBe(
                    JSON.stringify([{ attributes: passedAttributes }, { attributes: { firstname: 'Janet' } }])
                );
            });

            it('writes them before running selectPlacements calls queued behind the identify', async () => {
                const currentUser = createUser('current-mpid', { email: currentEmail });
                const resolvedUser = createUser('resolved-mpid', { email: passedEmail });
                useIdentityService(currentUser);

                const selection = roktManager.selectPlacements({ attributes: passedAttributes });
                roktManager['store'].identityCallInFlight = true;
                const queuedSelection = roktManager.selectPlacements({
                    attributes: { email: passedEmail, firstname: 'Janet' },
                });
                roktManager['store'].identityCallInFlight = false;
                (roktManager['identityService'].getCurrentUser as jest.Mock).mockReturnValue(resolvedUser);

                completeIdentify(identifyResult(200, resolvedUser));
                await Promise.all([selection, queuedSelection]);

                expect(writesByMPID(currentUser, resolvedUser)).toEqual({
                    'resolved-mpid': [expectedUserAttributes, { email: passedEmail, firstname: 'Janet' }],
                });
                expect(launcherOptions()).toBe(
                    JSON.stringify([
                        { attributes: passedAttributes },
                        { attributes: { email: passedEmail, firstname: 'Janet' } },
                    ])
                );
            });

            it('applies the same rule to a hashed email', async () => {
                roktManager['mappedEmailShaIdentityType'] = 'other5';
                const hashedAttributes = { email: passedEmail, emailsha256: 'passed-hash', firstname: 'Jane' };
                const currentUser = createUser('current-mpid', { email: passedEmail, other5: 'current-hash' });
                const resolvedUser = createUser('resolved-mpid', { email: passedEmail, other5: 'passed-hash' });

                useIdentityService(currentUser);
                const failedSelection = roktManager.selectPlacements({ attributes: hashedAttributes });
                completeIdentify(identifyResult(-1, currentUser));
                await failedSelection;

                useIdentityService(currentUser);
                const resolvedSelection = roktManager.selectPlacements({ attributes: hashedAttributes });
                completeIdentify(identifyResult(200, resolvedUser));
                await resolvedSelection;

                expect(identify).toHaveBeenCalledWith(
                    { userIdentities: { email: passedEmail, other5: 'passed-hash' } },
                    expect.any(Function)
                );
                expect(writesByMPID(currentUser, resolvedUser)).toEqual({
                    'resolved-mpid': [hashedAttributes],
                });
                expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(unresolvedIdentityWarning);
                expect(launcherOptions()).toBe(
                    JSON.stringify([{ attributes: hashedAttributes }, { attributes: hashedAttributes }])
                );
            });

            it.each([
                [
                    'matches the current email',
                    { email: currentEmail, firstname: 'Jane' },
                    { email: currentEmail, firstname: 'Jane' },
                    { email: currentEmail, firstname: 'Jane' },
                ],
                [
                    'is empty',
                    { email: '', firstname: 'Jane' },
                    { email: '', firstname: 'Jane' },
                    { email: currentEmail, firstname: 'Jane' },
                ],
                [
                    'is null',
                    { email: null, firstname: 'Jane' },
                    { email: null, firstname: 'Jane' },
                    { email: currentEmail, firstname: 'Jane' },
                ],
                [
                    'is absent',
                    { firstname: 'Jane' },
                    { firstname: 'Jane' },
                    { firstname: 'Jane', email: currentEmail },
                ],
            ])(
                'writes them to the current user synchronously when the passed email %s',
                (_description, attributes, userAttributes, launcherAttributes) => {
                    const currentUser = createUser('current-mpid', { email: currentEmail });
                    useIdentityService(currentUser);

                    void roktManager.selectPlacements({ attributes });

                    expect(identify).not.toHaveBeenCalled();
                    expect(writesByMPID(currentUser)).toEqual({ 'current-mpid': [userAttributes] });
                    expect(launcherOptions()).toBe(JSON.stringify([{ attributes: launcherAttributes }]));
                }
            );

            it("characterisation: the background identify keeps the current user's other identities alongside the passed email", () => {
                const currentUser = createUser('current-mpid', {
                    email: currentEmail,
                    customerid: 'customer-1',
                });
                useIdentityService(currentUser);

                void roktManager.selectPlacements({ attributes: passedAttributes });

                expect(identify).toHaveBeenCalledWith(
                    { userIdentities: { email: passedEmail, customerid: 'customer-1' } },
                    expect.any(Function)
                );
            });
        });

        it('should log developer passed attributes via verbose logger', async () => {
            (mockMPInstance.Logger.isVerbose as jest.Mock).mockReturnValue(true);

            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn().mockResolvedValue({}),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.kit = kit as IRoktKit;

            const mockIdentity = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getUserIdentities: () => ({
                        userIdentities: {
                            email: 'test@example.com'
                        }
                    }),
                    setUserAttributes: jest.fn()
                }),
                identify: jest.fn()
            } as unknown as SDKIdentityApi;

            roktManager['identityService'] = mockIdentity;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    email: 'test@example.com',
                    customAttr: 'value',
                }
            };

            await roktManager.selectPlacements(options);

            expect(mockMPInstance.Logger.verbose).toHaveBeenCalledWith(
                `mParticle.Rokt selectPlacements called with attributes:\n${JSON.stringify({ email: 'string', customAttr: 'string' }, null, 2)}`
            );
        });

        describe('passbackconversiontrackingid injection', () => {
            let kit: IRoktKit;

            beforeEach(() => {
                kit = {
                    launcher: {
                        selectPlacements: jest.fn().mockResolvedValue({ close: jest.fn(), getPlacements: jest.fn() }),
                        hashAttributes: jest.fn(),
                        use: jest.fn(),
                    },
                    filters: undefined,
                    filteredUser: undefined,
                    userAttributes: undefined,
                    selectPlacements: jest.fn().mockResolvedValue({ close: jest.fn(), getPlacements: jest.fn() }),
                    hashAttributes: jest.fn(),
                    setExtensionData: jest.fn(),
                    use: jest.fn(),
                    onShoppableAdsReady: jest.fn(),
                };

                roktManager.attachKit(kit);
                roktManager['store'].identityCallInFlight = false;
            });

            it('should inject passbackconversiontrackingid from IntegrationCapture when not provided by partner', async () => {
                roktManager['integrationCapture'] = {
                    capture: jest.fn(),
                    getClickIdsAsIntegrationAttributes: jest.fn().mockReturnValue({
                        1277: { passbackconversiontrackingid: 'rclid-from-capture' },
                    }),
                } as any;

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.objectContaining({
                            passbackconversiontrackingid: 'rclid-from-capture',
                        }),
                    }),
                );
            });

            it('should call capture() before reading to pick up late-arriving IDs', async () => {
                const mockCapture = jest.fn();
                roktManager['integrationCapture'] = {
                    capture: mockCapture,
                    getClickIdsAsIntegrationAttributes: jest.fn().mockReturnValue({
                        1277: { passbackconversiontrackingid: 'fresh-rclid' },
                    }),
                } as any;

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(mockCapture).toHaveBeenCalled();
            });

            it('should not overwrite passbackconversiontrackingid when partner explicitly provides it', async () => {
                roktManager['integrationCapture'] = {
                    capture: jest.fn(),
                    getClickIdsAsIntegrationAttributes: jest.fn().mockReturnValue({
                        1277: { passbackconversiontrackingid: 'rclid-from-capture' },
                    }),
                } as any;

                await roktManager.selectPlacements({
                    attributes: {
                        email: 'user@example.com',
                        passbackconversiontrackingid: 'partner-provided-rclid',
                    },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.objectContaining({
                            passbackconversiontrackingid: 'partner-provided-rclid',
                        }),
                    }),
                );
            });

            it('should not inject passbackconversiontrackingid when IntegrationCapture has no Rokt attributes', async () => {
                roktManager['integrationCapture'] = {
                    capture: jest.fn(),
                    getClickIdsAsIntegrationAttributes: jest.fn().mockReturnValue({}),
                } as any;

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.not.objectContaining({
                            passbackconversiontrackingid: expect.anything(),
                        }),
                    }),
                );
            });

            it('should not inject passbackconversiontrackingid when IntegrationCapture is not provided', async () => {
                roktManager['integrationCapture'] = undefined;

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.not.objectContaining({
                            passbackconversiontrackingid: expect.anything(),
                        }),
                    }),
                );
            });

            describe('from a real IntegrationCapture', () => {
                const originalLocation = window.location;

                const visit = (url: string) => {
                    delete (window as any).location;
                    (window as any).location = { href: url, search: new URL(url).search };
                };

                const passbackIdSentToKit = () =>
                    (kit.selectPlacements as jest.Mock).mock.calls[0][0].attributes.passbackconversiontrackingid;

                afterEach(() => {
                    window.location = originalLocation;
                    deleteAllCookies();
                    window.localStorage.clear();
                });

                it.each([
                    ['rtid', 'all'],
                    ['rclid', 'all'],
                    ['rtid', 'roktonly'],
                    ['rclid', 'roktonly'],
                ] as const)('should inject %s from the URL when a cookie and localStorage hold it too (%s)', async (key, captureMode) => {
                    visit(`https://www.example.com/?${key}=from-url`);
                    window.document.cookie = `${key}=from-cookie`;
                    window.localStorage.setItem(key, 'from-localStorage');
                    roktManager['integrationCapture'] = new IntegrationCapture(captureMode);

                    await roktManager.selectPlacements({ attributes: { email: 'user@example.com' } });

                    expect(passbackIdSentToKit()).toBe('from-url');
                });

                it('should inject a stored Rokt ID when the URL does not carry one', async () => {
                    visit('https://www.example.com/');
                    window.document.cookie = 'rtid=from-cookie';
                    roktManager['integrationCapture'] = new IntegrationCapture('all');

                    await roktManager.selectPlacements({ attributes: { email: 'user@example.com' } });

                    expect(passbackIdSentToKit()).toBe('from-cookie');
                });
            });
        });

        describe('active_time_on_site_ms injection', () => {
            let kit: IRoktKit;

            beforeEach(() => {
                kit = {
                    launcher: {
                        selectPlacements: jest.fn().mockResolvedValue({ close: jest.fn(), getPlacements: jest.fn() }),
                        hashAttributes: jest.fn(),
                        use: jest.fn(),
                    },
                    filters: undefined,
                    filteredUser: undefined,
                    userAttributes: undefined,
                    selectPlacements: jest.fn().mockResolvedValue({ close: jest.fn(), getPlacements: jest.fn() }),
                    hashAttributes: jest.fn(),
                    setExtensionData: jest.fn(),
                    use: jest.fn(),
                    onShoppableAdsReady: jest.fn(),
                };

                roktManager.attachKit(kit);
                roktManager['store'].identityCallInFlight = false;
            });

            it('should inject active_time_on_site_ms from the store time-on-site value', async () => {
                (roktManager['store'].getTimeOnSite as jest.Mock).mockReturnValue(12345);

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.objectContaining({
                            active_time_on_site_ms: 12345,
                        }),
                    }),
                );
            });

            it('should omit active_time_on_site_ms when the timer is not initialized', async () => {
                (roktManager['store'].getTimeOnSite as jest.Mock).mockReturnValue(undefined);

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.not.objectContaining({
                            active_time_on_site_ms: expect.anything(),
                        }),
                    }),
                );
            });

            it('should omit active_time_on_site_ms when the timer reports zero active time', async () => {
                (roktManager['store'].getTimeOnSite as jest.Mock).mockReturnValue(0);

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.not.objectContaining({
                            active_time_on_site_ms: expect.anything(),
                        }),
                    }),
                );
            });

            it('should omit active_time_on_site_ms when getTimeOnSite is unavailable on the store', async () => {
                (roktManager['store'] as Partial<IStore>).getTimeOnSite = undefined;

                await roktManager.selectPlacements({
                    attributes: { email: 'user@example.com' },
                });

                expect(kit.selectPlacements).toHaveBeenCalledWith(
                    expect.objectContaining({
                        attributes: expect.not.objectContaining({
                            active_time_on_site_ms: expect.anything(),
                        }),
                    }),
                );
            });
        });
    });

    describe('#setExtensionData', () => {
        it('should call kit.setExtensionData with the correct extension data', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn(),
                    use: jest.fn(),
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
            expect(roktManager['messageQueue'].size).toBe(1);
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            expect(queuedMessage.methodName).toBe('setExtensionData');
            expect(queuedMessage.payload).toBe(extensionData);
        });

        it('should process queued setExtensionData calls once the kit is attached', () => {
            const extensionData = { 'queue-test': { setting: true } };

            roktManager.setExtensionData(extensionData);
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].size).toBe(1);

            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn(),
                    use: jest.fn(),
                },
                setExtensionData: jest.fn()
            };

            roktManager.attachKit(kit as IRoktKit);

            expect(roktManager['kit']).not.toBeNull();
            expect(roktManager['messageQueue'].size).toBe(0);
            expect(kit.setExtensionData).toHaveBeenCalledWith(extensionData);
        });

        it('should throw an error if kit.setExtensionData fails', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn(),
                    use: jest.fn(),
                },
                setExtensionData: jest.fn()
            };

            roktManager.attachKit(kit as IRoktKit);

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

            expect(() => {
                roktManager.setExtensionData(extensionData);
            }).toThrow('Error setting extension data: ' + mockError.message);
        });
    });

    describe('#deferredCall', () => {
        it('should create a deferred promise with unique messageId', () => {
            const testPayload = { test: 'data' };
            
            // Call deferredCall
            const promise = roktManager['deferredCall']<string>('testMethod', testPayload);
            
            // Verify promise was created
            expect(promise).toBeInstanceOf(Promise);
            
            // Verify message was queued with unique messageId
            expect(roktManager['messageQueue'].size).toBe(1);
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            expect(queuedMessage.methodName).toBe('testMethod');
            expect(queuedMessage.payload).toBe(testPayload);
            expect(queuedMessage.messageId).toBeDefined();
            expect(typeof queuedMessage.messageId).toBe('string');
            expect(queuedMessage.messageId).toMatch(/^testMethod_[a-f0-9-]{36}$/i);
            
            // Verify message is tracked in messageQueue with that messageId
            expect(roktManager['messageQueue'].has(queuedMessage.messageId!)).toBe(true);
        });

        it('should generate unique messageIds for multiple calls', () => {
            // Make multiple deferred calls
            const promise1 = roktManager['deferredCall']<string>('method1', { data: 1 });
            const promise2 = roktManager['deferredCall']<string>('method2', { data: 2 });
            const promise3 = roktManager['deferredCall']<string>('method3', { data: 3 });
            
            // Verify all promises are created
            expect(promise1).toBeInstanceOf(Promise);
            expect(promise2).toBeInstanceOf(Promise);
            expect(promise3).toBeInstanceOf(Promise);
            
            // Verify all messages are queued
            expect(roktManager['messageQueue'].size).toBe(3);
            
            // Extract messageIds
            const queuedMessages = Array.from(roktManager['messageQueue'].values());
            const messageId1 = queuedMessages[0].messageId!;
            const messageId2 = queuedMessages[1].messageId!;
            const messageId3 = queuedMessages[2].messageId!;
            
            // Verify all messageIds are unique
            expect(messageId1).toBeDefined();
            expect(messageId2).toBeDefined();
            expect(messageId3).toBeDefined();
            expect(messageId1).not.toBe(messageId2);
            expect(messageId2).not.toBe(messageId3);
            expect(messageId1).not.toBe(messageId3);
            
            // Verify all are tracked in messageQueue
            expect(roktManager['messageQueue'].has(messageId1)).toBe(true);
            expect(roktManager['messageQueue'].has(messageId2)).toBe(true);
            expect(roktManager['messageQueue'].has(messageId3)).toBe(true);
        });
    });


    describe('#use', () => {
        it('should call kit.use with provided name', async () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.attachKit(kit);

            roktManager.use('ThankYouPageJourney');
            expect(kit.use).toHaveBeenCalledWith('ThankYouPageJourney');
        });

        it('should queue the use method if no launcher or kit is attached', () => {
            roktManager.use('ThankYouPageJourney');

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].size).toBe(1);
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            expect(queuedMessage.methodName).toBe('use');
            expect(queuedMessage.payload).toBe('ThankYouPageJourney');
        });

        it('should process queued use calls once the launcher and kit are attached', async () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            roktManager.use('ThankYouPageJourney');

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].size).toBe(1);
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            expect(queuedMessage.methodName).toBe('use');
            expect(queuedMessage.payload).toBe('ThankYouPageJourney');
            expect(kit.use).not.toHaveBeenCalled();

            roktManager.attachKit(kit);

            expect(roktManager['messageQueue'].size).toBe(0);
            expect(roktManager['kit']).not.toBeNull();
            expect(kit.use).toHaveBeenCalledWith('ThankYouPageJourney');
        });

        it('should pass through to kit.launcher.use and return the value', async () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn().mockResolvedValue('test-use'),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn().mockImplementation((name: string) => (kit.launcher).use(name)),
            };

            roktManager.attachKit(kit as IRoktKit);

            const result = await roktManager.use<string>('ThankYouPageJourney');
            expect(kit.use).toHaveBeenCalledWith('ThankYouPageJourney');
            expect(kit.launcher.use).toHaveBeenCalledWith('ThankYouPageJourney');
            expect(result).toBe('test-use');
        });
    });

    describe('#terminate', () => {
        const makeKit = (): IRoktKit => ({
            launcher: {
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                use: jest.fn(),
            },
            filters: undefined,
            filteredUser: undefined,
            userAttributes: undefined,
            selectPlacements: jest.fn(),
            hashAttributes: jest.fn(),
            setExtensionData: jest.fn(),
            use: jest.fn(),
            onShoppableAdsReady: jest.fn(),
            terminate: jest.fn().mockResolvedValue(undefined),
        });

        it('should call kit.terminate when a kit and launcher are attached', async () => {
            const kit = makeKit();
            roktManager.attachKit(kit);

            await roktManager.terminate();

            expect(kit.terminate).toHaveBeenCalledTimes(1);
        });

        it('should await the kit terminate promise before resolving', async () => {
            const kit = makeKit();
            let settled = false;
            (kit.terminate as jest.Mock).mockImplementation(
                () => new Promise<void>(resolve => setTimeout(() => {
                    settled = true;
                    resolve();
                }, 0))
            );
            roktManager.attachKit(kit);

            await roktManager.terminate();

            expect(settled).toBe(true);
        });

        it('should resolve as a no-op and not queue when no kit is attached', async () => {
            await expect(roktManager.terminate()).resolves.toBeUndefined();

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].size).toBe(0);
            expect(mockMPInstance.Logger.verbose).toHaveBeenCalledWith(
                'mParticle.Rokt.terminate called before the Rokt kit was ready. Nothing to terminate.'
            );
        });

        it('should resolve as a no-op when a kit is attached without a launcher', async () => {
            const kit = makeKit();
            kit.launcher = null;
            roktManager.attachKit(kit);

            await expect(roktManager.terminate()).resolves.toBeUndefined();

            expect(kit.terminate).not.toHaveBeenCalled();
            expect(roktManager['messageQueue'].size).toBe(0);
        });

        it('should log an error when the attached kit predates terminate support', async () => {
            const kit = makeKit();
            delete kit.terminate;
            roktManager.attachKit(kit);

            await expect(roktManager.terminate()).resolves.toBeUndefined();

            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                'mParticle.Rokt.terminate is not supported by the attached Rokt Kit version.'
            );
        });

        it('should log an error and resolve when kit.terminate rejects', async () => {
            const kit = makeKit();
            (kit.terminate as jest.Mock).mockRejectedValue(new Error('teardown failed'));
            roktManager.attachKit(kit);

            await expect(roktManager.terminate()).resolves.toBeUndefined();

            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                'Failed to terminate the Rokt launcher: teardown failed'
            );
        });

        it('should stay ready so repeat calls keep reaching the kit', async () => {
            const kit = makeKit();
            roktManager.attachKit(kit);

            await roktManager.terminate();
            await roktManager.terminate();

            expect(roktManager.isReady()).toBe(true);
            expect(kit.terminate).toHaveBeenCalledTimes(2);
        });
    });

    describe('#onShoppableAdsReady', () => {
        const makeKit = (): IRoktKit => ({
            launcher: {
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                use: jest.fn(),
            },
            filters: undefined,
            filteredUser: undefined,
            userAttributes: undefined,
            selectPlacements: jest.fn(),
            hashAttributes: jest.fn(),
            setExtensionData: jest.fn(),
            use: jest.fn(),
            onShoppableAdsReady: jest.fn(),
        });

        it('should queue the callback when kit is null', () => {
            const callback = jest.fn();

            roktManager.onShoppableAdsReady(callback);

            expect(roktManager['kit']).toBeNull();
            expect(roktManager['messageQueue'].size).toBe(1);
            const queued = Array.from(roktManager['messageQueue'].values())[0];
            expect(queued.methodName).toBe('onShoppableAdsReady');
            expect(queued.payload).toBe(callback);
        });

        it('should queue the callback when kit is attached but isShoppableAdsLoaded is false', () => {
            const kit = makeKit();
            // Attach via attachKit so kit is set, but isShoppableAdsLoaded stays false
            roktManager.attachKit(kit);
            const callback = jest.fn();

            roktManager.onShoppableAdsReady(callback);

            expect(roktManager['isShoppableAdsLoaded']).toBe(false);
            expect(roktManager['messageQueue'].size).toBe(1);
            const queued = Array.from(roktManager['messageQueue'].values())[0];
            expect(queued.methodName).toBe('onShoppableAdsReady');
            expect(queued.payload).toBe(callback);
            expect(kit.onShoppableAdsReady).not.toHaveBeenCalled();
        });

        it('should call kit.onShoppableAdsReady directly when kit is set and isShoppableAdsLoaded is true', () => {
            const kit = makeKit();
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit); // sets kit + isShoppableAdsLoaded = true
            const callback = jest.fn();

            roktManager.onShoppableAdsReady(callback);

            expect(kit.onShoppableAdsReady).toHaveBeenCalledWith(callback);
            expect(roktManager['messageQueue'].size).toBe(0);
        });

        it('should log an error if kit.onShoppableAdsReady throws', () => {
            const kit = makeKit();
            (kit.onShoppableAdsReady as jest.Mock).mockImplementation(() => {
                throw new Error('registration failed');
            });
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            roktManager.onShoppableAdsReady(jest.fn());

            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to register onShoppableAdsReady callback: registration failed')
            );
        });
    });

    describe('#flushOnShoppableAdsReadyMessageQueue', () => {
        const makeKit = (): IRoktKit => ({
            launcher: {
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                use: jest.fn(),
            },
            filters: undefined,
            filteredUser: undefined,
            userAttributes: undefined,
            selectPlacements: jest.fn(),
            hashAttributes: jest.fn(),
            setExtensionData: jest.fn(),
            use: jest.fn(),
            onShoppableAdsReady: jest.fn(),
        });

        it('should set this.kit to the provided kit', () => {
            const kit = makeKit();

            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            expect(roktManager['kit']).toBe(kit);
        });

        it('should set isShoppableAdsLoaded to true', () => {
            const kit = makeKit();

            expect(roktManager['isShoppableAdsLoaded']).toBe(false);
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);
            expect(roktManager['isShoppableAdsLoaded']).toBe(true);
        });

        it('should flush a queued onShoppableAdsReady message by calling kit.onShoppableAdsReady', () => {
            const callback = jest.fn();
            roktManager.onShoppableAdsReady(callback); // queued — no kit yet

            const kit = makeKit();
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            expect(kit.onShoppableAdsReady).toHaveBeenCalledWith(callback);
        });

        it('should flush all queued onShoppableAdsReady messages', () => {
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            roktManager.onShoppableAdsReady(cb1);
            roktManager.onShoppableAdsReady(cb2);

            const kit = makeKit();
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            expect(kit.onShoppableAdsReady).toHaveBeenCalledTimes(2);
            expect(kit.onShoppableAdsReady).toHaveBeenCalledWith(cb1);
            expect(kit.onShoppableAdsReady).toHaveBeenCalledWith(cb2);
        });

        it('should remove flushed onShoppableAdsReady messages from the queue', () => {
            roktManager.onShoppableAdsReady(jest.fn());
            expect(roktManager['messageQueue'].size).toBe(1);

            const kit = makeKit();
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            expect(roktManager['messageQueue'].size).toBe(0);
        });

        it('should not remove non-onShoppableAdsReady messages from the queue', () => {
            // Queue an onShoppableAdsReady message and a selectPlacements message
            roktManager.onShoppableAdsReady(jest.fn());
            roktManager['deferredCall']('selectPlacements', { attributes: {} });
            expect(roktManager['messageQueue'].size).toBe(2);

            const kit = makeKit();
            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            // Only the onShoppableAdsReady message should have been removed
            expect(roktManager['messageQueue'].size).toBe(1);
            const remaining = Array.from(roktManager['messageQueue'].values())[0];
            expect(remaining.methodName).toBe('selectPlacements');
        });

        it('should log an error and continue flushing when kit.onShoppableAdsReady throws', () => {
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            roktManager.onShoppableAdsReady(cb1);
            roktManager.onShoppableAdsReady(cb2);

            const kit = makeKit();
            let callCount = 0;
            (kit.onShoppableAdsReady as jest.Mock).mockImplementation(() => {
                callCount++;
                if (callCount === 1) throw new Error('flush error');
            });

            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            expect(mockMPInstance.Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('RoktManager: Error flushing onShoppableAdsReady')
            );
            // Second callback still processed
            expect(kit.onShoppableAdsReady).toHaveBeenCalledTimes(2);
            // Queue is still cleared even after an error
            expect(roktManager['messageQueue'].size).toBe(0);
        });

        it('should not call kit.onShoppableAdsReady when queue is empty', () => {
            const kit = makeKit();

            roktManager.flushOnShoppableAdsReadyMessageQueue(kit);

            expect(kit.onShoppableAdsReady).not.toHaveBeenCalled();
            expect(roktManager['isShoppableAdsLoaded']).toBe(true);
        });
    });

    describe('#hasIdentityChanged', () => {
        it('should return false when newValue is null', () => {
            const result = roktManager['hasIdentityChanged']('current@example.com', null);
            expect(result).toBe(false);
        });

        it('should return false when newValue is undefined', () => {
            const result = roktManager['hasIdentityChanged']('current@example.com', undefined);
            expect(result).toBe(false);
        });

        it('should return false when newValue is empty string', () => {
            const result = roktManager['hasIdentityChanged']('current@example.com', '');
            expect(result).toBe(false);
        });

        it('should return true when currentValue is null and newValue exists', () => {
            const result = roktManager['hasIdentityChanged'](null, 'new@example.com');
            expect(result).toBe(true);
        });

        it('should return true when currentValue is undefined and newValue exists', () => {
            const result = roktManager['hasIdentityChanged'](undefined, 'new@example.com');
            expect(result).toBe(true);
        });

        it('should return true when currentValue is empty string and newValue exists', () => {
            const result = roktManager['hasIdentityChanged']('', 'new@example.com');
            expect(result).toBe(true);
        });

        it('should return true when currentValue and newValue are different', () => {
            const result = roktManager['hasIdentityChanged']('old@example.com', 'new@example.com');
            expect(result).toBe(true);
        });

        it('should return false when currentValue and newValue are the same', () => {
            const result = roktManager['hasIdentityChanged']('same@example.com', 'same@example.com');
            expect(result).toBe(false);
        });

        it('should return false when both currentValue and newValue are null', () => {
            const result = roktManager['hasIdentityChanged'](null, null);
            expect(result).toBe(false);
        });

        it('should return false when both currentValue and newValue are undefined', () => {
            const result = roktManager['hasIdentityChanged'](undefined, undefined);
            expect(result).toBe(false);
        });

        it('should return false when both currentValue and newValue are empty strings', () => {
            const result = roktManager['hasIdentityChanged']('', '');
            expect(result).toBe(false);
        });

        it('should handle whitespace-only strings as valid values', () => {
            const result = roktManager['hasIdentityChanged']('old@example.com', '   ');
            expect(result).toBe(true);
        });

        it('should be case sensitive', () => {
            const result = roktManager['hasIdentityChanged']('test@example.com', 'TEST@EXAMPLE.COM');
            expect(result).toBe(true);
        });
    });

    describe('when MP SDK is not fully initialized', () => {
        let savedLocalStorage: Storage | undefined;

        beforeEach(() => {
            const win = typeof globalThis !== 'undefined' && (globalThis as any).window;
            if (win && win.localStorage === undefined) {
                const mockStorage: Storage = {
                    getItem: jest.fn().mockReturnValue(null),
                    setItem: jest.fn(),
                    removeItem: jest.fn(),
                    clear: jest.fn(),
                    key: jest.fn().mockReturnValue(null),
                    length: 0,
                };
                (win as any).localStorage = mockStorage;
                savedLocalStorage = undefined;
            }
        });

        afterEach(() => {
            if (savedLocalStorage !== undefined && (globalThis as any).window) {
                (globalThis as any).window.localStorage = savedLocalStorage;
            }
        });

        it('should allow Rokt Kit to initialize and selectPlacements', async () => {
            jest.setTimeout(10000);
            const mParticle = (globalThis as any).mParticle as IMParticleInstanceManager;
            if (!mParticle) {
                throw new Error('Global mParticle not available (Jest setup loads dist/mparticle.js)');
            }

            const mockFetch = jest.fn();
            const originalFetch = (globalThis as any).fetch;
            (globalThis as any).fetch = mockFetch;

            // Do not delete the default instance so mParticle.Rokt refers to the same instance we init
            const roktKitConfig = { name: 'Rokt', moduleId: 181 } as IKitConfigs;
            const config: SDKInitConfig = {
                workspaceToken,
                requestConfig: false,
                launcherOptions: { noFunctional: true, noTargeting: false },
                identifyRequest: undefined,
                kitConfigs: [roktKitConfig],
            };

            // 1. Call mParticle.init with noFunctional = true (and no identity so SDK does not complete initialization)
            mParticle.init(apiKey, config);

            // 2. Assert that the MP SDK is not initialized
            expect(mParticle.isInitialized()).not.toBe(true);

            // 3. Assert that no identity calls were made
            const identifyCalls = mockFetch.mock.calls.filter(
                (call: any) => typeof call[0] === 'string' && call[0].indexOf(urls.identify) !== -1
            );
            expect(identifyCalls.length).toBe(0);

            (globalThis as any).fetch = originalFetch;

            const mockSelectPlacementsResult = {
                close: jest.fn(),
                getPlacements: jest.fn().mockResolvedValue([]),
            };
            const mockRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue(mockSelectPlacementsResult),
                filters: {},
                filteredUser: null,
                userAttributes: {},
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
                onShoppableAdsReady: jest.fn(),
            };

            mParticle.Rokt.attachKit(mockRoktKit as any);

            // 4. Call mParticle.rokt.selectPlacements and assert that the kit called selectPlacements internally
            // Suppress expected console.error when SDK has no current user (setUserAttributes on null)
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
            const result = await mParticle.Rokt.selectPlacements({ attributes: {} });
            consoleError.mockRestore();

            expect(mockRoktKit.selectPlacements).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.close).toBeDefined();
            expect(result.getPlacements).toBeDefined();

            // Flush any pending microtasks so async work from selectPlacements completes before test ends
            await new Promise(resolve => setTimeout(resolve, 0));
            delete mParticle._instances[Constants.DefaultInstance];
        });
    });
});

describe('route changes', () => {
    let roktManager: RoktManager;
    let originalPushState: History['pushState'];

    const attachKitWith = (
        onRouteChange?: () => void,
        manager: RoktManager = roktManager
    ): IRoktKit => {
        const kit = ({
            filters: {},
            launcher: {},
            onRouteChange,
        } as unknown) as IRoktKit;
        manager.attachKit(kit);
        return kit;
    };

    const initManager = (
        flags: Record<string, unknown> = {},
        manager: RoktManager = roktManager
    ): void => {
        manager.init(
            {} as IKitConfigs,
            {} as IMParticleUser,
            ({} as unknown) as SDKIdentityApi,
            ({ SDKConfig: { flags } } as unknown) as IStore,
            ({ verbose: jest.fn(), error: jest.fn() } as unknown) as any
        );
    };

    // window.history may already be patched by something else in this suite.
    const subscriberCount = (): number =>
        Object.keys((window as any).__mpRouteMonitor__?.listeners ?? {})
            .length;

    beforeEach(() => {
        originalPushState = window.history.pushState;
        window.history.replaceState({}, '', '/start');
        resetRouteChangeMonitor();
        roktManager = new RoktManager('default');
        initManager();
    });

    afterEach(() => {
        resetRouteChangeMonitor();
        window.history.pushState = originalPushState;
    });

    it('calls the kit hook once on attach for the page it lands on', () => {
        const onRouteChange = jest.fn();

        attachKitWith(onRouteChange);

        expect(onRouteChange).toHaveBeenCalledTimes(1);
    });

    it('forwards a route change to the attached kit', () => {
        const onRouteChange = jest.fn();
        attachKitWith(onRouteChange);
        onRouteChange.mockClear();

        window.history.pushState({}, '', '/checkout');

        expect(onRouteChange).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when the kit does not implement the hook', () => {
        attachKitWith(undefined);

        expect(subscriberCount()).toBe(0);
    });

    // Core builds a new kit on every init() and never retires the old one.
    it('routes to the newest kit and stops calling the previous one', () => {
        const first = jest.fn();
        const second = jest.fn();
        attachKitWith(first);
        attachKitWith(second);
        first.mockClear();
        second.mockClear();

        window.history.pushState({}, '', '/checkout');

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('subscribes once no matter how many kits attach', () => {
        attachKitWith(jest.fn());
        attachKitWith(jest.fn());
        attachKitWith(jest.fn());

        expect(subscriberCount()).toBe(1);
    });

    it('keeps attach and navigation working when the kit hook throws', () => {
        const throwing = (): void => {
            throw new Error('kit blew up');
        };

        expect(() => attachKitWith(throwing)).not.toThrow();
        expect(() =>
            window.history.pushState({}, '', '/checkout')
        ).not.toThrow();
        expect(window.location.pathname).toBe('/checkout');
    });

    it('does not subscribe when AutoLogPageView is on', () => {
        initManager({ autoLogPageView: true });
        const onRouteChange = jest.fn();

        attachKitWith(onRouteChange);

        expect(subscriberCount()).toBe(0);
    });

    // The auto page view fires once per page load, so a re-init emits none and this call is
    // the only thing that re-arms the kit on the page it lands on.
    it('still calls the hook on attach when AutoLogPageView is on', () => {
        initManager({ autoLogPageView: true });
        const onRouteChange = jest.fn();

        attachKitWith(onRouteChange);

        expect(onRouteChange).toHaveBeenCalledTimes(1);
    });

    it('leaves the kit hook in place when AutoLogPageView is on', () => {
        initManager({ autoLogPageView: true });
        const onRouteChange = jest.fn();

        const kit = attachKitWith(onRouteChange);

        expect(kit.onRouteChange).toBe(onRouteChange);
    });

    it('unsubscribes when AutoLogPageView is on by a later attach', () => {
        attachKitWith(jest.fn());
        expect(subscriberCount()).toBe(1);

        initManager({ autoLogPageView: true });
        const onRouteChange = jest.fn();
        attachKitWith(onRouteChange);
        onRouteChange.mockClear();
        window.history.pushState({}, '', '/checkout');

        expect(subscriberCount()).toBe(0);
        expect(onRouteChange).not.toHaveBeenCalled();
    });

    it.each([
        [true, true],
        [false, false],
        [undefined, false],
    ])('tells the kit AutoLogPageView is on only when the flag is true (%s)', (flag, on) => {
        initManager({ autoLogPageView: flag });

        expect(roktManager.isAutoLogPageViewEnabled()).toBe(on);
    });

    // Next.js re-executes the bundle per navigation, building a new manager under the same
    // instance name while the earlier one is never torn down.
    it('lets a re-executed bundle manager take over from the earlier one', () => {
        const earlier = new RoktManager('default');
        initManager({}, earlier);
        const earlierHook = jest.fn();
        attachKitWith(earlierHook, earlier);

        const later = new RoktManager('default');
        initManager({}, later);
        const laterHook = jest.fn();
        attachKitWith(laterHook, later);

        earlierHook.mockClear();
        laterHook.mockClear();
        window.history.pushState({}, '', '/checkout');

        expect(earlierHook).not.toHaveBeenCalled();
        expect(laterHook).toHaveBeenCalledTimes(1);
        expect(subscriberCount()).toBe(1);
    });

    it('keeps a separate subscription for a second named instance', () => {
        const first = new RoktManager('default');
        initManager({}, first);
        const firstHook = jest.fn();
        attachKitWith(firstHook, first);

        const second = new RoktManager('other');
        initManager({}, second);
        const secondHook = jest.fn();
        attachKitWith(secondHook, second);

        firstHook.mockClear();
        secondHook.mockClear();
        window.history.pushState({}, '', '/checkout');

        expect(firstHook).toHaveBeenCalledTimes(1);
        expect(secondHook).toHaveBeenCalledTimes(1);
    });
});

describe('checkout intent', () => {
    let roktManager: RoktManager;
    let logger: { verbose: jest.Mock; error: jest.Mock };
    let store: { isEnabled: boolean; SDKConfig: { flags: Record<string, unknown> } };

    const initManager = (launcherOptions: Record<string, unknown> = {}): void => {
        logger = { verbose: jest.fn(), error: jest.fn() };
        roktManager.init(
            {} as IKitConfigs,
            {} as IMParticleUser,
            ({} as unknown) as SDKIdentityApi,
            (store as unknown) as IStore,
            (logger as unknown) as any,
            { launcherOptions }
        );
        roktManager.setAutoButtonClicksForwarded(true);
    };

    const attachKitWith = (onCheckoutIntent?: (signal: unknown) => void): void => {
        roktManager.attachKit(({
            filters: {},
            launcher: {},
            onCheckoutIntent,
        } as unknown) as IRoktKit);
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(1000000);
        window.history.replaceState({}, '', '/checkout');
        resetRouteChangeMonitor();
        store = { isEnabled: true, SDKConfig: { flags: { autoButtonTracking: true } } };
        roktManager = new RoktManager('default');
        initManager();
    });

    afterEach(() => {
        jest.useRealTimers();
        resetRouteChangeMonitor();
        delete (navigator as any).globalPrivacyControl;
    });

    it('delivers to the attached kit', () => {
        const onCheckoutIntent = jest.fn();
        attachKitWith(onCheckoutIntent);

        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 1000000 });

        expect(onCheckoutIntent).toHaveBeenCalledWith({ kind: 'commit', t: 1000000 });
    });

    it('buffers signals raised before the kit attaches and flushes them oldest first', () => {
        roktManager.notifyCheckoutIntent({ kind: 'wallet', t: 999000 });
        roktManager.notifyCheckoutIntent({ kind: 'checkout_step', t: 998000 });
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent.mock.calls.map(call => call[0].kind)).toEqual([
            'checkout_step',
            'wallet',
        ]);
    });

    it('keeps only the latest buffered signal per kind', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 998000 });
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).toHaveBeenCalledTimes(1);
        expect(onCheckoutIntent).toHaveBeenCalledWith({ kind: 'commit', t: 999000 });
    });

    it('keeps a buffered add-to-cart click when a later cart click only opens the cart', () => {
        roktManager.notifyCheckoutIntent({ kind: 'cart', t: 997000, adds: true });
        roktManager.notifyCheckoutIntent({ kind: 'cart', t: 998000, adds: true });
        roktManager.notifyCheckoutIntent({ kind: 'cart', t: 999000 });
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent.mock.calls.map(call => call[0])).toEqual([
            { kind: 'cart', t: 998000, adds: true },
            { kind: 'cart', t: 999000 },
        ]);
    });

    it('keeps one buffered signal of every kind, so a later kind never evicts a commit', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 995000 });
        roktManager.notifyCheckoutIntent({ kind: 'wallet', t: 996000 });
        roktManager.notifyCheckoutIntent({ kind: 'checkout_step', t: 997000 });
        roktManager.notifyCheckoutIntent({ kind: 'frame', t: 998000 });
        roktManager.notifyCheckoutIntent({ kind: 'cart', t: 998500, adds: true });
        roktManager.notifyCheckoutIntent({ kind: 'cart', t: 999000 });
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent.mock.calls.map(call => call[0].kind + (call[0].adds ? ':adds' : ''))).toEqual([
            'commit',
            'wallet',
            'checkout_step',
            'frame',
            'cart:adds',
            'cart',
        ]);
    });

    it('flushes the buffer only once', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);
        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).toHaveBeenCalledTimes(1);
    });

    it('drops buffered signals 30 seconds old or older', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 970000 });
        roktManager.notifyCheckoutIntent({ kind: 'wallet', t: 970001 });
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).toHaveBeenCalledTimes(1);
        expect(onCheckoutIntent).toHaveBeenCalledWith({ kind: 'wallet', t: 970001 });
    });

    it('drops buffered signals raised on another path', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });
        window.history.replaceState({}, '', '/order/confirmation');
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).not.toHaveBeenCalled();
    });

    it.each(['noFunctional', 'noTargeting', 'doNotShareOrSell', 'noDeviceId'])(
        'drops signals when %s is set',
        option => {
            initManager({ [option]: true });
            const onCheckoutIntent = jest.fn();
            roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });
            attachKitWith(onCheckoutIntent);

            roktManager.notifyCheckoutIntent({ kind: 'wallet', t: 1000000 });

            expect(roktManager.isCheckoutIntentSuppressed()).toBe(true);
            expect(onCheckoutIntent).not.toHaveBeenCalled();
        }
    );

    it('is not suppressed without privacy options', () => {
        expect(roktManager.isCheckoutIntentSuppressed()).toBe(false);
    });

    it.each(['noTargeting', 'doNotShareOrSell', 'noDeviceId', 'noDeviceID'])(
        'reports a targeting opt-out when %s is set',
        option => {
            initManager({ [option]: true });

            expect(roktManager.hasTargetingOptOut()).toBe(true);
        }
    );

    it('reports a targeting opt-out under Global Privacy Control', () => {
        (navigator as any).globalPrivacyControl = true;

        expect(roktManager.hasTargetingOptOut()).toBe(true);
    });

    it('reads only Global Privacy Control before init sets launcher options', () => {
        roktManager = new RoktManager('default');

        expect(roktManager.hasTargetingOptOut()).toBe(false);
        (navigator as any).globalPrivacyControl = true;
        expect(roktManager.hasTargetingOptOut()).toBe(true);
    });

    it('reports no targeting opt-out for noFunctional alone, the flag, opt-out or the connection', () => {
        initManager({ noFunctional: true });
        store.isEnabled = false;
        store.SDKConfig.flags.autoButtonTracking = false;
        roktManager.setAutoButtonClicksForwarded(false);

        expect(roktManager.hasTargetingOptOut()).toBe(false);
        expect(roktManager.isCheckoutIntentSuppressed()).toBe(true);
    });

    const laterGates: Array<[string, () => void]> = [
        ['the user opts out', () => (store.isEnabled = false)],
        ['Global Privacy Control turns on', () => ((navigator as any).globalPrivacyControl = true)],
        ['the flag turns off', () => (store.SDKConfig.flags.autoButtonTracking = false)],
        [
            'the Rokt connection does not receive auto button clicks',
            () => roktManager.setAutoButtonClicksForwarded(false),
        ],
    ];

    it.each(laterGates)('is suppressed when %s', (_, apply) => {
        apply();

        expect(roktManager.isCheckoutIntentSuppressed()).toBe(true);
    });

    it('is suppressed until init finds the Rokt connection receives auto button clicks', () => {
        roktManager = new RoktManager('default');
        roktManager.init(
            {} as IKitConfigs,
            {} as IMParticleUser,
            ({} as unknown) as SDKIdentityApi,
            (store as unknown) as IStore,
            (logger as unknown) as any,
            { launcherOptions: {} }
        );

        expect(roktManager.isCheckoutIntentSuppressed()).toBe(true);
        expect(roktManager.isCheckoutIntentLive()).toBe(false);
    });

    it('drops signals to an attached kit when the Rokt connection does not receive auto button clicks', () => {
        const onCheckoutIntent = jest.fn();
        attachKitWith(onCheckoutIntent);
        roktManager.setAutoButtonClicksForwarded(false);

        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 1000000 });

        expect(onCheckoutIntent).not.toHaveBeenCalled();
    });

    it('is live when not suppressed and the browser has composedPath', () => {
        expect(roktManager.isCheckoutIntentLive()).toBe(true);
    });

    it.each(laterGates)('is not live when %s', (_, apply) => {
        apply();

        expect(roktManager.isCheckoutIntentLive()).toBe(false);
    });

    it.each(['noFunctional', 'noTargeting', 'doNotShareOrSell'])('is not live when %s is set', option => {
        initManager({ [option]: true });

        expect(roktManager.isCheckoutIntentLive()).toBe(false);
    });

    it('is not live in a browser without composedPath', () => {
        const original = Event.prototype.composedPath;
        try {
            delete (Event.prototype as any).composedPath;
            expect(roktManager.isCheckoutIntentLive()).toBe(false);
        } finally {
            Event.prototype.composedPath = original;
        }
    });

    it.each(laterGates)('does not replay a buffered signal when %s before the kit attaches', (_, apply) => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });
        apply();
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).not.toHaveBeenCalled();
    });

    it('drops buffered signals when discarded', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });
        roktManager.discardCheckoutIntents();
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).not.toHaveBeenCalled();
    });

    it('buffers under the path the signal was raised on', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 }, '/cart');
        const onCheckoutIntent = jest.fn();

        attachKitWith(onCheckoutIntent);

        expect(onCheckoutIntent).not.toHaveBeenCalled();
    });

    it('does not throw when the kit has no checkout intent hook', () => {
        roktManager.notifyCheckoutIntent({ kind: 'commit', t: 999000 });

        expect(() => attachKitWith(undefined)).not.toThrow();
        expect(() =>
            roktManager.notifyCheckoutIntent({ kind: 'wallet', t: 1000000 })
        ).not.toThrow();
    });

    it('logs and continues when the kit hook throws', () => {
        attachKitWith(() => {
            throw new Error('kit blew up');
        });

        expect(() =>
            roktManager.notifyCheckoutIntent({ kind: 'commit', t: 1000000 })
        ).not.toThrow();
        expect(logger.error).toHaveBeenCalledWith(
            'RoktManager: Error in onCheckoutIntent: kit blew up'
        );
    });

    describe('payment picks', () => {
        const signal = Object.freeze({ t: 1000000, pathname: '/checkout', family: 'apple_pay' as const });
        const attachPickKit = (onPaymentPick?: (pick: unknown) => void): void => {
            roktManager.attachKit(({
                filters: {},
                launcher: {},
                onPaymentPick,
            } as unknown) as IRoktKit);
        };

        it('delivers a pick to the attached kit', () => {
            const onPaymentPick = jest.fn();
            attachPickKit(onPaymentPick);

            roktManager.notifyPaymentPick(signal);

            expect(onPaymentPick).toHaveBeenCalledWith(signal);
        });

        it.each(laterGates)('drops a pick when %s', (_, apply) => {
            const onPaymentPick = jest.fn();
            attachPickKit(onPaymentPick);
            apply();

            roktManager.notifyPaymentPick(signal);

            expect(onPaymentPick).not.toHaveBeenCalled();
        });

        it.each(['noFunctional', 'noTargeting', 'doNotShareOrSell'])('drops a pick when %s is set', option => {
            initManager({ [option]: true });
            const onPaymentPick = jest.fn();
            attachPickKit(onPaymentPick);

            roktManager.notifyPaymentPick(signal);

            expect(onPaymentPick).not.toHaveBeenCalled();
        });

        it('keeps no pick made before a kit attaches', () => {
            roktManager.notifyPaymentPick(signal);
            const onPaymentPick = jest.fn();

            attachPickKit(onPaymentPick);

            expect(onPaymentPick).not.toHaveBeenCalled();
        });

        it('does not throw when the kit has no payment pick hook', () => {
            attachPickKit(undefined);

            expect(() => roktManager.notifyPaymentPick(signal)).not.toThrow();
        });

        it('logs and continues when the kit hook throws', () => {
            attachPickKit(() => {
                throw new Error('kit blew up');
            });

            expect(() => roktManager.notifyPaymentPick(signal)).not.toThrow();
            expect(logger.error).toHaveBeenCalledWith(
                'RoktManager: Error in onPaymentPick: kit blew up'
            );
        });
    });
});

import { IKitConfigs } from "../../src/configAPIClient";
import { IMParticleUser } from "../../src/identity-user-interfaces";
import { SDKIdentityApi } from "../../src/identity.interfaces";
import { IMParticleWebSDKInstance } from "../../src/mp-instance";
import RoktManager, { IRoktKit, IRoktSelectPlacementsOptions } from "../../src/roktManager";
import { testMPID } from '../src/config/constants';

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
            mockMPInstance._Store,
            mockMPInstance.Logger,
            undefined,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
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
    });

    describe('#attachKit', () => {
        it('should attach a kit', () => {
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
            };

            roktManager.attachKit(kit);
            expect(roktManager['kit']).not.toBeNull();
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
        beforeEach(() => {
            roktManager['currentUser'] = currentUser;
            jest.clearAllMocks();
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
            };

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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                hashAttributes: jest.fn(),
                selectPlacements: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn(),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
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
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue({}),
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
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

        it('should log error when identify fails with a 500 but continue execution', async () => {
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

    describe('#completePendingPromise', () => {
        it('should resolve pending promise when given a direct value', async () => {
            const promise = roktManager['deferredCall']<string>('testMethod', {});
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            const messageId = queuedMessage.messageId!;

            // Complete the promise with direct value (not wrapped in Promise)
            roktManager['completePendingPromise'](messageId, 'success result');

            // Promise should resolve with the direct value
            await expect(promise).resolves.toBe('success result');

            // Should clean up the message from queue
            expect(roktManager['messageQueue'].has(messageId)).toBe(false);
        });

        it('should resolve pending promise when given a Promise and unwrap it', async () => {
            const promise = roktManager['deferredCall']<any>('testMethod', {});
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            const messageId = queuedMessage.messageId!;
            const asyncResult = { data: 'async data' };

            // Complete with a Promise that needs unwrapping
            roktManager['completePendingPromise'](messageId, Promise.resolve(asyncResult));

            // Should get the unwrapped result, not the promise wrapper
            const result = await promise;
            expect(result).toEqual(asyncResult);
            expect(result).not.toBeInstanceOf(Promise);

            // Should clean up the message from queue
            expect(roktManager['messageQueue'].has(messageId)).toBe(false);
        });

        it('should reject pending promise with error', async () => {
            const promise = roktManager['deferredCall']<string>('testMethod', {});
            const queuedMessage = Array.from(roktManager['messageQueue'].values())[0];
            const messageId = queuedMessage.messageId!;
            const error = new Error('test error');

            // Complete the promise with error (wrapped in rejected promise)
            roktManager['completePendingPromise'](messageId, Promise.reject(error));

            // Promise should reject with the error
            await expect(promise).rejects.toThrow('test error');

            // Should clean up the pending promise
            expect(roktManager['messageQueue'].has(messageId)).toBe(false);
        });

        it('should handle missing messageId gracefully', () => {
            // Should not throw when messageId is undefined
            expect(() => {
                roktManager['completePendingPromise'](undefined, 'result');
            }).not.toThrow();

            // Should not throw when messageId does not exist
            expect(() => {
                roktManager['completePendingPromise']('nonexistent', 'result');
            }).not.toThrow();
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
});
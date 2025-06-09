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
        it('should process the message queue if a launcher and kit are attached', () => {
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

            // Indirectly attach the launcher and kit to test the message queue
            roktManager.kit = kit;

            roktManager['processMessageQueue']();
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(kit.selectPlacements).toHaveBeenCalledTimes(3);
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

        it('should throw an error if kit.setExtensionData fails', () => {
            const kit: Partial<IRoktKit> = {
                launcher: {
                    hashAttributes: jest.fn(),
                    selectPlacements: jest.fn()
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
});
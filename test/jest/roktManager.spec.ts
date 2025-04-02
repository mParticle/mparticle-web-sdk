import { IKitConfigs } from "../../src/configAPIClient";
import RoktManager, { IRoktKit, IRoktSelectPlacementsOptions } from "../../src/roktManager";

describe('RoktManager', () => {
    let roktManager: RoktManager;

    beforeEach(() => {
        roktManager = new RoktManager();
    });

    describe('constructor', () => {
        it('should be initialized', () => {
            expect(roktManager).toBeDefined();
        });

        it('should have a null kit', () => {
            expect(roktManager['kit']).toBeNull();
        });
    });

    describe('#init', () => {
        it('should initialize the manager with defaults when no config is provided', () => {
            roktManager.init({} as IKitConfigs);
            expect(roktManager['kit']).toBeNull();
            expect(roktManager['filters']).toEqual({
                userAttributeFilters: undefined,
                filterUserAttributes: expect.any(Function),
                filteredUser: undefined,
            });
            expect(roktManager['kit']).toBeNull();
        });

        it('should initialize the manager with user attribute filters from a config', () => {
            const kitConfig: Partial<IKitConfigs> = {
                name: 'Rokt',
                moduleId: 181,
                userAttributeFilters: [816506310, 1463937872, 36300687],
            };

            roktManager.init(kitConfig as IKitConfigs);
            expect(roktManager['filters']).toEqual({
                userAttributeFilters: [816506310, 1463937872, 36300687],
                filterUserAttributes: expect.any(Function),
            });
        });
    });

    describe('#attachKit', () => {
        it('should attach a kit', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
            };

            roktManager.attachKit(kit);
            expect(roktManager['kit']).not.toBeNull();
        });
    });

    describe('#processMessageQueue', () => {
        it('should process the message queue if a launcher and kit are attached', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                selectPlacements: jest.fn(),
                filteredUser: undefined,
                userAttributes: undefined
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
        it('should call kit.selectPlacements with empty attributes', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
            };

            roktManager.attachKit(kit);

            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should call kit.selectPlacements with passed in attributes', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
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
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
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

        it('should pass through the correct attributes to kit.launcher.selectPlacements', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
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
                })
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

        it('should add sandbox with true value when isDevelopmentMode is true', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
            };

            roktManager.attachKit(kit);
            roktManager.config = { isDevelopmentMode: true } as any;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                }
            };

            roktManager.selectPlacements(options);

            const expectedOptions = {
                attributes: {
                    customAttr: 'value',
                    'sandbox': true
                }
            };

            expect(kit.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should add sandbox with false value when isDevelopmentMode is false', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
            };

            roktManager.attachKit(kit);
            roktManager.config = { isDevelopmentMode: false } as any;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                }
            };

            roktManager.selectPlacements(options);

            const expectedOptions = {
                attributes: {
                    customAttr: 'value',
                    'sandbox': false
                }
            };

            expect(kit.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should preserve other option properties when adding sandbox', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
            };

            roktManager.attachKit(kit);
            roktManager.config = { isDevelopmentMode: true } as any;

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                },
                identifier: 'test-identifier'
            };

            roktManager.selectPlacements(options);

            const expectedOptions = {
                attributes: {
                    customAttr: 'value',
                    'sandbox': true
                },
                identifier: 'test-identifier'
            };

            expect(kit.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should not add sandbox when config is null', () => {
            const kit: IRoktKit = {
                launcher: {
                    selectPlacements: jest.fn()
                },
                filters: undefined,
                filteredUser: undefined,
                userAttributes: undefined,
                selectPlacements: jest.fn()
            };

            roktManager.attachKit(kit);
            // Not initializing config, so it remains null

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                }
            };

            roktManager.selectPlacements(options);
            expect(kit.selectPlacements).toHaveBeenCalledWith(options);
        });
    });
});

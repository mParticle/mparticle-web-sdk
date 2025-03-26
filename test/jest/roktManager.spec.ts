import RoktManager, { IRoktLauncher, IRoktSelectPlacementsOptions } from "../../src/roktManager";

describe('RoktManager', () => {
    let roktManager: RoktManager;

    beforeEach(() => {
        roktManager = new RoktManager();
    });

    describe('constructor', () => {
        it('should be initialized', () => {
            expect(roktManager).toBeDefined();
        });

        it('should have a null launcher', () => {
            expect(roktManager['launcher']).toBeNull();
        });
    });

    describe('#attachLauncher', () => {
        it('should attach a launcher', () => {
            const launcher = {} as IRoktLauncher;
            roktManager.attachLauncher(launcher);
            expect(roktManager['launcher']).not.toBeNull();
        });

        it('should process the message queue if a launcher is attached', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);
            roktManager.selectPlacements({} as IRoktSelectPlacementsOptions);

            expect(roktManager['messageQueue'].length).toBe(3);

            roktManager.attachLauncher(launcher);
            expect(roktManager['launcher']).not.toBeNull();
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(launcher.selectPlacements).toHaveBeenCalledTimes(3);
        });
    });

    describe('#selectPlacements', () => {
        it('should call launcher.selectPlacements with empty attributes', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.attachLauncher(launcher);
            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);
            expect(launcher.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should call launcher.selectPlacements with passed in attributes', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.attachLauncher(launcher);

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
            expect(launcher.selectPlacements).toHaveBeenCalledWith(options);
        });

        it('should queue the selectPlacements method if no launcher is attached', () => {
            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);

            expect(roktManager['launcher']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('selectPlacements');
            expect(roktManager['messageQueue'][0].payload).toBe(options);
        });

        it('should process queued selectPlacements calls once the launcher is attached', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            const options = {
                attributes: {}
            } as IRoktSelectPlacementsOptions;

            roktManager.selectPlacements(options);
            expect(roktManager['launcher']).toBeNull();
            expect(roktManager['messageQueue'].length).toBe(1);
            expect(roktManager['messageQueue'][0].methodName).toBe('selectPlacements');
            expect(roktManager['messageQueue'][0].payload).toBe(options);

            roktManager.attachLauncher(launcher);
            expect(roktManager['launcher']).not.toBeNull();
            expect(roktManager['messageQueue'].length).toBe(0);
            expect(launcher.selectPlacements).toHaveBeenCalledWith(options);
        });

        // New tests for the 'rokt.testsession' attribute
        it('should add rokt.testsession with true value when isDevelopmentMode is true', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.attachLauncher(launcher);
            roktManager.init({ isDevelopmentMode: true });

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                }
            };

            roktManager.selectPlacements(options);

            const expectedOptions = {
                attributes: {
                    customAttr: 'value',
                    'rokt.testsession': true
                }
            };

            expect(launcher.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should add rokt.testsession with false value when isDevelopmentMode is false', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.attachLauncher(launcher);
            roktManager.init({ isDevelopmentMode: false });

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                }
            };

            roktManager.selectPlacements(options);

            const expectedOptions = {
                attributes: {
                    customAttr: 'value',
                    'rokt.testsession': false
                }
            };

            expect(launcher.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should preserve other option properties when adding rokt.testsession', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.attachLauncher(launcher);
            roktManager.init({ isDevelopmentMode: true });

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
                    'rokt.testsession': true
                },
                identifier: 'test-identifier'
            };

            expect(launcher.selectPlacements).toHaveBeenCalledWith(expectedOptions);
        });

        it('should not add rokt.testsession when config is null', () => {
            const launcher: IRoktLauncher = {
                selectPlacements: jest.fn()
            };

            roktManager.attachLauncher(launcher);
            // Not initializing config, so it remains null

            const options: IRoktSelectPlacementsOptions = {
                attributes: {
                    customAttr: 'value'
                }
            };

            roktManager.selectPlacements(options);

            // Should pass original options without modification since config is null
            expect(launcher.selectPlacements).toHaveBeenCalledWith(options);
        });
    });
});

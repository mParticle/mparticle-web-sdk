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
    });
});
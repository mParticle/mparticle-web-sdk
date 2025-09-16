import {
  mParticle,
  MPConfig,
  testMPID,
} from '../src/config/constants';

describe('Products Persistence', () => {
    let mpInstance = mParticle.getInstance();
    beforeEach(() => {
        mParticle._resetForTests(MPConfig);
    });

    it('should update Products localStorage when noTargeting is false by default', () => {
        const product = { Name: 'iphone', Sku: 'iphonesku', Price: 599, Quantity: 1 };
        mpInstance._Persistence.setCartProducts({ [testMPID]: { cp: [product] } } as any);
        expect(mpInstance._Persistence.getCartProducts(testMPID).length).toBe(1);
    });

    it('should NOT update Products localStorage when noTargeting is true', () => {
        mpInstance._Store.setNoTargeting(true);
        const product = { Name: 'iphone', Sku: 'iphonesku', Price: 599, Quantity: 1 };
        mpInstance._Persistence.setCartProducts({ [testMPID]: { cp: [product] } } as any);
        expect(mpInstance._Persistence.getCartProducts(testMPID).length).toBe(0);
        expect(mpInstance._Persistence.getCartProducts(testMPID)).toEqual([]);
    });

    it('should update Products localStorage when noTargeting is false', () => {
        mpInstance._Store.setNoTargeting(false);
        const product = { Name: 'iphone', Sku: 'iphonesku', Price: 599, Quantity: 1 };
        mpInstance._Persistence.setCartProducts({ [testMPID]: { cp: [product] } } as any);
        expect(mpInstance._Persistence.getCartProducts(testMPID).length).toBe(1);
    });
});
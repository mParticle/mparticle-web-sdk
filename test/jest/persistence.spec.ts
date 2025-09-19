import {
  mParticle,
  MPConfig,
  testMPID,
} from '../src/config/constants';
import { Product } from '@mparticle/web-sdk';

describe('Products Persistence', () => {
    let mpInstance = mParticle.getInstance();
    beforeEach(() => {
        mParticle._resetForTests(MPConfig);
        localStorage.removeItem(mpInstance._Store?.prodStorageName as string);
    });

    it('should save products to localStorage when noTargeting is false by default', () => {
        const product = { Name: 'iphone', Sku: 'iphonesku', Price: 599, Quantity: 1 };
        mpInstance._Persistence.setCartProducts({ [testMPID]: { cp: [product] } } as unknown as Product[]);
        expect(mpInstance._Persistence.getCartProducts(testMPID).length).toBe(1);
    });

    it('should NOT save products to localStorage when noTargeting is true', () => {
        mpInstance._Store.setNoTargeting(true);
        const product = { Name: 'iphone', Sku: 'iphonesku', Price: 599, Quantity: 1 };
        mpInstance._Persistence.setCartProducts({ [testMPID]: { cp: [product] } } as unknown as Product[]);
        expect(mpInstance._Persistence.getCartProducts(testMPID).length).toBe(0);
    });

    it('should save products to localStorage when noTargeting is false', () => {
        mpInstance._Store.setNoTargeting(false);
        const product = { Name: 'iphone', Sku: 'iphonesku', Price: 599, Quantity: 1 };
        mpInstance._Persistence.setCartProducts({ [testMPID]: { cp: [product] } } as unknown as Product[]);
        expect(mpInstance._Persistence.getCartProducts(testMPID).length).toBe(1);
    });
});
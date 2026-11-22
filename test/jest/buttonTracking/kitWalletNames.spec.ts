import { namesWallet } from '../../../src/buttonTracking/checkoutIntent';
import { IButtonClick } from '../../../src/buttonTracking/buttonDescription';
import { classifyPaymentFamily } from '../../../kits/rokt/src/paymentFamily';

// Core ships its own copy of the Rokt kit's wallet words, so a click core reads
// as naming a wallet is one the kit reads a wallet family from. Each label names
// one method at most: from a label naming two wallets the kit reads none, while
// core still reads it as naming one.
describe('wallet names in core and the Rokt kit', () => {
    it.each([
        'PayPal',
        'Place order with PayPal!',
        'paypal-pay-button',
        'PAYPAL_EXPRESS',
        'paypal2',
        'PayPal Credit',
        'Apple Pay',
        'applePayButton',
        'Apple Pay gift card',
        'Google Pay',
        'GPay',
        'Android Pay',
        'Venmo',
        'Amazon Pay',
        'amazon_pay',
        'Shop Pay',
        'Klarna',
        'Afterpay',
        'Clearpay',
        'Cash App Pay',
        'Cash App Afterpay',
        'Affirm',
        'Sezzle',
        'Samsung Pay',
        'Credit Card',
        'Visa',
        'Place order with card',
        'Gift card',
        'Place order',
        'Pay now',
        'Continue to payment',
    ])('agree on "%s"', label => {
        const family = classifyPaymentFamily(label);
        const click = { label } as IButtonClick;

        expect(namesWallet(document.createElement('button'), click)).toBe(
            family !== undefined && family !== 'card'
        );
    });
});

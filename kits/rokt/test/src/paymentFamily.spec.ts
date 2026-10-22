import { describe, it, expect } from 'vitest';
import {
  classifyPaymentFamily,
  describeArrivalPayment,
  isPaymentFamily,
  paymentFamilyFromClick,
} from '../../src/paymentFamily';

describe('paymentFamily', () => {
  describe('classifyPaymentFamily', () => {
    it.each([
      ['PayPal', 'paypal'],
      ['PAYPAL_ACCOUNT', 'paypal'],
      ['Pay with Venmo', 'venmo'],
      ['ApplePay', 'apple_pay'],
      ['applePayButton', 'apple_pay'],
      ['apple-pay-checkout-button', 'apple_pay'],
      ['GPay', 'google_pay'],
      ['Google Pay', 'google_pay'],
      ['amazon_pay', 'amazon_pay'],
      ['Klarna', 'klarna'],
      ['Clearpay', 'afterpay'],
      ['Cash App Pay', 'cash_app'],
      ['CreditCard', 'card'],
      ['Credit or debit card', 'card'],
      ['Visa', 'card'],
      ['MasterCard', 'card'],
      ['American Express', 'card'],
      ['PayPal Credit', 'paypal'],
      ['ANDROID_PAY', 'google_pay'],
      ['MC', 'card'],
      ['APPLE_PAY | PROMO_CODE', 'apple_pay'],
      ['REWARD | APPLE_PAY, Apple Pay - Visa', 'apple_pay'],
      ['Bonus Points | Credit Card, VISA', 'card'],
      ['Coupon | Credit Card, VISA', 'card'],
      ['Store Rewards Credit Card', 'card'],
      ['creditcard', 'card'],
      ['CREDITCARD', 'card'],
      ['debitcard', 'card'],
      ['americanexpress', 'card'],
      ['AmEx', 'card'],
    ])('reads %s as %s', (text, family) => {
      expect(classifyPaymentFamily(text)).toBe(family);
    });

    it.each([
      ['two wallets', 'PayPal or Venmo'],
      ['a gift card', 'Gift card'],
      ['store credit', 'Use store credit'],
      ['reward points', 'Pay with points'],
      ['rewards alone', 'Rewards'],
      ['a store name', 'Acme'],
      ['a run-together gift card', 'giftcard'],
      ['a two-letter network code', 'VI'],
      ['a confirm label', 'Place order'],
      ['an empty value', ''],
      ['a sentence', 'you can pay with paypal later today if that is easier for you'],
      ['a number', 42],
      ['nothing', undefined],
    ])('reads %s as no family', (_, text) => {
      expect(classifyPaymentFamily(text)).toBeUndefined();
    });
  });

  describe('paymentFamilyFromClick', () => {
    it('reads a checked picker from its label', () => {
      expect(paymentFamilyFromClick({ type: 'radio', checked: true, label: 'credit card' })).toBe('card');
    });

    it('reads a wallet button from its test id when it has no label', () => {
      expect(paymentFamilyFromClick({ type: 'button', element: 'role', test_id: 'apple-pay-checkout-button' })).toBe(
        'apple_pay',
      );
    });

    it.each([
      ['a checked checkbox', { type: 'checkbox', checked: true, label: 'Save my card' }],
      ['a consent checkbox', { type: 'checkbox', checked: true, label: 'I affirm I am over 18' }],
      ['a learn-more link', { type: 'button', element: 'link', label: 'Learn more about Affirm' }],
    ])('never reads %s as a pick', (_, attributes) => {
      expect(paymentFamilyFromClick(attributes)).toBeUndefined();
    });

    it('ignores an unchecked picker', () => {
      expect(paymentFamilyFromClick({ type: 'checkbox', checked: false, label: 'PayPal' })).toBeUndefined();
    });

    it('ignores a picker whose checked state was stripped', () => {
      expect(paymentFamilyFromClick({ type: 'radio', label: 'PayPal' })).toBeUndefined();
    });

    it('ignores anything marked unchecked even when its type was stripped', () => {
      expect(paymentFamilyFromClick({ checked: false, label: 'PayPal' })).toBeUndefined();
    });

    it.each([
      ['an input', { element: 'input', label: 'PayPal' }],
      ['no element', { label: 'PayPal' }],
    ])('ignores a click whose type and checked state were both stripped, with %s', (_, attributes) => {
      expect(paymentFamilyFromClick(attributes)).toBeUndefined();
    });

    it('still reads a wallet button whose type was stripped', () => {
      expect(paymentFamilyFromClick({ element: 'wallet', label: 'Apple Pay' })).toBe('apple_pay');
    });

    it('accepts a checked state sent as a string', () => {
      expect(paymentFamilyFromClick({ type: 'radio', checked: 'true', label: 'Klarna' })).toBe('klarna');
    });

    it('only takes card words from a picker, never from a button', () => {
      expect(paymentFamilyFromClick({ type: 'submit', label: 'pay with card' })).toBeUndefined();
    });

    it('ignores a click with no attributes', () => {
      expect(paymentFamilyFromClick(undefined)).toBeUndefined();
    });
  });

  describe('describeArrivalPayment', () => {
    it.each([
      [{ paymenttype: 'PayPal' }, 'paypal'],
      [{ PaymentType: 'visa' }, 'card'],
      [{ payment_method: 'APPLE_PAY' }, 'apple_pay'],
      [{ paymenttype: 'Bank transfer' }, 'other'],
      [{ paymenttype: '  ' }, 'absent'],
      [{ paymenttype: 3 }, 'absent'],
      [{ email: 'shopper@example.com' }, 'absent'],
      [undefined, 'absent'],
    ])('reads %j as %s', (attributes, expected) => {
      expect(describeArrivalPayment(attributes as Record<string, unknown> | undefined)).toBe(expected);
    });
  });

  it('accepts only the known family names', () => {
    expect(isPaymentFamily('paypal')).toBe(true);
    expect(isPaymentFamily('bitcoin')).toBe(false);
    expect(isPaymentFamily(undefined)).toBe(false);
  });
});

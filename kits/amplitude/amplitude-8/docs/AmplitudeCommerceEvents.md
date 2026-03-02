## Revenue Commerce Events (purchases and refunds)

1. If we send the following MP purchase event:

```
var prodattr1 = {journeyType: 'testjourneytype1', eventMetric1: 'metric2'}
var prodattr2 = {'hit-att2': 'hit-att2-type', prodMetric1: 'metric1'}

var product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1, 'variant', 'category', 'brand', 1, 'coupon', prodattr1);
var product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1, 'variant', 'category', 'brand', 1, 'coupon', prodattr2);

var transactionAttributes = {
    Id: 'foo-transaction-id',
    Revenue: 430.00,
    Tax: 30
};
var customAttributes = {sale: true}; // if not passing any custom attributes, pass null
var customFlags = {'Google.Category': 'travel'} // if not passing any custom flags, pass null
mParticle.eCommerce.logProductAction(
    mParticle.ProductActionType.Purchase,
    [product1, product2],
    customAttributes,
    customFlags,
    transactionAttributes);
```

2. If excludeIndividualProductEvents === 'true', the payload signature for the summary event should be:
```
{
    eventName: 'eCommerce - Purchase',
    attrs: {
        revenue: 430, // <------- no $ prepended
        'Product Count': 2,
        'Currency Code': 'USD',
        'Tax Amount': 30,
        'Transaction Id': 'foo-transaction-id',
        mparticle_amplitude_should_split: false,
        products: JSON.stringify([product1, product2]),
        sale: true,
    }
}
```

3. If excludeIndividualProductEvents === 'true', the payload signature for the summary event should be:
```
{
    eventName: 'eCommerce - Purchase',
    attrs: {
        $revenue: 430, <------- $ prepended
        'Product Count': 2,
        'Currency Code': 'USD',
        'Tax Amount': 30,
        'Transaction Id': 'foo-transaction-id',
        mparticle_amplitude_should_split: false,
        products: JSON.stringify([product1, product2]),
        sale: true,
    }
}
```

## non-Revenue Commerce Events (all non-purchase, non-refund commerce product action events)
1. Using the same example above, but if we do an AddToCart instead of a purchase, ie:
```
mParticle.eCommerce.logProductAction(
    mParticle.ProductActionType.AddToCart,
    [product1, product2],
    customAttributes,
    customFlags,
    transactionAttributes);
```

2. Regardless of excludeIndividualProductEvents value, the summary event will be:
```
{
    eventName: 'eCommerce - AddToCart',
    attrs: {
        'Product Count': 2,
        'Currency Code': 'USD',
        'Tax Amount': 30,
        'Transaction Id': 'foo-transaction-id',
        mparticle_amplitude_should_split: false,
        products: JSON.stringify([product1, product2]),
        sale: true,
    }
}
```
Note that it is unlikely that non-revenue product actions likely would not have transaction attributes, but this is for illustrative purposes oly. 
const SELECT_PLACEMENTS_ATTRIBUTE_PERSISTENCE_DENY_LIST = [
  'billingaddress1',
  'billingaddress2',
  'billingcity',
  'billingstate',
  'billingzipcode',
  'cartitems',
  'ccbin',
  'confirmationref',
  'conversiontype',
  'country',
  'couponcode',
  'currency',
  'language',
  'paymentserviceprovider',
  'paymentserviceproviderattribute',
  'paymenttype',
  'shippingaddress1',
  'shippingcity',
  'shippingcountry',
  'shippingmethod',
  'shippingstate',
  'shippingzipcode',
  'totalprice',
];
const SELECT_PLACEMENTS_ATTRIBUTE_PERSISTENCE_DENY_SET = new Set(SELECT_PLACEMENTS_ATTRIBUTE_PERSISTENCE_DENY_LIST);

export function isSelectPlacementsAttributePersistenceDenied(key: string): boolean {
  return SELECT_PLACEMENTS_ATTRIBUTE_PERSISTENCE_DENY_SET.has(key.toLowerCase());
}

export function removeSelectPlacementsAttributePersistenceDeniedAttributes(
  attributes: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const filteredAttributes: Record<string, unknown> = {};
  const sourceAttributes = attributes || {};
  const attributeKeys = Object.keys(sourceAttributes);

  for (let i = 0; i < attributeKeys.length; i++) {
    const key = attributeKeys[i];
    if (!isSelectPlacementsAttributePersistenceDenied(key)) {
      filteredAttributes[key] = sourceAttributes[key];
    }
  }

  return filteredAttributes;
}

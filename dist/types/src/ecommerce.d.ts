export default function Ecommerce(mpInstance: any): void;
export default class Ecommerce {
    constructor(mpInstance: any);
    convertTransactionAttributesToProductAction: (transactionAttributes: any, productAction: any) => void;
    getProductActionEventName: (productActionType: any) => "AddToCart" | "AddToWishlist" | "Checkout" | "CheckoutOption" | "Click" | "Purchase" | "Refund" | "RemoveFromCart" | "RemoveFromWishlist" | "ViewDetail" | "Unknown";
    getPromotionActionEventName: (promotionActionType: any) => "Unknown" | "PromotionClick" | "PromotionView";
    convertProductActionToEventType: (productActionType: any) => 0 | 20 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 21;
    convertPromotionActionToEventType: (promotionActionType: any) => 18 | 19;
    generateExpandedEcommerceName: (eventName: any, plusOne: any) => string;
    extractProductAttributes: (attributes: any, product: any) => void;
    extractTransactionId: (attributes: any, productAction: any) => void;
    extractActionAttributes: (attributes: any, productAction: any) => void;
    extractPromotionAttributes: (attributes: any, promotion: any) => void;
    buildProductList: (event: any, product: any) => any;
    createProduct: (name: any, sku: any, price: any, quantity: any, variant: any, category: any, brand: any, position: any, couponCode: any, attributes: any) => {
        Name: string;
        Sku: any;
        Price: any;
        Quantity: any;
        Brand: any;
        Variant: any;
        Category: any;
        Position: any;
        CouponCode: any;
        TotalAmount: number;
        Attributes: any;
    };
    createPromotion: (id: any, creative: any, name: any, position: any) => {
        Id: any;
        Creative: any;
        Name: any;
        Position: any;
    };
    createImpression: (name: any, product: any) => {
        Name: string;
        Product: any;
    };
    createTransactionAttributes: (id: any, affiliation: any, couponCode: any, revenue: any, shipping: any, tax: any) => {
        Id: any;
        Affiliation: any;
        CouponCode: any;
        Revenue: any;
        Shipping: any;
        Tax: any;
    };
    expandProductImpression: (commerceEvent: any) => any[];
    expandCommerceEvent: (event: any) => any[];
    expandPromotionAction: (commerceEvent: any) => any[];
    expandProductAction: (commerceEvent: any) => any[];
    createCommerceEventObject: (customFlags: any, options: any) => any;
    sanitizeAmount: (amount: any, category: any) => any;
}

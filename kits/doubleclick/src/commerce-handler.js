var salesCounterTypes = {
    transactions: 1,
    items_sold: 1
};
var ITEMS_SOLD = 'items_sold';

function CommerceHandler(common) {
    this.common = common || {};
}

CommerceHandler.prototype.logCommerceEvent = function(event) {
    if (event.EventDataType === mParticle.CommerceEventType.ProductPurchase) {
        var counter =
            event.CustomFlags && event.CustomFlags['DoubleClick.Counter']
                ? event.CustomFlags['DoubleClick.Counter']
                : null;
        if (!counter) {
            console.log(
                "Event not sent. Sales conversions requires a custom flag of DoubleClick.Counter equal to 'transactions', or 'items_sold'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
            );
            return false;
        } else if (!salesCounterTypes[counter]) {
            console.log(
                "Counter type not valid. For sales conversions, use a custom flag of DoubleClick.Counter equal to 'transactions', or 'items_sold'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
            );
            return false;
        }

        var eventMapping = this.common.getEventMapping(event);

        if (!eventMapping) {
            console.log('Event not mapped. Event not sent.');
            return false;
        }

        if (eventMapping.result && eventMapping.match) {
            var gtagProperties = {};
            this.common.setCustomVariables(event, gtagProperties);
            this.common.setSendTo(
                eventMapping.match,
                event.CustomFlags,
                gtagProperties
            );
            gtagProperties.send_to += '+' + counter;
            //stringify number
            gtagProperties.value = '' + event.ProductAction.TotalAmount;
            gtagProperties.transaction_id = event.ProductAction.TransactionId;

            if (counter === ITEMS_SOLD) {
                gtagProperties.quantity =
                    '' + event.ProductAction.ProductList.length;
            }
            this.common.sendGtag('purchase', gtagProperties);
            return true;
        }
    }
};

module.exports = CommerceHandler;

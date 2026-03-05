window.mParticle.addForwarder = function (forwarder) {
    window.mParticle.forwarder = new forwarder.constructor();
};

var amplitude = function () {
    var instance;
    var self = this;

    this.settings = {};
    this.instances = {};

    this.getInstance = function (instanceName) {
        if (!instanceName) {
            instanceName = 'default';
        }

        if (this.instances[instanceName]) {
            return this.instances[instanceName];
        } else if (instanceName === 'default') {
            instance = new amplitudeClient('default');
        } else {
            instance = new amplitudeClient(instanceName);
        }

        this.instances[instanceName] = instance;

        return instance;
    };

    this.Revenue = function () {
        return {
            setPrice: function (price) {
                this.price = price;
                return this;
            },

            setEventProperties: function (eventAttributes) {
                this.eventAttributes = eventAttributes;
                return this;
            },
        };
    };

    this.reset = function () {
        self.settings = {};
        self.instances = {};
    };
};

var amplitudeClient = function (instanceName) {
    var self = this;

    this.init = function (key, arg1, settings) {
        self.settings = settings;
        self.events = [];
        self.attrs = null;
        self.amount = null;
        self.quantity = null;
        self.sku = null;
        self.props = null;
        self.isOptingOut = null;
        self.userId = null;
    };

    this.logRevenue = function (amount, quantity, sku) {
        self.amount = amount;
        self.quantity = quantity;
        self.sku = sku;
    };

    this.logRevenueV2 = function (RevenueObj) {
        self.revenueObj = RevenueObj;
    };

    this.logEvent = function (name, attrs) {
        self.events.push({
            eventName: name,
            attrs: attrs,
        });
    };

    this.setOptOut = function (isOptingOut) {
        self.isOptingOut = isOptingOut;
    };

    this.setUserProperties = function (props) {
        self.props = self.props || {};
        for (key in props) {
            self.props[key] = props[key];
        }
    };

    this.setUserId = function (id) {
        self.userId = id;
    };

    this.reset = function () {
        self.eventName = null;
        self.attrs = null;
        self.amount = null;
        self.quantity = null;
        self.sku = null;
        self.props = null;
        self.isOptingOut = null;
        self.userId = null;
    };
};

window.amplitude = new amplitude();

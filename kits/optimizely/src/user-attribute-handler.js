function UserAttributeHandler(common) {
    this.common = common || {};
}

UserAttributeHandler.prototype.onRemoveUserAttribute = function(key) {
    if (!this.common.useFullStack && window.optimizely) {
        var attribute = {};
        attribute[key] = null;
        window['optimizely'].push({
            type: 'user',
            attributes: attribute
        });
    }
    if (this.common.useFullStack && window.optimizelyClientInstance) {
        if (this.common.userAttributes[key]) {
            delete this.common.userAttributes[key];
        }
    }
};
UserAttributeHandler.prototype.onSetUserAttribute = function(key, value) {
    if (!this.common.useFullStack && window.optimizely) {
        var attribute = {};
        attribute[key] = value;
        window['optimizely'].push({
            type: 'user',
            attributes: attribute
        });
    }
    if (this.common.useFullStack && window.optimizelyClientInstance) {
        var self = this;
        self.common.userAttributes[key] = value;
    }    
};

module.exports = UserAttributeHandler;

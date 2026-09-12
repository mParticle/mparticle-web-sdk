var SHA256 = require('crypto-js/sha256');
function Common() {}

Common.prototype.exampleMethod = function() {
    return 'I am an example';
};

Common.prototype.logId5Id = function(id5Id) {
    if (!id5Id) {
        return;
    }

    var integrationAttributes = {
        encryptedId5Id: id5Id,
        id5IdType: this.id5IdType,
        partnerId: this.partnerId.toString(),
    };

    window.mParticle.setIntegrationAttribute(
        this.moduleId,
        integrationAttributes
    );
};

Common.prototype.buildPartnerData = function(mParticleUser) {
    var pdKeys = {};
    var userIdentities = mParticleUser.getUserIdentities();

    var email = this.normalizeEmail(userIdentities.userIdentities['email']);
    var phone = this.normalizePhone(
        userIdentities.userIdentities['mobile_number']
    );

    if (!email && !phone) {
        return null;
    }

    if (email) {
        pdKeys[1] = SHA256(email);
    }

    if (phone) {
        pdKeys[2] = SHA256(phone);
    }

    var pdRaw = Object.keys(pdKeys)
        .map(function(key) {
            return key + '=' + pdKeys[key];
        })
        .join('&');

    return btoa(pdRaw);
};

Common.prototype.normalizeEmail = function(email) {
    if (!email || !this.validateEmail(email)) {
        return null;
    }
    var parts = email.split('@');
    var charactersToRemove = ['+', '.'];

    if (parts[1] != 'gmail.com') {
        return email;
    }

    parts[0] = this.replace(parts[0], charactersToRemove);

    return parts.join('@');
};

Common.prototype.normalizePhone = function(phone) {
    if (!phone) {
        return null;
    }
    var charactersToRemove = [' ', '-', '(', ')'];
    var normalizedPhone = this.replace(phone, charactersToRemove);

    if (normalizedPhone[0] !== '+') {
        normalizedPhone = '+' + normalizedPhone;
    }

    if (!this.validatePhone(normalizedPhone)) {
        return null;
    }
    return normalizedPhone;
};

Common.prototype.replace = function(string, targets) {
    var newString = '';
    for (var i = 0; i < string.length; i++) {
        var char = string[i];
        if (!targets.includes(char)) {
            newString += char;
        }
    }
    return newString.toLowerCase();
};

Common.prototype.validateEmail = function(email) {
    if (!email) {
        return false;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

Common.prototype.validatePhone = function(phone) {
    if (!phone) {
        return false;
    }
    var e164Regex = /^\+?[1-9]\d{1,14}$/;

    return e164Regex.test(phone);
};
module.exports = Common;

// Import set up logic
import './config/setup';

// Import each test module
// import './tests-core-sdk';
// import './tests-batchUploader';
// import './tests-beaconUpload';
// import './tests-kit-blocking';
// import './tests-persistence';
// import './tests-forwarders';
// import './tests-helpers';
// import './tests-identity';
// import './tests-event-logging';
// import './tests-eCommerce';
// import './tests-cookie-syncing';
// import './tests-identities-attributes';
// import './tests-native-sdk';
// import './tests-consent';
// import './tests-serverModel';

import './tests-mockBatchCreator'; //done
import './tests-mParticleUser'; //done
import './tests-self-hosting-specific';  // to do - config will need to be refactored to wait for condition if possible.  is there something that can be triggered from config to know if it has returned?
import './tests-runtimeToBatchEventsDTO';  // done
import './tests-apiClient'; //done
import './tests-mparticle-instance-manager'; // this has tests that relate to the config, similar to above, will need to be refactored to wait for condition if possible.  is there something that can be triggered from config to know if it has returned?
import './tests-queue-public-methods';  // done
import './tests-validators';  // done
import './tests-utils';  // done
import './tests-session-manager';
import './tests-store';
import './tests-config-api-client';
import './tests-identity-utils';
import './tests-audience-manager';
import './tests-feature-flags';
import './tests-user';
import './tests-legacy-alias-requests';
import './tests-aliasRequestApiClient';

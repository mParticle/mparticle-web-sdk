import { IMParticleWebSDKInstance } from './mp-instance';
export interface ISessionManager {
    initialize: () => void;
    getSessionId: () => string;
    startNewSession: () => void;
    endSession: (override?: boolean) => void;
    setSessionTimer: () => void;
    resetSessionTimer: () => void;
    clearSessionTimeout: () => void;
    startNewSessionIfNeeded: () => void;
    /**
     * @deprecated
     */
    getSession: () => string;
}
export default function SessionManager(this: ISessionManager, mpInstance: IMParticleWebSDKInstance): void;

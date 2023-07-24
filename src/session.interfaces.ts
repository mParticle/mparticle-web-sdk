export interface ISessionManager {
    initialize: () => void;
    getSession: () => string;
    startNewSession: () => void;
    endSession: (override?: boolean) => void;
    setSessionTimer: () => void;
    resetSessionTimer: () => void;

    clearSessionTimeout: () => void;
    startNewSessionIfNeeded: () => void;
}

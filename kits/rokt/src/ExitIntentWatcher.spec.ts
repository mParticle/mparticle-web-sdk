import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExitIntentWatcher } from './ExitIntentWatcher';

describe('ExitIntentWatcher', () => {
    const setup = (isKitReady = true, didForward = true) => {
        const handlers = {
            isKitReady: vi.fn(() => isKitReady),
            onExitIntent: vi.fn(() => didForward),
            onLeadCaptureSubmitted: vi.fn(),
        };
        const watcher = new ExitIntentWatcher(handlers);
        return { watcher, handlers };
    };

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('forwards one known exit-intent reason per page view', () => {
        const { watcher, handlers } = setup();
        watcher.configure({
            enabled: true,
            identifier: 'exit-intent',
            attributes: { source: 'checkout' },
        });

        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'mouse-exit-top' },
            })
        );
        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'scroll-up-fast' },
            })
        );

        expect(handlers.onExitIntent).toHaveBeenCalledTimes(1);
        expect(handlers.onExitIntent).toHaveBeenCalledWith('mouse-exit-top', {
            source: 'checkout',
        });
    });

    it('allows forwarding again after page state reset', () => {
        const { watcher, handlers } = setup();
        watcher.configure({ enabled: true, identifier: 'exit-intent' });

        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'idle' },
            })
        );
        watcher.resetPageViewState();
        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'leave-link' },
            })
        );

        expect(handlers.onExitIntent).toHaveBeenCalledTimes(2);
    });

    it('does not forward unknown reasons', () => {
        const { watcher, handlers } = setup();
        watcher.configure({ enabled: true, identifier: 'exit-intent' });

        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'unsupported' },
            })
        );

        expect(handlers.onExitIntent).not.toHaveBeenCalled();
    });

    it('does not lock page view state when forwarding fails', () => {
        const { watcher, handlers } = setup(true, false);
        watcher.configure({ enabled: true, identifier: 'exit-intent' });

        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'mouse-exit-top' },
            })
        );
        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'idle' },
            })
        );

        expect(handlers.onExitIntent).toHaveBeenCalledTimes(2);
    });

    it('ignores exit-intent events when kit is not ready', () => {
        const { watcher, handlers } = setup(false, true);
        watcher.configure({ enabled: true, identifier: 'exit-intent' });

        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'mouse-exit-top' },
            })
        );

        expect(handlers.onExitIntent).not.toHaveBeenCalled();
    });

    it('parses lead capture identity and canonical metadata attributes', () => {
        const { watcher, handlers } = setup();
        watcher.configure({
            enabled: true,
            identityCapture: { enabled: true },
        });

        window.dispatchEvent(
            new CustomEvent('LEAD_CAPTURE_SUBMITTED', {
                detail: {
                    body: {
                        email: 'person@example.com',
                        mobile_number: '+15551234567',
                        rclid: 'rclid-123',
                        accountID: 'account-456',
                        referralCreativeID: 'creative-789',
                    },
                },
            })
        );

        expect(handlers.onLeadCaptureSubmitted).toHaveBeenCalledTimes(1);
        expect(handlers.onLeadCaptureSubmitted).toHaveBeenCalledWith({
            identities: {
                email: 'person@example.com',
                mobile_number: '+15551234567',
            },
            userAttributes: {
                rokt_rclid: 'rclid-123',
                rokt_account_id: 'account-456',
                rokt_referral_creative_id: 'creative-789',
            },
        });
    });

    it('filters custom lead capture attributes with allowlist and safe values', () => {
        const { watcher, handlers } = setup();
        watcher.configure({
            enabled: true,
            identityCapture: {
                enabled: true,
                allowCustomUserAttributes: true,
                allowedUserAttributeKeys: ['tier', 'flag', 'tags'],
            },
        });

        window.dispatchEvent(
            new CustomEvent('LEAD_CAPTURE_SUBMITTED', {
                detail: {
                    body: {
                        userAttributes: {
                            tier: 'gold',
                            flag: true,
                            tags: ['a', 'b'],
                            ignored_number_array: [1, 2],
                            ['__proto__']: 'bad',
                            notAllowlisted: 'skip',
                        },
                    },
                },
            })
        );

        expect(handlers.onLeadCaptureSubmitted).toHaveBeenCalledWith({
            identities: {},
            userAttributes: {
                tier: 'gold',
                flag: true,
                tags: ['a', 'b'],
            },
        });
    });

    it('removes listeners after dispose', () => {
        const { watcher, handlers } = setup();
        watcher.configure({
            enabled: true,
            identityCapture: { enabled: true },
        });
        watcher.dispose();

        window.dispatchEvent(
            new CustomEvent('rokt:intent', {
                detail: { reason: 'mouse-exit-top' },
            })
        );
        window.dispatchEvent(
            new CustomEvent('LEAD_CAPTURE_SUBMITTED', {
                detail: { body: { email: 'person@example.com' } },
            })
        );

        expect(handlers.onExitIntent).not.toHaveBeenCalled();
        expect(handlers.onLeadCaptureSubmitted).not.toHaveBeenCalled();
    });
});

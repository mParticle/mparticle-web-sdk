import { AsyncUploader, FetchUploader, XHRUploader, IFetchPayload } from './uploaders';
import { IMParticleWebSDKInstance } from './mp-instance';
import Constants from './constants';

interface TimingEventsRequestPayload extends IFetchPayload {
    headers: {
        Accept: string;
        'Content-Type': string;
        [key: string]: string;
    };
}

interface TimingEventsRequestBody {
    timingMetrics: Array<{
        name: string;
        value: number;
    }>;
}

export interface ITimingEventsClient {
    sendTimingEvent: (eventType: string, timestamp: number) => Promise<void>;
}

export default function TimingEventsClient(
    this: ITimingEventsClient,
    mpInstance: IMParticleWebSDKInstance
) {
    const launcherInstanceGuidKey = Constants.Rokt.LauncherInstanceGuidKey;

    const getLauncherInstanceGuid = (): string | undefined => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        if (window[launcherInstanceGuidKey] && typeof window[launcherInstanceGuidKey] === 'string') {
            return window[launcherInstanceGuidKey];
        }
        return undefined;
    };

    const getRoktTraceId = (): string | undefined => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const roktTraceIdKey = '__rokt_trace_id__';
        if (window[roktTraceIdKey] && typeof window[roktTraceIdKey] === 'string') {
            return window[roktTraceIdKey];
        }
        return undefined;
    };

    this.sendTimingEvent = async function(eventType: string, timestamp: number): Promise<void> {
        if (!mpInstance._Store) {
            return;
        }

        const launcherInstanceGuid = getLauncherInstanceGuid();
        if (!launcherInstanceGuid) {
            return;
        }

        const roktTraceId = getRoktTraceId();
        if (!roktTraceId) {
            return;
        }

        const { sessionId } = mpInstance._Store;

        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };

        headers['rokt-launcher-instance-guid'] = launcherInstanceGuid;
        headers['x-rokt-trace-id'] = roktTraceId;

        if (sessionId) {
            headers['rokt-session-id'] = sessionId;
        }

        if (Constants.sdkVersion) {
            headers['rokt-sdk-version'] = Constants.sdkVersion;
        }

        headers['rokt-sdk-framework-type'] = 'integration-launcher';
        headers['rokt-integration-type'] = 'wsdk';

        if (mpInstance._Store.context) {
            const context = mpInstance._Store.context as any;
            if (context.partnerId) {
                headers['rokt-tag-id'] = String(context.partnerId);
            }
            if (context.pageId) {
                headers['rokt-page-id'] = context.pageId;
            }
            if (context.pageInstanceGuid) {
                headers['rokt-page-instance-guid'] = context.pageInstanceGuid;
            }
        }

        const timingMetricsBody: TimingEventsRequestBody = {
            timingMetrics: [
                {
                    name: eventType,
                    value: timestamp,
                },
            ],
        };

        const uploadUrl = `/v1/timings/events`;

        const uploader: AsyncUploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        const fetchPayload: TimingEventsRequestPayload = {
            method: 'post',
            headers: headers as TimingEventsRequestPayload['headers'],
            body: JSON.stringify(timingMetricsBody),
        };

        try {
            const response: Response = await uploader.upload(fetchPayload);
            
            if (response.status >= 200 && response.status < 300) {
                if (mpInstance.Logger) {
                    mpInstance.Logger.verbose(
                        `Identify timing event sent successfully: ${eventType} at ${timestamp}`
                    );
                }
            } else {
                if (mpInstance.Logger) {
                    mpInstance.Logger.warning(
                        `Timing event request returned HTTP ${response.status} for event: ${eventType}`
                    );
                }
            }
        } catch (err) {
            const errorMessage = (err as Error).message || err.toString();
            if (mpInstance.Logger) {
                mpInstance.Logger.error(
                    `Error sending identify timing event: ${errorMessage}`
                );
            }
        }
    };
}

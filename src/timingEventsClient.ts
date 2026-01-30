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

        const uploader: AsyncUploader = (typeof window !== 'undefined' && window.fetch)
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        const fetchPayload: TimingEventsRequestPayload = {
            method: 'post',
            headers: headers as TimingEventsRequestPayload['headers'],
            body: JSON.stringify(timingMetricsBody),
        };

        try {
            await uploader.upload(fetchPayload);
        } catch (err) {
        }
    };
}

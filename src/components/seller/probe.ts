import * as api from '../../api/sellerApi';
import { getDeviceInfo } from '../../api/shared';

const SELLER_PROBE_SESSION_KEY = 'seller_probe_session_id';

export function getOrCreateSellerProbeSessionId(): string {
  const existing = sessionStorage.getItem(SELLER_PROBE_SESSION_KEY);
  if (existing) return existing;

  const next = `seller_${crypto.randomUUID()}`;
  sessionStorage.setItem(SELLER_PROBE_SESSION_KEY, next);
  return next;
}

async function buildProbeDevice(): Promise<api.Probe.ProbeDevice | undefined> {
  try {
    const device = await getDeviceInfo();
    return {
      device_id: device.device_id,
      platform: device.device_type ?? 'web',
      app_version: device.app_version,
      os_version: device.os_version,
      locale: navigator.language,
    };
  } catch {
    return undefined;
  }
}

export async function trackSellerEvent(params: {
  sellerId?: string;
  type: api.Probe.ProbeEventInput['type'];
  screenName?: string;
  properties?: Record<string, any>;
}): Promise<void> {
  const sessionId = getOrCreateSellerProbeSessionId();
  const device = await buildProbeDevice();

  await api.Probe.IngestEvents({
    session_id: sessionId,
    user_id: params.sellerId,
    device,
    events: [
      {
        type: params.type,
        timestamp: new Date().toISOString(),
        properties: params.properties,
        context: params.screenName ? { screen_name: params.screenName } : undefined,
      },
    ],
  }).catch(() => undefined);
}

export async function sendSellerHeartbeat(params: {
  sellerId?: string;
  screenName?: string;
  pageCount?: number;
}): Promise<void> {
  const sessionId = getOrCreateSellerProbeSessionId();
  const device = await buildProbeDevice();

  await api.Probe.Heartbeat({
    session_id: sessionId,
    user_id: params.sellerId,
    device,
    timestamp: new Date().toISOString(),
    screen_name: params.screenName,
    page_count: params.pageCount ?? 1,
  }).catch(() => undefined);
}


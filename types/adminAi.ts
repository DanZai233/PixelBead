export interface UsageCounts {
  requests: number;
  generated: number;
  failed: number;
  archiveFailed: number;
  timeout: number;
  pending: number;
  text: number;
  image: number;
  avgDurationMs: number | null;
}

export interface UsageStats {
  summary: UsageCounts & { uniqueIps: number };
  daily: (UsageCounts & { _id: string })[];
  users: (UsageCounts & { _id: string; firstSeen: number; lastSeen: number; request?: { userAgent?: string; country?: string; region?: string; city?: string } })[];
  devices: { _id: string; requests: number }[];
  countries: { _id: string; requests: number }[];
  models: { _id: string; requests: number }[];
  errors: { _id: string; requests: number }[];
  page: number;
  limit: number;
}

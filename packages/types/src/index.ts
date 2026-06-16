export type RoleName = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
export type SupportedAiProvider = "GEMINI" | "CLAUDE" | "DEEPSEEK" | "GROK" | "MISTRAL";
export type StorageProviderName = "local" | "minio";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: RoleName;
  image?: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  description: string;
}

export interface DashboardMetricCard {
  label: string;
  value: string;
  helperText: string;
}

export interface AiProviderSummary {
  name: SupportedAiProvider;
  configured: boolean;
  status: "available" | "not_configured";
}

export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

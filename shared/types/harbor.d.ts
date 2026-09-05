/**
 * Type declarations for the Harbor Host Bridge (`harbor`) injected into plugin workers.
 */

export interface HElement {
  querySelector(selector: string): HElement | null;
  querySelectorAll(selector: string): HElement[];
  text(): string;
  attr(name: string): string | null;
}

export interface HDocument {
  querySelector(selector: string): HElement | null;
  querySelectorAll(selector: string): HElement[];
}

export interface HttpOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  responseType?: 'text' | 'json' | 'base64';
  timeoutMs?: number;
}

export interface HttpResponseText {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: string;
}

export interface GrpcOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  mode?: 'grpc' | 'grpc-web';
}

export interface GrpcResult {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: Uint8Array;
  messages: Uint8Array[];
  trailers: Record<string, string>;
  grpcStatus?: number;
  grpcMessage?: string;
}

export interface HarborHost {
  /**
   * Mediated network HTTP request.
   * Private, loopback, and link-local hosts are blocked.
   * Cookies and restricted headers are stripped.
   */
  http(url: string, opts?: HttpOptions & { responseType?: 'text' | 'base64' }): Promise<HttpResponseText>;
  http<T = unknown>(url: string, opts: HttpOptions & { responseType: 'json' }): Promise<T | null>;
  http(url: string, opts?: HttpOptions): Promise<HttpResponseText>;

  /**
   * Mediated binary gRPC / gRPC-Web request.
   */
  grpc(
    url: string,
    protobufBytes: Uint8Array | ArrayBuffer | number[] | string,
    opts?: GrpcOptions
  ): Promise<GrpcResult>;

  /**
   * Parse HTML string into a queryable DOM-like tree.
   * Script, style, and iframe nodes are automatically removed.
   */
  parseHtml(html: string): Promise<HDocument>;

  /**
   * Register your provider instance.
   */
  register(provider: any): void;

  /**
   * Log messages to Harbor dev console.
   */
  log(...args: any[]): void;
}

declare global {
  /** Injected Harbor host bridge available in the plugin execution scope */
  const harbor: HarborHost;
}

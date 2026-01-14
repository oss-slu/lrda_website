/**
 * Base HTTP client with standardized error handling and request/response patterns.
 * Provides foundation for all API interactions.
 */

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * Generic HTTP client that can be extended for specific API backends.
 * Handles common patterns like JSON serialization, headers, and error handling.
 */
export class HttpClient {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;
  protected timeout: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Core request method that all HTTP methods use internally.
   */
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.defaultHeaders,
          ...(options.headers as Record<string, string>),
        },
      });

      clearTimeout(timeoutId);

      // Handle empty responses (e.g., 204 No Content)
      let data: T;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      return {
        data,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('Request timeout', 408, 'TIMEOUT');
      }

      throw this.createError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        'NETWORK_ERROR',
      );
    }
  }

  /**
   * Build full URL from base and endpoint.
   */
  protected buildUrl(endpoint: string): string {
    // Handle absolute URLs
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Ensure proper joining of baseUrl and endpoint
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${base}${path}`;
  }

  /**
   * Create a standardized error object.
   */
  protected createError(message: string, status: number, code?: string): ApiError {
    return { message, status, code };
  }

  /**
   * GET request.
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST request with JSON body.
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  /**
   * PUT request with JSON body.
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }

  /**
   * PATCH request with JSON body.
   */
  async patch<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers,
    });
  }

  /**
   * DELETE request with optional body.
   */
  async delete<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }
}

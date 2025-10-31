import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

/**
 * Features:
 * - Singleton
 * - Interceptors for auth + errors
 * - Automatic retries with exponential backoff (simple)
 * - Request timeout + cancel support
 * - Strong typing for responses
 * - Pluggable logger
 */

type Logger = {
    info?: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
};

export interface ApiClientOptions {
    baseURL?: string;
    timeoutMs?: number;
    maxRetries?: number;
    logger?: Logger;
    getAuthHeader?: () => Promise<string | null> | string | null;
    isEdge?: boolean;
}

export class ApiError extends Error {
    public status?: number;
    public data?: any;
    public originalError?: any;

    constructor(message: string, status?: number, data?: any, originalError?: any) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
        this.originalError = originalError;
    }
}

export class ApiClient {
    private static _instance: ApiClient | null = null;
    private axios: AxiosInstance;
    private options: Required<ApiClientOptions>;
    private logger: Logger;

    private constructor(opts: ApiClientOptions = {}) {
        this.options = {
            baseURL: opts.baseURL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
            timeoutMs: opts.timeoutMs ?? 10_000,
            maxRetries: opts.maxRetries ?? 2,
            logger: opts.logger ?? console,
            getAuthHeader: opts.getAuthHeader ?? (() => null),
            isEdge: opts.isEdge ?? false,
        };

        this.logger = this.options.logger;

        this.axios = axios.create({
            baseURL: this.options.baseURL,
            timeout: this.options.timeoutMs,
            withCredentials: false,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        this.setupInterceptors();
    }

    public static getInstance(opts?: ApiClientOptions) {
        if (!ApiClient._instance) {
            ApiClient._instance = new ApiClient(opts);
        }
        return ApiClient._instance;
    }

    public static setInstanceForTest(instance: ApiClient) {
        ApiClient._instance = instance;
    }

    private setupInterceptors() {
        this.axios.interceptors.request.use(
            async (config: any) => {
                try {
                    const tokenOrHeader = await this.options.getAuthHeader();
                    if (tokenOrHeader) {
                        const headerValue = tokenOrHeader.startsWith("Bearer ") ? tokenOrHeader : `Bearer ${tokenOrHeader}`;
                        config.headers = {
                            ...config.headers,
                            Authorization: headerValue,
                        };
                    }
                } catch (e) {
                    this.logger.warn?.("getAuthHeader failed:", e);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.axios.interceptors.response.use(
            (res: AxiosResponse) => res,
            async (error: AxiosError) => {
                //TODO: If token expired handling is needed, implement here.
                // For now, wrap into ApiError for consistent handling.
                if (error.code !== "ERR_CANCELED"){
                    const status = error.response?.status;
                    const data = error.response?.data as any;
                    const msg = data?.message || "Network error";
                    const apiError = new ApiError(msg, status, data, error);
                    this.logger?.error?.("API error:", status, msg, data);
                    return Promise.reject(apiError);
                }

            }
        );
    }

    private async request<T = any>(config: AxiosRequestConfig, retriesLeft = this.options.maxRetries): Promise<T> {
        try {
            const response = await this.axios.request<T>({ ...config });
            return response.data;
        } catch (err) {
            const isNetwork = !(err as any)?.status;
            const status = (err as any)?.status;
            const shouldRetry = retriesLeft > 0 && (isNetwork || (status >= 500 && status < 600));
            if (shouldRetry) {
                const backoff = this.backoffDelay(this.options.maxRetries - retriesLeft);
                this.logger.info?.(`Retrying request in ${backoff}ms. retriesLeft=${retriesLeft - 1}`);
                await this.sleep(backoff);
                return this.request<T>(config, retriesLeft - 1);
            }
            throw err;
        }
    }

    private backoffDelay(attempt: number) {
        const base = 200;
        const jitter = Math.floor(Math.random() * 100);
        return Math.pow(2, attempt) * base + jitter;
    }

    private sleep(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
    }

    public get<T = any>(url: string, config?: AxiosRequestConfig) {
        return this.request<T>({ method: "GET", url, ...config });
    }

    public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.request<T>({ method: "POST", url, data, ...config });
    }

    public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.request<T>({ method: "PUT", url, data, ...config });
    }

    public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.request<T>({ method: "PATCH", url, data, ...config });
    }

    public delete<T = any>(url: string, config?: AxiosRequestConfig) {
        return this.request<T>({ method: "DELETE", url, ...config });
    }

    // Raw axios if needed (for advanced use)
    public raw() {
        return this.axios;
    }
}

export default ApiClient.getInstance();
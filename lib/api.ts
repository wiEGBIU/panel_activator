interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

// Define response types for better TypeScript support
interface CountResponse {
  count: number;
}

interface PromoCodesCountsResponse {
  working_count: number;
  non_working_count: number;
  total_count?: number;
}

interface AccessCodesResponse {
  access_codes: string[];
  count: number;
}

interface GenerateAccessCodesResponse {
  status: string;
  message: string;
  access_codes?: string[];
  generated_codes?: string[];
  codes?: string[];
  count?: number;
}

interface PromoCodesResponse {
  working_promo_codes: string[];
  non_working_promo_codes: string[];
  working_count: number;
  non_working_count: number;
}

interface WorkingPromoCodesResponse {
  working_promo_codes: string[];
  count: number;
}

interface NonWorkingPromoCodesResponse {
  non_working_promo_codes: string[];
  count: number;
}

interface ApiResponse {
  status: string;
  message: string;
  result?: any;
}

// Log interfaces
interface LogEntry {
  timestamp: string;
  level: string;
  function: string;
  message: string;
}

interface LogsResponse {
  logs: LogEntry[];
  count: number;
  timestamp: string;
}

interface LogStatsResponse {
  total_logs: number;
  level_counts: Record<string, number>;
  function_counts: Record<string, number>;
  active_subscribers: number;
  timestamp: string;
}

interface LogSearchResponse {
  logs: LogEntry[];
  count: number;
  filters_applied: {
    query?: string;
    level?: string;
    function?: string;
    limit: number;
  };
  timestamp: string;
}

// Checker interfaces
interface CheckerResults {
  working_codes: string[];
  already_redeemed: string[];
  non_existent: string[];
  error: string[];
}

interface CheckerResponse {
  results: CheckerResults;
  summary: {
    total_codes: number;
    working_codes: number;
    already_redeemed: number;
    non_existent: number;
    errors: number;
  };
}

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...this.config.headers,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error) {
      // Handle network errors or API unavailability
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('API server is not available. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Email & Pro Activation
  async sendEmail(email: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/send-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async activatePro(email: string, verification: string, access_code: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/activate-pro', {
      method: 'POST',
      body: JSON.stringify({ email, verification, access_code }),
    });
  }

  // Fast Count Endpoints
  async getAccessCodesCount(): Promise<CountResponse> {
    return this.request<CountResponse>('/access-codes/count');
  }

  async getWorkingPromoCodesCount(): Promise<CountResponse> {
    return this.request<CountResponse>('/promo-codes/working/count');
  }

  async getNonWorkingPromoCodesCount(): Promise<CountResponse> {
    return this.request<CountResponse>('/promo-codes/non-working/count');
  }

  async getAllPromoCodesCounts(): Promise<PromoCodesCountsResponse> {
    return this.request<PromoCodesCountsResponse>('/promo-codes/counts');
  }

  // Access Codes - Data Retrieval
  async getAccessCodes(): Promise<AccessCodesResponse> {
    return this.request<AccessCodesResponse>('/access-codes');
  }

  async getAccessCode(code: string): Promise<any> {
    return this.request(`/access-code/${code}`);
  }

  async generateAccessCodes(count: number): Promise<GenerateAccessCodesResponse> {
    return this.request<GenerateAccessCodesResponse>('/generate-access-codes', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  }

  async deleteAccessCode(code: string): Promise<any> {
    return this.request(`/access-code/${code}`, {
      method: 'DELETE',
    });
  }

  async deleteAccessCodesBulk(codes: string[]): Promise<any> {
    return this.request('/access-codes/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ codes }),
    });
  }

  async clearAccessCodes(): Promise<any> {
    return this.request('/access-codes/clear', {
      method: 'DELETE',
    });
  }

  // Promo Codes - Data Retrieval
  async getPromoCodes(): Promise<PromoCodesResponse> {
    return this.request<PromoCodesResponse>('/promo-codes');
  }

  async getWorkingPromoCodes(): Promise<WorkingPromoCodesResponse> {
    return this.request<WorkingPromoCodesResponse>('/promo-codes/working');
  }

  async getNonWorkingPromoCodes(): Promise<NonWorkingPromoCodesResponse> {
    return this.request<NonWorkingPromoCodesResponse>('/promo-codes/non-working');
  }

  async addPromoCode(promo_code: string): Promise<any> {
    return this.request('/promo-code', {
      method: 'POST',
      body: JSON.stringify({ promo_code }),
    });
  }

  async addPromoCodesBulk(codes: { promo_code: string }[]): Promise<any> {
    return this.request('/promo-codes/bulk', {
      method: 'POST',
      body: JSON.stringify({ codes }),
    });
  }

  async deletePromoCode(promo_code: string): Promise<any> {
    return this.request(`/promo-code/${promo_code}`, {
      method: 'DELETE',
    });
  }

  async deletePromoCodesBulk(codes: string[]): Promise<any> {
    return this.request('/promo-codes/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ codes }),
    });
  }

  async clearPromoCodes(): Promise<any> {
    return this.request('/promo-codes/clear', {
      method: 'DELETE',
    });
  }

  // Logs Endpoints
  async getRecentLogs(limit: number = 100): Promise<LogsResponse> {
    return this.request<LogsResponse>(`/logs/recent?limit=${limit}`);
  }

  async clearLogs(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/logs/clear', {
      method: 'POST',
    });
  }

  async getLogStats(): Promise<LogStatsResponse> {
    return this.request<LogStatsResponse>('/logs/stats');
  }

  async searchLogs(query?: string, level?: string, functionName?: string, limit: number = 100): Promise<LogSearchResponse> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (level) params.append('level', level);
    if (functionName) params.append('function', functionName);
    params.append('limit', limit.toString());

    return this.request<LogSearchResponse>(`/logs/search?${params.toString()}`);
  }

  // Checker Endpoint
  async checkPromoCodes(codes: string[]): Promise<CheckerResponse> {
    return this.request<CheckerResponse>('/checker', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(codes),
    });
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('/');
  }
}

export { ApiClient };
export type { 
  ApiConfig, 
  CountResponse, 
  PromoCodesCountsResponse, 
  AccessCodesResponse, 
  PromoCodesResponse, 
  ApiResponse, 
  GenerateAccessCodesResponse,
  LogEntry,
  LogsResponse,
  LogStatsResponse,
  LogSearchResponse,
  CheckerResults,
  CheckerResponse
};
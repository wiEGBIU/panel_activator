interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
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
  async sendEmail(email: string) {
    return this.request('/send-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async activatePro(email: string, verification: string, access_code: string) {
    return this.request('/activate-pro', {
      method: 'POST',
      body: JSON.stringify({ email, verification, access_code }),
    });
  }

  // Fast Count Endpoints
  async getAccessCodesCount() {
    return this.request('/access-codes/count');
  }

  async getWorkingPromoCodesCount() {
    return this.request('/promo-codes/working/count');
  }

  async getNonWorkingPromoCodesCount() {
    return this.request('/promo-codes/non-working/count');
  }

  async getAllPromoCodesCounts() {
    return this.request('/promo-codes/counts');
  }

  // Access Codes - Data Retrieval
  async getAccessCodes() {
    return this.request('/access-codes');
  }

  async getAccessCode(code: string) {
    return this.request(`/access-code/${code}`);
  }

  async generateAccessCodes(count: number) {
    return this.request('/generate-access-codes', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  }

  async deleteAccessCode(code: string) {
    return this.request(`/access-code/${code}`, {
      method: 'DELETE',
    });
  }

  async deleteAccessCodesBulk(codes: string[]) {
    return this.request('/access-codes/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ codes }),
    });
  }

  async clearAccessCodes() {
    return this.request('/access-codes/clear', {
      method: 'DELETE',
    });
  }

  // Promo Codes - Data Retrieval
  async getPromoCodes() {
    return this.request('/promo-codes');
  }

  async getWorkingPromoCodes() {
    return this.request('/promo-codes/working');
  }

  async getNonWorkingPromoCodes() {
    return this.request('/promo-codes/non-working');
  }

  async addPromoCode(promo_code: string) {
    return this.request('/promo-code', {
      method: 'POST',
      body: JSON.stringify({ promo_code }),
    });
  }

  async addPromoCodesBulk(codes: { promo_code: string }[]) {
    return this.request('/promo-codes/bulk', {
      method: 'POST',
      body: JSON.stringify({ codes }),
    });
  }

  async deletePromoCode(promo_code: string) {
    return this.request(`/promo-code/${promo_code}`, {
      method: 'DELETE',
    });
  }

  async deletePromoCodesBulk(codes: string[]) {
    return this.request('/promo-codes/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ codes }),
    });
  }

  async clearPromoCodes() {
    return this.request('/promo-codes/clear', {
      method: 'DELETE',
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/');
  }
}

export { ApiClient };
export type { ApiConfig };
import axios from 'axios';

class HttpClient {
    constructor(baseURL) {
        // Allow passing baseURL for different endpoints
        this.client = axios.create({
            baseURL: baseURL || 'https://localhost/medline/wp-json/wooheadless/v1', // Default to RBaseUrl if no baseURL is passed
            headers: {
                'Content-Type': 'application/json',
                // Add auth token dynamically in request interceptor
            },
            withCredentials: true,
        });

        // Interceptor to add the token to each request
        this.client.interceptors.request.use(
            (config) => {
                const cart_token = localStorage.getItem('cart_token'); // Retrieve token from localStorage
                if (cart_token) {
                    // config.headers['Authorization'] = `Bearer ${token}`; // Add token to headers if it exists
                    config.headers['Cart-Token'] = cart_token; // Add nonce to headers if it exists
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Optional: Interceptors to handle API responses
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API error:', error);
                return Promise.reject(error);
            }
        );
    }

    // Method to change the base URL dynamically
    setBaseURL(baseURL) {
        this.client.defaults.baseURL = baseURL;
    }

    get(url, config = {}) {
        return this.client.get(url, config);
    }

    post(url, data, config = {}) {
        return this.client.post(url, data, config);
    }

    delete(url, config = {}) {
        return this.client.delete(url, config);
    }
}

export default HttpClient;

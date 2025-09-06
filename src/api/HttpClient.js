import axios from 'axios';

class HttpClient {
    constructor(baseURL) {
        // const base = import.meta.env.VITE_API_BASE_URL;
        // Allow passing baseURL for different endpoints
        this.client = axios.create({
            baseURL: baseURL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Add auth token dynamically in request interceptor
            },
        });

        // Interceptor to add the token to each request
        this.client.interceptors.request.use(
            (config) => {
                const cart_token = localStorage.getItem('cart_token'); // Retrieve token from localStorage

                // Prevent sending Cart-Token for the /cart/ endpoint
                if (cart_token && !config.url.includes('/cart') && !config.url.includes('/products')) {
                    console.log('Cart-Token added to header', cart_token);
                    config.headers['Cart-Token'] = cart_token; // Add Cart-Token to headers if it's not the /cart/ endpoint
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

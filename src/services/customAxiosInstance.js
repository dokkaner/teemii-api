const axios = require('axios')

class CustomAxiosInstance {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.ES_BASE_URL,
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, gzip, deflate, br',
        'x-api-key': process.env.ES_API_KEY,
      },
    });
  }

  get(url) {
    return this.axiosInstance.get(url);
  }

  post(url, data) {
    return this.axiosInstance.post(url, data);
  }
}

const customAxiosInstance = new CustomAxiosInstance();
module.exports = customAxiosInstance;
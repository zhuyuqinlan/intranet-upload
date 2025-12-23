import axios, { AxiosError } from 'axios';
import type { ApiResponse } from './types';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 只有非 FormData 请求才设置 Content-Type
    // FormData 会由 Axios 自动设置正确的 Content-Type (包括 boundary)
    if (!(config.data instanceof FormData)) {
      config.headers = config.headers || {};
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (data.success === false) {
      return Promise.reject(new Error(data.error || data.message || '请求失败'));
    }
    return data.data;
  },
  (error: AxiosError<ApiResponse>) => {
    const message = error.response?.data?.error ||
                   error.response?.data?.message ||
                   error.message ||
                   '请求失败';
    return Promise.reject(new Error(message));
  }
);

export default request;

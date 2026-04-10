
let loadingInstance = null; // 记录当前的 Loading 实例
import Config from './config.js'
const BASE_URL = 'http://localhost:9810'; // 统一的请求前缀

function showLoading() {
    if (!loadingInstance) {
        loadingInstance = uni.showLoading({
            title: '加载中...',
            mask: true,
        });
    }
}

function hideLoading() {
    if (loadingInstance) {
        uni.hideLoading();
        loadingInstance = null;
    }
}

function request(url, method = 'GET', data = {}, headers = {}) {
    showLoading(); // 显示 Loading

    return new Promise((resolve, reject) => {
        uni.request({
            url: `${Config.baseUrl}${url}`, // 拼接请求前缀和接口路径
            method,
            data,
            header: {
                'Content-Type': 'application/json',
				token:uni.getStorageSync('token'),
                ...headers,
            },
            success: (res) => {
                resolve(res.data);
            },
            fail: (err) => {
                reject(err);
            },
            complete: () => {
                hideLoading(); // 隐藏 Loading
            },
        });
    });
}

export default request;

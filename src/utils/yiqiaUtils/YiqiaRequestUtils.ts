import axios from "axios";
import SdkConfig from "../../SdkConfig";

const GMS_URL = SdkConfig.get()["gms_url"];
const requestInstance = axios.create({
    baseURL: GMS_URL,
    timeout: 30000,
});
requestInstance.defaults.headers.common['Content-Type'] = 'application/json';
requestInstance.defaults.headers.common['Accept'] = 'application/json';

export const newPost = (url, token, params?:any) => {
    const newInstance = axios.create({
        headers: {
            'Authorization': "Bearer " + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    });
    return new Promise((resolve, reject) => {
        newInstance.post(url, params).then(resp => {
            if(resp.data.code !== 200) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        })
    });
}

export const newUpload = (url, token, params?:any) => {
    const newInstance = axios.create({
        headers: {
            'Authorization': "Bearer " + token,
        }
    });
    return new Promise((resolve, reject) => {
        newInstance.post(url, params).then(resp => {
            if(resp.data.code !== 200) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        })
    });
}

export const newGet = (url, token, params?:any) => {
    const newInstance = axios.create({
        headers: {
            'Authorization': "Bearer " + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });
    return new Promise((resolve, reject) => {
        newInstance.get(url, params).then(resp => {
            if(resp.data.code !== 200) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        })
    });
}

export const newDownload = (url, token, params?:any) => {
    const newInstance = axios.create({
        headers: {
            'Authorization': "Bearer " + token,
            'Content-Type': 'application/json',
            "Response-Type": 'blob',
        }
    });
    return new Promise((resolve, reject) => {
        newInstance.get(url, params).then(resp => {
            if(resp.status !== 200) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        })
    });
}

export const get = (url, params?:any) => {
    return new Promise((resolve, reject) => {
        requestInstance.get(url, params).then(resp => {
            if(resp.data.code !== 200) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        })
    });
}

export const post = (url, params?:any) => {
    return new Promise((resolve, reject) => {
        requestInstance.post(url, params).then(resp => {
            if(resp.data.code !== 200) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        })
    });
}
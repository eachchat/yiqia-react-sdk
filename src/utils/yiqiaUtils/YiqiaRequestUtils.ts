import axios from "axios";
import SdkConfig from "../../SdkConfig";

const GMS_URL = SdkConfig.get()["gms_url"];
const requestInstance = axios.create({
    baseURL: GMS_URL,
    timeout: 30000,
});
requestInstance.defaults.headers.common['Content-Type'] = 'application/json';
requestInstance.defaults.headers.common['Accept'] = 'application/json';

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
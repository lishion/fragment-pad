Promise.prototype.finally = function (callback) {
    let P = this.constructor;
    return this.then(
        value => P.resolve(callback()).then(() => value),
        reason =>
            P.resolve(callback()).then(() => {
                throw reason;
            })
    );
};

import axios from 'axios'

export default class Sender {
    constructor(axios) {
        this.axios = axios;
    }

    static getInstance(){
        const dev = process.env.NODE_ENV === "development"
        if(!Sender.instance){
            const axiosInstance = axios.create({
                baseURL: dev ? "http://127.0.0.1:8000" : "http://www.fern-li.cn",
                xsrfCookieName:'csrftoken',
                xsrfHeaderName:'X-CSRFtoken',
                withCredentials: true
            });
            Sender.instance = new Sender(axiosInstance)
        }
        return Sender.instance
    }
    get(url) {
        let response = this.axios.get(url);
        return this.handleResponse(response);
    }
    post(url, data) {
        let response = this.axios.post(url, data);
        return this.handleResponse(response);
    }
    patch(url, data) {
        let response = this.axios.patch(url, data);
        return this.handleResponse(response);
    }
    delete(url, data) {
        let response = this.axios.delete(url, {"data":data});
        return this.handleResponse(response);
    }
    handleResponse(response) {
        return new Promise((resolve, reject) => {
            response.then(response => {
                    if (response.data.status != "success") {
                        reject(response.data.message);
                    } else {
                        resolve(response.data.data);
                    }
                })
                .catch(e => {
                    reject("网络或服务器异常");
                });
        });
    }
}


Sender.instance = null
 


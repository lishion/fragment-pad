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
        if(!Sender.instance){
            const axiosInstance = axios.create({
                xsrfCookieName:'csrftoken',
                xsrfHeaderName:'X-CSRFtoken'
            });
            axiosInstance.defaults.withcredentials=true
            Sender.instance =  new Sender(axiosInstance)
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
                    reject(e);
                });
        });
    }
}


Sender.instance = null
 


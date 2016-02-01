var request = require('request')
import {clone} from './utilities';

interface FetchOptions {
    url: string,
    baseUrl?: string,
    auth?: {
        userName: string,
        password: string
    },
    method?: string,
    json?: boolean,
    body?: any
}

export default function fetch(options: FetchOptions): Promise<{response: {statusCode: number}, body: string}>{
    var auth = options.auth ? {user: options.auth.userName, pass: options.auth.password} : null;
    return new Promise((resolve, reject) => {
        var newOptions = <any>clone(options);
        if(auth)newOptions.auth = auth;
        if(!newOptions.method)newOptions.method = 'GET';
        var callback = (error, response, body: string) => {
            if(error){
                reject(error);
                return;
            }
            console.log('http ' + newOptions.method + ' request completed');
            resolve({response: response, body: body});
        }
        request(newOptions, callback);
    });
}

export function expectStatus200(responseAndBody:{response: any, body: string}): Promise<{response: any, body: string}>{
    return expectStatus(200)(responseAndBody);
}

interface ResponseAndBody{
    response: any, 
    body: string
}

function expectStatus(...statuses: number[]){
    return expect(
        rb => rb.response && statuses.indexOf(rb.response.statusCode) === -1,
        rb => 'Error: HTTP response status: ' + rb.response.statusCode
    );
}

function expect(what: (rb:ResponseAndBody) => boolean, sayIfNot: (rb:ResponseAndBody) => string){
    return (rb:{response: any, body: string})=>{
        return new Promise((resolve, reject) => {
            var response = rb.response;
            if(what(rb)){   
                reject(sayIfNot(rb));
            }
        
            resolve(rb);        
        });
    }
}

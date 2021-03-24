import axios from 'axios'

const REQUEST_MODULE = "request";

interface RequestUIHandler {
    loading: (loading: Boolean) => void;
    error: (err: any) => void;
}

type HeaderProvider = (path) => object;

function createAxiosInstance(baseURL: string, timeout: number, headerInjectionFunc: HeaderProvider, uiHandler?: RequestUIHandler) {
    const service = axios.create({
        baseURL,
        withCredentials: true, // send cookies when cross-domain requests
        timeout // request timeout
    })

    // request interceptor
    service.interceptors.request.use(
        config => {
            const addHeaders = headerInjectionFunc(config.url);
            var headers;
            if (config.headers) {
                headers = { ...config.headers, ...addHeaders };
            } else {
                headers = addHeaders;
            }
            if (uiHandler) {
                uiHandler.loading(true);
            }
            return { ...config, headers };
        },
        error => {
            if (uiHandler) {
                uiHandler.error(error);
            }
            if (uiHandler) {
                uiHandler.loading(false);
            }
            return Promise.reject(error)
        }
    )

    // response interceptor
    service.interceptors.response.use(
        response => {
            if (uiHandler) {
                uiHandler.loading(false);
            }
            return response;
        },
        error => {
            if (uiHandler) {
                uiHandler.error(error);
            }
            if (uiHandler) {
                uiHandler.loading(false);
            }
            return Promise.reject(error)
        }
    )
    return service;
}

let vueInstance = null

export default {
    name: REQUEST_MODULE,
    dependsOn: null,
    extensionPoints: {
        "request.ui": ({ registry }, obj: RequestUIHandler) => {
            registry.moduleVarSet(REQUEST_MODULE, "ui", obj);
        },
        // request header injection function registration
        // the registered function will be called for every request for header provision
        "request.header": ({ registry }, obj: HeaderProvider) => {
            registry.moduleVarAppend(REQUEST_MODULE, "headerProvider", obj);
        }
    },
    start({ vue, registry }) {

        // create an axios instance
        let httpCfg = registry.configGet('http');

        let baseURL = httpCfg ? httpCfg['endpoint'] : null;
        let timeout = httpCfg ? httpCfg['timeout'] : 15000;

        const headerProviders = registry.moduleVarGet(REQUEST_MODULE, "headerProvider");
        const flattenHeaderProviders = headerProviders ? headerProviders.reduce((a, b) => [...a, ...b], []) : [];

        const headerInjectionFunc = flattenHeaderProviders.length > 0
            ? (path) => {
                const headers = flattenHeaderProviders //
                    .map(hp => hp(path)) //
                    .reduce((h1, h2) => { return { ...h1, ...h2 } }, {});
                return headers;
            }
            : () => { return {} }

        // headless request
        vue.prototype.$request = createAxiosInstance(baseURL, timeout, headerInjectionFunc);

        // ui request
        let uiHandler = registry.moduleVarGet(REQUEST_MODULE, "ui");
        vue.prototype.$requestUI = createAxiosInstance(baseURL, timeout, headerInjectionFunc, uiHandler);

        vueInstance = vue
    },
    request(config) {
        if (vueInstance) {
            return vueInstance.prototype.$request(config)
        }
        console.log('Vue not initialized yet')
    },
    requestUI(config) {
        if (vueInstance) {
            return vueInstance.prototype.$requestUI(config)
        }
        console.log('Vue not initialized yet')
    }
}

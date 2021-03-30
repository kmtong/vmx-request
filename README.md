# How to Use

## Setup

```js
import VueModx from 'vue-modx'
import RequestModule from 'vmx-request'
import RequestElementUIModule from 'vmx-request-elm' // provide UI handler for HTTP requests

// vue3-style
const app = createApp({})

app.use(VueModx, {
    modules: [RequestModule, RequestElementUIModule],
    config: {
        http: {
            endpoint: "http://localhost:8080/",
            timeout: 5000 
        }
    }
})

```

## Make a Request

In Vue:

```js
async request() {
    let resp = await this.$request({
        url: `/path`,
        method: 'get'
    })
    console.log(resp);
},
async requestUI() {
    // with UI handler (loading/error)
    let resp = await this.$requestUI({
        url: `/path`,
        method: 'get'
    })
    console.log(resp);
}
```

Wrapping Request into API:

* api.js
```js
async function getUser(request, userId) {
    const response = await request({ url: '/user/info', method: 'get' })
    return response.data
}
```

* in Vue
```
    import api from 'api'

    methods: {
        async getUser() {
            // pass-in this.$request as a request construction function
            const user = await api.getUser(this.$request, this.userId)
        }
    }
```

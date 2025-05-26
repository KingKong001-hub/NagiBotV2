import got from 'got'

const stringify = obj => JSON.stringify(obj, null, 2)
const parse = str => JSON.parse(str, (_, v) => {
    if (
        v !== null &&
        typeof v === 'object' &&
        v.type === 'Buffer' &&
        Array.isArray(v.data)
    ) {
        return Buffer.from(v.data)
    }
    return v
})

class CloudDBAdapter {
    constructor(url, {
        serialize = stringify,
        deserialize = parse,
        fetchOptions = {}
    } = {}) {
        if (!url || typeof url !== 'string') {
            throw new TypeError('Invalid URL provided to CloudDBAdapter')
        }
        this.url = url
        this.serialize = serialize
        this.deserialize = deserialize
        this.fetchOptions = fetchOptions
    }

    async read() {
        try {
            const res = await got(this.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;q=0.9,text/plain'
                },
                ...this.fetchOptions
            })
            if (res.statusCode !== 200) {
                throw new Error(`GET failed with status ${res.statusCode}: ${res.statusMessage}`)
            }
            return this.deserialize(res.body)
        } catch (e) {
            console.error('CloudDBAdapter read error:', e)
            return null
        }
    }

    async write(obj) {
        const res = await got(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            ...this.fetchOptions,
            body: this.serialize(obj)
        })
        if (![200, 201, 202].includes(res.statusCode)) {
            throw new Error(`POST failed with status ${res.statusCode}: ${res.statusMessage}`)
        }
        return res.body
    }
}

export default CloudDBAdapter

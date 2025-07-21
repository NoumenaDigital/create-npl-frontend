import { Configuration, DefaultApi } from '../../generated'
import { EventSourcePolyfill } from 'event-source-polyfill'
import Keycloak from 'keycloak-js'
import { useEffect, useState } from 'react'

export class BaseService {
    api: DefaultApi
    private apiBaseUrl: string
    private keycloak: Keycloak

    constructor(apiBaseUrl: string, keycloak: Keycloak) {
        this.keycloak = keycloak
        this.apiBaseUrl = apiBaseUrl
        this.api = new DefaultApi(
            new Configuration({
                basePath: apiBaseUrl
            })
        )
    }

    withAuthorizationHeader = () => {
        return { headers: { Authorization: `Bearer ${this.keycloak.token}` } }
    }

    public useStateStream = (requestRefresh: () => void) => {
        const [active, setActive] = useState(true)

        useEffect(() => {
            const source = new EventSourcePolyfill(
                this.apiBaseUrl + '/api/streams/states',
                this.withAuthorizationHeader()
            )

            // available param: event-source-polyfill.MessageEvent
            source.onmessage = () => requestRefresh()

            source.onopen = () => setActive(true)

            source.onerror = () => {
                source.close()
                setActive(false)
            }

            source.addEventListener('state', requestRefresh)

            return () => {
                source.removeEventListener('state', requestRefresh)
                source.close()
                setActive(false)
            }
        }, [])

        return active
    }
}

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface RuntimeConfiguration {
    apiBaseUrl: string
    keycloakUrl: string
    keycloakRealm: string
}

const RuntimeConfigurationContext = createContext<RuntimeConfiguration | null>(
    null
)

export const useRuntimeConfiguration = (): RuntimeConfiguration => {
    const configuration = useContext(RuntimeConfigurationContext)
    if (!configuration) {
        throw new Error('Configuration not loaded')
    }
    return configuration
}

interface RuntimeConfigurationProviderProps {
    children: React.ReactNode
}

/**
 * Loads runtime configuration from static file (in /public folder).
 */
export const loadRuntimeConfiguration =
    async (): Promise<RuntimeConfiguration> => {
        const config_file = '/config-noumena-cloud.json'
        const response = await fetch(config_file)
        const value = await response.json()

        let config = {
            apiBaseUrl: value.API_BASE_URL,
            keycloakUrl: value.KEYCLOAK_URL,
            keycloakRealm: value.KEYCLOAK_REALM
        }

        return config
    }

export const RuntimeConfigurationProvider: React.FC<
    RuntimeConfigurationProviderProps
> = ({ children }) => {
    const [runtimeConfig, setRuntimeConfig] =
        useState<RuntimeConfiguration | null>(null)

    useEffect(() => {
        const loadConfig = async () => {
            const loadedConfig = await loadRuntimeConfiguration()
            setRuntimeConfig(loadedConfig)
        }
        loadConfig()
    }, [])

    return (
        <RuntimeConfigurationContext.Provider value={runtimeConfig}>
            {runtimeConfig ? children : <div>&nbsp;</div>}
        </RuntimeConfigurationContext.Provider>
    )
}

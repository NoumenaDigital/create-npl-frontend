import React, { FC } from 'react'
import { KeycloakProvider } from './KeycloakProvider'
import { DirectOidcProvider } from './DirectOidcProvider'
import { useRuntimeConfiguration } from '../RuntimeConfigurationProvider'

interface AuthProviderProps {
    children: React.ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const { loginMode } = useRuntimeConfiguration()

    if (loginMode === 'KEYCLOAK') {
        return <KeycloakProvider>{children}</KeycloakProvider>
    }

    return <DirectOidcProvider>{children}</DirectOidcProvider>
}

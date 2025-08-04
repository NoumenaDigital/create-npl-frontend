import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { CssBaseline } from '@mui/material'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ConfigurationProvider } from './ConfigurationProvider.tsx'
import { ServiceProvider } from './ServiceProvider'
import { UserProvider } from './UserProvider'
import { router } from './Router.tsx'

export const IouApp = () => {
    return (
        <React.StrictMode>
            <CssBaseline></CssBaseline>
            <RouterProvider router={router()} />
        </React.StrictMode>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ConfigurationProvider>
        <AuthProvider>
            <ServiceProvider>
                <UserProvider>
                    <IouApp></IouApp>
                </UserProvider>
            </ServiceProvider>
        </AuthProvider>
    </ConfigurationProvider>
)

import {
    Box,
    Card,
    CardContent,
    Container,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useServices } from '../ServiceProvider'

export const HomePage = () => {
    const { api, withAuthorizationHeader, useStateStream } = useServices()

    // Example of using the state stream
    const active = useStateStream(() => {
        // This callback will be invoked on state changes
        console.log('State changed!');
    });

    useEffect(() => {
        // Initial data load can go here
    }, [api, withAuthorizationHeader]);

    return (
        <Container>
            <Typography variant={'h4'}>Home</Typography>
            <br />
            <Box display={'flex'} flexWrap={'wrap'}>
                <Card sx={{ width: '100%' }}>
                    <CardContent>
                        <Box display={'flex'} justifyContent={'space-between'}>
                            <Typography variant={'h6'}>Welcome to your NPL application!</Typography>
                        </Box>
                        <br />
                        <Typography>
                            Edit src/components/HomePage.tsx to get started.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
}

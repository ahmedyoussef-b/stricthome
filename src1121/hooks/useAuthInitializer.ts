// src/hooks/useAuthInitializer.ts
'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setUser, logout, setLoading } from '@/lib/redux/slices/authSlice';
import { getServerSession } from '@/lib/auth-utils';

/**
 * Custom hook to initialize the user's auth state using a server action.
 * It ensures the session is fetched only once on initial load.
 */
export const useAuthInitializer = () => {
    const dispatch = useAppDispatch();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) {
            return;
        }
        hasFetched.current = true;
        
        const checkSession = async () => {
            dispatch(setLoading(true));
            try {
                const session = await getServerSession();
                if (session?.user) {
                    dispatch(setUser(session.user));
                } else {
                    dispatch(logout());
                }
            } catch (error) {
                console.error("Auth Initializer Error:", error);
                dispatch(logout());
            } finally {
                dispatch(setLoading(false));
            }
        };

        checkSession();
    }, [dispatch]);
};

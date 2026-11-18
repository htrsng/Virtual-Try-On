import type { ReactNode } from 'react';
export interface AuthUser {
    id?: string;
    _id?: string;
    email: string;
    role: string;
    fullName?: string;
}
export function useAuth(): {
    user: AuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    logout: () => void;
    login: (email: string, password: string) => Promise<{
        success: boolean;
        message: string;
    }>;
};
export function AuthProvider(props: {
    children: ReactNode;
}): ReactNode;

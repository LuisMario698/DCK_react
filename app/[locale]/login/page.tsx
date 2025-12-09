'use client';

import { LoginForm } from '@/components/auth/LoginForm';

// Usar el logo importado o path directo si es estático
// import logo from '@/assets/logo_DCK.png'; 

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                    <LoginForm showLogo={true} />
                </div>
            </div>
        </div>
    );
}


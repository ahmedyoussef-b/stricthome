// src/app/(auth)/login/page.tsx
import AuthLayout from '@/components/layout/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <AuthLayout
            title="Se Connecter"
            description="Accédez à votre tableau de bord."
        >
            <LoginForm />
        </AuthLayout>
    );
}

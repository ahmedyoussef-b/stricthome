// src/app/(auth)/register/page.tsx
import AuthLayout from '@/components/layout/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Créer un Compte"
            description="Rejoignez notre plateforme en tant qu'enseignant ou parent."
        >
            <RegisterForm />
        </AuthLayout>
    );
}

// src/app/(auth)/forgot-password/page.tsx
import AuthLayout from '@/components/layout/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    return (
        <AuthLayout
            title="Mot de Passe Oublié"
            description="Entrez votre email pour recevoir un lien de réinitialisation."
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
}

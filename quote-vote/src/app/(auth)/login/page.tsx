import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}

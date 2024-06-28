import { Link } from '@tanstack/react-router';
import { OTPForm } from '../../components/form-otp';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export default function EmailVerification() {
  return (
    <main className="grid place-items-center h-screen">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Email verification
          </CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit verification code to your email. Enter the code
            below to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid place-items-center">
          <OTPForm />
          <Link
            className="text-stone-500 text-sm mt-2 underline hover:text-gray-600"
            to="/home"
          >
            Verify email in other moment
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

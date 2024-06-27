import { useForm } from '@conform-to/react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp';
import { useState } from 'react';
import { codeSchema } from '../lib/schemas';
import { parseWithZod } from '@conform-to/zod';
import { Link } from '@tanstack/react-router';

export function OTPForm() {
  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onSubmit',
    shouldRevalidate: 'onSubmit',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, { schema: codeSchema });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/auth/email-verification', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
      }
    },
    defaultValue: {
      code: '',
    },
  });
  return (
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
        <form method="post" id={form.id} onSubmit={form.onSubmit}>
          <InputOTP maxLength={6} id="code" name="code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <span className="text-sm text-red-500">{fields.code.errors}</span>
          <Button className="w-full mt-6">Verify</Button>
        </form>
        <Link className="text-stone-500 text-sm mt-2 underline hover:text-gray-600" to="/home">
          Verify email in other moment
        </Link>
      </CardContent>
    </Card>
  );
}

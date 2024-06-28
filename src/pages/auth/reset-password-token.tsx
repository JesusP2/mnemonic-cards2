import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { validateResetTokenSchema } from '../../lib/schemas';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '../../components/ui/button';

export default function ResetPasswordToken() {
  const navigate = useNavigate({ from: '/auth/reset-password/$token' });
  const params = useParams({ from: '/auth/reset-password/$token' });
  const [viewPass, setViewPass] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, {
        schema: validateResetTokenSchema.omit({ token: true }),
      });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      context.formData.set('token', params.token);
      const res = await fetch('/api/auth/reset-password/token', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
        return;
      }
      window.location.href = '/home'
    },
    defaultValue: {
      password: '',
    },
  });
  return (
    <main className="grid place-items-center h-screen">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Password reset</CardTitle>
          <CardDescription className="text-center">
            Change password
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid place-items-center">
          <form id={form.id} onSubmit={form.onSubmit}>
            <div className="grid gap-2">
              <div className="flex items-center gap-x-4">
                <Label htmlFor="password">New password</Label>
                <button
                  type="button"
                  onClick={() => setViewPass((prev) => !prev)}
                  className="hover:text-gray-600"
                >
                  {viewPass ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type={viewPass ? 'text' : 'password'}
                required
                minLength={8}
              />
              <span className="text-sm text-red-500">
                {fields.password.errors}
              </span>
            </div>
            <Button className="w-full mt-4">Change password</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

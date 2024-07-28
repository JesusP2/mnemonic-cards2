import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { createLazyFileRoute } from '@tanstack/react-router';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { queryClient } from '../lib/query-client';
import { signupSchema } from '../lib/schemas';

export const Route = createLazyFileRoute('/auth/signup')({
  component: SignupForm,
});

function SignupForm() {
  const navigate = useNavigate({ from: '/auth/signup' });
  const [viewPass, setViewPass] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, { schema: signupSchema });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
        return;
      }
      await queryClient.invalidateQueries();
      navigate({ to: '/me' });
    },
    defaultValue: {
      username: '',
      password: '',
    },
  });
  return (
    <form
      method="post"
      id={form.id}
      onSubmit={form.onSubmit}
      className="w-full max-w-sm"
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Get started by creating an account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="John Doe" />
            <span className="text-sm text-red-500">
              {fields.username.errors}
            </span>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-x-4">
              <Label htmlFor="password">Password</Label>
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
          <Button className="w-full">Sign up</Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/auth/signin" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

import { useForm } from '@conform-to/react';
import { Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { Button } from '../../components//ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components//ui/card';
import { Input } from '../../components//ui/input';
import { Label } from '../../components/ui/label';
import { signinSchema } from '../../lib/schemas';
import { parseWithZod } from '@conform-to/zod';

export default function LoginForm() {
  const [viewPass, setViewPass] = useState(false);
  const [lastResult, setLastResult] = useState(null)
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, { schema: signinSchema })
    },
    onSubmit: async (e, context) =>{
      e.preventDefault()
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        body: context.formData
      })
      if (!res.ok){
        const json = await res.json()
        setLastResult(json)
        return;
      }
      return redirect({ to: '/main/home' })
    },
    defaultValue: {
      username: '',
      password: '',
    },
  });
  return (
    <form method="post" id={form.id} onSubmit={form.onSubmit}>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="John Doe"
                required
                minLength={3}
              />
              <span className="text-sm text-red-500">
                {fields.username.errors}
              </span>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
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
                <Link
                  to="/auth/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
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
            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/auth/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

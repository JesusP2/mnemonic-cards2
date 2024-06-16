import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { LuEye, LuEyeOff } from "react-icons/lu";
import { useState } from 'react';

export default function SignUpForm() {
  const [viewPass, setViewPass] = useState(false);
  return (
    <main className="grid place-items-center h-screen">
      <form>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="John Doe"
                required
                minLength={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="username" placeholder="m@example.com" />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-x-4">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => setViewPass((prev) => !prev)}
                  className="hover:text-gray-600"
              >
                  {viewPass ? <LuEyeOff />  : <LuEye />}
              </button>
              </div>
              <Input
                id="password"
                type={viewPass ? 'text' : 'password'}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Sign in</Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}

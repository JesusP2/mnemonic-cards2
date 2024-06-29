import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { CircleCheckBig } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { resetTokenSchema } from '../../lib/schemas';

export default function ForgotPassword() {
  const [isEmailSent, toggleEmailState] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, { schema: resetTokenSchema });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/auth/reset-password/email', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
      }
      toggleEmailState(true);
    },
    defaultValue: {
      email: '',
    },
  });
  if (isEmailSent) {
    return (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Email sent to {fields.email.value}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid place-items-center">
          <CircleCheckBig size={50} />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Email verification
        </CardTitle>
        <CardDescription className="text-center">
          Introduce an email to send a verification token
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id={form.id} onSubmit={form.onSubmit}>
          <div className="grid gap-2 max-w-3xl mt-4">
            <Label htmlFor={fields.email.id} className="font-medium">
              Email
            </Label>
            <Input
              id={fields.email.id}
              name={fields.email.name}
              type="email"
              placeholder="example@app.com"
            />
            <span className="text-sm text-red-500">{fields.email.errors}</span>
          </div>
          <Button className="w-full mt-8">Send email</Button>
        </form>
      </CardContent>
    </Card>
  );
}

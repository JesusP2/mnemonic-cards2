import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { codeSchema } from '../lib/schemas';
import { Button } from './ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp';

export function OTPForm({
  onSuccess,
}: { onSuccess?: () => PromiseLike<void> | void }) {
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
      const res = await fetch('/api/account/email-verification', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
      }
      await onSuccess?.();
    },
    defaultValue: {
      code: '',
    },
  });
  return (
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
  );
}

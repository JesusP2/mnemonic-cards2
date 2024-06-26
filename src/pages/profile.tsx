import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TypographyH4 } from '../components/ui/typography';
import { profileQueryOptions } from '../lib/queries';
import { profileSchema } from '../lib/schemas';

export default function Profile() {
  const query = useQuery(profileQueryOptions);
  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, {
        schema: profileSchema.superRefine((data, ctx) => {
          if (query.data?.email && !data.email) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['email'],
              message: 'Required field',
            });
          }
        }),
      });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
        return;
      }
    },
    defaultValue: {
      username: '',
    },
  });
  return (
    <>
      <TypographyH4>Profile</TypographyH4>
      <p className="text-muted-foreground mt-2 text-sm">
        This is how others will see you on this site.
      </p>
      <div
        data-orientation="horizontal"
        className="shrink-0 bg-border h-[1px] max-w-3xl my-6"
      />
      <form className="grid gap-6">
        <div className="grid gap-2 max-w-3xl">
          <Label htmlFor="username" className="font-medium">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            placeholder="John Doe"
            required
            minLength={3}
          />
          <span className="text-muted-foreground text-xs">
            This is your public display name. It can be your real name or a
            pseudonym.{' '}
          </span>
        </div>
        <div className="grid gap-2 max-w-3xl">
          <Label htmlFor="email" className="font-medium">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            placeholder="example@gmail.com"
            required
            minLength={3}
          />
          <span className="text-muted-foreground text-xs">
            This field is private, only you can see your email.
          </span>
        </div>
        <Button variant="default" className="w-36">
          Save changes
        </Button>
      </form>
    </>
  );
}

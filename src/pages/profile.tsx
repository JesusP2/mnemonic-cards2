import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useQuery } from '@tanstack/react-query';
import { CircleUser } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { OTPForm } from '../components/form-otp';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { TypographyH4 } from '../components/ui/typography';
import { profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';
import { profileSchema } from '../lib/schemas';

export default function Profile() {
  const query = useQuery(profileQueryOptions);
  const [avatar, setAvatar] = useState<null | string>(null);
  const [isEmailVerificationDialogOpen, openEmailVerificationDialog] =
    useState(false);
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
      const res = await fetch('/api/account', {
        method: 'PUT',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
        return;
      }
      const json = await res.json();
      if (json && 'message' in json) {
        openEmailVerificationDialog(true);
      }
      await queryClient.invalidateQueries();
      setAvatar(null);
    },
    defaultValue: {
      username: query.data?.username,
      email: query.data?.email,
      avatar: null,
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
      <form className="grid gap-6" id={form.id} onSubmit={form.onSubmit}>
        <div>
          <label className="relative group size-[96px] block overflow-hidden  rounded-full">
            {avatar || query.data?.avatar ? (
              <img
                src={avatar || (query.data?.avatar as string)}
                alt=""
                className="size-[96px]"
              />
            ) : (
              <CircleUser size={96} />
            )}
            <div className="group-hover:grid place-items-center hidden bg-black absolute left-0 size-[96px] top-0 bg-opacity-50 cursor-pointer">
              <span className="font-medium">Edit</span>
            </div>
            <input
              type="file"
              name="avatar"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatar(URL.createObjectURL(file));
              }}
            />
          </label>
          <span className="text-sm text-red-500">{fields.avatar.errors}</span>
        </div>
        <div className="grid gap-2 max-w-3xl">
          <Label htmlFor="username" className="font-medium">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            defaultValue={fields.username.value}
            placeholder="John Doe"
            required
            minLength={3}
          />
          <span className="text-muted-foreground text-xs">
            This is your public display name. It can be your real name or a
            pseudonym.{' '}
          </span>
          <span className="text-sm text-red-500">{fields.username.errors}</span>
        </div>
        <div className="grid gap-2 max-w-3xl">
          <Label htmlFor="email" className="font-medium">
            Email
          </Label>
          {query.data?.isOauth ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="email"
                    name="email"
                    placeholder={query.data?.isOauth ? '' : 'example@gmail.com'}
                    disabled={query.data?.isOauth}
                    defaultValue={fields.email.value}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>You're logged in using oauth</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Input id="email" name="email" defaultValue={fields.email.value} />
          )}
          <span className="text-muted-foreground text-xs">
            This field is private, only you can see your email.
          </span>
          <span className="text-sm text-red-500">{fields.email.errors}</span>
        </div>
        <Button variant="default" className="w-36">
          Save changes
        </Button>
      </form>
      <Dialog
        open={isEmailVerificationDialogOpen}
        onOpenChange={(open) => openEmailVerificationDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Email verification
            </DialogTitle>
            <DialogDescription className="text-center">
              We've sent a 6-digit verification code to your email. Enter the
              code below to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-6 grid place-items-center">
            <OTPForm
              onSuccess={async () => {
                openEmailVerificationDialog(false);
                await queryClient.setQueryData(
                  ['profile'],
                  (profile: Record<string, unknown>) => ({
                    ...profile,
                    email: fields.email.value,
                  }),
                );
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TypographyH4 } from '../components/ui/typography';
import { cn } from '../components/ui/utils';
import { unselectedCss } from '../lib/constants';
import { profileQueryOptions } from '../lib/queries';
import { changePasswordSchema } from '../lib/schemas';

export const Route = createLazyFileRoute('/_main/settings/account')({
  component: Account,
});

function Account() {
  const query = useQuery(profileQueryOptions);
  const [lastResult, setLastResult] = useState(null);
  const [isModalOpened, openModal] = useState(false);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, {
        schema: changePasswordSchema,
      });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
        return;
      }
      openModal(true);
    },
    defaultValue: {
      currentPassword: '',
      newPassword: '',
    },
  });
  return (
    <>
      <TypographyH4>Account</TypographyH4>
      <p className="text-muted-foreground mt-2 text-sm">
        Update your account settings
      </p>
      {!query.data?.isOauth ? (
        <>
          <div
            data-orientation="horizontal"
            className="shrink-0 bg-border h-[1px] max-w-3xl my-6"
          />
          <section>
            <h5 className="text-lg font-medium">Change password</h5>
            <form id={form.id} onSubmit={form.onSubmit}>
              <div className="grid gap-2 max-w-3xl mt-4">
                <Label
                  htmlFor={fields.currentPassword.id}
                  className="font-medium"
                >
                  Current password
                </Label>
                <Input
                  className="max-w-sm"
                  id={fields.currentPassword.id}
                  name={fields.currentPassword.name}
                  defaultValue={fields.currentPassword.value}
                  type="password"
                />
                <span className="text-sm text-red-500">
                  {fields.currentPassword.errors}
                </span>
              </div>
              <div className="grid gap-2 max-w-3xl mt-2">
                <Label htmlFor={fields.newPassword.id} className="font-medium">
                  New password
                </Label>
                <Input
                  className="max-w-sm"
                  id={fields.newPassword.id}
                  name={fields.newPassword.name}
                  defaultValue={fields.newPassword.value}
                  type="password"
                />
                <span className="text-sm text-red-500">
                  {fields.currentPassword.errors}
                </span>
              </div>
              <Button className="mt-4">Change password</Button>
            </form>
          </section>
        </>
      ) : null}
      <div
        data-orientation="horizontal"
        className="shrink-0 bg-border h-[1px] max-w-3xl my-10"
      />
      <section>
        <form action="/api/auth/signout-global" method="post">
          <Button>Close all sessions</Button>
        </form>
      </section>
      <Dialog open={isModalOpened}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="mt-4">
            <DialogTitle className="text-2xl text-center">
              Pasword updated succesfully
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm text-center">
            Your password has been updated. Please log in with your new
            password.
          </p>
          <Link
            className={cn(unselectedCss, 'justify-center')}
            to="/auth/signin"
          >
            Go back to login page
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}

import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { type ReactNode, useState } from 'react';
import { queryClient } from '../lib/query-client';
import { createDeckSchema } from '../lib/schemas';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export function CreateDeck({ children }: { children: ReactNode }) {
  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, {
        schema: createDeckSchema,
      });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/deck', {
        method: 'POST',
        body: context.formData,
      });
      if (!res.ok) {
        const json = await res.json();
        setLastResult(json);
        return;
      }
      await queryClient.invalidateQueries();
    },
    defaultValue: {
      name: '',
      description: '',
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create new deck</DialogTitle>
        </DialogHeader>
        <form {...getFormProps(form)}>
          <div>
            <Label htmlFor={fields.name.id} className="text-right">
              Name
            </Label>
            <Input
              {...getInputProps(fields.name, { type: 'text' })}
              placeholder="Japanese"
              className="col-span-3"
            />
          </div>
          <div>
            <Label htmlFor={fields.description.id} className="text-right">
              Description
            </Label>
            <Textarea
              {...getTextareaProps(fields.description)}
              placeholder="Description (optional)"
              className="col-span-3"
            />
          </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

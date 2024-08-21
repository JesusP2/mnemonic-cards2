import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { type ReactNode, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const createDeckMutation = useMutation({
    meta: {
      type: 'notification',
    },
    mutationKey: ['user-decks'],
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/deck', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        setLastResult(error);
        if ('message' in error) {
          throw new Error(error.message);
        }
      }
    },
  });

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
      createDeckMutation.mutateAsync(context.formData).then(() => {
        queryClient.invalidateQueries({ queryKey: ['user-decks'] });
      });
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
              className="col-span-3 mt-1"
            />
          </div>
          <div className="mt-2">
            <Label htmlFor={fields.description.id} className="text-right">
              Description
            </Label>
            <Textarea
              {...getTextareaProps(fields.description)}
              placeholder="Description (optional)"
              className="col-span-3 mt-1"
            />
          </div>
          <DialogFooter>
            <Button className="mt-4" type="submit">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

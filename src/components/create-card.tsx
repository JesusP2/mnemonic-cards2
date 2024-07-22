import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Image } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { getFormProps, getTextareaProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type  { z } from 'zod';
import { createCardSchema, type fileSchema } from '../lib/schemas';

type FileElement = z.infer<typeof fileSchema>;
export default function CreateCard() {
  const [markdownSource, setMarkdownSource] = useState('');
  const [files, setFiles] = useState<FileElement[]>([]);
  const cardRef = useRef<null | HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const [lastResult, setLastResult] = useState(null);
  const [form, fields] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate: ({ formData }) => {
      return parseWithZod(formData, {
        schema: createCardSchema
      });
    },
    onSubmit: async (e, context) => {
      e.preventDefault();
      const res = await fetch('/api/deck/10/card', {
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
      markdown: '',
      files: []
    },
  });

  const handleCursorPositionChange = (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    e: any,
  ) => {
    setCursorPosition(e.target.selectionStart);
  };

  async function onTextareaValueChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    const value = e.target.value;
    setMarkdownSource(value);
    if (cardRef.current) {
      const newMarkdown = DOMPurify.sanitize(await marked.parse(value), {
        ALLOW_UNKNOWN_PROTOCOLS: true,
      });
      cardRef.current.innerHTML = newMarkdown;
      const newFiles = files.filter((file) => newMarkdown.includes(file.url));
      setFiles(newFiles);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && cardRef.current) {
      const fileTempUrl = URL.createObjectURL(file);
      const fileKey = fileTempUrl.split('/')[fileTempUrl.split('/').length - 1];
      const newValuePart1 = markdownSource.slice(0, cursorPosition);
      const newValuePart2 = markdownSource.slice(cursorPosition);
      const newValue = `${newValuePart1}
![image info](${fileTempUrl})
${newValuePart2}`;

      setMarkdownSource(newValue);
      const newMarkdown = DOMPurify.sanitize(await marked.parse(newValue), {
        ALLOW_UNKNOWN_PROTOCOLS: true,
      });
      cardRef.current.innerHTML = newMarkdown;
      setFiles((prev) => [
        ...prev,
        { file, url: fileTempUrl, key: fileKey as string },
      ]);
    }
  };
  return (
    <div className="flex h-[calc(100vh-96px)] gap-x-[10px]">
      <div className="w-[calc(50%-5px)] h-full relative">
        <form {...getFormProps(form)}>
          <div className="absolute top-0 right-0 flex p-2 items-center gap-x-2">
            <Button size="sm" className="p-2 py-0 h-7">
              Create
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="hover:text-foreground/70">
                    <Image size={33} />
                    <input type="file" onChange={handleFileChange} hidden />
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach image</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <textarea
            value={markdownSource}
            onChange={onTextareaValueChange}
            onClick={handleCursorPositionChange}
            onKeyUp={handleCursorPositionChange}
            {...getTextareaProps(fields.markdown)}
            className="w-full h-full bg-background outline-none border border-zinc-700 rounded-sm p-2"
          />
        </form>
      </div>
      <div
        ref={cardRef}
        className="w-[calc(50%-5px)] h-full border border-zinc-700 rounded-sm p-2 overflow-auto prose dark:prose-invert"
      />
    </div>
  );
}

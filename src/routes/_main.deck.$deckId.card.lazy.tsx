import { createLazyFileRoute, useParams } from '@tanstack/react-router';
import DOMPurify from 'dompurify';
import { Image } from 'lucide-react';
import { marked } from 'marked';
import { useRef, useState } from 'react';
import type { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import type { fileSchema } from '../lib/schemas';
import { Button } from '../components/ui/button';
import { queryClient } from '../lib/query-client';
import type { UserDeckDashboard } from '../lib/types';
import { createUlid } from '../server/utils/ulid';
import { createEmptyCard, Rating } from 'ts-fsrs';

export const Route = createLazyFileRoute('/_main/deck/$deckId/card')({
  component: CreateCard,
});

type FileElement = z.infer<typeof fileSchema>;
function CreateCard() {
  const params = useParams({ from: '/_main/deck/$deckId/card' });
  const [frontViewMarkdown, setFrontViewMarkdown] = useState('');
  const [backViewMarkdown, setbackViewMarkdown] = useState('');
  const [frontViewFiles, setFrontViewFiles] = useState<FileElement[]>([]);
  const [backViewFiles, setBackViewFiles] = useState<FileElement[]>([]);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const cardRef = useRef<null | HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const markdown =
    currentView === 'front' ? frontViewMarkdown : backViewMarkdown;
  const files = currentView === 'front' ? frontViewFiles : backViewFiles;
  function setMarkdown(str: string) {
    return currentView === 'front'
      ? setFrontViewMarkdown(str)
      : setbackViewMarkdown(str);
  }

  function setFiles(
    files: FileElement[] | ((files: FileElement[]) => FileElement[]),
  ) {
    return currentView === 'front'
      ? setFrontViewFiles(files)
      : setBackViewFiles(files);
  }

  async function onSubmit() {
    const formData = new FormData();
    const newCard = {
      id: createUlid(),
      deckId: params.deckId,
      frontViewMarkdown,
      backViewMarkdown,
      frontFiles: frontViewFiles.map((file) => ({ url: file.url })),
      backFiles: backViewFiles.map((file) => ({ url: file.url })),
      updatedAt: new Date().getTime(),
      createdAt: new Date().getTime(),
      ...createEmptyCard(),
      rating: Rating.Again,
    };

    queryClient.setQueryData(['user-decks'], (oldData: UserDeckDashboard[]) => {
      return oldData.map((data) => {
        if (data.id === params.deckId) {
          return { ...data, again: data.again + 1 };
        }
        return data;
      });
    });

    queryClient.setQueryData(
      ['deck-review-', params.deckId],
      (oldData: (typeof newCard)[]) => {
        return [...oldData, newCard];
      },
    );
    for (const [k, v] of Object.entries(newCard)) {
      if (v instanceof Date) {
        formData.append(k, JSON.stringify(v.getTime()));
      } else {
        formData.append(k, JSON.stringify(v));
      }
    }

    for (const file of frontViewFiles) {
      formData.append('frontViewFiles', file.file);
    }
    for (const file of backViewFiles) {
      formData.append('backViewFiles', file.file);
    }

    const res = await fetch(`/api/deck/${params.deckId}/card`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
  }

  async function handleViewChange() {
    const markdown =
      currentView === 'front' ? backViewMarkdown : frontViewMarkdown;
    if (cardRef.current) {
      const newMarkdown = DOMPurify.sanitize(await marked.parse(markdown), {
        ALLOW_UNKNOWN_PROTOCOLS: true,
      });
      cardRef.current.innerHTML = newMarkdown;
      setCurrentView((prev) => (prev === 'front' ? 'back' : 'front'));
    }
  }

  function handleCursorPositionChange(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    e: any,
  ) {
    setCursorPosition(e.target.selectionStart);
  }

  async function onTextareaValueChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    const value = e.target.value;
    setMarkdown(value);
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
      const tempFileUrl = URL.createObjectURL(file);
      const newValuePart1 = markdown.slice(0, cursorPosition);
      const newValuePart2 = markdown.slice(cursorPosition);
      const newValue = `${newValuePart1}
![image info](${tempFileUrl})
${newValuePart2}`;

      setMarkdown(newValue);
      const newMarkdown = DOMPurify.sanitize(await marked.parse(newValue), {
        ALLOW_UNKNOWN_PROTOCOLS: true,
      });
      cardRef.current.innerHTML = newMarkdown;
      setFiles((prev) => [...prev, { file, url: tempFileUrl }]);
    }
  };
  return (
    <div className="flex h-[calc(100vh-97px)] gap-x-[10px]">
      <div className="w-[calc(50%-5px)] h-full relative">
        <div className="absolute top-0 right-0 flex p-2 items-center gap-x-2">
          <Button onClick={onSubmit} size="sm" className="p-2 py-0 h-7">
            Create
          </Button>
          <Button onClick={handleViewChange} size="sm" className="p-2 py-0 h-7">
            Switch view
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild type="button">
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
          value={markdown}
          onChange={onTextareaValueChange}
          onClick={handleCursorPositionChange}
          onKeyUp={handleCursorPositionChange}
          className="w-full resize-none h-full bg-background outline-none border border-zinc-700 rounded-sm p-2"
        />
      </div>
      <div
        ref={cardRef}
        className="w-[calc(50%-5px)] h-full border border-zinc-700 rounded-sm p-2 overflow-auto prose dark:prose-invert"
      />
    </div>
  );
}

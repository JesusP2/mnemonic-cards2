import { useQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import DOMPurify from 'dompurify';
import { Image } from 'lucide-react';
import { marked } from 'marked';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Rating, createEmptyCard } from 'ts-fsrs';
import type { z } from 'zod';
import { Button } from '../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { db } from '../lib/indexdb';
import { profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';
import type { fileSchema } from '../lib/schemas';
import type { UserDeckDashboard } from '../lib/types';
import { createUlid } from '../server/utils/ulid';

export const Route = createLazyFileRoute('/_main/deck/$deckId/card')({
  component: CreateCard,
});

type FileElement = z.infer<typeof fileSchema>;
function CreateCard() {
  const navigate = useNavigate({ from: '/deck/$deckId/card' });
  const params = useParams({ from: '/_main/deck/$deckId/card' });
  const [frontMarkdown, setFrontMarkdown] = useState('');
  const [backMarkdown, setbackMarkdown] = useState('');
  const [frontFiles, setFrontFiles] = useState<FileElement[]>([]);
  const [backFiles, setBackFiles] = useState<FileElement[]>([]);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const cardRef = useRef<null | HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const profileQuery = useQuery(profileQueryOptions);

  const markdown = currentView === 'front' ? frontMarkdown : backMarkdown;
  const files = currentView === 'front' ? frontFiles : backFiles;
  function setMarkdown(str: string) {
    return currentView === 'front'
      ? setFrontMarkdown(str)
      : setbackMarkdown(str);
  }

  function setFiles(
    files: FileElement[] | ((files: FileElement[]) => FileElement[]),
  ) {
    return currentView === 'front' ? setFrontFiles(files) : setBackFiles(files);
  }

  async function onSubmit() {
    const newCard = {
      id: createUlid(),
      deckId: params.deckId,
      frontMarkdown,
      backMarkdown,
      frontFilesMetadata: [] as string[],
      backFilesMetadata: [] as string[],
      updatedAt: new Date().getTime(),
      createdAt: new Date().getTime(),
      ...createEmptyCard(),
      rating: Rating.Again,
    };
    await db.transaction('rw', 'files', async (tx) => {
      for (const { file, url } of frontFiles) {
        const extension = file.type.split('/')[1];
        const key = `${createUlid()}.${extension}`;
        newCard.frontMarkdown = newCard.frontMarkdown.replaceAll(url, key);
        newCard.frontFilesMetadata.push(key);
        await tx.files.put({ file, key });
      }
      for (const { file, url } of backFiles) {
        const extension = file.type.split('/')[1];
        const key = `${createUlid()}.${extension}`;
        newCard.backMarkdown = newCard.backMarkdown.replaceAll(url, key);
        newCard.backFilesMetadata.push(key);
        await tx.files.put({ file, key });
      }
    });

    queryClient.setQueryData(
      ['user-decks-', profileQuery.data?.username],
      (oldData: UserDeckDashboard[]) => {
        return oldData.map((data) => {
          if (data.id === params.deckId) {
            return { ...data, again: data.again + 1 };
          }
          return data;
        });
      },
    );

    queryClient.setQueryData(
      ['deck-review-', params.deckId],
      (oldData: (typeof newCard)[]) => {
        if (oldData) {
          return [...oldData, newCard];
        }
        return [newCard];
      },
    );

    const formData = new FormData();
    for (const [k, v] of Object.entries(newCard)) {
      if (v instanceof Date) {
        formData.append(k, JSON.stringify(v.getTime()));
      } else {
        formData.append(k, JSON.stringify(v));
      }
    }

    for (const file of frontFiles) {
      formData.append('frontFiles', file.file);
    }
    for (const file of backFiles) {
      formData.append('backFiles', file.file);
    }
    const res = await fetch(`/api/deck/${params.deckId}/card`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
    toast.success('Card created');
    navigate({ to: '/me' });
  }

  async function handleViewChange() {
    const markdown = currentView === 'front' ? backMarkdown : frontMarkdown;
    if (cardRef.current) {
      const newMarkdown = DOMPurify.sanitize(await marked.parse(markdown), {
        ALLOW_UNKNOWN_PROTOCOLS: true,
      });
      cardRef.current.innerHTML = newMarkdown;
      setCurrentView((prev) => (prev === 'front' ? 'back' : 'front'));
    }
  }

  function handleCursorPositionChange(e: any) {
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

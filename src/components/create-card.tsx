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
import { Button } from './ui/button';

type FileElement = z.infer<typeof fileSchema>;
export default function CreateCard() {
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
    formData.append('front_view_markdown', frontViewMarkdown);
    formData.append('front_back_markdown', backViewMarkdown);
    for (const file of frontViewFiles) {
      formData.append('front_view_files', file.file);
    }
    for (const file of backViewFiles) {
      formData.append('back_view_files', file.file);
    }
    formData.append(
      'front_view_files_metadata',
      JSON.stringify(frontViewFiles.map((file) => ({ url: file.url }))),
    );
    formData.append(
      'back_view_files_metadata',
      JSON.stringify(backViewFiles.map((file) => ({ url: file.url }))),
    );
    const res = await fetch('/api/deck/10/card', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log(data);
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
      const fileTempUrl = URL.createObjectURL(file);
      const newValuePart1 = markdown.slice(0, cursorPosition);
      const newValuePart2 = markdown.slice(cursorPosition);
      const newValue = `${newValuePart1}
![image info](${fileTempUrl})
${newValuePart2}`;

      setMarkdown(newValue);
      const newMarkdown = DOMPurify.sanitize(await marked.parse(newValue), {
        ALLOW_UNKNOWN_PROTOCOLS: true,
      });
      cardRef.current.innerHTML = newMarkdown;
      setFiles((prev) => [...prev, { file, url: fileTempUrl }]);
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

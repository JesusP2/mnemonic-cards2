import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useParams } from '@tanstack/react-router';
import { deckReviewQueryOptions } from '../lib/queries';
import DOMPurify from 'dompurify';
import { useState } from 'react';
import { marked } from 'marked';
import { Button } from '../components/ui/button';
import type { Rating } from 'ts-fsrs';

export const Route = createLazyFileRoute('/_main/deck/$deckId/review')({
  component: Review,
});

function Review() {
  const params = useParams({ from: '/_main/deck/$deckId/review' });
  const query = useQuery(deckReviewQueryOptions(params.deckId));
  const [cardIndex, setCardIndex] = useState(0);
  const [isAnswerBeingShown, showAnswer] = useState(false);

  function renderMarkdownToHTML() {
    if (!query.data) return {
      __html: ''
    };
      console.log(query.data)
    const markdown =
      query.data[cardIndex]?.[
        isAnswerBeingShown ? 'backMarkdown' : 'frontMarkdown'
      ];
    if (markdown) {
      return {
        __html: DOMPurify.sanitize(marked.parse(markdown) as string),
      };
    }
  }

  async function updateCard(rating: Rating) {
    const res = await fetch(`/api/deck/${params.deckId}/card/${params.deckId}/review`, {
      method: 'PUT',
      body: JSON.stringify()
    })
  }

  return (
    <>
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={renderMarkdownToHTML()}
        className="max-w-xl mx-auto h-[calc(100vh-187px)] border border-zinc-700 rounded-sm p-2 overflow-auto prose dark:prose-invert"
      />
      {!isAnswerBeingShown ? (
        <div className="flex gap-x-4 mx-auto max-w-fit mt-6">
          <Button onClick={() => showAnswer(true)} variant="outline" className="p-8">Show answer</Button>
        </div>
      ) : (
        <div className="flex gap-x-4 mx-auto max-w-fit mt-6">
          <Button variant="outline" className="p-8">
            Easy
          </Button>
          <Button variant="outline" className="p-8">
            Good
          </Button>
          <Button variant="outline" className="p-8">
            Hard
          </Button>
          <Button variant="outline" className="p-8">
            Again
          </Button>
        </div>
      )}
    </>
  );
}

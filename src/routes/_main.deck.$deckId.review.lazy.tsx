import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useParams } from '@tanstack/react-router';
import { deckReviewQueryOptions } from '../lib/queries';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { marked } from 'marked';
import { Button } from '../components/ui/button';
import { type Card, type Grade, Rating } from 'ts-fsrs';
import type { ClientSideCard } from '../server/db/types';
import type { UserDeckDashboard } from '../lib/types';
import { fsrsScheduler } from '../lib/fsrs';
import { queryClient } from '../lib/query-client';
import { db } from '../lib/indexdb';
import { fileToBase64 } from '../lib/file-to-base64';

export const Route = createLazyFileRoute('/_main/deck/$deckId/review')({
  component: Review,
});

async function transformKeysToUrls(keys: string[]) {
  const results = await Promise.allSettled(
    keys.map((key) => db.files.get(key)),
  );
  const fulfilled = results.filter(
    (result) => result.status === 'fulfilled' && result.value,
  ) as PromiseFulfilledResult<{ file: File; key: string }>[];
  return fulfilled.map(async ({ value }) => ({
    key: value.key,
    url: (await fileToBase64(value.file)) as string,
  }));
}

function Review() {
  const params = useParams({ from: '/_main/deck/$deckId/review' });
  const query = useQuery(deckReviewQueryOptions(params.deckId));
  const [currentCard, setCurrentCard] = useState<ClientSideCard | null>(null);
  const [isAnswerBeingShown, showAnswer] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    const card = query.data.find(
      (card) => card.due && new Date(card.due).getTime() < new Date().getTime(),
    );
    if (!card) {
      return;
    }
    if (
      (card.frontFilesMetadata.length &&
        !card.frontMarkdown.includes(
          'https://mnemonic-cards.13e14d558cce799d0040255703bae354.r2.cloudflarestorage.com',
        )) ||
      (card.backFilesMetadata.length &&
        !card.backMarkdown.includes(
          'https://mnemonic-cards.13e14d558cce799d0040255703bae354.r2.cloudflarestorage.com',
        ))
    ) {
      transformKeysToUrls(card.frontFilesMetadata)
        .then((promises) => Promise.all(promises))
        .then((keyUrlPairs) => {
          for (const { url, key } of keyUrlPairs) {
            card.frontMarkdown = card.frontMarkdown.replaceAll(key, url);
          }
          return transformKeysToUrls(card.backFilesMetadata);
        })
        .then((promises) => Promise.all(promises))
        .then((keyUrlPairs) => {
          for (const { url, key } of keyUrlPairs) {
            card.backMarkdown = card.backMarkdown.replaceAll(key, url);
          }
          setCurrentCard(card);
        });
    } else {
      setCurrentCard(card);
    }
  }, [query.data]);

  async function updateCard(grade: Grade) {
    if (!currentCard) {
      return;
    }
    const newCard = fsrsScheduler.repeat(
      currentCard as unknown as Card,
      new Date(),
    )[grade].card as unknown as ClientSideCard;
    newCard.rating = grade;
    const ratingToRatingType = {
      1: 'again',
      2: 'hard',
      3: 'good',
      4: 'easy',
    } as const;
    const newRatingType = ratingToRatingType[grade] as keyof UserDeckDashboard;
    const currentRatingType = ratingToRatingType[
      currentCard.rating as Grade
    ] as keyof UserDeckDashboard;

    queryClient.setQueryData(['user-decks'], (oldData: UserDeckDashboard[]) => {
      return oldData.map((data) => {
        if (data.id === params.deckId && newRatingType === currentRatingType) {
          return { ...data };
        }
        if (data.id === params.deckId) {
          return {
            ...data,
            [newRatingType]: (data[newRatingType] as number) + 1,
            [currentRatingType]: (data[currentRatingType] as number) - 1,
          };
        }
        return data;
      });
    });

    queryClient.setQueryData(
      ['deck-review-', params.deckId],
      (oldData: ClientSideCard[]) => {
        const idx = oldData.findIndex((card) => card.id === currentCard.id);
        oldData.splice(idx, 1, { ...newCard });
        return [...oldData];
      },
    );

    // const res = await fetch(
    //   `/api/deck/${params.deckId}/card/${currentCard.id}/review`,
    //   {
    //     method: 'PUT',
    //     body: JSON.stringify(updatedCard),
    //   },
    // );
    // if (!res.ok) {
    //   console.error('wrong');
    // }
  }
  if (query.isLoading) {
    return <div>loading...</div>;
  }
  if (currentCard === null) {
    return <div>nothing to show</div>;
  }

  return (
    <>
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            marked.parse(
              currentCard[
              isAnswerBeingShown ? 'backMarkdown' : 'frontMarkdown'
              ] || '',
            ) as string,
          ),
        }}
        className="max-w-xl mx-auto h-[calc(100vh-187px)] border border-zinc-700 rounded-sm p-2 overflow-auto prose dark:prose-invert"
      />
      {!isAnswerBeingShown ? (
        <div className="flex gap-x-4 mx-auto max-w-fit mt-6">
          <Button
            onClick={() => showAnswer(true)}
            variant="outline"
            className="p-8"
          >
            Show answer
          </Button>
        </div>
      ) : (
        <div className="flex gap-x-4 mx-auto max-w-fit mt-6">
          <Button
            variant="outline"
            className="p-8"
            onClick={() => updateCard(Rating.Easy)}
          >
            Easy
          </Button>
          <Button
            variant="outline"
            className="p-8"
            onClick={() => updateCard(Rating.Good)}
          >
            Good
          </Button>
          <Button
            variant="outline"
            className="p-8"
            onClick={() => updateCard(Rating.Hard)}
          >
            Hard
          </Button>
          <Button
            variant="outline"
            className="p-8"
            onClick={() => updateCard(Rating.Again)}
          >
            Again
          </Button>
        </div>
      )}
    </>
  );
}

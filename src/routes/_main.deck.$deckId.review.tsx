import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, defer, useParams } from '@tanstack/react-router';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { type Card, type Grade, Rating } from 'ts-fsrs';
import { Button } from '../components/ui/button';
import { fileToBase64 } from '../lib/file-to-base64';
import { fsrsScheduler } from '../lib/fsrs';
import { db } from '../lib/indexdb';
import { deckReviewQueryOptions, profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';
import type { UserDeckDashboard } from '../lib/types';
import type { ClientSideCard } from '../server/db/types';
import { Card as Cardd, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export const Route = createFileRoute('/_main/deck/$deckId/review')({
  component: Review,
  loader: async ({ params }) => {
    return {
      data: defer(
        queryClient.ensureQueryData(deckReviewQueryOptions(params.deckId)),
      ),
    };
  },
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
  const profileQuery = useQuery(profileQueryOptions);
  const params = useParams({ from: '/_main/deck/$deckId/review' });
  const deckReviewQuery = useQuery(deckReviewQueryOptions(params.deckId));
  const [currentCard, setCurrentCard] = useState<ClientSideCard | null>(null);
  const [isAnswerBeingShown, showAnswer] = useState(false);
  const updateCardMutation = useMutation({
    meta: {
      type: 'notification',
    },
    mutationFn: async ({
      deckId,
      cardId,
      card,
    }: { deckId: string; cardId: string; card: ClientSideCard }) => {
      const res = await fetch(`/api/deck/${deckId}/card/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(card),
      });
      if (!res.ok) {
        throw new Error('Could not update card');
      }
    },
  });

  async function getNextCard() {
    if (!deckReviewQuery.data) return null;
    const card = deckReviewQuery.data?.find(
      (card) => card.due && new Date(card.due).getTime() < new Date().getTime(),
    );
    if (!card) {
      return null;
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
      const frontKeyUrlPairs = await Promise.all(
        await transformKeysToUrls(card.frontFilesMetadata),
      );
      for (const { url, key } of frontKeyUrlPairs) {
        card.frontMarkdown = card.frontMarkdown.replaceAll(key, url);
      }
      const backKeyUrlPairs = await Promise.all(
        await transformKeysToUrls(card.backFilesMetadata),
      );
      for (const { url, key } of backKeyUrlPairs) {
        card.backMarkdown = card.backMarkdown.replaceAll(key, url);
      }
    }
    return card;
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    getNextCard().then((card) => {
      if (card) {
        setCurrentCard(card);
      }
    });
  }, [deckReviewQuery.data]);

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

    queryClient.setQueryData(
      ['user-decks-', profileQuery.data?.username],
      (oldData: UserDeckDashboard[]) => {
        return oldData.map((data) => {
          if (
            data.id === params.deckId &&
            newRatingType === currentRatingType
          ) {
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
      },
    );

    queryClient.setQueryData(
      ['deck-review-', params.deckId],
      (oldData: ClientSideCard[]) => {
        const idx = oldData.findIndex((card) => card.id === currentCard.id);
        oldData.splice(idx, 1, { ...newCard });
        return [...oldData];
      },
    );
    newCard.due = newCard.due && new Date(newCard.due).getTime();
    newCard.last_review =
      newCard.last_review && new Date(newCard.last_review).getTime();
    updateCardMutation.mutate({
      deckId: params.deckId,
      cardId: currentCard.id,
      card: newCard,
    });
    const nextCard = await getNextCard();
    setCurrentCard(nextCard);
    showAnswer(false);
  }
  if (deckReviewQuery.isLoading) {
    return <div>loading...</div>;
  }
  if (currentCard === null) {
    return (
      <Cardd className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Nothing to study, comeback later
          </CardTitle>
        </CardHeader>
        <CardContent className="grid place-items-center">
          <Button>Go back home</Button>
        </CardContent>
      </Cardd>
    );
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

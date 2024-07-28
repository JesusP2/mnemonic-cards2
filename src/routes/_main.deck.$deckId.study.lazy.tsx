import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_main/deck/$deckId/study')({
  component: () => <div>Hello /_main/deck/$deckId!</div>,
});

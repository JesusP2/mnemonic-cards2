import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_main/deck/$deckId')({
  component: () => <div>Hello /_main/deck/$deckId!</div>,
});

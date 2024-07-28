import { createLazyFileRoute } from '@tanstack/react-router';
import { DataTableDemo } from '../components/deck-table/data-table';

export const Route = createLazyFileRoute('/_main/me')({
  component: Me,
});

function Me() {
  return (
    <div className="container mx-auto py-10">
      <h1>Decks</h1>
      <DataTableDemo />
    </div>
  );
}

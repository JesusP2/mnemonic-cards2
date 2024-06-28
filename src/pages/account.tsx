import { TypographyH4 } from '../components/ui/typography';

export default function Account() {
  return (
    <>
      <TypographyH4>Profile</TypographyH4>
      <p className="text-muted-foreground mt-2 text-sm">
        Update your account settings
      </p>
      <div
        data-orientation="horizontal"
        className="shrink-0 bg-border h-[1px] max-w-3xl my-6"
      />
    </>
  );
}

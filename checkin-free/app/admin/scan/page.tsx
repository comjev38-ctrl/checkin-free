import Scanner from "./scanner";

export default function PageScan({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  if (!searchParams.event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <p className="text-stone">
          Choisis un événement depuis le tableau de bord pour ouvrir le
          scanner.
        </p>
      </main>
    );
  }

  return <Scanner eventId={searchParams.event} />;
}

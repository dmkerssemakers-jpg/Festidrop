import EventForm from '@/components/admin/EventForm';

export default function NewEventPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
          Nieuw event
        </h1>
        <p className="text-sm text-muted mt-1">Maak een nieuwe FestiDrop sessie aan</p>
      </div>
      <EventForm />
    </div>
  );
}

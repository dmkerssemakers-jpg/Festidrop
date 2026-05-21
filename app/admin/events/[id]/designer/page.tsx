import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { parseDesign } from '@/lib/polaroid-design';
import PolaroidDesigner from '@/components/admin/PolaroidDesigner';

export default async function DesignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const design = parseDesign(event.designConfig);

  return (
    <PolaroidDesigner
      eventId={event.id}
      eventName={event.name}
      accentColor={event.accentColor}
      logoUrl={event.logoUrl}
      initialDesign={design}
    />
  );
}

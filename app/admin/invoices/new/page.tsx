import { prisma } from '@/lib/prisma';
import InvoiceCreator from '@/components/admin/InvoiceCreator';

export default async function NewInvoicePage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    select: {
      id:    true,
      name:  true,
      email: true,
      events: {
        select: { id: true, name: true, _count: { select: { drops: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return <InvoiceCreator clients={clients} />;
}

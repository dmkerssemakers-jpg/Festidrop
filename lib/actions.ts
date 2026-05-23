'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { PolaroidDesign } from '@/lib/polaroid-design';

// ── Slug helper ──────────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Create event ─────────────────────────────────────────────────────────────
export async function createEvent(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const customSlug = (formData.get('slug') as string | null)?.trim();
  const accentColor = (formData.get('accentColor') as string) || '#1E8BFF';
  const emailText = (formData.get('emailText') as string | null)?.trim() || null;
  const maxPhotos = parseInt(formData.get('maxPhotos') as string) || 10;

  const slug = customSlug || toSlug(name);

  const event = await prisma.event.create({
    data: { name, slug, accentColor, emailText, maxPhotos },
  });

  revalidatePath('/admin/events');
  redirect(`/admin/events/${event.id}`);
}

// ── Update event ─────────────────────────────────────────────────────────────
export async function updateEvent(id: string, formData: FormData) {
  const name       = (formData.get('name') as string).trim();
  const slug       = (formData.get('slug') as string).trim();
  const accentColor = (formData.get('accentColor') as string) || '#1E8BFF';
  const emailText  = (formData.get('emailText') as string | null)?.trim() || null;
  const maxPhotos  = parseInt(formData.get('maxPhotos') as string) || 10;
  const isActive   = formData.get('isActive') === 'true';
  const logoUrl    = (formData.get('logoUrl') as string | null)?.trim() || null;
  const accessCode = (formData.get('accessCode') as string | null)?.trim() || null;
  const endsAtRaw  = (formData.get('endsAt') as string | null)?.trim();
  const endsAt     = endsAtRaw ? new Date(endsAtRaw) : null;
  const notes      = (formData.get('notes') as string | null)?.trim() || null;
  const clientId   = (formData.get('clientId') as string | null)?.trim() || null;

  await prisma.event.update({
    where: { id },
    data: { name, slug, accentColor, emailText, maxPhotos, isActive, logoUrl, accessCode, endsAt, notes, clientId },
  });

  revalidatePath(`/admin/events/${id}`);
  revalidatePath('/admin/events');
  revalidatePath('/admin');
}

// ── Duplicate event ───────────────────────────────────────────────────────────
export async function duplicateEvent(id: string) {
  const source = await prisma.event.findUnique({ where: { id } });
  if (!source) return;

  const baseSlug = `${source.slug}-copy`;
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  const copy = await prisma.event.create({
    data: {
      name:        `${source.name} (kopie)`,
      slug,
      accentColor: source.accentColor,
      logoUrl:     source.logoUrl,
      emailText:   source.emailText,
      maxPhotos:   source.maxPhotos,
      isActive:    false, // start inactive so you can review before publishing
      accessCode:  source.accessCode,
    },
  });

  revalidatePath('/admin/events');
  redirect(`/admin/events/${copy.id}`);
}

// ── Save polaroid design ─────────────────────────────────────────────────────
export async function saveEventDesign(eventId: string, design: PolaroidDesign) {
  await prisma.event.update({
    where: { id: eventId },
    data:  { designConfig: design },
  });
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/designer`);
  revalidatePath('/admin');
}

// ── Toggle event active/inactive ─────────────────────────────────────────────
export async function toggleEventActive(id: string, isActive: boolean) {
  await prisma.event.update({ where: { id }, data: { isActive } });
  revalidatePath('/admin/events');
  revalidatePath('/admin');
}

// ── Delete event ─────────────────────────────────────────────────────────────
export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

// ── Client CRUD ──────────────────────────────────────────────────────────────
export async function createClient(formData: FormData) {
  const name          = (formData.get('name') as string).trim();
  const contactPerson = (formData.get('contactPerson') as string | null)?.trim() || null;
  const email         = (formData.get('email') as string | null)?.trim() || null;
  const phone         = (formData.get('phone') as string | null)?.trim() || null;
  const website       = (formData.get('website') as string | null)?.trim() || null;
  const notes         = (formData.get('notes') as string | null)?.trim() || null;

  const client = await prisma.client.create({
    data: { name, contactPerson, email, phone, website, notes },
  });

  revalidatePath('/admin/clients');
  redirect(`/admin/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const name          = (formData.get('name') as string).trim();
  const contactPerson = (formData.get('contactPerson') as string | null)?.trim() || null;
  const email         = (formData.get('email') as string | null)?.trim() || null;
  const phone         = (formData.get('phone') as string | null)?.trim() || null;
  const website       = (formData.get('website') as string | null)?.trim() || null;
  const notes         = (formData.get('notes') as string | null)?.trim() || null;

  await prisma.client.update({
    where: { id },
    data: { name, contactPerson, email, phone, website, notes },
  });

  revalidatePath(`/admin/clients/${id}`);
  revalidatePath('/admin/clients');
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  revalidatePath('/admin/clients');
  redirect('/admin/clients');
}

export async function setEventClient(eventId: string, clientId: string | null) {
  await prisma.event.update({ where: { id: eventId }, data: { clientId } });
  revalidatePath('/admin/clients');
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${eventId}`);
}

// ── Whitelist ────────────────────────────────────────────────────────────────
export async function addWhitelist(eventId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  await prisma.whitelist.upsert({
    where: { eventId_email: { eventId, email: normalized } },
    create: { eventId, email: normalized },
    update: {},
  });

  revalidatePath(`/admin/events/${eventId}`);
}

export async function removeWhitelist(id: string, eventId: string) {
  await prisma.whitelist.delete({ where: { id } });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function addWhitelistBulk(eventId: string, emails: string[]) {
  const normalized = emails
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@') && e.includes('.'));
  if (!normalized.length) return;
  await prisma.whitelist.createMany({
    data: normalized.map(email => ({ eventId, email })),
    skipDuplicates: true,
  });
  revalidatePath(`/admin/events/${eventId}`);
}

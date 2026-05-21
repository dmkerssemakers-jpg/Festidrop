'use client';
import { useRef, useState, useTransition } from 'react';
import { createEvent, updateEvent, deleteEvent } from '@/lib/actions';
import type { Event } from '@prisma/client';

const COLORS = [
  '#1E8BFF', '#20D6E8', '#FF6B35', '#FF3CAC', '#7B2FF7',
  '#00C896', '#FFB800', '#FF1E5B',
];

interface Props {
  event?: Event;
}

export default function EventForm({ event }: Props) {
  const isEdit = !!event;
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(event?.accentColor ?? '#1E8BFF');
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('accentColor', color);

    startTransition(async () => {
      if (isEdit) {
        await updateEvent(event.id, fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        await createEvent(fd);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Event "${event?.name}" verwijderen? Dit kan niet ongedaan worden.`)) return;
    startTransition(() => deleteEvent(event!.id));
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-5">
        {isEdit ? 'Instellingen' : 'Event details'}
      </h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Field label="Naam">
          <input
            name="name"
            defaultValue={event?.name}
            required
            placeholder="bijv. Lowlands 2026"
            className="field"
          />
        </Field>

        {/* Slug */}
        <Field label="URL slug" hint="Automatisch ingevuld op basis van naam">
          <input
            name="slug"
            defaultValue={event?.slug}
            placeholder="bijv. lowlands-2026"
            className="field"
          />
        </Field>

        {/* Max photos */}
        <Field label="Max foto's per sessie">
          <input
            name="maxPhotos"
            type="number"
            min={1}
            max={30}
            defaultValue={event?.maxPhotos ?? 10}
            required
            className="field"
          />
        </Field>

        {/* Active toggle (edit only) */}
        {isEdit && (
          <Field label="Status">
            <select name="isActive" defaultValue={event.isActive ? 'true' : 'false'} className="field">
              <option value="true">Actief</option>
              <option value="false">Inactief</option>
            </select>
          </Field>
        )}

        {/* Logo URL */}
        <Field label="Logo URL" hint="Link naar je eigen logo (optioneel)">
          <input
            name="logoUrl"
            type="url"
            defaultValue={event?.logoUrl ?? ''}
            placeholder="https://..."
            className="field"
          />
        </Field>

        {/* Email text */}
        <Field label="E-mail tekst" hint="Optioneel — verschijnt in de bevestigingsmail">
          <textarea
            name="emailText"
            defaultValue={event?.emailText ?? ''}
            placeholder="bijv. Bedankt voor je komst bij Lowlands 2026! 🎪"
            rows={2}
            className="field resize-none"
          />
        </Field>

        {/* Accent color */}
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-[0.1em] block mb-2">
            Accentkleur
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c,
                  outline: color === c ? `3px solid ${c}` : undefined,
                  outlineOffset: color === c ? '2px' : undefined,
                  opacity: color === c ? 1 : 0.6,
                }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-0"
              title="Aangepaste kleur"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: saved ? '#00C896' : 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
          >
            {isPending ? 'Opslaan…' : saved ? '✓ Opgeslagen!' : isEdit ? 'Opslaan' : 'Event aanmaken'}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-60"
              style={{ background: 'rgba(255,30,30,0.1)', color: '#FF1E1E' }}
            >
              Verwijder
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .field {
          width: 100%;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          background: rgba(247,251,255,0.8);
          border: 1px solid rgba(189,239,255,0.6);
          color: #07162F;
          outline: none;
          transition: border-color 0.15s;
        }
        .field:focus {
          border-color: #1E8BFF;
        }
        .field::placeholder {
          color: #6C7A8D;
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.1em]">{label}</label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

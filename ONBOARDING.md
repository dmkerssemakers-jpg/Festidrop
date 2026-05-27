# FestiDrop — Project Onboarding

## Wat is FestiDrop?
Een Next.js admin-tool voor een fotodrop-service bij festivals/events. Gasten scannen een QR-code, voeren hun e-mail in en ontvangen achteraf hun foto's. De beheerder beheert events, klanten en facturen via een admin dashboard.

## Tech stack
- **Next.js 15/16** App Router, React Server Components, Server Actions
- **Prisma v5** + PostgreSQL (Vercel Postgres)
- **NextAuth v5** met Google OAuth
- **Vercel Blob** voor foto-opslag
- **Vercel KV** voor rate limiting (per e-mail per event)
- **Resend** voor e-mail (bevestigingsmail na drop)
- **Tailwind CSS** + inline styles (design system: navy `#07162F`, azure `#1E8BFF`, etc.)
- **Vercel Cron** voor AVG auto-delete + herinneringsmails

## Repository
GitHub: `dmkerssemakers-jpg/Festidrop` (branch: `master`)
Deployed: `https://festidrop.vercel.app`

---

## Admin pagina's — volledig geoptimaliseerd (10/10)

| Route | Bestand | Status |
|-------|---------|--------|
| `/admin` | `app/admin/page.tsx` | ✅ Dashboard met stat cards, 7-daags chart, actieve events, recente drops |
| `/admin/events` | `app/admin/events/page.tsx` + `EventsList.tsx` | ✅ Zoeken/filteren/sorteren, gekleurde event-rijen |
| `/admin/events/[id]` | `app/admin/events/[id]/page.tsx` | ✅ Hero, designer/export/duplicate knoppen |
| `/admin/events/new` | `app/admin/events/new/page.tsx` via `NewEventForm.tsx` | ✅ |
| `/admin/clients` | `app/admin/clients/page.tsx` | ✅ Stat cards, empty state met stappen |
| `/admin/clients/[id]` | `app/admin/clients/[id]/page.tsx` | ✅ Hero, contact chips, gekoppelde events |
| `/admin/clients/new` | `app/admin/clients/new/page.tsx` | ✅ 3-sectie kaarten (identiteit/contact/intern) |
| `/admin/invoices` | `app/admin/invoices/page.tsx` | ✅ Stat cards, status-gekleurde rijen |
| `/admin/invoices/[id]` | `app/admin/invoices/[id]/page.tsx` | ✅ Hero, delete werkt voor alle statussen |
| `/admin/invoices/new` | `app/admin/invoices/new/page.tsx` via `InvoiceCreator.tsx` | ✅ Genummerde stappen, live totaal in knop |
| `/admin/settings` | `app/admin/settings/page.tsx` + `SettingsForm.tsx` | ✅ Twee-kolom layout, live factuur preview, checklist |
| `/factuur/[id]` | `app/factuur/[id]/page.tsx` | ✅ Print-ready PDF met betaalgegevens |

---

## Instellingen systeem (company details)
Bedrijfsgegevens worden opgeslagen in de DB via het `Setting` model (key-value). Geen redeploy nodig voor wijzigingen.

- **Model:** `prisma/schema.prisma` → `model Setting { key String @id; value String; updatedAt DateTime @updatedAt }`
- **Runtime migratie:** `instrumentation.ts` maakt de tabel aan als die nog niet bestaat
- **Helper:** `lib/settings.ts` → `getCompanySettings()` leest uit DB met env var fallback
- **Server Action:** `lib/actions.ts` → `saveSettings(formData)` met `prisma.setting.upsert`
- **Keys:** `company.name`, `company.address`, `company.city`, `company.kvk`, `company.btw`, `company.iban`, `company.bank`, `company.email`, `company.website`

---

## Design system

### Kleuren
```
Navy:   #07162F  (primaire tekst, donkere achtergronden)
Azure:  #1E8BFF  (primaire accent, knoppen)
Teal:   #20D6E8  (secundaire accent)
Green:  #00C896  (succes, betaald)
Purple: #7B2FF7  (facturen, fiscaal)
Muted:  #6C7A8D  (subtekst)
```

### Wiederkehrende patronen
- **Gradient accent bar:** `<div className="h-1" style={{ background: 'linear-gradient(...)' }} />` bovenaan kaarten
- **Sectie kaarten:** `rounded-2xl overflow-hidden` + gradient bar + genummerd stap badge
- **Stat cards:** gradient bar + icon badge + groot getal + trend indicator
- **Pill badges:** kleine gekleurde labels voor status, LIVE, etc.
- **Veld stijl:** `border: 1.5px solid rgba(189,239,255,0.65)` → groen bij filled, blauw bij focus

### Tailwind custom classes (in `globals.css`)
- `.text-navy`, `.text-muted`, `.text-azure`
- `.bg-navy`

---

## Kritieke bugs opgelost
- **Delete factuur** werkte alleen voor CONCEPT-status → opgelost met `DeleteInvoiceButton` client component
- **`styled-jsx` in Server Component** → vervangen door `const fieldStyle` inline object
- **TypeScript any-type in `lib/settings.ts`** → opgelost met expliciete `Record<string, string>` type

---

## Wat nog NIET werkt / TODO

### 🔴 Blocker voor productie
**E-mail naar anderen:** `onboarding@resend.dev` stuurt alleen naar het Resend account-eigenaar e-mailadres.
**Fix:**
1. Registreer `festidrop.nl` (of ander domein)
2. Verifieer domein in Resend dashboard
3. Zet in Vercel env vars: `RESEND_FROM=noreply@festidrop.nl`

### 🟡 Vercel environment variables checken
```
NEXT_PUBLIC_BASE_URL=https://festidrop.vercel.app   ← controleer of dit gezet is!
CRON_SECRET=<willekeurige string>                    ← voor AVG cron authenticatie
```

### 🟢 Nog te ontwerpen / optimaliseren
- **Publieke event pagina** (`/[slug]`) — wat gasten zien bij QR-scan. Nog niet bekeken/geoptimaliseerd. MEEST URGENT voor eerste indruk.
- **E-mail template** — bevestigingsmail die gasten ontvangen na drop
- **Designer pagina** (`/admin/events/[id]/designer`) — Polaroid layout editor
- **Mobile responsiveness** admin dashboard
- **Custom 404 / error pagina's**

---

## Bestandsstructuur (key files)

```
app/
  admin/
    page.tsx                    ← Dashboard
    layout.tsx                  ← Admin layout met sidebar
    events/[id]/page.tsx        ← Event detail + beheren
    events/[id]/designer/       ← Polaroid designer
    clients/[id]/page.tsx       ← Klant detail
    invoices/[id]/page.tsx      ← Factuur detail
    settings/page.tsx           ← Instellingen
  factuur/[id]/page.tsx         ← Print-ready factuur PDF
  [slug]/page.tsx               ← PUBLIEKE event pagina (gasten)
  api/
    cron/cleanup-photos/        ← AVG: verwijder foto's na 30 dagen
    cron/cleanup-reminder/      ← Stuur herinnering op dag 25
    admin/events/[id]/export-drops/  ← CSV export (normaal + marketing)

components/admin/
  AdminSidebar.tsx              ← Navigatie sidebar
  SettingsForm.tsx              ← Instellingen formulier (client component)
  InvoiceCreator.tsx            ← Factuur aanmaken
  EventsList.tsx                ← Events lijst met zoeken/filteren
  DeleteInvoiceButton.tsx       ← Client component voor delete met confirm
  DashboardChart.tsx            ← 7-daags bar chart

lib/
  settings.ts                   ← getCompanySettings() helper
  actions.ts                    ← Server actions (saveSettings, createClient, etc.)
  prisma.ts                     ← Prisma client singleton

prisma/schema.prisma            ← Database schema
instrumentation.ts              ← Runtime migraties (Setting tabel)
vercel.json                     ← Cron job configuratie
```

---

## Prisma schema (hoofdmodellen)

```prisma
model Event {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  accentColor String   @default("#1E8BFF")
  isActive    Boolean  @default(true)
  maxPhotos   Int      @default(10)
  accessCode  String?
  notes       String?
  endsAt      DateTime?
  clientId    String?
  client      Client?  @relation(...)
  drops       Drop[]
  whitelist   Whitelist[]
  createdAt   DateTime @default(now())
}

model Drop {
  id               String   @id @default(cuid())
  email            String
  eventId          String
  event            Event    @relation(...)
  sentAt           DateTime @default(now())
  marketingConsent Boolean  @default(false)
}

model Client {
  id            String   @id @default(cuid())
  name          String
  contactPerson String?
  email         String?
  phone         String?
  website       String?
  notes         String?
  events        Event[]
  invoices      Invoice[]
  createdAt     DateTime @default(now())
}

model Invoice {
  id        String        @id @default(cuid())
  number    String        @unique  // bijv. FD-2025-001
  clientId  String
  client    Client        @relation(...)
  status    InvoiceStatus @default(CONCEPT)
  issueDate DateTime
  dueDate   DateTime?
  vatPct    Float         @default(21)
  notes     String?
  lines     InvoiceLine[]
  createdAt DateTime      @default(now())
}

model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

---

## Lokaal draaien
```bash
cd C:/Users/dmker/Claude/festidrop
npm run dev
# Draait op http://localhost:3000
# Vereist: DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET in .env.local
```

## Deployen
```bash
git add . && git commit -m "beschrijving" && git push
# Vercel pikt automatisch op en deployt
```

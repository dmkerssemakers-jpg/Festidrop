# 🎪 FestiDrop — Product & Strategie Kompas

> **Companion bij `ONBOARDING.md`.**
> `ONBOARDING.md` = *hoe de code werkt*. Dit document = *waar we heen bouwen en waarom*.
> Laatst bijgewerkt: **2026-05-31**

---

## 1. FestiDrop in één zin

> Festivalgangers maken met hun telefoon (zonder app te installeren) branded polaroid-foto's en ontvangen ze direct per e-mail — voor de **organisator** een white-label fotobeleving, voor de **gast** een gratis souvenir.

---

## 2. De twee omgevingen — één systeem, twee gezichten

FestiDrop is **één codebase + één database**, maar bestaat uit twee bewust gescheiden *omgevingen* met een andere doelgroep, ontwerp en doel. **Houd ze bij elke keuze uit elkaar.**

| | 🛠️ Back-office | 🎉 Festival-omgeving |
|---|---|---|
| **Routes** | `/admin/*`, `/login` | `/[slug]`, `/[slug]/send`, `/gallery/[slug]`, `/qr` |
| **Voor wie** | Jij (en later de organisator) | De festivalganger |
| **Apparaat** | Desktop | Telefoon |
| **Karakter** | Zakelijk, data, beheer | Branded, fun, beleving |
| **Doel** | Events beheren, factureren, statistieken | Foto's maken, ontvangen, (straks) albums |
| **once.film-magie?** | Nee — alleen de *knoppen* (bv. reveal-tijd) | **Ja — hier leeft álle consumentenmagie** |

> 🔑 **Regel:** nieuwe consument-/once.film-achtige features horen in de **festival-omgeving**. De back-office krijgt alleen de instellingen om ze te besturen. Je hoeft géén tweede app te bouwen — de scheiding zit al in je routes.

---

## 3. De 4 lagen

```
PLATFORM (jij)            L1  ✅ gebouwd      — god mode, /admin, één ADMIN_EMAIL
  └ ORGANIZER (Client)    L2  🟡 data ✅ / portal ❌
      └ EVENT             L3  🟡 detail+designer ✅ / workspace ❌
          └ GUEST          L4  🟢 capture ✅ / account ❌   ← jouw consumentenproduct
```

| Laag | Wie | Status | Waar in de code |
|---|---|---|---|
| **L1 Platform** | Jij | ✅ Werkt | `auth.ts` (Google, 1 e-mail), `/admin/*` |
| **L2 Organizer** | Betalende klant | 🟡 `Client`-model + `Event.clientId` bestaan; geen login/portal | `Client`, `/admin/clients` |
| **L3 Event** | Jij nu, organisator later | 🟡 `/admin/events/[id]` + `/designer` bestaan; nog geen "workspace" | `Event` |
| **L4 Guest** | Festivalganger | 🟢 Capture → e-mail werkt; geen account/album-overzicht | `CameraCapture`, `EmailDropCard`, `/gallery/[slug]` |

> **De data-spine bestaat al:** `Client → Event → Drop → Photo`, met ownership via `Event.clientId` en `Invoice.clientId`. Wat ontbreekt voor de hogere lagen is vooral *identiteit* (logins) en *scoping* — niet het datamodel.

---

## 4. De flywheel — waarom dit kán groeien

Dit is het zeldzame, verdedigbare deel:

```
Organisator betaalt voor een event
        ↓
Elke gast vult e-mail in om foto's te krijgen
        ↓
Honderden consumenten-e-mails per event — gratis
        ↓
Die converteer je naar terugkerende gast-accounts (L4)
        ↓
Meer gasten → aantrekkelijker voor de volgende organisator
```

> Een puur "event-fototool" is commodity. De **gast-laag, gevoed door betalende organisatoren**, is de motor die groot kan worden. Daar zit de waarde "in the end".

---

## 5. once.film — wat we lenen en wat we bewust NIET doen

**Hun concept:** collectieve digitale wegwerpcamera. Gast scant QR (iOS App Clip, geen install), schiet met **beperkte shots** in één **gedeelde rol**, het album **ontwikkelt ná afloop** (reveal). Betalen: **per event naar groepsgrootte**, gratis t/m 5 deelnemers. Bewust **géén** gast-social-laag.

### ⚠️ Belangrijkste inzicht — festival ≠ once.film
once.film is voor *intieme* groepen (bruiloft, verjaardag) waar je elkaar ként → één gedeeld album is logisch. Op een festival sta je tussen **duizenden vreemden**. "Iedereen op één hoop" is daar geen warme herinnering maar ruis. → **We adapteren, we kopiëren niet.**

| once.film-idee | Overnemen? | FestiDrop-variant |
|---|---|---|
| **Delayed reveal** (album opent ná afloop) | ✅ Ja, kern | Optionele modus *bovenop* instant-levering |
| **Gedeelde rol** | ⚠️ Aangepast | **Per vriendengroep** (groeps-QR) of **per podium/dag** curated wall — niet één mega-rol |
| **Beperkte shots = betere foto's** | ✅ Gratis | Je hebt `maxPhotos` al — herframe als deugd in de UI |
| **Reveal-tijd instelbaar** | ✅ Ja | Eén veld in event-admin (`revealAt`) |
| **Foto-attributie** ("door Jan") | ✅ Ja | Optionele naam op het verzendformulier |
| **Occasion-landingspagina's** | ✅ Ja | `/festival`, `/bedrijfsfeest` voor SEO/funnel |
| **Self-serve prijs naar grootte** | ✅ Ja | Gratis t/m X gasten, daarna tiers (Stripe) |
| **QR, geen download** | ✅ Al beter | Jouw web-flow werkt óók op Android (hun App Clip is iOS) |
| **Gast-social-accounts** | ❌ Zelfs zij niet | Niet vroeg bouwen; eerst data verzamelen |

---

## 6. FestiDrop's wig — waar je wint

- **B2B / white-label voor festivals & merken:** logo + kleur per event, designer, facturatie, multi-event klantbeheer. once.film (consumer/bruiloft) doet dit niet.
- **Instant + collectief:** jij geeft *je eigen polaroids meteen* **én** *iedereens shots ná afloop*. once.film doet alleen het collectieve → strikt méér.
- **Echt geen download, overal:** browser-camera i.p.v. iOS App Clip.

---

## 7. Concrete backlog — geprioriteerd

| # | Feature | Omgeving | Waar / data-delta | Moeite | Impact |
|---|---|---|---|---|---|
| 1 | Shot-limiet als deugd ("nog 3 shots ✨") | Festival | copy in `CameraCapture.tsx` | Mini | M |
| 2 | Occasion-landingspagina's | Festival | nieuwe routes `/festival`, `/bedrijfsfeest` | Klein | M |
| 3 | **Reveal-modus:** gedeelde event-rol op slot tot `revealAt` | Festival | `Event.revealAt` + gating in `/gallery/[slug]` | Middel | **Hoog** |
| 4 | Host stelt reveal-moment in (einde / custom / "nu") | Back-office | veld in `/admin/events/[id]` | Klein | M |
| 5 | Foto-attributie in galerij | Festival | naam op `EmailDropCard` → `Drop.displayName?` | Middel | M |
| 6 | Festival-variant: groeps-QR / per podium | Festival | sub-roll per groep/area | Middel | Hoog |
| 7 | **Gast-account** via magic-link → "al jouw events" | Festival | Resend magic-link + query `Drop.where({ email })` | Middel | **Hoog** |
| 8 | Deelbare album-link (unlisted) | Festival | share-token op Drop/album | Middel | Hoog (viraal) |
| 9 | Self-serve per-grootte prijzen | Back-office | Stripe + `plan` op `Event`/`Client` | Groot | Hoog |
| 10 | Premium-upgrade (permanent / HD / albums) | Festival | `plan` op gast + retentie-uitzondering | Groot | Hoog (€) |

---

## 8. Bouwvolgorde — de roadmap

> **Principe: bouw in de volgorde waarin elke laag de volgende verdient.** Je kunt geen publiekslaag bouwen zonder publiek — en publiek krijg je door events te draaien.

**🚦 NU (vóór / rond launch)**
- **0. De loop sluiten:** DNS/DKIM af → één echte mail versturen → één klein echt event draaien (±10 gasten). *Niets hieronder telt tot dit één keer écht werkt.*
- **1.** Gratis wins: shot-framing (#1) + landingspagina's (#2).

**▶️ NEXT (na 1-2 echte events)**
- **2. Event-workspace (L3)** — live drop-feed, QR/link, whitelist, export. De tool die jíj nodig hebt om events te draaien — en die de organisator later erft.
- **3. Reveal-modus (#3–#6)** — de festival-variant. Je meest onderscheidende feature.

**⏭️ LATER (als gasten terugkomen)**
- **4.** Gast-account (#7) → delen (#8) → self-serve geld (#9) → premium (#10).
- **5. Organizer-portal (L2)** — pas als echte organisatoren om self-service vragen.

---

## 9. Datamodel-deltas (schema)

Toekomstige toevoegingen — **nog niet bouwen**, alleen vastgelegd zodat de richting helder is:

```prisma
model Event {
  // … bestaand
  revealAt    DateTime?   // null = instant; gezet = gedeelde rol opent dan
  revealMode  String?     // "instant" | "event_end" | "custom"
}

model Drop {
  // … bestaand
  displayName String?     // optionele naam voor foto-attributie in de gedeelde galerij
}

// Nieuw — pas relevant bij de L4-gast-account:
model GuestUser {
  id        String   @id @default(cuid())
  email     String   @unique
  plan      String   @default("free")   // "free" | "premium"
  createdAt DateTime @default(now())
}
```

---

## 10. Randvoorwaarden (niet later "erbij bouwen")

- **AVG / retentie:** nu beloof je *foto's na 30 dagen weg* (cron `/api/cron/cleanup-photos`). Een album-/accountproduct impliceert permanentie → maak het **consent-getrapt**: gratis = 30 dagen, premium = langer **mét nieuwe, expliciete toestemming**. Zo ontworpen vanaf het begin, niet achteraf.
- **Scoping choke-point:** zodra je een laag onder jezelf opent (organizer/gast), is **datalekkage** het #1 risico — de e-mails van gast A zichtbaar bij organisator B = een AVG-incident, geen bug. Forceer scoping op **één plek** (een `getScoped(session)`-helper die altijd `where: { clientId }` injecteert), nooit ad-hoc per query.
- **Omgevingen gescheiden houden:** festival-features niet in de admin proppen, en admin-zaken niet in de festival-omgeving.

---

## 11. Het kompas in één regel

> **Festivals eerst. Instant-persoonlijk + een festival-slimme collectieve reveal. Organisatoren betalen en voeden de gast-laag. Bouw in de volgorde waarin elke laag de volgende verdient — en de eerstvolgende schakel is nog steeds die ene mail die moet aankomen.**

# EDUFAKE.SK

Základ školského informačného systému: Next.js 15 (App Router) + TypeScript +
Tailwind + Supabase (Auth, Postgres, RLS).

## Čo je v tomto commite hotové a naozaj funkčné

- Kompletná DB schéma (`supabase/migrations/0001_init.sql`): školy, roky,
  semestre, budovy, učebne, zvonenie, predmety, RBAC (13 rolí + custom roly
  a permissions), triedy, žiaci, učitelia, rodičia, rozvrh, suplovanie,
  triedna kniha, dochádzka, ospravedlnenky, domáce úlohy, známky, správanie,
  správy, notifikácie, audit log.
- Row Level Security politiky pre všetky citlivé tabuľky (žiak/rodič vidí len
  svoje dáta, učiteľ/admin vidí všetko v rámci svojej role).
- Trigger, ktorý pri založení Supabase Auth účtu automaticky vytvorí profil.
- Prihlásenie cez Supabase Auth (server action, žiadny mock), middleware,
  ktorý chráni `/dashboard/*` a presmerováva podľa stavu session.
- Dashboard layout s bočným menu podľa role a domovská stránka, ktorá reálne
  číta dáta zo Supabase (počty žiakov/učiteľov/tried pre admina, domáce úlohy
  a známky pre žiaka).
- `npm run build` prechádza bez chýb (overené).

## Čo ešte chýba (ďalšie iterácie)

Toto je **základ**, nie hotový EduPage klon — ten má stovky prepojených
obrazoviek a nedá sa poctivo dodať naraz. Ďalšie moduly, ktoré treba doplniť
postupne (schéma a RLS pre ne už existujú, chýba len UI + server actions):
triedna kniha (zápis), zadávanie a oprava známok učiteľom, rozvrh + drag&drop
editor, suplovanie, správy/inbox, tlač vysvedčení do PDF, tlač
prihlasovacích údajov, admin CRUD pre používateľov/triedy/predmety, export
Excel/PDF, nastavenia školy (logo, farby, zvonenie) v UI.

## Branding — pozor

Zámerne som **nekopíroval** logo ani vizuálnu identitu EduPage — to by bolo
porušenie ochrannej známky. UI je moderné, modré, s bielymi kartami (bežný
SaaS look), nie napodobenina konkrétneho produktu. Vlastné logo/favicon si
nahraď v `app/(auth)/login/page.tsx` a `app/(dashboard)/layout.tsx`
(momentálne je tam len jednoduché "E" ako placeholder).

## Bezpečnostná poznámka k admin heslu

Zadané heslo `EF12345690*@` je teraz natvrdo v `supabase/seed-admin.ts` a
pôjde do histórie Git repozitára. **Hneď po prvom prihlásení si ho zmeň** v
Supabase Auth (Authentication → Users), alebo ešte lepšie — pred pushnutím
do GitHubu uprav `seed-admin.ts` a heslo si nastav cez premennú prostredia,
nie natvrdo v kóde.

---

## 1. Založenie Supabase projektu

1. Choď na https://supabase.com/dashboard → **New project**.
2. Po vytvorení choď do **Project Settings → API** a skopíruj:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` kľúč → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` kľúč → `SUPABASE_SERVICE_ROLE_KEY` (drž v tajnosti,
     nikdy nedávaj do `NEXT_PUBLIC_*`)

## 2. Aplikovanie schémy

V Supabase dashboarde choď do **SQL Editor** → **New query**, vlož celý
obsah `supabase/migrations/0001_init.sql` a spusti (Run).

(Alternatíva cez CLI, ak ju máš nainštalovanú lokálne:
`supabase link --project-ref <ref>` a potom `supabase db push`.)

## 3. Vytvorenie admin účtu

Lokálne (potrebuješ Node.js):

```bash
npm install
cp .env.example .env.local   # vyplň skutočné hodnoty zo Supabase
npx tsx supabase/seed-admin.ts
```

Vytvorí sa `admin@edufake.sk` / `EF12345690*@` s rolou `administrator`.

## 4. Nahratie na GitHub

```bash
cd edufake
git init
git add .
git commit -m "EDUFAKE.SK — initial scaffold"
git branch -M main
git remote add origin https://github.com/<tvoj-ucet>/edufake.git
git push -u origin main
```

## 5. Deploy na Vercel

1. https://vercel.com/new → **Import Git Repository** → vyber `edufake`.
2. Framework preset sa nastaví automaticky na **Next.js**.
3. V **Environment Variables** pridaj presne tieto tri (Production +
   Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy**.
5. Po nasadení otvor URL → presmeruje na `/login` → prihlás sa admin
   účtom → presmeruje na `/dashboard`.

Žiadny lokálny server, žiadny Docker — beží čisto na Vercel + Supabase.

## Lokálny vývoj

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Ďalší krok

Napíš mi, ktorý modul chceš ako ďalší (napr. "zadávanie známok pre
učiteľa" alebo "admin CRUD pre používateľov") a spravím ho rovnako
naostro — reálne prepojený na Supabase, otestovaný buildom, žiadne
mock dáta.

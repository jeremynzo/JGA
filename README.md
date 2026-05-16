# JGA-Planer

Kollaborativer JGA-Planer für 22.-23. August 2026. Mehrere Personen können gleichzeitig denselben Plan bearbeiten über einen 6-stelligen Raum-Code. Daten werden in Supabase gespeichert, Updates kommen über Realtime-Subscriptions live an.

## So deployst du das Ganze (komplett kostenlos)

Insgesamt etwa 20-30 Minuten. Du brauchst nur einen Browser, kein lokales Setup.

### Schritt 1: Supabase einrichten (Datenbank)

1. Gehe auf https://supabase.com und klicke auf **Start your project** -> mit GitHub anmelden
2. Klicke **New project**:
   - Name: `jga-planer` (oder was du willst)
   - Database Password: irgendwas Sicheres ausdenken und merken
   - Region: **Frankfurt (eu-central-1)** für schnellste Verbindung
   - Pricing Plan: Free
3. Warte 1-2 Minuten, bis das Projekt fertig ist
4. Im linken Menü auf **SQL Editor** (Symbol: <>)
5. Klicke **New query**, kopiere diesen Code rein und klicke **Run**:

```sql
create table jga_plans (
  room_code text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

alter table jga_plans enable row level security;

create policy "anyone can read" on jga_plans for select using (true);
create policy "anyone can insert" on jga_plans for insert with check (true);
create policy "anyone can update" on jga_plans for update using (true);

alter publication supabase_realtime add table jga_plans;
```

6. Im linken Menü auf **Project Settings** (Zahnrad ganz unten) -> **API**
7. Kopiere zwei Werte (in einem Notizblock zwischenspeichern):
   - **Project URL** (sieht aus wie `https://xyz123.supabase.co`)
   - **anon public** Key (langer Text unter "Project API Keys")

### Schritt 2: Code auf GitHub hochladen

1. Gehe auf https://github.com -> rechts oben + -> **New repository**
2. Name: `jga-planer`, **Public** auswählen (sonst geht Vercel free nicht), **Create repository**
3. Auf der nächsten Seite: **uploading an existing file** klicken
4. Den **ganzen Inhalt** dieses Ordners reinziehen (alle Files und den `src`-Ordner) - aber **NICHT** `node_modules` falls vorhanden, und auch **nicht** eine `.env`-Datei
5. Ganz unten: **Commit changes**

Falls du Git auf deinem Rechner installiert hast, geht es schneller mit:
```bash
cd /pfad/zu/diesem/ordner
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN_USER/jga-planer.git
git push -u origin main
```

### Schritt 3: Bei Vercel deployen

1. Gehe auf https://vercel.com -> **Sign up** -> **Continue with GitHub**
2. Klicke **Add New...** -> **Project**
3. Bei "Import Git Repository" dein `jga-planer` Repo auswählen -> **Import**
4. **Framework Preset** sollte automatisch "Vite" erkennen
5. Bei **Environment Variables** zwei Variablen anlegen:
   - Name: `VITE_SUPABASE_URL` -> Wert: deine Project URL von Schritt 1.7
   - Name: `VITE_SUPABASE_ANON_KEY` -> Wert: der anon public Key
6. **Deploy** klicken
7. Nach ca. 1 Minute siehst du dein fertiges Deployment mit einer URL wie `jga-planer-xyz.vercel.app`

### Schritt 4: Eigene Domain (optional)

In Vercel auf dein Projekt -> **Settings** -> **Domains** -> wenn du eine eigene Domain hast, kannst du sie hier anhängen (z.B. `jga.deinedomain.de`). Vercel zeigt dir die DNS-Einträge, die du bei deinem Domain-Anbieter setzen musst.

## Wie es funktioniert

- Du öffnest die URL -> Auswahl "Raum erstellen" oder "Beitreten"
- Bei "Raum erstellen" wird ein 6-stelliger Code generiert (z.B. `XK7M2P`)
- Der Code steht in der URL: `jga-planer.vercel.app/#XK7M2P`
- Diese URL teilst du per WhatsApp mit deinen Freunden
- Die öffnen den Link, sehen direkt euren Plan und können gleichzeitig bearbeiten
- Änderungen erscheinen bei den anderen live (über Supabase Realtime)
- Im Header gibt es einen kleinen Button zum Kopieren des Share-Links

## Kostenlimits (Free-Tier)

Mehr als ausreichend für JGA-Planung:
- **Vercel:** 100 GB Traffic/Monat, unbegrenzte Deployments
- **Supabase:** 500 MB Datenbank, 50.000 monthly active users, 2 GB Bandbreite
- **Beides bleibt gratis**, solange du in diesen Grenzen bleibst

## Lokal entwickeln (optional)

Wenn du Änderungen am Code machen willst:

```bash
# Node.js 18+ installieren (https://nodejs.org)
npm install
cp .env.example .env
# Trag deine Supabase-Credentials in .env ein
npm run dev
```


Browser öffnet automatisch auf http://localhost:5173

## Sicherheitshinweis

Jeder mit dem 6-stelligen Code kann den Plan eures Raumes lesen und bearbeiten. Theoretisch könnte jemand Codes durchprobieren, aber 6 Zeichen aus 31 möglichen ergeben fast 1 Milliarde Kombinationen - praktisch unkrackbar. Wer dir den Code nicht kennt, sieht euren Plan nicht.

Wenn du das maximal absichern willst, kannst du in Supabase im SQL Editor eine Liste erlaubter Codes pflegen. Für einen JGA ist das aber Overkill.

## Bei Problemen

- **"Raum konnte nicht erstellt werden"**: SQL-Query in Supabase nicht ausgeführt? Schritt 1.5 wiederholen.
- **"… verbindet" bleibt dauerhaft**: Environment Variables in Vercel falsch geschrieben. Settings -> Environment Variables prüfen.
- **Build schlägt fehl in Vercel**: Im Build-Log prüfen welche Datei fehlt; eventuell wurde was nicht hochgeladen.
- **Realtime funktioniert nicht**: SQL `alter publication supabase_realtime add table jga_plans;` ausgeführt?

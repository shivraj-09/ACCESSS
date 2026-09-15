# RAAH

### A more accessible tomorrow.

> A community-powered accessibility intelligence platform that helps people understand barriers before they begin their journey.

<p align="center">
  <a href="https://raah-dev.vercel.app"><strong>Live Demo → raah-dev.vercel.app</strong></a>
</p>

---

## The Problem

People with disabilities often encounter accessibility barriers that are unknown, unreported, or difficult to understand before reaching a place. Blocked ramps, narrow pathways, steep entrances, and inaccessible entrances can turn an ordinary journey into an uncertain one.

**RAAH turns accessibility observations into useful, location-aware context before people travel.**

## What RAAH Does

RAAH combines community reporting, photo evidence, AI-assisted analysis, mapping, and route context into one web experience.

### Core features

- 📍 **Accessibility Map** — Explore confirmed community reports on an interactive map.
- 📸 **Barrier Reporting** — Submit a photo, location, barrier type, and description.
- 🤖 **AI Analysis** — Gemini analyzes uploaded evidence and suggests a barrier classification, severity, confidence, and explanation.
- ✅ **Human Confirmation** — AI is advisory; reports are published only after user confirmation and server-side validation.
- 🧭 **Accessible Route Context** — Compare walking routes using nearby reported accessibility conditions.
- 💬 **RAAH Assistant** — Ask accessibility questions and get map-aware assistance when location is available.
- 🔐 **Google Authentication** — Secure sign-in through Supabase Auth.
- 📱 **Responsive UX** — Designed for desktop and mobile with accessibility-focused interaction patterns.

## How It Works

```text
┌──────────────┐
│ Google Login │
└──────┬───────┘
       ↓
┌────────────────┐
│ Explore the Map│
└──────┬─────────┘
       ↓
┌─────────────────┐
│ Report a Barrier│
│ + photo + GPS   │
└──────┬──────────┘
       ↓
┌────────────────────┐
│ Gemini AI Analysis │
└────────┬───────────┘
         ↓
┌──────────────────────┐
│ User Reviews Result │
└────────┬─────────────┘
         ↓
┌────────────────────┐
│ Confirm & Publish   │
└────────┬────────────┘
         ↓
┌──────────────────────┐
│ Map + Route Context  │
└──────────────────────┘
```

## Architecture

```text
                    ┌─────────────────────┐
                    │      RAAH Web App   │
                    │ React + Vite +      │
                    │ Tailwind + Leaflet  │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ↓                 ↓                 ↓
      ┌─────────────┐   ┌──────────────┐  ┌──────────────┐
      │   Supabase  │   │ Edge Functions│  │ OpenStreetMap│
      │ Auth / DB / │   │ AI / Chat /   │  │ Walking Route│
      │ Storage     │   │ Report Flow   │  │ Context      │
      └─────────────┘   └───────┬──────┘  └──────────────┘
                                ↓
                         ┌──────────────┐
                         │ Gemini API   │
                         │ Vision + AI  │
                         └──────────────┘
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4 |
| Maps | Leaflet, React Leaflet |
| Icons | Lucide React |
| Routing | OpenStreetMap-based walking routing |
| Authentication | Supabase Auth + Google OAuth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Backend | Supabase Edge Functions |
| AI | Google Gemini |
| Hosting | Vercel |

## Accessibility First

RAAH is built around the same principle it promotes: accessibility should be considered from the beginning, not added as an afterthought.

The interface uses semantic HTML, keyboard-friendly controls, visible focus states, readable contrast, descriptive labels, large touch targets, responsive layouts, and reduced-motion support where appropriate.

## AI Safety & Trust

RAAH does **not** treat AI output as ground truth.

- AI classifications are advisory.
- Confidence is surfaced to the user.
- Uncertain results are not automatically published.
- Users review the AI assessment before confirmation.
- Published map reports represent community observations, not guaranteed real-world conditions.

## Barrier Types

RAAH currently supports:

1. Blocked Ramp
2. Narrow Pathway
3. Steep Entrance
4. Inaccessible Entrance
5. Missing Accessibility Facility
6. Accessible Entrance
7. Accessibility Uncertain

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- Google OAuth configured in Supabase Auth
- Gemini API access for AI analysis

### Installation

```bash
git clone https://github.com/shivraj-09/ACCESSS.git
cd ACCESSS
npm install
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

> Server-side secrets such as the Gemini API key must never be placed in the frontend environment or committed to GitHub.

## Project Structure

```text
src/
├── components/       # Map, reporting, routing and shared UI
├── lib/              # Supabase client and authentication context
├── pages/            # Login, Dashboard, Map, Report, Chat, Details
├── App.tsx           # Routing and application shell
└── index.css         # Global design system and motion

public/
└── RAAH brand assets
```

## Demo

**Live:** [raah-dev.vercel.app](https://raah-dev.vercel.app)

RAAH also includes judge-friendly demo access so the core product experience can be explored without requiring a personal Google account.

## Project Status

RAAH is an MVP focused on the complete accessibility reporting loop:

**Discover → Report → Analyze → Confirm → Map → Decide**

The project is intentionally focused on making accessibility information more visible, contextual, and actionable.

## Contributing

Contributions, ideas, accessibility feedback, and improvements are welcome. If you find an issue with the product or its accessibility, open a GitHub issue with enough context to reproduce it.

## License

This project does not currently declare an open-source license. All rights are reserved unless otherwise stated by the project owners.

---

<p align="center">
  <strong>RAAH</strong><br />
  <sub>A more accessible tomorrow.</sub>
</p>

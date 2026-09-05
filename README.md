# ResumeAI 🚀

ResumeAI is an AI-powered career assistant for students, freshers, and early-career professionals. It helps users build and improve resumes, analyze ATS-style compatibility, prepare for interviews, and plan the skills needed for their target roles.

## Features

- Resume Builder
- Resume Analyzer
- ATS-style resume scoring
- Keyword and skills matching
- Missing skills detection
- Resume improvement suggestions
- AI-powered bullet point rewriting
- Interview preparation
- Skill roadmap guidance
- Role-based resume templates
- Job Ready Meter
- Resume comparison
- Responsive desktop and mobile UI
- Google and email/password authentication through Supabase

---

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui and Radix UI components
- Supabase Auth and backend services
- TanStack React Query
- Recharts
- Vitest

---

## Project Structure

```text
resumeai-career-copilot/
├── public/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── integrations/
│   ├── pages/
│   └── ...
├── supabase/
│   ├── functions/
│   └── migrations/
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

---

## 1. Requirements

Before starting, install:

- Node.js 20 or newer
- npm
- Git (recommended)
- A Supabase project if you want to use the application's backend and authentication

Node.js 22 LTS is recommended.

---

## 2. Get the Project

Clone the repository:

```bash
git clone https://github.com/Munaz-new/resumeai-career-copilot.git
cd resumeai-career-copilot
```

Or download the repository as a ZIP from GitHub and open a terminal in the extracted project folder.

---

## 3. Configure Environment Variables

ResumeAI uses Vite environment variables for its Supabase connection.

### Create `.env`

Copy the safe example file:

```bash
cp .env.example .env
```

Then open `.env` with your preferred editor. For example, with Neovim:

```bash
nvim .env
```

The public template contains:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholders with values from **your own Supabase project**.

### Security

**Never commit `.env` to GitHub.**

`.env.example` is intentionally safe to commit because it contains placeholders rather than credentials.

Do not put any of the following in the frontend source code or GitHub repository:

- Supabase secret/service-role keys
- Google OAuth client secrets
- Private API keys
- Passwords
- Other server-side credentials

Supabase publishable/anonymous client credentials are intended for frontend use, but database access must still be protected with appropriate Supabase authentication and Row Level Security policies.

---

## 4. Install Dependencies

Run:

```bash
npm install
```

---

## 5. Configure Supabase

The repository contains Supabase migrations and Edge Function source under `supabase/`.

If you are using your own Supabase project, configure the project before using backend-dependent features.

### Supabase CLI

You can install the CLI as a development dependency:

```bash
npm install supabase --save-dev
```

Check it with:

```bash
npx supabase --help
```

### Authenticate with Supabase

```bash
npx supabase login
```

A browser window will open for authentication.

### Link a Supabase project

```bash
npx supabase link --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with the ID of the Supabase project you intend to use.

### Database migrations

Preview pending migrations:

```bash
npx supabase db push --dry-run
```

Apply migrations:

```bash
npx supabase db push
```

### Edge Functions

The project contains Edge Function source under:

```text
supabase/functions/
```

Deploy all functions:

```bash
npx supabase functions deploy
```

Or deploy one function:

```bash
npx supabase functions deploy FUNCTION_NAME
```

Some functions may require server-side secrets. Configure those secrets in Supabase rather than placing private keys in the frontend environment.

---

## 6. Authentication

ResumeAI uses Supabase Auth.

The application supports:

- Email/password authentication
- Google OAuth authentication
- Persistent browser sessions

Google OAuth requires configuration in both Supabase Auth and Google Cloud. The Google OAuth redirect URI must point to the Supabase Auth callback for the project, while the application's redirect URL must be allowed by the Supabase Auth redirect URL configuration.

For local development, use the local application origin. For production, use the deployed application origin.

Do not publish Google OAuth client secrets in this repository.

---

## 7. Start ResumeAI Locally

Start the development server:

```bash
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:8080/
```

Open the displayed local URL in your browser.

---

## 8. Production Deployment

ResumeAI can be deployed as a Vite application on Vercel or another compatible hosting platform.

Configure these environment variables in the hosting platform:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Do not commit production environment values to GitHub.

The repository includes `vercel.json` to support client-side React Router routes when deployed to Vercel.

---

## 9. Application Routes

The current application includes these main routes:

| Route | Purpose |
|---|---|
| `/` | ResumeAI home page |
| `/builder` | Resume builder |
| `/analyzer` | Resume analyzer |
| `/analysis` | Analysis view |
| `/skills` | Skills guidance |
| `/suggestions` | Resume improvement suggestions |
| `/interview` | Interview preparation |
| `/compare` | Resume comparison |
| `/roadmap` | Career/skill roadmap |
| `/profile` | User profile |
| `/auth` | Authentication |

---

## 10. Troubleshooting

### Blank white page

Check that `.env` exists:

```bash
ls -la .env
```

Verify that the Supabase environment variables are configured correctly, then restart the development server:

```text
Ctrl + C
```

```bash
npm run dev
```

Also check the browser Developer Tools console for JavaScript or configuration errors.

### Authentication problems

Check:

1. `VITE_SUPABASE_URL` points to the intended Supabase project.
2. `VITE_SUPABASE_PUBLISHABLE_KEY` belongs to the same project.
3. Supabase Auth providers are configured correctly.
4. Google OAuth redirect settings match the deployed/local application origin.
5. The deployment was rebuilt after changing Vercel environment variables.

### Direct route returns 404 on Vercel

Make sure the deployment includes the repository's `vercel.json` SPA rewrite configuration and that the latest commit has been deployed.

---

## 11. Useful Commands

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Run tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Supabase CLI help

```bash
npx supabase --help
```

### List migrations

```bash
npx supabase migration list
```

### Preview database changes

```bash
npx supabase db push --dry-run
```

### Apply database migrations

```bash
npx supabase db push
```

### Deploy Edge Functions

```bash
npx supabase functions deploy
```

---

## Contributing

Contributions, improvements, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the project locally.
5. Open a pull request.

---

## License

This project is licensed under the MIT License.

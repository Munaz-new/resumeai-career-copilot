# ResumeAI 🚀

ResumeAI is an AI-powered career assistant designed to help students, freshers, and early-career professionals improve their resumes and prepare for the job market.

## Features

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
- Responsive desktop and mobile UI

---

## 1. Download the Project

You can either download the repository as a ZIP file or clone it using Git.

### Using Git

```bash
git clone https://github.com/Munaz-new/resumeai-career-copilot.git
cd resumeai-career-copilot
```

### Using ZIP

On the GitHub repository page, select **Code → Download ZIP** and extract the project on your computer.

Then open a terminal inside the extracted project folder.

---

## 2. Requirements

Before starting, install:

- Node.js 20 or newer
- npm
- Git (recommended)
- A Supabase account/project

Node.js 22 LTS is recommended.

---

## 3. Create Your Local `.env` File

### What is `.env`?

`.env` is a local configuration file used by ResumeAI to connect to the required services.

The `.env` file is **not included in this GitHub repository** because it contains environment-specific configuration.

Instead, ResumeAI provides:

```text
.env.example
```

This is a safe template that shows which environment variables are required.

### Step 1: Create `.env`

Make sure you are inside the ResumeAI project folder:

```bash
cd resumeai-career-copilot
```

Create your local `.env` file:

```bash
cp .env.example .env
```

### Step 2: Open `.env`

With VS Code:

```bash
code .env
```

Or with Neovim:

```bash
nvim .env
```

### Step 3: Configure Your Supabase Project

ResumeAI uses Supabase for authentication, database services, and backend functionality.

Create your own Supabase project and add the required values shown in `.env.example`.

Your `.env` may contain variables similar to:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

Replace the placeholder values with the values from **your own Supabase project**.

> Do not use another developer's private credentials.

### Step 4: Save `.env`

Your project should now contain:

```text
resumeai-career-copilot/
├── .env
├── .env.example
├── src/
├── public/
├── supabase/
└── package.json
```

### 🔐 Important Security Rule

**Never commit your `.env` file to GitHub.**

The `.env` file is for your local computer.

The `.env.example` file is the public template.

Safe to commit:

```text
.env.example
```

Keep private:

```text
.env
```

---

## 4. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

---

## 5. Configure the Supabase Backend

ResumeAI includes Supabase configuration and database migration files in the `supabase/` directory.

If you want to run your own complete backend, you will need your own Supabase project.

### Install the Supabase CLI

You can install the CLI as a project dependency:

```bash
npm install supabase --save-dev
```

Then verify it:

```bash
npx supabase --help
```

### Log in to Supabase

```bash
npx supabase login
```

A browser window will open so you can authenticate with your Supabase account.

### Link Your Supabase Project

Use your own Supabase project ID:

```bash
npx supabase link --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

### Apply Database Migrations

ResumeAI includes database migration files in:

```text
supabase/migrations/
```

After linking your Supabase project, preview or apply the pending migrations:

```bash
npx supabase db push --dry-run
```

```bash
npx supabase db push
```

### Deploy Edge Functions

ResumeAI also contains backend Edge Function source under:

```text
supabase/functions/
```

Deploy the required functions with:

```bash
npx supabase functions deploy
```

Or deploy a specific function:

```bash
npx supabase functions deploy FUNCTION_NAME
```

Replace `FUNCTION_NAME` with the actual function directory name used by your project.

> Some Edge Functions may require server-side secrets. Configure those secrets in Supabase rather than placing private API keys in the frontend `.env` file.

For more information, see the [Supabase CLI documentation](https://supabase.com/docs/guides/cli).

---

## 6. Start ResumeAI

After configuring your environment and Supabase project, start the development server:

```bash
npm run dev
```

The terminal will display a local address similar to:

```text
Local: http://localhost:8080/
```

Open that address in your browser.

ResumeAI should now be running locally.

---

## 7. If You See a Blank White Page

If the development server starts but the browser displays a blank page, check the following:

### Check 1: Make sure `.env` exists

```bash
ls -la .env
```

### Check 2: Verify your environment variables

Make sure the required values in `.env` are configured correctly.

### Check 3: Restart the development server

Stop the server:

```text
Ctrl + C
```

Then start it again:

```bash
npm run dev
```

### Check 4: Check the browser console

Open your browser Developer Tools and check the **Console** for JavaScript or configuration errors.

### Check 5: Check Supabase configuration

Make sure your Supabase project is correctly configured and that the required database migrations and Edge Functions have been deployed.

---

## 8. Useful Commands

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

### Install dependencies

```bash
npm install
```

### Check Supabase CLI

```bash
npx supabase --help
```

### Check database migrations

```bash
npx supabase migration list
```

### Preview database changes

```bash
npx supabase db push --dry-run
```

### Deploy database migrations

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

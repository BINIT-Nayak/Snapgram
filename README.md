# Snapgram

Snapgram is a social media web app built with React, TypeScript, Appwrite, React Query, React Hook Form, Zod, and Tailwind CSS.

The app supports authentication, creating and editing posts, image uploads, feed browsing, profile pages, likes, saves, search, and responsive navigation.

## Tech Stack

- React 18
- TypeScript
- Vite
- Appwrite
- TanStack React Query
- React Router
- React Hook Form
- Zod
- Tailwind CSS
- Radix UI primitives

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_APPWRITE_URL='https://cloud.appwrite.io/v1'
VITE_APPWRITE_PROJECT_ID=''
VITE_APPWRITE_DATABASE_ID=''
VITE_APPWRITE_STORAGE_ID=''
VITE_APPWRITE_USER_COLLECTION_ID=''
VITE_APPWRITE_POST_COLLECTION_ID=''
VITE_APPWRITE_SAVES_COLLECTION_ID=''
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

## Appwrite Setup

In Appwrite, create:

- One project
- One database
- One storage bucket
- Three collections: users, posts, saves

Add a Web platform for local development:

```text
localhost
127.0.0.1
```

Enable Email/Password auth in Appwrite Auth settings.

### Required Collections

Users collection:

```text
accountId   string
name        string
username    string
email       string
imageUrl    string
imageId     string, optional
bio         string
followers   string array, optional
following   string array, optional
posts       relationship to posts
save        relationship to saves
```

Posts collection:

```text
creator     relationship to users, or string user document ID
caption     string
imageUrl    string
imageId     string
location    string
tags        string array
likes       relationship/string array depending on schema
```

Saves collection:

```text
user        relationship to users
post        relationship to posts
```

### Permissions

For local development, collections and storage should allow authenticated users to read and write:

```text
read("users")
create("users")
update("users")
delete("users")
```

For public image rendering, uploaded files are created with:

```text
read("any")
```

The app uses Appwrite file `view` URLs instead of `preview` URLs because previews can be blocked by image transformation settings.

## Project Structure

```text
src/
  _auth/                 Auth layout and auth forms
  _root/                 Main app layout and protected pages
  components/
    forms/               App-specific forms
    shared/              Reusable app components
    ui/                  Low-level UI primitives
  context/               Auth context
  hooks/                 Shared React hooks
  lib/
    appwrite/            Appwrite domain API modules
    react-query/         Query hooks, keys, invalidation helpers
    validation/          Zod schemas
  types/                 Form, navigation, and Appwrite document types
```

## Appwrite API Modules

The Appwrite integration is split by domain:

```text
src/lib/appwrite/auth.ts
src/lib/appwrite/posts.ts
src/lib/appwrite/users.ts
src/lib/appwrite/saves.ts
src/lib/appwrite/storage.ts
src/lib/appwrite/config.ts
src/lib/appwrite/utils.ts
```

`src/lib/appwrite/api.ts` re-exports these modules so existing imports can use one stable path.

## UI Primitives

`src/components/ui` contains low-level components such as `Button`, `Input`, `Textarea`, `Label`, `Tabs`, form wrappers, and toast primitives.

Toast is split into:

- `toast.tsx`: visual Radix toast components
- `use-toast.ts`: toast store and hook
- `toaster.tsx`: renderer mounted once in `App.tsx`

See `src/components/ui/README.md` for details.

## Quality Checks

Before pushing changes, run:

```bash
npm run build
npm run lint
```

Both commands should pass.

The build may show a Browserslist `caniuse-lite is outdated` warning. That is maintenance noise, not an app failure.

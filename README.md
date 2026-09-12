# Snapgram

Snapgram is a social media web app built with React, TypeScript, Appwrite, React Query, React Hook Form, Zod, and Tailwind CSS.

The app supports authentication, creating and editing posts, image uploads, feed browsing, profile pages, likes, saves, search, and responsive navigation.

LIVE: https://snapgram-two-kappa.vercel.app/

## Tech Stack

- React 18
- TypeScript
- Vite
- Appwrite
- TanStack React Query
- TanStack Virtual
- React Router
- React Hook Form
- Zod
- Tailwind CSS
- Radix UI primitives
- Vitest
- React Testing Library
- MSW
- Playwright

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
# Optional while migrating. Required for like/follow relationship writes.
VITE_APPWRITE_LIKES_COLLECTION_ID=''
VITE_APPWRITE_FOLLOWS_COLLECTION_ID=''
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

Run unit and integration tests:

```bash
npm run test
```

Run the Playwright E2E suite:

```bash
npm run test:e2e
```

Run the main quality gate:

```bash
npm run test:all
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
- Five collections: users, posts, saves, likes, follows

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
likeCount   integer, required, default 0
```

Post indexes:

```text
posts_likeCount_index   key on likeCount
```

Existing posts should be backfilled with `likeCount: 0`, then optionally updated to the real count from the `likes` collection.

For production-grade permissions, update `likeCount` from an Appwrite Function triggered by like create/delete events. The client does a best-effort reconciliation, but the backend should own denormalized counters if post documents are owner-write-only.

Saves collection:

```text
user        relationship to users
post        relationship to posts
```

Likes collection:

```text
userId      string
postId      string
createdAt   provided by Appwrite as $createdAt
```

Follows collection:

```text
followerId   string
followingId  string
createdAt    provided by Appwrite as $createdAt
```

Likes and follows use one document per relationship instead of read-modify-writing arrays on posts or users. Configure Appwrite permissions so authenticated users can create/delete their own relationship documents, and keep each `(userId, postId)` like and `(followerId, followingId)` follow unique. The client also uses deterministic document IDs so repeated actions are idempotent.

If these two collection IDs are missing or still placeholders, Snapgram will still load feeds/profiles with empty like/follow counts. Like and follow writes require the real collection IDs.

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

## Design Docs

- [High-Level Design](./docs/HLD.md)
- [Low-Level Design](./docs/LLD.md)

## Feed Performance

Snapgram treats feed performance as a core frontend feature:

- Cursor-based fetching keeps network payloads bounded.
- TanStack Virtual keeps the home feed DOM bounded as users scroll.
- Post images use lazy loading, async decoding, reserved dimensions, skeleton loading, blur-up transitions, responsive `sizes`, and high fetch priority for the first visible image.
- Feed, detail, profile, search, and saved-post surfaces share the same optimized image component.

## Testing

Snapgram includes unit, integration, and E2E coverage for critical user flows:

- Vitest and React Testing Library cover validation, auth guards, post cards, file upload, follow controls, optimized images, and debounce behavior.
- Integration tests verify React Query optimistic cache updates for likes/saves with rollback on API failure.
- The create-post integration test covers image selection, form submission, mutation payloads, cache invalidation, and redirect behavior.
- MSW is configured for browser-level request mocking in integration tests.
- Playwright covers the real user journey: login, create post, like, save, and logout. It is skipped until `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are provided.

## Appwrite API Modules

The Appwrite integration is split by domain:

```text
src/lib/appwrite/auth.ts
src/lib/appwrite/posts.ts
src/lib/appwrite/users.ts
src/lib/appwrite/saves.ts
src/lib/appwrite/relationships.ts
src/lib/appwrite/search.ts
src/lib/appwrite/storage.ts
src/lib/appwrite/config.ts
src/lib/appwrite/utils.ts
```

`src/lib/appwrite/api.ts` re-exports these modules so existing imports can use one stable path.

## Search

Explore search is URL-backed and shareable:

```text
/explore?q=react&type=posts
```

Supported result groups:

- Posts
- People
- Tags
- Locations

Search uses debouncing, React Query caching, recent searches, tab state in the URL, empty states, and keyboard shortcuts for Escape and ArrowDown.

Required Appwrite full-text indexes:

```text
posts.caption
posts.location
posts.searchableTags
users.name
users.username
```

## UI Primitives

`src/components/ui` contains low-level components such as `Button`, `Input`, `Textarea`, `Label`, `Tabs`, form wrappers, and toast primitives.

Toast is split into:

- `toast.tsx`: visual Radix toast components
- `use-toast.ts`: toast store and hook
- `toaster.tsx`: renderer mounted once in `App.tsx`

See `src/components/ui/README.md` for details.

## Images
<img width="500" height="500" alt="Screenshot 2026-06-04 at 8 03 51 PM" src="https://github.com/user-attachments/assets/de90f2e1-11cb-488c-8611-7d9226bc239f" />
<img width="506" height="500" alt="Screenshot 2026-06-04 at 8 05 40 PM" src="https://github.com/user-attachments/assets/9db5fdf5-be3f-4e52-b589-affe58d5432f" />
<img width="500" height="500" alt="Screenshot 2026-06-04 at 8 06 11 PM" src="https://github.com/user-attachments/assets/eb6906f5-45d4-4a03-be06-31873d8b9c32" />
<img width="500" height="500" alt="Screenshot 2026-06-04 at 8 06 41 PM" src="https://github.com/user-attachments/assets/bf9e87e9-f10f-4743-874a-ba9580fc519f" />
<img width="500" height="500" alt="Screenshot 2026-06-04 at 8 07 08 PM" src="https://github.com/user-attachments/assets/284df66f-3181-4a8a-bf4f-4cd982e088ba" />


## Quality Checks

Before pushing changes, run:

```bash
npm run build
npm run lint
```

Both commands should pass.

The build may show a Browserslist `caniuse-lite is outdated` warning. That is maintenance noise, not an app failure.

# Snapgram High-Level Design

## 1. Purpose

Snapgram is a web-based social media application where authenticated users can create image posts, browse feeds, search posts, like and save content, follow other users, and manage their profile.

The application is a single-page React app backed by Appwrite for authentication, database storage, and file storage.

## 2. Goals

- Provide email/password authentication.
- Maintain a protected social feed for signed-in users.
- Support image upload and rendering through Appwrite Storage.
- Support post creation, editing, deletion, likes, saves, and search.
- Support user profiles, profile updates, followers, and following.
- Keep the UI responsive across desktop and mobile layouts.
- Keep feed network usage, image loading, layout shift, and mounted DOM nodes bounded.
- Keep server state fresh using React Query cache invalidation.

## 3. Non-Goals

- Real-time chat or comments.
- Server-side rendering.
- A custom backend server.
- Advanced recommendation ranking.
- Payment, moderation, or admin workflows.

## 4. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router |
| Server-state cache | TanStack React Query |
| Feed virtualization | TanStack Virtual |
| Forms | React Hook Form |
| Validation | Zod |
| Styling | Tailwind CSS |
| UI primitives | Radix UI primitives |
| Backend platform | Appwrite |
| Auth | Appwrite Account email/password sessions |
| Database | Appwrite Databases |
| File storage | Appwrite Storage |
| Deployment target | Vercel-compatible static build |

## 5. System Context

```mermaid
flowchart LR
  User[User Browser]
  SPA[Snapgram React SPA]
  Appwrite[Appwrite Cloud]
  Auth[Appwrite Account]
  DB[Appwrite Database]
  Storage[Appwrite Storage]

  User --> SPA
  SPA --> Auth
  SPA --> DB
  SPA --> Storage
  Appwrite --> Auth
  Appwrite --> DB
  Appwrite --> Storage
```

The browser runs the Snapgram SPA. All persistent operations are performed directly against Appwrite SDK clients from the frontend.

## 6. Application Architecture

```mermaid
flowchart TD
  Main[src/main.tsx]
  Router[BrowserRouter]
  QueryProvider[QueryProvider]
  AuthProvider[AuthProvider]
  App[App Routes]
  AuthLayout[AuthLayout]
  RootLayout[RootLayout]
  Pages[Pages]
  Shared[Shared Components]
  Hooks[React Query Hooks]
  AppwriteApi[Appwrite API Modules]
  Appwrite[(Appwrite)]

  Main --> Router
  Router --> QueryProvider
  QueryProvider --> AuthProvider
  AuthProvider --> App
  App --> AuthLayout
  App --> RootLayout
  RootLayout --> Pages
  Pages --> Shared
  Pages --> Hooks
  Shared --> Hooks
  Hooks --> AppwriteApi
  AppwriteApi --> Appwrite
```

### Major Frontend Areas

| Area | Responsibility |
| --- | --- |
| `src/main.tsx` | Mounts React, router, React Query provider, and auth provider. |
| `src/App.tsx` | Defines public auth routes and protected app routes. |
| `src/context/AuthContext.tsx` | Stores current authenticated user and checks Appwrite session state. |
| `src/_auth` | Sign-in/sign-up layout and forms. |
| `src/_root` | Protected layout and app pages. |
| `src/components/shared` | App-specific reusable UI such as post cards, nav, uploaders, follow buttons. |
| `src/components/ui` | Low-level UI primitives. |
| `src/lib/react-query` | Query and mutation hooks plus cache invalidation helpers. |
| `src/lib/appwrite` | Domain API wrappers around Appwrite SDK. |
| `src/lib/validation` | Zod validation schemas. |
| `src/types` | Form types, Appwrite document types, navigation types. |

## 7. Route Architecture

```mermaid
flowchart TD
  App[App]
  AuthLayout[AuthLayout]
  RootLayout[RootLayout]

  App --> AuthLayout
  AuthLayout --> SignIn[/sign-in/]
  AuthLayout --> SignUp[/sign-up/]

  App --> RootLayout
  RootLayout --> Home[/ /]
  RootLayout --> Explore[/explore/]
  RootLayout --> Saved[/saved/]
  RootLayout --> AllUsers[/all-users/]
  RootLayout --> CreatePost[/create-post/]
  RootLayout --> EditPost[/update-post/:id/]
  RootLayout --> PostDetails[/posts/:id/]
  RootLayout --> Profile[/profile/:id/*/]
  RootLayout --> UpdateProfile[/update-profile/:id/]
```

`AuthLayout` is used for unauthenticated pages. If the user is already authenticated, it redirects to `/`.

`RootLayout` protects all main application pages. It waits for auth loading, redirects unauthenticated users to `/sign-in`, and renders the desktop/mobile navigation around the active page.

## 8. Data Model

```mermaid
erDiagram
  USER {
    string accountId
    string name
    string username
    string email
    string imageUrl
    string imageId
    string bio
    string_array followers
    string_array following
  }

  POST {
    string creator
    string caption
    string imageUrl
    string imageId
    string location
    string_array tags
    relationship_array likes
  }

  SAVE {
    relationship user
    relationship post
  }

  USER ||--o{ POST : creates
  USER ||--o{ SAVE : owns
  POST ||--o{ SAVE : saved_as
  USER }o--o{ POST : likes
```

### Collections

| Collection | Purpose |
| --- | --- |
| Users | Stores app profile data linked to Appwrite Auth via `accountId`. |
| Posts | Stores post content and image metadata. |
| Saves | Stores user-to-post saved records. |

### Storage

Appwrite Storage stores post images and profile photos. Documents keep both:

- `imageId`: Appwrite storage file ID.
- `imageUrl`: file view URL used by the UI.

## 9. Authentication Flow

```mermaid
sequenceDiagram
  participant User
  participant UI as Signup/Signin Form
  participant AuthContext
  participant Account as Appwrite Account
  participant DB as Appwrite Database

  User->>UI: Submit credentials
  alt Signup
    UI->>Account: Create account
    Account-->>UI: accountId
    UI->>DB: Create user document
    DB-->>UI: user document
    UI->>Account: Create email session
  else Signin
    UI->>Account: Create email session
  end
  UI->>AuthContext: checkAuthUser()
  AuthContext->>Account: Get current account
  AuthContext->>DB: Find user by accountId
  DB-->>AuthContext: User document
  AuthContext-->>UI: authenticated
  UI->>User: Navigate to home
```

Important design choice: the application uses the Appwrite user document ID as `user.id` in frontend state, not the Appwrite Account ID. Appwrite Account ID is stored as `accountId` inside the user document.

## 10. Core User Flows

### Create Post

```mermaid
sequenceDiagram
  participant User
  participant Form as PostForm
  participant Storage
  participant DB as Posts Collection
  participant RQ as React Query

  User->>Form: Select image and submit post
  Form->>Form: Validate caption/location/tags
  Form->>Storage: Upload file
  Storage-->>Form: fileId
  Form->>Storage: Build file view URL
  Form->>DB: Create post document
  DB-->>Form: Created post
  Form->>RQ: Invalidate post lists and user posts
  Form->>User: Navigate home
```

### Like Post

```mermaid
sequenceDiagram
  participant User
  participant Stats as PostStats
  participant DB as Posts Collection
  participant RQ as React Query

  User->>Stats: Click like
  Stats->>RQ: Snapshot affected query caches
  Stats->>RQ: Optimistically update cached post likes
  Stats->>DB: Update post.likes array
  alt Success
    Stats->>RQ: Invalidate post detail, lists, current user
  else Error
    Stats->>RQ: Restore previous query snapshots
  end
```

### Save Post

```mermaid
sequenceDiagram
  participant User
  participant Stats as PostStats
  participant DB as Saves Collection
  participant RQ as React Query

  User->>Stats: Click save
  alt Not saved
    Stats->>DB: Create save document
  else Already saved
    Stats->>DB: Delete save document
  end
  DB-->>Stats: Result
  Stats->>RQ: Invalidate post lists, current user, saved posts
```

### Follow User

```mermaid
sequenceDiagram
  participant User
  participant Button as FollowButton
  participant Users as Users Collection
  participant RQ as React Query

  User->>Button: Click follow/unfollow
  Button->>Button: Optimistically toggle state
  Button->>Users: Fetch current and target users
  Users->>Users: Update current.following
  Users->>Users: Update target.followers
  Users-->>Button: Result
  Button->>RQ: Invalidate current user, users, both profiles
```

## 11. Flow Charts

### End-To-End User Journey

```mermaid
flowchart TD
  Visit[User opens Snapgram]
  SessionCheck{Valid Appwrite session?}
  SignIn[Sign in]
  SignUp[Sign up]
  Home[Home feed]
  Explore[Explore posts]
  Create[Create post]
  Details[Post details]
  Profile[Profile page]
  Saved[Saved posts]
  People[All users]
  Logout[Logout]

  Visit --> SessionCheck
  SessionCheck -->|No| SignIn
  SessionCheck -->|No account| SignUp
  SignIn --> Home
  SignUp --> Home
  SessionCheck -->|Yes| Home
  Home --> Explore
  Home --> Create
  Home --> Details
  Home --> Profile
  Explore --> Details
  Details --> Saved
  Profile --> People
  People --> Profile
  Home --> Logout
  Logout --> SignIn
```

### Protected Routing Flow

```mermaid
flowchart TD
  RouteRequest[User requests protected route]
  AuthLoading{Auth check loading?}
  ShowLoader[Show full-page loader]
  Authenticated{Authenticated?}
  Redirect[Redirect to sign-in]
  RenderLayout[Render RootLayout]
  RenderNav[Render topbar, sidebar, bottombar]
  RenderPage[Render requested page]

  RouteRequest --> AuthLoading
  AuthLoading -->|Yes| ShowLoader
  AuthLoading -->|No| Authenticated
  Authenticated -->|No| Redirect
  Authenticated -->|Yes| RenderLayout
  RenderLayout --> RenderNav
  RenderLayout --> RenderPage
```

### Post Lifecycle Flow

```mermaid
flowchart TD
  Draft[User fills PostForm]
  Validate{Valid form?}
  ToastValidation[Show validation messages]
  Upload[Upload image to Appwrite Storage]
  Url{File view URL created?}
  CleanupUpload[Delete uploaded file]
  CreateDoc[Create or update post document]
  Success{Document saved?}
  CleanupNew[Delete new uploaded file if needed]
  DeleteOld[Delete old image on replacement]
  Invalidate[Invalidate React Query caches]
  Navigate[Navigate to feed or post details]

  Draft --> Validate
  Validate -->|No| ToastValidation
  Validate -->|Yes| Upload
  Upload --> Url
  Url -->|No| CleanupUpload
  Url -->|Yes| CreateDoc
  CreateDoc --> Success
  Success -->|No| CleanupNew
  Success -->|Yes| DeleteOld
  DeleteOld --> Invalidate
  Invalidate --> Navigate
```

### Browse And Discovery Flow

```mermaid
flowchart TD
  Home[Home page]
  Recent[Fetch 20 recent posts]
  Creators[Fetch top 10 users]
  Explore[Explore page]
  Infinite[Fetch paginated posts]
  SearchInput{Search typed?}
  Debounce[Wait 500ms debounce]
  Search[Run Appwrite caption search]
  SearchOk{Search succeeds?}
  Fallback[Fetch latest 50 and filter locally]
  Sort[Sort loaded posts by active filter]
  Grid[Render grid/list]

  Home --> Recent
  Home --> Creators
  Recent --> Grid
  Creators --> Grid
  Explore --> Infinite
  Explore --> SearchInput
  SearchInput -->|No| Sort
  SearchInput -->|Yes| Debounce
  Debounce --> Search
  Search --> SearchOk
  SearchOk -->|Yes| Grid
  SearchOk -->|No| Fallback
  Fallback --> Grid
  Infinite --> Sort
  Sort --> Grid
```

## 12. Page Responsibilities

| Page | Responsibility |
| --- | --- |
| Home | Shows recent posts and a top creator list. |
| Explore | Shows paginated posts, client-side sorting, and debounced search. |
| CreatePost | Hosts `PostForm` in create mode. |
| EditPost | Fetches a post and hosts `PostForm` in update mode. |
| PostDetails | Shows one post, owner-only edit/delete controls, stats, and related posts. |
| Saved | Shows the current user's saved posts. |
| Profile | Shows user details, stats, posts, own liked-posts tab, and follow controls. |
| UpdateProfile | Updates display name, bio, and profile image. |
| AllUsers | Shows all users with follow controls. |

## 13. Caching Strategy

React Query is the app's server-state manager.

Reads are keyed by query keys such as:

- `GET_CURRENT_USER`
- `GET_USERS`
- `GET_RECENT_POSTS`
- `GET_INFINITE_POSTS`
- `GET_POST_BY_ID`
- `GET_USER_POSTS`
- `GET_SAVED_POSTS`
- `SEARCH_POSTS`

Mutations invalidate related queries after success. This keeps feeds, profiles, saved posts, and current user relationships reasonably fresh without manual prop drilling.

## 14. Feed Performance Strategy

```mermaid
flowchart TD
  InfiniteQuery[React Query cursor pagination]
  Pages[Loaded pages]
  Flatten[Flattened post list]
  Virtualizer[TanStack Virtual home feed]
  Mounted[Only visible post cards mounted]
  Image[PerformanceImage]
  Lazy[Lazy loading and async decoding]
  Reserve[Reserved image dimensions prevent CLS]
  Priority[First visible image gets high priority]
  Reconcile[React Query cache reconciliation]

  InfiniteQuery --> Pages
  Pages --> Flatten
  Flatten --> Virtualizer
  Virtualizer --> Mounted
  Mounted --> Image
  Image --> Lazy
  Image --> Reserve
  Image --> Priority
  Mounted --> Reconcile
```

The home feed combines server pagination with DOM virtualization. Image-heavy surfaces use a shared `PerformanceImage` component that reserves layout space, shows a skeleton and blur-up transition while loading, uses native lazy loading for non-priority images, and marks the first visible feed/detail image as high priority.

## 15. Security Model

- Auth is delegated to Appwrite Account sessions.
- Protected routes rely on `AuthContext` and Appwrite session checks.
- Database and storage permissions must be configured in Appwrite.
- Uploaded files are created with public read permission so images can render.
- Owner-only edit/delete controls are hidden in the UI.

Important: UI hiding is not a complete security boundary. Appwrite collection permissions must prevent unauthorized document updates/deletes.

## 16. Deployment View

```mermaid
flowchart LR
  Dev[Developer]
  Build[npm run build]
  Static[Static dist assets]
  Vercel[Vercel or static host]
  Browser[User Browser]
  Appwrite[Appwrite Cloud]

  Dev --> Build
  Build --> Static
  Static --> Vercel
  Browser --> Vercel
  Browser --> Appwrite
```

The app builds to static assets through Vite. Runtime backend calls go directly from the browser to Appwrite using environment-injected project and collection IDs.

## 17. High-Level Risks And Tradeoffs

- The frontend talks directly to Appwrite, so permissions must be precise.
- Likes and follows are stored as arrays, which is simple but can suffer race conditions when multiple users update the same document concurrently.
- Saved posts use separate documents, which is cleaner, but `getSavedPosts` fetches each saved post individually.
- Search depends on Appwrite full-text search on `caption`; fallback search only scans the latest 50 posts.
- Auth state depends partly on Appwrite's `cookieFallback` localStorage behavior before calling `getCurrentUser`.
- Public file read permissions make image rendering simple but may not fit private-media requirements.
- Home feed virtualization uses estimated row heights and runtime measurement; large caption/image variations should be checked for scroll smoothness.

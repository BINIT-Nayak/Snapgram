# UI primitives

This folder contains low-level reusable UI building blocks. Feature-specific
components should live in `components/shared`, `components/forms`, or a page
folder instead.

- `button.tsx`: shared button styles and variants.
- `form.tsx`: React Hook Form wrappers for form field layout and messages.
- `input.tsx`: styled text input.
- `label.tsx`: Radix label primitive used by forms.
- `textarea.tsx`: styled multiline input.
- `tabs.tsx`: Radix tabs primitive for tabbed interfaces.

Toast files are split because the toast system has three separate concerns:

- `toast.tsx`: visual Radix toast primitives.
- `use-toast.ts`: toast store, hook, and imperative `toast()` API.
- `toaster.tsx`: renderer mounted once in `App.tsx`.

Import from `components/ui` for common primitives. Import toast internals
directly only when wiring the toast system itself.

# Email Package

This package manages the email templates for the ETL Marketplace project using [React Email](https://react.email/). It allows for developing, previewing, and exporting HTML email templates.

## Tech Stack

- **Framework**: React Email
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Installation

```bash
bun install
```

### Development Server

To start the local preview server:

```bash
bun run dev
```

This will open the preview at [http://localhost:3000](http://localhost:3000).

## Project Structure

- **`emails/notification-templates`**: Contains the individual email templates. Each folder corresponds to a notification type.
- **`emails/components`**: Reusable components like `Layout.tsx`, `Header.tsx`, `Footer.tsx`.
- **`emails/styles`**: Shared styles and Tailwind configuration.

## Creating a New Template

1. Create a new folder in `emails/notification-templates`.
2. Create an `index.tsx` file.
3. Use the `Layout` component to ensure consistent styling.

```tsx
import { Layout } from '../../components/Layout';
import { Button, Text } from '@react-email/components';

export default function MyNewTemplate() {
    return (
        <Layout>
            <Text>Hello!</Text>
            <Button href="https://example.com">
                Click me
            </Button>
        </Layout>
    );
}
```

## Scripts

- **`bun run dev`**: Start the preview server.
- **`bun run export`**: Export templates to HTML (used by the ETL process).
- **`bun run build`**: Build the text package.

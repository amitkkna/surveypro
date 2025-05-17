# Survey Portal

A web-based survey portal for creating, managing, and collecting responses to questionnaires.

## Features

- Admin dashboard for survey management
- Create and edit surveys with multiple question types
- View survey responses
- Generate QR codes for survey distribution
- User-friendly survey form with section navigation
- Email and contact information collection

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase (Authentication and Database)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/amitkkna/surveypro.git
   ```

2. Navigate to the project directory:
   ```
   cd surveypro
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

To build the project for production:

```
npm run build
```

Then, you can start the production server:

```
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

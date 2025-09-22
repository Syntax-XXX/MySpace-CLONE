# MySpace Clone

Welcome to the MySpace clone project! This application replicates the classic 2005-era MySpace design and layout, providing users with a nostalgic social networking experience.

## Features

- **User Authentication**: Users can sign up and log in using email and password. OAuth authentication is also supported.
- **Profile Customization**: Users can edit their profiles, including their bio, profile picture, and background color.
- **Friend Management**: Users can send and accept friend requests, and view their friends in a grid layout.
- **Posts and Comments**: Users can create posts, comment on them, and like them.
- **Real-time Updates**: New posts and comments are updated in real-time using Supabase subscriptions.
- **Music Player**: An optional embedded music player allows users to share their favorite tracks.
- **Theme Toggle**: Users can switch between classic and modern themes for a personalized experience.

## Tech Stack

- **Frontend**: React (or Next.js) with TailwindCSS for styling.
- **Backend**: Supabase for authentication and data storage.
- **Database**: PostgreSQL managed by Supabase.

## Project Structure

```
myspace
├── src
│   ├── app
│   ├── components
│   ├── pages
│   ├── lib
│   ├── hooks
│   ├── styles
│   ├── types
│   └── utils
├── supabase
│   ├── migrations
│   ├── seed
│   └── storage
├── scripts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd myspace
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env` and fill in your Supabase credentials.

4. **Run the application**:
   ```
   npm run dev
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`.

## Database Setup

To initialize the database, run the SQL commands in `supabase/migrations/001_init_tables.sql`. You can also seed the database with initial data using the script in `scripts/seed.ts`.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
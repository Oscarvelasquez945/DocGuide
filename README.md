# DocGuide

DocGuide is a React Native / Expo application for connecting patients and doctors with a guided experience powered by Supabase.

## Requirements

- Node.js 18+
- npm
- Expo Go app on your phone, or an Android/iOS emulator

## Local setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Oscarvelasquez945/DocGuide.git
   cd DocGuide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   copy .env.example .env
   ```
   Then fill in your Supabase values:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
   ```

4. Start the app:
   ```bash
   npm start
   ```

   Useful alternatives:
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Notes

- The file `.env` is gitignored and should never be committed.
- If you are using your own Supabase project, make sure the database schema and tables are created from the SQL files under the `supabase/migrations` folder.

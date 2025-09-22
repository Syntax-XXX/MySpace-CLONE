module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-storage-url.com'], // Replace with your Supabase storage URL
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};
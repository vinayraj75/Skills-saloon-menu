/** Next.js config — Skills Saloon */
const supabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? (() => {
        try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname; }
        catch { return ''; }
      })()
    : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
};

module.exports = nextConfig;

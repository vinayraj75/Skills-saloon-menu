import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Route guard for /admin/*.
 * - /admin/login and /admin/setup are open paths handled by the pages
 *   themselves (setup also verifies a secret token server-side, and only
 *   works until the first admin account exists).
 * - Everything else requires a valid session BEFORE the page renders.
 * Role (admin vs staff) is verified server-side inside the dashboard layout.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const openPath = path === '/admin/login' || path === '/admin/setup';

  if (!user && !openPath) {
    // not signed in → send to login (remember where they were heading)
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = path !== '/admin' ? `?next=${encodeURIComponent(path)}` : '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};

# Routing Standards

This document outlines the routing architecture and standards for the lifting diary course application.

## Route Structure

### Dashboard-Centric Architecture

All application routes should be accessed via the `/dashboard` prefix. This provides a clear separation between public and authenticated areas of the application.

**Structure:**
```
/dashboard              # Main dashboard page
/dashboard/workout      # Workout-related pages
/dashboard/profile      # User profile pages
/dashboard/*            # All other authenticated routes
```

### Route Protection

All `/dashboard` routes and sub-routes are **protected routes** that require user authentication.

#### Implementation via Middleware

Route protection is implemented using Next.js middleware, which provides:
- Centralized authentication checks
- Early request interception before pages render
- Consistent protection across all dashboard routes
- Efficient redirect handling for unauthenticated users

**Middleware Configuration:**

The middleware should be placed at `src/middleware.ts` and configured to:

1. **Match all dashboard routes:**
   ```typescript
   export const config = {
     matcher: ['/dashboard/:path*']
   }
   ```

2. **Verify authentication status:**
   - Check for valid session/auth tokens
   - Validate user credentials
   - Handle token refresh if needed

3. **Redirect behavior:**
   - Unauthenticated users → Redirect to login page
   - Authenticated users → Allow request to proceed
   - Preserve original URL for post-login redirect

**Example Pattern:**
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check authentication
  const isAuthenticated = // ... auth check logic

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

## Best Practices

### Route Organization

1. **Group related features:** Keep related pages together under logical sub-paths
   - Example: `/dashboard/workout/new`, `/dashboard/workout/[id]`, `/dashboard/workout/[id]/edit`

2. **Use dynamic routes:** Leverage Next.js dynamic routing for resource-based pages
   - Pattern: `/dashboard/[resource]/[id]`

3. **Consistent naming:** Use kebab-case for route segments
   - ✅ `/dashboard/workout-history`
   - ❌ `/dashboard/workoutHistory` or `/dashboard/workout_history`

### Authentication Flow

1. **Unauthenticated access attempts:**
   - Middleware catches the request
   - Redirects to login page
   - Preserves intended destination in query params

2. **Post-login redirect:**
   - After successful authentication, redirect to original destination
   - Fall back to `/dashboard` if no destination is specified

3. **Session validation:**
   - Middleware should validate session on every protected route request
   - Handle expired sessions gracefully
   - Refresh tokens when possible

### Performance Considerations

1. **Middleware efficiency:**
   - Keep middleware logic lightweight
   - Avoid heavy computations or database queries
   - Cache authentication checks where appropriate

2. **Matcher patterns:**
   - Use specific matchers to avoid unnecessary middleware execution
   - Exclude public routes and static assets from middleware

## Route Conventions

### URL Parameters

- **Resource IDs:** Use descriptive parameter names
  - ✅ `/dashboard/workout/[workoutId]`
  - ❌ `/dashboard/workout/[id]`

### Query Parameters

- **Filtering/Sorting:** Use query params for non-essential route information
  - Example: `/dashboard/workouts?sort=date&order=desc`

### Route Guards

While middleware handles top-level authentication:
- Individual pages may implement additional authorization checks
- Example: Check if user owns the resource before allowing edit
- Implement these checks in Server Components or Server Actions

## Security Considerations

1. **Never trust client-side routing alone:** Always validate on the server
2. **Validate permissions:** Authentication ≠ Authorization
3. **Sanitize route parameters:** Prevent injection attacks
4. **Rate limiting:** Consider implementing rate limits on sensitive routes
5. **CSRF protection:** Ensure forms are protected against CSRF attacks

## Migration Notes

If converting existing routes to the dashboard structure:
1. Update all internal links to use `/dashboard` prefix
2. Verify middleware configuration catches all protected routes
3. Update any hardcoded URLs in components or actions
4. Test authentication flow thoroughly

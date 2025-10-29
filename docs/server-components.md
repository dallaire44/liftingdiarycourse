# Server Components Standards

This document defines the coding standards and best practices for React Server Components in this Next.js 15+ application.

## Critical Next.js 15+ Changes

### MANDATORY: Params Must Be Awaited

**CRITICAL RULE**: In Next.js 15+, all `params` and `searchParams` are **Promises** and MUST be awaited before use.

This is a breaking change from Next.js 14 and earlier versions. Failing to await params will cause runtime errors.

#### ✅ CORRECT: Awaiting Params

```tsx
// app/posts/[postId]/page.tsx

interface PageProps {
  params: Promise<{
    postId: string
  }>
}

export default async function PostPage({ params }: PageProps) {
  // CRITICAL: Await params before accessing properties
  const { postId } = await params

  // Now you can use postId
  const post = await getPostById(postId)

  return <div>{post.title}</div>
}
```

#### ❌ INCORRECT: Not Awaiting Params

```tsx
// app/posts/[postId]/page.tsx

interface PageProps {
  params: {
    postId: string  // ❌ WRONG: Not a Promise type
  }
}

export default async function PostPage({ params }: PageProps) {
  // ❌ WRONG: Accessing params without await
  const { postId } = params  // Runtime error!

  const post = await getPostById(postId)
  return <div>{post.title}</div>
}
```

### SearchParams Must Also Be Awaited

Search parameters follow the same pattern and MUST be awaited:

#### ✅ CORRECT: Awaiting SearchParams

```tsx
// app/search/page.tsx

interface PageProps {
  searchParams: Promise<{
    query?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  // CRITICAL: Await searchParams before accessing
  const { query, page } = await searchParams

  const results = await searchPosts(query, page)

  return <div>{/* render results */}</div>
}
```

#### ❌ INCORRECT: Not Awaiting SearchParams

```tsx
// app/search/page.tsx

interface PageProps {
  searchParams: {
    query?: string  // ❌ WRONG: Not a Promise type
    page?: string
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  // ❌ WRONG: Accessing without await
  const { query, page } = searchParams  // Runtime error!

  return <div>{/* ... */}</div>
}
```

## Server Component Page Patterns

### Basic Page Component

```tsx
// app/dashboard/page.tsx

export default async function DashboardPage() {
  // Server Components can directly fetch data
  const data = await fetchData()

  return (
    <div>
      <h1>Dashboard</h1>
      {/* render data */}
    </div>
  )
}
```

### Dynamic Route with Params

```tsx
// app/products/[productId]/page.tsx

interface ProductPageProps {
  params: Promise<{
    productId: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  // 1. Await params
  const { productId } = await params

  // 2. Fetch data using the param
  const product = await getProductById(productId)

  // 3. Handle not found
  if (!product) {
    notFound()
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  )
}
```

### Multiple Dynamic Segments

```tsx
// app/blog/[category]/[slug]/page.tsx

interface BlogPostPageProps {
  params: Promise<{
    category: string
    slug: string
  }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Await params to access all segments
  const { category, slug } = await params

  const post = await getPostByCategoryAndSlug(category, slug)

  if (!post) {
    notFound()
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Category: {category}</p>
      {/* ... */}
    </article>
  )
}
```

### Page with Params and SearchParams

```tsx
// app/products/[category]/page.tsx

interface ProductCategoryPageProps {
  params: Promise<{
    category: string
  }>
  searchParams: Promise<{
    sort?: string
    filter?: string
    page?: string
  }>
}

export default async function ProductCategoryPage({
  params,
  searchParams,
}: ProductCategoryPageProps) {
  // Await both params and searchParams
  const { category } = await params
  const { sort, filter, page } = await searchParams

  // Use them to fetch data
  const products = await getProductsByCategory({
    category,
    sort,
    filter,
    page: page ? parseInt(page) : 1,
  })

  return (
    <div>
      <h1>{category} Products</h1>
      {/* render products */}
    </div>
  )
}
```

## Protected Route Pattern (with Authentication)

This is the STANDARD pattern for all protected pages in this application:

```tsx
// app/dashboard/workout/[workoutId]/page.tsx

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getWorkoutByIdAndUserId } from "@/data/workouts"

interface WorkoutPageProps {
  params: Promise<{
    workoutId: string
  }>
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  // 1. Get authenticated user
  const { userId } = await auth()

  // 2. Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }

  // 3. Await params (Next.js 15+ requirement)
  const { workoutId } = await params

  // 4. Fetch data (scoped to user for security)
  const workout = await getWorkoutByIdAndUserId(userId, workoutId)

  // 5. Handle not found or unauthorized
  if (!workout) {
    redirect("/dashboard")
  }

  // 6. Render the page
  return (
    <div>
      <h1>{workout.name}</h1>
      {/* render workout details */}
    </div>
  )
}
```

## TypeScript Types for Props

### Page Props Type

```tsx
// Standard page props with params
type PageProps = {
  params: Promise<{ [key: string]: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
```

### Specific Page Props

```tsx
// Define specific types for your routes
interface UserProfilePageProps {
  params: Promise<{
    userId: string
  }>
  searchParams: Promise<{
    tab?: string
  }>
}
```

### Catch-All Routes

```tsx
// app/docs/[...slug]/page.tsx

interface DocsPageProps {
  params: Promise<{
    slug: string[]  // Array for catch-all segments
  }>
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params

  // slug is an array: /docs/a/b/c -> ['a', 'b', 'c']
  const path = slug.join('/')
  const doc = await getDocByPath(path)

  return <div>{doc.content}</div>
}
```

### Optional Catch-All Routes

```tsx
// app/shop/[[...slug]]/page.tsx

interface ShopPageProps {
  params: Promise<{
    slug?: string[]  // Optional for [[...slug]]
  }>
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params

  // slug can be undefined or an array
  const category = slug ? slug[0] : 'all'

  return <div>Category: {category}</div>
}
```

## Metadata with Params

Metadata generation functions also receive params as Promises:

### generateMetadata Function

```tsx
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{
    productId: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // CRITICAL: Await params in generateMetadata too
  const { productId } = await params

  const product = await getProductById(productId)

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params
  const product = await getProductById(productId)

  return <div>{product.name}</div>
}
```

### Static Metadata

For pages without dynamic params, use static metadata:

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard page",
}

export default async function DashboardPage() {
  return <div>Dashboard</div>
}
```

## generateStaticParams

When pre-rendering dynamic routes, params are still Promises:

```tsx
// app/posts/[slug]/page.tsx

interface PostPageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate static params at build time
export async function generateStaticParams() {
  const posts = await getAllPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function PostPage({ params }: PostPageProps) {
  // Still need to await params at runtime
  const { slug } = await params

  const post = await getPostBySlug(slug)

  return <div>{post.title}</div>
}
```

## Error Handling

### Not Found

```tsx
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params
  const item = await getItemById(id)

  if (!item) {
    notFound()  // Renders not-found.tsx
  }

  return <div>{item.name}</div>
}
```

### Unauthorized (Redirect)

```tsx
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function ProtectedPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <div>Protected content</div>
}
```

### Error Boundaries

Create `error.tsx` for error handling:

```tsx
// app/posts/[postId]/error.tsx
"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Server Component Best Practices

### 1. Always Await Params
```tsx
// ✅ CORRECT
const { id } = await params

// ❌ WRONG
const { id } = params
```

### 2. Type Props Correctly
```tsx
// ✅ CORRECT
interface PageProps {
  params: Promise<{ id: string }>
}

// ❌ WRONG
interface PageProps {
  params: { id: string }
}
```

### 3. Await at the Top
```tsx
// ✅ CORRECT: Await params early
export default async function Page({ params }: PageProps) {
  const { id } = await params
  const data = await getData(id)
  return <div>{data}</div>
}

// ❌ WRONG: Trying to pass promise to function
export default async function Page({ params }: PageProps) {
  const data = await getData(params.id)  // Error!
  return <div>{data}</div>
}
```

### 4. Parallel Data Fetching

When you need multiple data sources, fetch in parallel:

```tsx
export default async function Page({ params }: PageProps) {
  const { id } = await params

  // Fetch data in parallel using Promise.all
  const [user, posts, comments] = await Promise.all([
    getUserById(id),
    getPostsByUserId(id),
    getCommentsByUserId(id),
  ])

  return (
    <div>
      <UserProfile user={user} />
      <PostsList posts={posts} />
      <CommentsList comments={comments} />
    </div>
  )
}
```

### 5. Streaming with Suspense

For better UX, stream data with React Suspense:

```tsx
import { Suspense } from "react"

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return (
    <div>
      <Suspense fallback={<LoadingSkeleton />}>
        <UserData userId={id} />
      </Suspense>
      <Suspense fallback={<LoadingPosts />}>
        <UserPosts userId={id} />
      </Suspense>
    </div>
  )
}

// Separate async component
async function UserData({ userId }: { userId: string }) {
  const user = await getUserById(userId)
  return <div>{user.name}</div>
}
```

## Common Mistakes to Avoid

### ❌ MISTAKE 1: Not Awaiting Params

```tsx
// ❌ WRONG
export default async function Page({ params }: PageProps) {
  const id = params.id  // Runtime error!
  return <div>{id}</div>
}
```

**Fix**: Always await params

```tsx
// ✅ CORRECT
export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <div>{id}</div>
}
```

### ❌ MISTAKE 2: Wrong Type Definition

```tsx
// ❌ WRONG
interface PageProps {
  params: { id: string }  // Not a Promise!
}
```

**Fix**: Params must be typed as Promise

```tsx
// ✅ CORRECT
interface PageProps {
  params: Promise<{ id: string }>
}
```

### ❌ MISTAKE 3: Using Client Component Hooks

```tsx
// ❌ WRONG: Server Component using client hooks
export default async function Page() {
  const [state, setState] = useState(0)  // Error!
  return <div>{state}</div>
}
```

**Fix**: Use Client Components for interactivity

```tsx
// ✅ CORRECT: Separate Client Component
"use client"

export function Counter() {
  const [state, setState] = useState(0)
  return <button onClick={() => setState(state + 1)}>{state}</button>
}
```

### ❌ MISTAKE 4: Fetching Data in useEffect

```tsx
// ❌ WRONG: Don't fetch in useEffect for Server Components
export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data').then(/* ... */)  // Wrong pattern!
  }, [])

  return <div>{data}</div>
}
```

**Fix**: Fetch directly in Server Components

```tsx
// ✅ CORRECT: Direct async fetch in Server Component
export default async function Page() {
  const data = await getData()  // Server-side fetch
  return <div>{data}</div>
}
```

## Migration from Next.js 14

If you're upgrading from Next.js 14, update your pages:

### Before (Next.js 14)

```tsx
interface PageProps {
  params: { id: string }  // Synchronous
}

export default async function Page({ params }: PageProps) {
  const { id } = params  // Direct access
  return <div>{id}</div>
}
```

### After (Next.js 15+)

```tsx
interface PageProps {
  params: Promise<{ id: string }>  // Promise
}

export default async function Page({ params }: PageProps) {
  const { id } = await params  // Must await
  return <div>{id}</div>
}
```

## Summary

### Critical Rules for Next.js 15+

1. ✅ **ALWAYS** await `params` and `searchParams`
2. ✅ **ALWAYS** type them as `Promise<...>`
3. ✅ Await params at the top of your component
4. ✅ Await params in `generateMetadata` too
5. ✅ Use Server Components for data fetching
6. ✅ Use Client Components only when needed (interactivity)

### The Standard Pattern

```tsx
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  // 1. Authenticate (if protected)
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // 2. Await params
  const { id } = await params

  // 3. Fetch data
  const data = await getData(userId, id)

  // 4. Handle not found
  if (!data) notFound()

  // 5. Render
  return <div>{data.content}</div>
}
```

Follow this pattern for ALL dynamic routes in this Next.js 15+ application.

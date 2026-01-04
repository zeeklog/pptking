export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">404 - Page Not Found</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      </div>
    </div>
  );
}


import { Button } from '../../components/ui'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-100">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-600">The page you're looking for doesn't exist or may have moved.</p>
      <div className="mt-8 flex gap-3">
        <Button to="/">Go home</Button>
        <Button to="/courses" variant="secondary">Browse courses</Button>
      </div>
    </div>
  )
}

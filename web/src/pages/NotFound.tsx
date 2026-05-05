import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl text-amber-100">Page not found</h1>
      <p className="mt-2 text-gray-400">
        <Link to="/" className="text-amber-300 underline">
          Return home
        </Link>
      </p>
    </div>
  );
}

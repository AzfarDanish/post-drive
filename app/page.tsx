import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Post Drive</h1>
          <p className="text-lg text-gray-500">
            AI-powered content for Threads.
          </p>
        </div>

        <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
          Describe your business, optionally drop a website link, and let AI
          generate a post that sounds like a real person — not a brand.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/connect"
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Connect Threads
          </Link>
          <Link
            href="/post"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Create a Post
          </Link>
        </div>
      </div>
    </div>
  );
}

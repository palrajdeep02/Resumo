import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-grid bg-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-lead uppercase">
        <span>
          © {new Date().getFullYear()} Resumo. Created by{" "}
          <span className="text-ink font-semibold">Palraj</span>.
        </span>
        <div className="flex space-x-6">
          <Link
            href="https://github.com/palra"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-crimson transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
          >
            GitHub
          </Link>
          <Link
            href="https://linkedin.com/in/palra"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-crimson transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
          >
            LinkedIn
          </Link>
        </div>
      </div>
    </footer>
  );
}

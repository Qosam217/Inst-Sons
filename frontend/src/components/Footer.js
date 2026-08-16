export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4">
        <p>© {new Date().getFullYear()} Inst Sons — Personal Productivity Tools. Modular Monolith Architecture.</p>
      </div>
    </footer>
  );
}

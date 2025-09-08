import { Github, Linkedin } from "lucide-react";

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between border-b border-white/10">
      {/* Left: Title */}
      <h1 className="text-2xl font-bold">AI RAG Chatbot</h1>

      {/* Right: Social Links */}
      <div className="flex gap-4">
        <a
          href="https://github.com/dkbera01"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors"
        >
          <Github size={24} />
        </a>
        <a
          href="https://www.linkedin.com/in/dhaval-bera/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors"
        >
          <Linkedin size={24} />
        </a>
      </div>
    </header>
  );
}

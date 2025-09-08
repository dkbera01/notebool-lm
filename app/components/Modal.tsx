import { X } from "lucide-react";

export default function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-gray-900 w-full max-w-2xl p-8 rounded-2xl shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-semibold mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

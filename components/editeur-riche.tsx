"use client";

import { useRef, useState, useEffect } from "react";
import { Bold, Smile } from "lucide-react";

const EMOJIS = [
  "😀", "😊", "🎉", "🎊", "🥳", "👋", "🙌", "👍",
  "❤️", "🧡", "✨", "🔥", "📅", "📍", "⏰", "🍕",
  "🍲", "☕", "🎓", "📚", "🎵", "⚽", "🎮", "💬",
];

export default function EditeurRiche({
  value,
  onChange,
  placeholder,
  minHeight = "110px",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [emojiOuvert, setEmojiOuvert] = useState(false);
  const dejaInitialise = useRef(false);

  // On n'écrase le contenu qu'à l'initialisation (édition d'un rappel
  // existant) — ensuite on laisse le navigateur gérer le DOM
  // directement, sinon le curseur saute à chaque frappe.
  useEffect(() => {
    if (!dejaInitialise.current && ref.current) {
      ref.current.innerHTML = value || "";
      dejaInitialise.current = true;
    }
  }, [value]);

  function emettreChangement() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function appliquerGras() {
    ref.current?.focus();
    document.execCommand("bold");
    emettreChangement();
  }

  function inserer(emoji: string) {
    ref.current?.focus();
    document.execCommand("insertText", false, emoji);
    setEmojiOuvert(false);
    emettreChangement();
  }

  return (
    <div className="rounded-md border border-ligne bg-white focus-within:border-indigo focus-within:ring-2 focus-within:ring-indigo/10">
      <div className="flex items-center gap-1 border-b border-ligne px-2 py-1.5">
        <button
          type="button"
          onClick={appliquerGras}
          title="Gras"
          className="rounded p-1.5 text-sourdine hover:bg-fond hover:text-encre"
        >
          <Bold size={15} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOuvert((v) => !v)}
            title="Emoji"
            className="rounded p-1.5 text-sourdine hover:bg-fond hover:text-encre"
          >
            <Smile size={15} />
          </button>
          {emojiOuvert && (
            <div className="absolute left-0 top-9 z-20 grid w-56 grid-cols-8 gap-1 rounded-md border border-ligne bg-white p-2 shadow-lg">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => inserer(e)}
                  className="rounded p-1 text-lg hover:bg-fond"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="ml-1 text-[11px] text-sourdine">
          Entrée = retour à la ligne
        </span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emettreChangement}
        onBlur={emettreChangement}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="editeur-riche-contenu overflow-y-auto px-3 py-2.5 text-sm text-encre outline-none"
      />
      <style jsx>{`
        .editeur-riche-contenu:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

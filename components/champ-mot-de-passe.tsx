"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function ChampMotDePasse({
  id,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-ligne bg-white px-3 py-2 pr-10 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-sourdine hover:text-encre"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

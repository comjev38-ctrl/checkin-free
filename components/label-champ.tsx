export default function LabelChamp({
  htmlFor,
  obligatoire = true,
  children,
}: {
  htmlFor?: string;
  obligatoire?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-xs uppercase text-stone"
    >
      {children}
      {obligatoire && <span className="ml-0.5 text-rose">*</span>}
    </label>
  );
}

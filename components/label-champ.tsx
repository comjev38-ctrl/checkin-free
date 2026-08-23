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
      className="block text-xs uppercase text-sourdine"
    >
      {children}
      {obligatoire && <span className="ml-0.5 text-corail">*</span>}
    </label>
  );
}

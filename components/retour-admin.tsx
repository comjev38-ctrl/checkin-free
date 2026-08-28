import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RetourAdmin({
  href,
  label = "Mes événements",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-sourdine hover:text-encre"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

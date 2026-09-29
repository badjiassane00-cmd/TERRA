import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export default function BackLink({ href, label, className }: BackLinkProps) {
  return <Link href={href} className={className}><ArrowLeft size={16} aria-hidden="true" />{label}</Link>;
}

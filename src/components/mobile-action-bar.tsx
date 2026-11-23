import Link from "next/link";
import { club } from "@/content/club";

export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <a
          href={`tel:${club.phone.tel}`}
          className="flex h-11 items-center justify-center rounded-sm border border-line text-[0.7rem] font-medium uppercase tracking-[0.12em] text-paper"
        >
          Позвонить
        </a>
        <a
          href={club.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-sm border border-line text-[0.7rem] font-medium uppercase tracking-[0.12em] text-paper"
        >
          WhatsApp
        </a>
        <Link
          href="/#lead"
          className="flex h-11 items-center justify-center rounded-sm bg-brand text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white"
        >
          Записаться
        </Link>
      </div>
    </div>
  );
}

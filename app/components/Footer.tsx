"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { usePathname } from "next/navigation";

const shopLinks = [
  { label: "Shop all costumes", href: "/shop" },
  { label: "Custom costumes", href: "/custom-costumes" },
  { label: "Costume Show collection", href: "/costume-show-shop" },
  { label: "Our story", href: "/our-story" },
];

const companyLinks = [
  { label: "About EMPI", href: "/about" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "My cart", href: "/cart" },
];

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname !== "/" && pathname !== "/shop") {
    return null;
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050505] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-lime-500/[0.04] blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 border-b border-white/10 pb-10 md:grid-cols-12 md:gap-8 md:pb-14">
          <div className="col-span-2 flex flex-col items-center text-center md:col-span-5 md:items-start md:text-left lg:col-span-5">
            <Link href="/" className="inline-flex" aria-label="EMPI Costumes home">
              <Image
                src="/logo/EMPI-2k24-LOGO-1.PNG"
                alt="EMPI Costumes"
                width={174}
                height={123}
                className="h-auto w-[138px] object-contain transition-transform duration-300 hover:scale-[1.03] md:w-[158px] md:object-left"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
              Character-led costume design, premium rentals and statement
              pieces made in Lagos for moments that deserve to be remembered.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <SocialLink
                href="https://www.instagram.com/empicostumes/"
                label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink
                href="https://www.tiktok.com/@empicostumes"
                label="TikTok"
              >
                <TiktokIcon />
              </SocialLink>
            </div>
          </div>

          <FooterLinkGroup title="Explore" links={shopLinks} className="col-span-1 text-center md:col-span-3 md:text-left lg:col-span-2" />
          <FooterLinkGroup title="Company" links={companyLinks} className="col-span-1 text-center md:col-span-2 md:text-left lg:col-span-2" />

          <div className="col-span-2 flex flex-col items-center text-center md:col-span-5 md:items-start md:text-left lg:col-span-3">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-lime-500">
              Contact
            </p>
            <div className="space-y-3">
              <ContactLink href="mailto:empicostumes@gmail.com" icon={<Mail />}>
                empicostumes@gmail.com
              </ContactLink>
              <ContactLink href="tel:+2348085779180" icon={<Phone />}>
                +234 808 577 9180
              </ContactLink>
              <div className="flex items-center justify-center gap-3 text-sm text-white/55 md:justify-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lime-500">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                Lagos, Nigeria
              </div>
            </div>
          </div>
        </div>

        <div className="grid justify-items-center gap-6 py-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-[1fr_auto] lg:items-center lg:justify-items-stretch">
          <div className="flex flex-col items-center gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 sm:items-start lg:flex-row lg:items-center lg:gap-6">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-lime-500" />
              Secure online payments
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-lime-500" />
              Delivery across Lagos
            </span>
          </div>

          <Link
            href="/shop"
            className="group inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:border-lime-500/40 hover:bg-lime-500 hover:text-black"
          >
            Explore the collection
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-6 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-white/35 md:flex-row md:justify-between md:text-left">
          <div className="space-y-2">
            <p>&copy; {currentYear} EMPI Costumes. All rights reserved.</p>
            <p>Costume artistry, made in Lagos.</p>
          </div>
          <a
            href="https://www.samuelstanley.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[9px] tracking-[0.14em] text-white/45 transition hover:border-lime-500/35 hover:text-white"
          >
            Designed &amp; developed by
            <span className="font-black text-white transition-colors group-hover:text-lime-400">
              Samuel Stanley
            </span>
            <ArrowUpRight className="h-3 w-3 text-lime-500" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links,
  className,
}: {
  title: string;
  links: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-lime-500">
        {title}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/55 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactElement<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-center gap-3 text-sm text-white/55 transition-colors hover:text-white md:justify-start"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lime-500 transition-colors group-hover:border-lime-500/30">
        {icon}
      </span>
      <span className="break-all">{children}</span>
    </a>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:-translate-y-0.5 hover:border-lime-500/40 hover:bg-lime-500 hover:text-black"
    >
      {children}
    </a>
  );
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-1.26-.93-2.15-2.32-2.39-3.84h-.05v10.2c0 .28-.03.55-.07.82-.2 1.39-1.04 2.7-2.24 3.47-1.2.77-2.77 1.05-4.14.73-1.37-.32-2.59-1.25-3.23-2.51-.64-1.26-.7-2.8-.16-4.1.54-1.29 1.65-2.34 2.99-2.76.54-.17 1.11-.25 1.68-.25.13 0 .26.01.39.02v4.03c-.15-.02-.3-.03-.45-.03-1.09 0-2.1.66-2.52 1.66-.42 1-.16 2.19.64 2.9.8.71 1.99.82 2.91.27.92-.55 1.39-1.63 1.15-2.66.02-.36.01-.72.01-1.08V.02z" />
    </svg>
  );
}

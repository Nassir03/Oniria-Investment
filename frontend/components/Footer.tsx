const socialLinks = [
  {
    label: 'WhatsApp',
    href: 'https://www.whatsapp.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.25a9.5 9.5 0 0 0-8.1 14.46L2.65 21.75l5.16-1.2A9.5 9.5 0 1 0 12 2.25Zm0 17.25a7.7 7.7 0 0 1-3.93-1.08l-.28-.17-3.06.72.77-2.97-.18-.3A7.75 7.75 0 1 1 12 19.5Zm4.25-5.78c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.15.23-.6.76-.73.92-.14.16-.27.18-.5.06-.24-.12-1-.36-1.9-1.15-.7-.62-1.17-1.39-1.31-1.62-.14-.23-.02-.36.1-.48.1-.1.24-.27.35-.4.12-.14.16-.24.24-.4.08-.15.04-.29-.02-.4-.06-.12-.52-1.26-.72-1.72-.19-.46-.38-.4-.52-.4h-.45c-.16 0-.4.06-.62.29-.21.23-.82.8-.82 1.96s.84 2.28.96 2.44c.12.15 1.66 2.54 4.03 3.56.56.24 1 .39 1.34.5.56.18 1.08.15 1.48.09.45-.07 1.38-.57 1.57-1.11.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.45-.28Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.5" cy="6.7" r="1" className="socialFill" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 21v-8h2.8l.42-3.15H13.5V7.83c0-.91.26-1.53 1.6-1.53H16.8V3.5c-.3-.04-1.3-.13-2.48-.13-2.46 0-4.14 1.5-4.14 4.25v2.23H7.4V13h2.78v8h3.32Z" className="socialFill" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 8.05a2.9 2.9 0 0 0-2.04-2.05C17.15 5.5 12 5.5 12 5.5s-5.15 0-6.96.5A2.9 2.9 0 0 0 3 8.05C2.5 9.86 2.5 12 2.5 12s0 2.14.5 3.95A2.9 2.9 0 0 0 5.04 18C6.85 18.5 12 18.5 12 18.5s5.15 0 6.96-.5A2.9 2.9 0 0 0 21 15.95c.5-1.81.5-3.95.5-3.95S21.5 9.86 21 8.05Z" />
        <path d="m10 15.1 5.1-3.1L10 8.9v6.2Z" className="socialFill" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="siteFooter compactFooter">
      <div className="compactFooterTop">
        <div className="compactFooterBrand">
          <strong>ONIRIA Investments</strong>
          <span>Creating places with lasting presence.</span>
        </div>

        <div className="compactFooterRight">
          <div className="compactFooterLinks" aria-label="Footer information">
            <span>Privacy Policy</span>
            <span>Terms and Conditions</span>
            <span>Sitemap</span>
            <span>Contact</span>
          </div>

          <div className="compactFooterSocial" aria-label="Social media">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="compactFooterBottom">
        <span>© {new Date().getFullYear()} ONIRIA Investments. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

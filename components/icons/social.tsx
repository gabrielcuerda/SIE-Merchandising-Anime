import type { SiteSocial } from "@/lib/site";

const paths: Record<SiteSocial["icon"], React.ReactNode> = {
  instagram: (
    <>
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
    </>
  ),
  youtube: (
    <>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10.2 8.9 15.5 12l-5.3 3.1V8.9Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </>
  ),
  tiktok: (
    <path
      d="M14 3v9.9a3.4 3.4 0 1 1-3-3.36M14 3c.4 2.3 1.9 3.7 4.2 3.9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  x: (
    <path
      d="M4 4l7.2 9.1L4.4 20h2.2l5.6-6 4.4 6H20l-7.5-9.5L19 4h-2.2l-5.1 5.5L7.8 4H4Z"
      fill="currentColor"
    />
  ),
  whatsapp: (
    <path
      d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm0 2a7 7 0 1 1-3.5 13l-.3-.2-2.5.7.7-2.4-.2-.3A7 7 0 0 1 12 5Zm-2.6 3.4c-.2 0-.4.1-.5.3-.2.2-.6.6-.6 1.4s.6 1.6.7 1.7c.1.1 1.1 1.8 2.8 2.4 1.4.5 1.7.4 2 .3.3 0 .9-.4 1.1-.7.1-.3.1-.6 0-.7l-.9-.4c-.2 0-.3 0-.5.2l-.5.6c-.1.1-.3.2-.5.1a5.7 5.7 0 0 1-1.7-1 6.3 6.3 0 0 1-1.1-1.4c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.2-.5l-.4-1c-.1-.2-.3-.3-.5-.3h-.5Z"
      fill="currentColor"
    />
  ),
  facebook: (
    <path
      d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v1.9H8V12h2.6v8H14v-8h2.4l.4-3.5H14Z"
      fill="currentColor"
    />
  ),
};

export default function SocialIcon({
  icon,
  className = "h-4 w-4",
}: {
  icon: SiteSocial["icon"];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      {paths[icon]}
    </svg>
  );
}

## Packages
recharts | Dashboard analytics charts and data visualization
socket.io-client | Real-time student activity tracking
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to cleanly merge tailwind classes
lucide-react | Beautiful dashboard icons

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  sans: ["var(--font-sans)"],
}
JWT custom auth: Token stored in localStorage as 'auth_token' and passed in Authorization header.
Socket.io connects to '/ws' namespace.

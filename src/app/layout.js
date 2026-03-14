import "./globals.css";

export const metadata = {
  title: "The World — Explore Every Country on Earth",
  description:
    "Discover all countries of the world ranked by population, land area, and more. Search, explore, and learn about every nation with our beautiful interactive globe.",
  keywords: "countries, world, population, land area, flags, geography, explore",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}

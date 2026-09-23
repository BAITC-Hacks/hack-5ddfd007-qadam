import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "QADAM — люди для вашего события",
  description:
    "Подбор подрядчиков по бюджету, формату и календарю из анонимизированного каталога HackAlem.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

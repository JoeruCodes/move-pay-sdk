import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import {WalletProvider} from "../components/WalletProvider";
import { AutoConnectProvider } from "../components/AutoConnectProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
const wallets = [new PetraWallet()];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AutoConnectProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AutoConnectProvider>
      </body>
    </html>
  );
}
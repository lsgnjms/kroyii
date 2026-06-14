"use client";

import React from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-8 h-8"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AgentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-8 h-8"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
  </svg>
);

const ExecuteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-8 h-8"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="flex items-center flex-col grow pt-10 pb-20">
      <div className="px-5 max-w-3xl w-full">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-block mb-4">
            <span className="badge badge-outline text-xs px-3 py-2 opacity-60 tracking-widest uppercase">
              Powered by Venice AI + MetaMask Smart Accounts
            </span>
          </div>
          <h1 className="text-6xl font-bold mb-4 kroyii-gradient">Kroyii</h1>
          <p className="text-xl opacity-70 mb-3">Your autonomous onchain agent</p>
          <p className="text-sm opacity-50 max-w-lg mx-auto leading-relaxed">
            Grant permissions once. Kroyii reasons with Venice AI and executes onchain actions on your behalf — no
            constant approvals, no gas headaches.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="kroyii-card bg-base-100 rounded-2xl p-6 border border-base-300 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldIcon />
            </div>
            <h3 className="font-semibold">Grant Permissions</h3>
            <p className="text-xs opacity-60 leading-relaxed">
              Connect MetaMask and grant Kroyii scoped ERC-7715 permissions. One time. Revocable anytime.
            </p>
          </div>
          <div className="kroyii-card bg-base-100 rounded-2xl p-6 border border-base-300 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <AgentIcon />
            </div>
            <h3 className="font-semibold">Give an Instruction</h3>
            <p className="text-xs opacity-60 leading-relaxed">
              Type a natural language instruction. Venice AI reasons about what onchain action to take.
            </p>
          </div>
          <div className="kroyii-card bg-base-100 rounded-2xl p-6 border border-base-300 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <ExecuteIcon />
            </div>
            <h3 className="font-semibold">Kroyii Executes</h3>
            <p className="text-xs opacity-60 leading-relaxed">
              Kroyii autonomously executes the transaction through your Smart Account. No further approvals.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center mb-12">
          <Link href="/agent" passHref>
            <button className="btn btn-primary btn-lg px-12 text-base">Launch Kroyii Agent →</button>
          </Link>
        </div>

        {/* Tech Stack */}
        <div className="bg-base-100 rounded-2xl p-5 border border-base-300 text-center">
          <p className="text-xs opacity-40 mb-3 uppercase tracking-widest">Built with</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "MetaMask Smart Accounts",
              "ERC-7715 Permissions",
              "Venice AI",
              "EIP-7702",
              "Pimlico",
              "Sepolia Testnet",
            ].map(tag => (
              <span key={tag} className="badge badge-outline badge-sm py-3 px-4 opacity-50 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {connectedAddress && (
          <div className="text-center mt-6">
            <p className="text-xs opacity-30">Connected: {connectedAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

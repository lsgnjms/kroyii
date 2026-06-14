"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  status: "success" | "failed";
  gasUsed: string;
}

interface TransactionHistoryProps {
  address: string | undefined;
}

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ address }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions?address=${address}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setTransactions(data.transactions);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const shortAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Unknown");

  const shortHash = (hash: string) => (hash ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : "Unknown");

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Transaction History</h2>
          {lastUpdated && <p className="text-xs opacity-40 mt-0.5">Updated {lastUpdated}</p>}
        </div>
        <button onClick={fetchTransactions} disabled={isLoading || !address} className="btn btn-ghost btn-xs gap-1.5">
          <RefreshIcon />
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Not connected */}
      {!address && (
        <p className="text-sm opacity-40 text-center py-4">Connect your wallet to see transaction history.</p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error/10 rounded-xl p-3">
          <p className="text-error text-xs">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && transactions.length === 0 && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-base-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && address && transactions.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm opacity-40">No transactions found for this address.</p>
        </div>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="flex flex-col gap-2">
          {transactions.map(tx => (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-3 bg-base-200 rounded-xl hover:bg-base-300 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      tx.status === "success" ? "bg-success" : "bg-error"
                    }`}
                  />
                  <span className="text-xs font-mono opacity-60">{shortHash(tx.hash)}</span>
                  <button
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank")}
                    className="opacity-40 hover:opacity-100 transition-opacity"
                  >
                    <ExternalLinkIcon />
                  </button>
                </div>
                <div className="flex items-center gap-3 pl-3.5">
                  <span className="text-xs opacity-40">To: {shortAddress(tx.to)}</span>
                  <span className="text-xs opacity-40">{tx.timestamp}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium">{tx.value} ETH</p>
                <p className={`text-xs ${tx.status === "success" ? "text-success" : "text-error"}`}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

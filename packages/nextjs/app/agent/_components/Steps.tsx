"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "~~/app/agent/_components/Button";
import { PermissionBlock } from "~~/app/agent/_components/PermissionBlock";
import { usePermissions } from "~~/app/agent/hooks/usePermissions";

const getTxKey = (addr: string | undefined) => (addr ? `kroyii_tx_history_${addr.toLowerCase()}` : null);

interface TxRecord {
  hash: string;
  to: string;
  amount: string;
  reasoning: string;
  timestamp: string;
}

const StatusDot = ({ active, done }: { active: boolean; done: boolean }) => (
  <div
    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${
      done
        ? "bg-success border-success"
        : active
          ? "bg-primary border-primary animate-pulse"
          : "bg-base-300 border-base-300"
    }`}
  />
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

export const Steps = (): React.JSX.Element => {
  const { grantedPermissions, isLoading, error, txHash, requestPermission, redeemPermission, clearError } =
    usePermissions();
  const { address, isConnected } = useAccount();

  const [instruction, setInstruction] = useState("");
  const [agentReasoning, setAgentReasoning] = useState<string | null>(null);
  const [agentAction, setAgentAction] = useState<any | null>(null);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<TxRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Load tx history on mount
  useEffect(() => {
    const key = getTxKey(address);
    if (!key) {
      setTxHistory([]);
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved) setTxHistory(JSON.parse(saved));
      else setTxHistory([]);
    } catch {}
  }, [address]);

  // When txHash arrives, show success and save to history
  useEffect(() => {
    if (txHash && txHash !== lastTxHash) {
      setLastTxHash(txHash);
      setShowSuccess(true);
      const newRecord: TxRecord = {
        hash: txHash,
        to: agentAction?.to || "",
        amount: agentAction?.amount || "",
        reasoning: agentReasoning || "",
        timestamp: new Date().toLocaleString(),
      };
      const updated = [newRecord, ...txHistory].slice(0, 20);
      setTxHistory(updated);
      const key = getTxKey(address);
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch {}
      }
    }
  }, [txHash]);

  // Clear permissions when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      localStorage.removeItem("kroyii_permissions_v2");
      localStorage.removeItem("kroyii_session_key");
    }
  }, [isConnected]);

  const askAgent = async () => {
    if (!instruction.trim()) return;
    setIsAgentThinking(true);
    setAgentError(null);
    setAgentReasoning(null);
    setAgentAction(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          walletAddress: address,
          permissionContext: grantedPermissions?.[0]?.context,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAgentError(data.error);
        return;
      }
      setAgentReasoning(data.result.reasoning);
      setAgentAction(data.result);
    } catch (err: any) {
      setAgentError(err.message || "Failed to contact Kroyii agent");
    } finally {
      setIsAgentThinking(false);
    }
  };

  const executeAction = async () => {
    if (!agentAction || agentAction.action === "none") return;
    await redeemPermission(agentAction.to, agentAction.amount);
  };

  const startNewTransaction = () => {
    setInstruction("");
    setAgentReasoning(null);
    setAgentAction(null);
    setAgentError(null);
    setShowSuccess(false);
  };

  const revokePermissions = () => {
    localStorage.removeItem("kroyii_session_key");
    setAgentReasoning(null);
    setAgentAction(null);
    setInstruction("");
    setShowSuccess(false);
  };

  const step1Done = isConnected;
  const step2Done = !!grantedPermissions;
  const step3Done = showSuccess;

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-8 max-w-5xl mx-auto px-4 sm:px-6 min-h-screen">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="bg-base-100 rounded-2xl border border-base-300 p-5 sticky top-24 flex flex-col gap-5">
          <h2 className="font-bold text-base kroyii-gradient">Kroyii Agent</h2>

          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <StatusDot active={!step1Done} done={step1Done} />
              <div>
                <p className={`text-sm font-medium ${step1Done ? "opacity-100" : "opacity-40"}`}>Connect Wallet</p>
                {step1Done && (
                  <p className="text-xs opacity-40 mt-0.5 break-all">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                )}
              </div>
            </div>

            <div className="w-px h-4 bg-base-300 ml-1.5" />

            <div className="flex items-start gap-3">
              <StatusDot active={step1Done && !step2Done} done={step2Done} />
              <div>
                <p className={`text-sm font-medium ${step2Done ? "opacity-100" : "opacity-40"}`}>Grant Permissions</p>
                {step2Done && <p className="text-xs text-success mt-0.5">Active · 30 days</p>}
              </div>
            </div>

            <div className="w-px h-4 bg-base-300 ml-1.5" />

            <div className="flex items-start gap-3">
              <StatusDot active={step2Done && !step3Done} done={step3Done} />
              <div>
                <p className={`text-sm font-medium ${step2Done ? "opacity-100" : "opacity-40"}`}>Execute Action</p>
                {step3Done && <p className="text-xs text-success mt-0.5">Confirmed onchain</p>}
              </div>
            </div>
          </div>

          {txHistory.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} className="btn btn-ghost btn-xs w-full gap-1">
              {showHistory ? "Hide" : "View"} History ({txHistory.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {!step1Done
              ? "Connect your wallet"
              : !step2Done
                ? "Grant permissions to Kroyii"
                : step3Done
                  ? "Transaction complete"
                  : "What should Kroyii do?"}
          </h1>
          <p className="text-sm opacity-50 mt-1">
            {!step1Done
              ? "Connect your MetaMask Flask wallet to get started."
              : !step2Done
                ? "Kroyii needs one-time permission to act on your behalf."
                : step3Done
                  ? "Your transaction was executed successfully onchain."
                  : "Type a natural language instruction and Kroyii will execute it autonomously."}
          </p>
        </div>

        {/* Not connected */}
        {!step1Done && (
          <div className="bg-base-100 rounded-2xl border border-base-300 p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-8 h-8"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <p className="text-sm opacity-60">Use the Connect Wallet button in the top right to get started.</p>
          </div>
        )}

        {/* Grant Permissions */}
        {step1Done && !step2Done && (
          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 flex flex-col gap-4">
            <p className="text-sm opacity-60 leading-relaxed">
              Kroyii uses ERC-7715 Advanced Permissions to execute transactions on your behalf. Please make sure your
              account is upgraded to a MetaMask Smart Account first.{" "}
              <a
                href="https://support.metamask.io/configure/accounts/switch-to-or-revert-from-a-smart-account/#how-to-switch-to-a-metamask-smart-account"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                Learn how.
              </a>
            </p>
            <div className="bg-base-200 rounded-xl p-4 text-sm flex flex-col gap-2">
              <p className="text-xs opacity-40 uppercase tracking-widest mb-1">You will be granting</p>
              <div className="flex justify-between">
                <span className="opacity-50">Permission type</span>
                <span className="font-medium">Native token periodic</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">Spending limit</span>
                <span className="font-medium">0.001 ETH / day</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">Duration</span>
                <span className="font-medium">30 days</span>
              </div>
            </div>
            <Button disabled={isLoading} onClick={requestPermission}>
              {isLoading ? "Waiting for MetaMask..." : "Grant Permissions to Kroyii"}
            </Button>
          </div>
        )}

        {/* Permissions Summary */}
        {step2Done && (
          <div className="bg-base-100 rounded-2xl border border-success/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-semibold text-success">Permissions Active</span>
            </div>
            <PermissionBlock permission={grantedPermissions!} />
          </div>
        )}

        {/* Instruction Input */}
        {step2Done && !step3Done && (!agentReasoning || agentAction?.action === "none") && !agentError && !error && (
          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 flex flex-col gap-4">
            <textarea
              className="textarea textarea-bordered w-full text-sm resize-none"
              rows={3}
              placeholder='e.g. "Send 0.0000001 ETH to 0x000...dEaD"'
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
            />
            <Button disabled={isAgentThinking || !instruction.trim()} onClick={askAgent}>
              {isAgentThinking ? "Kroyii is thinking..." : "Ask Kroyii →"}
            </Button>
          </div>
        )}

        {/* Agent Reasoning */}
        {agentReasoning && !step3Done && !error && !agentError && (
          <div className="bg-base-100 rounded-2xl border border-primary/30 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-primary">Kroyii Reasoning</span>
            </div>
            <p className="text-sm opacity-70">{agentReasoning}</p>
            {agentAction?.action !== "none" && (
              <div className="bg-base-200 rounded-xl p-4 text-sm flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="opacity-50">Action</span>
                  <span className="font-medium capitalize">{agentAction?.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">Recipient</span>
                  <span className="font-medium font-mono text-xs">
                    {agentAction?.to?.slice(0, 10)}...{agentAction?.to?.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">Amount</span>
                  <span className="font-medium">{agentAction?.amount} ETH</span>
                </div>
              </div>
            )}
            {agentAction?.action !== "none" && (
              <Button disabled={isLoading} onClick={executeAction}>
                {isLoading ? "Executing..." : "Confirm & Execute →"}
              </Button>
            )}
          </div>
        )}

        {/* Errors */}
        {(agentError || error) && (
          <div className="bg-error/10 rounded-2xl border border-error/30 p-4 flex flex-col gap-3">
            <p className="text-error text-sm">{agentError || error}</p>
            <button
              onClick={() => {
                setAgentError(null);
                setAgentReasoning(null);
                setAgentAction(null);
                setInstruction("");
                clearError();
              }}
              className="btn btn-outline btn-sm rounded-full self-start"
            >
              ← Try Again
            </button>
          </div>
        )}

        {/* Success */}
        {step3Done && (
          <div className="bg-base-100 rounded-2xl border border-success/30 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-semibold text-success">Transaction Confirmed</span>
            </div>
            <p className="text-xs font-mono opacity-50 break-all">{lastTxHash}</p>
            <Button
              disabled={false}
              onClick={() => {
                window.open(`https://sepolia.etherscan.io/tx/${lastTxHash}`, "_blank");
              }}
            >
              View on Etherscan →
            </Button>
            <button onClick={startNewTransaction} className="btn btn-outline btn-sm rounded-full">
              New Transaction →
            </button>
          </div>
        )}

        {/* Transaction History */}
        {showHistory && txHistory.length > 0 && (
          <div className="bg-base-100 rounded-2xl border border-base-300 p-5 flex flex-col gap-3">
            <h2 className="font-semibold text-sm">Transaction History</h2>
            <div className="flex flex-col gap-2">
              {txHistory.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-base-200 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                      <span className="text-xs font-mono opacity-60">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      </span>
                      <button
                        onClick={() => {
                          window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank");
                        }}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                      >
                        <ExternalLinkIcon />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 pl-3.5">
                      <span className="text-xs opacity-40">
                        To: {tx.to?.slice(0, 6)}...{tx.to?.slice(-4)}
                      </span>
                      <span className="text-xs opacity-40">{tx.timestamp}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{tx.amount} ETH</p>
                    <p className="text-xs text-success">success</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

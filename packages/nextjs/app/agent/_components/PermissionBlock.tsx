"use client";

import React from "react";
import { RequestExecutionPermissionsReturnType } from "@metamask/smart-accounts-kit/actions";

interface PermissionsListProps {
  permission: RequestExecutionPermissionsReturnType;
}

export const PermissionBlock: React.FC<PermissionsListProps> = ({ permission }) => {
  const p = permission[0];

  const shortAddress = (addr: string) => (addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "Unknown");

  const permData = (p?.permission as any)?.data;

  const periodAmount = permData?.periodAmount ? (Number(permData.periodAmount) / 1e18).toFixed(6) : "Unknown";

  const periodDays = permData?.periodDuration ? Math.round(Number(permData.periodDuration) / 86400) : null;

  const periodWeeks = permData?.periodDuration ? Math.round(Number(permData.periodDuration) / 604800) : null;

  const periodLabel = permData?.periodDuration
    ? Number(permData.periodDuration) >= 604800
      ? `${periodWeeks} week${periodWeeks !== 1 ? "s" : ""}`
      : `${periodDays} day${periodDays !== 1 ? "s" : ""}`
    : "Unknown";

  const expiry = p?.rules?.[0]?.data?.timestamp
    ? new Date(Number((p.rules[0].data as any).timestamp) * 1000).toLocaleDateString()
    : "Unknown";

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between items-center py-2 border-b border-base-300">
        <span className="opacity-50">Network</span>
        <span className="font-medium">Sepolia Testnet</span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-base-300">
        <span className="opacity-50">Permission Type</span>
        <span className="font-medium">Native Token Periodic</span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-base-300">
        <span className="opacity-50">Spending Limit</span>
        <span className="font-medium">
          {periodAmount} ETH / {periodLabel}
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-base-300">
        <span className="opacity-50">Expires</span>
        <span className="font-medium">{expiry}</span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-base-300">
        <span className="opacity-50">Delegation Manager</span>
        <span className="font-mono text-xs">{shortAddress(p?.delegationManager)}</span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="opacity-50">Status</span>
        <span className="text-success font-semibold">Active</span>
      </div>
    </div>
  );
};

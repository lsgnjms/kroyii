"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RequestExecutionPermissionsReturnType,
  erc7710BundlerActions,
  erc7715ProviderActions,
} from "@metamask/smart-accounts-kit/actions";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { Hex, parseEther } from "viem";
import { createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { sepolia } from "viem/chains";
import { useAccount, useWalletClient } from "wagmi";
import { useSessionAccount } from "~~/app/agent/providers/SessionAccountProvider";

const PERMISSIONS_KEY = "kroyii_permissions_v2";

const serialize = (val: any): string =>
  JSON.stringify(val, (_, v) => (typeof v === "bigint" ? { __bigint: v.toString() } : v));

const deserialize = (str: string): any =>
  JSON.parse(str, (_, v) => (v && typeof v === "object" && "__bigint" in v ? BigInt(v.__bigint) : v));

export const usePermissions = () => {
  const [grantedPermissions, setGrantedPermissionsState] = useState<RequestExecutionPermissionsReturnType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { sessionAccount } = useSessionAccount();
  const { data: walletClient } = useWalletClient();

  // Load persisted permissions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERMISSIONS_KEY);
      if (saved) {
        const parsed = deserialize(saved);
        setGrantedPermissionsState(parsed);
      }
    } catch {
      localStorage.removeItem(PERMISSIONS_KEY);
    }
  }, []);

  const setGrantedPermissions = useCallback((perms: RequestExecutionPermissionsReturnType | null) => {
    setGrantedPermissionsState(perms);
    if (perms) {
      try {
        localStorage.setItem(PERMISSIONS_KEY, serialize(perms));
      } catch {}
    } else {
      localStorage.removeItem(PERMISSIONS_KEY);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }
    if (!sessionAccount) {
      setError("Session account not ready");
      return;
    }
    if (!walletClient) {
      setError("Wallet client not ready");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = walletClient!.extend(erc7715ProviderActions());
      const currentTime = Math.floor(Date.now() / 1000);
      const periodDuration = 86400;
      const expiry = currentTime + 30 * 86400;

      const permission = await client.requestExecutionPermissions([
        {
          chainId: sepolia.id,
          expiry,
          to: sessionAccount.address as `0x${string}`,
          permission: {
            type: "native-token-periodic",
            data: {
              periodAmount: parseEther("0.001"),
              periodDuration,
              justification: "Request permisison to spend 0.001 ETH per day",
              startTime: currentTime,
            },
            isAdjustmentAllowed: true,
          },
        },
      ]);

      setGrantedPermissions(permission);
    } catch (err: any) {
      setError(err.message || "Failed to request permission");
      console.error("Permission request error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address, sessionAccount, walletClient]);

  const redeemPermission = useCallback(
    async (to?: string, amount?: string) => {
      if (!grantedPermissions) {
        setError("Permission not found");
        return;
      }
      if (!sessionAccount) {
        setError("Session account not available");
        return;
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
        if (!pimlicoKey) throw new Error("Pimlico API key not configured");

        const bundlerClient = createBundlerClient({
          transport: http(`https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoKey}`),
          paymaster: true,
        }).extend(erc7710BundlerActions());

        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(),
        });

        const pimlicoClient = createPimlicoClient({
          transport: http(`https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoKey}`),
        });

        const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

        const hash = await bundlerClient.sendUserOperationWithDelegation({
          publicClient,
          account: sessionAccount,
          calls: [
            {
              to: (to || sessionAccount.address) as Hex,
              value: parseEther(amount || "0.0000001"),
              permissionContext: grantedPermissions[0].context,
              delegationManager: grantedPermissions[0].delegationManager as `0x${string}`,
            },
          ],
          ...fee,
        });

        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash });
        setTxHash(receipt.transactionHash);
      } catch (err: any) {
        const raw = err.message || "";
        if (raw.includes("0xb5863604") || raw.includes("reverted during simulation")) {
          setError(
            "Transaction failed: You may have exceeded your daily spending limit. " +
              "Please try a smaller amount or wait for your allowance to reset.",
          );
        } else if (raw.includes("reverted")) {
          setError(
            "Transaction failed: The requested amount may exceed your remaining daily limit. " +
              "Try a smaller amount like 0.0000001 ETH.",
          );
        } else {
          setError(raw || "Failed to redeem permission");
        }
        console.error("Permission redeem error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [grantedPermissions, sessionAccount],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    grantedPermissions,
    setGrantedPermissions,
    isLoading,
    error,
    txHash,
    requestPermission,
    redeemPermission,
    clearError,
  };
};

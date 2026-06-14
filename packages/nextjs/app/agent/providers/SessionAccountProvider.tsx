"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Implementation, MetaMaskSmartAccount, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";

const SESSION_KEY_STORAGE = "kroyii_session_key";

export const SessionAccountContext = createContext({
  sessionAccount: null as MetaMaskSmartAccount | null,
});

export const SessionAccountProvider = ({ children }: { children: React.ReactNode }) => {
  const publicClient = usePublicClient();
  const [sessionAccount, setSessionAccount] = useState<MetaMaskSmartAccount | null>(null);

  const createSessionAccount = useCallback(async () => {
    if (!publicClient) return;

    // Reuse existing private key or generate a new one
    let privateKey = localStorage.getItem(SESSION_KEY_STORAGE) as Hex | null;
    if (!privateKey) {
      privateKey = generatePrivateKey();
      localStorage.setItem(SESSION_KEY_STORAGE, privateKey);
    }

    const account = privateKeyToAccount(privateKey as Hex);
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [account.address as Hex, [], [], []],
      deploySalt: "0x",
      signer: { account },
    });

    setSessionAccount(smartAccount);
  }, [publicClient]);

  useEffect(() => {
    createSessionAccount();
  }, []);

  return <SessionAccountContext.Provider value={{ sessionAccount }}>{children}</SessionAccountContext.Provider>;
};

export const useSessionAccount = () => {
  return useContext(SessionAccountContext);
};

"use client";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { aptos, RawJsonPayload, validateTransfer } from "move-pay-sdk";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { AccountAddress, AccountAddressInput, InputEntryFunctionData } from "@aptos-labs/ts-sdk";

export default function Home() {
  const searchParams = useSearchParams();
  const nonce = searchParams.get("nonce");
  const data = searchParams.get("data");
  const [message, setMessage] = useState<string | undefined>();
  const wallet = useWallet();

  useEffect(() => {
    const process = async () => {
      if (wallet.account && nonce && data) {
        try{
          await validateTransfer(wallet.account.address, aptos);
        }catch(err){
          console.log("Account Validation failed", err);
        }
        const response = await fetch('/api/decrypt', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nonce: nonce, data: data })
        });
        const result: RawJsonPayload = await response.json();
        setMessage(result.message);

        const sign = await wallet.signAndSubmitTransaction({
          data: result.data as InputEntryFunctionData
        });

        const executed = await aptos.waitForTransaction({
          transactionHash: sign.hash
        });

        executed.success ? setMessage("Success") : setMessage("Unsuccessful");
      }
    };

    process();
  }, [nonce, data, wallet.account]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden relative">
      <div className="gradient-bg"></div>
      <div className="bg-white/75 text-black p-4 rounded-lg shadow-lg relative z-10">
        <p className="text-lg font-semibold mb-4">{message}</p>
        <WalletSelector/>
      </div>
    </div>
  );
}

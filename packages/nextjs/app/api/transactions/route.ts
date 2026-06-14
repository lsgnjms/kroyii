import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Etherscan API key not configured" }, { status: 500 });
    }

    const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "0" && data.message !== "No transactions found") {
      return NextResponse.json({ error: data.message }, { status: 500 });
    }

    const transactions = (data.result || []).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: (Number(tx.value) / 1e18).toFixed(7),
      timestamp: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
      status: tx.isError === "0" ? "success" : "failed",
      gasUsed: tx.gasUsed,
    }));

    return NextResponse.json({ transactions });
  } catch (err: any) {
    console.error("Transactions route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

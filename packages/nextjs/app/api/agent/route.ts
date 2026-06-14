import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { instruction, walletAddress, permissionContext } = await req.json();

    if (!instruction) {
      return NextResponse.json({ error: "Instruction is required" }, { status: 400 });
    }

    const veniceApiKey = process.env.VENICE_API_KEY;
    if (!veniceApiKey) {
      return NextResponse.json({ error: "Venice API key not configured" }, { status: 500 });
    }

    const systemPrompt = `You are Kroyii, an autonomous onchain AI agent. 
You have been granted permission to execute transactions on behalf of a MetaMask user.
The user's wallet address is: ${walletAddress}

Your job is to interpret the user's natural language instruction and decide what onchain action to take.
You can only perform ETH transfers for now.

IMPORTANT: You must respond with ONLY a valid JSON object, no extra text, no markdown, no explanation.
The JSON must have this exact structure:
{
  "action": "transfer",
  "to": "<recipient ethereum address>",
  "amount": "<amount in ETH as a string e.g. 0.0000001>",
  "reasoning": "<one sentence explaining what you are doing>"
}

If the instruction is unclear or unsafe, respond with:
{
  "action": "none",
  "reasoning": "<one sentence explaining why you cannot proceed>"
}`;

    const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${veniceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: instruction },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Venice API error:", errorText);
      return NextResponse.json({ error: "Venice AI request failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;

    // Safely parse the JSON response from Venice
    try {
      const clean = rawContent.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json({ result: parsed });
    } catch {
      console.error("Failed to parse Venice response:", rawContent);
      return NextResponse.json({ error: "Failed to parse AI response", raw: rawContent }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Agent route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

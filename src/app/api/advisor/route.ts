import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { query } from "@/lib/database";
import { GoogleGenAI } from "@google/genai";


// Helper function to get user's financial data
async function getUserFinancialData(userId: string) {
  try {
    const expenses = await query("SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId]);
    const assets = await query("SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    const liabilities = await query("SELECT * FROM liabilities WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    const categories = await query("SELECT * FROM categories WHERE user_id = ?", [userId]);

    return {
      expenses: expenses.rows,
      assets: assets.rows,
      liabilities: liabilities.rows,
      categories: categories.rows,
    };
  } catch (error) {
    console.error("Error fetching user financial data:", error);
    return null;
  }
}

// Helper function to call Google Gemini API using @google/genai
async function callGeminiAPI(prompt: string, financialContext: any) {
  // Support both GOOGLE_GEMINI_API_KEY and GOOGLE_API_KEY environment variables
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google Gemini API key not configured");
  }

  const systemPrompt = `You are a professional financial advisor AI assistant with access to the user's comprehensive financial data. Provide personalized, practical advice that is helpful, professional, and focused on actionable recommendations. Answer the user's question precisely without unnecessary summaries.

FINANCIAL OVERVIEW:
 • Assets: ₹${financialContext.totalAssets.toLocaleString()}, 
 • Asset Portfolio: ${financialContext.assetTypes.join(", ") || "No assets recorded"}
 • Liabilities: ₹${financialContext.totalLiabilities.toLocaleString()})


SPENDING PATTERNS:
• Current Month: ₹${financialContext.monthlyExpenseTotal.toLocaleString()}
• Last 30 Days: ₹${financialContext.recentExpenseTotal.toLocaleString()}
• All-Time Total: ₹${financialContext.totalExpenses.toLocaleString()}
• Primary Categories: ${financialContext.topCategories.slice(0, 3).join(", ") || "No recent expenses"}

BUDGET STATUS:
${Object.keys(financialContext.budgetAnalysis).length > 0 ? 
  Object.entries(financialContext.budgetAnalysis)
    .slice(0, 5)
    .map(([category, data]: [string, any]) => {
      const percentage = ((data.spent/data.budget)*100);
      const status = percentage > 100 ? "⚠️ OVER" : percentage > 80 ? "⚡ HIGH" : "✅ OK";
      return `• ${category}: ₹${data.spent.toLocaleString()}/₹${data.budget.toLocaleString()} (${percentage.toFixed(0)}% ${status})`;
    })
    .join("\n") 
  : "• No active budgets configured"}

CONTEXT: ${financialContext.expenseCount} expenses, ${financialContext.assetCount} assets, ${financialContext.liabilityCount} liabilities tracked

Based on this financial data, provide specific, actionable advice tailored to the user's question. Reference relevant numbers and trends when making recommendations.`;

  const fullPrompt = `${systemPrompt}\n\nUser Question: ${prompt}`;

  try {
    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    // Generate content using the new SDK
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1000,
      }
    });

    return response.text || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Helper function to calculate financial context
function calculateFinancialContext(financialData: any) {
  const totalAssets = financialData.assets.reduce((sum: number, asset: any) => sum + Number(asset.value || asset.amount || 0), 0);
  const totalLiabilities = financialData.liabilities.reduce((sum: number, liability: any) => sum + Number(liability.amount || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // All expenses total
  const totalExpenses = financialData.expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);

  // Recent expenses (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentExpenses = financialData.expenses.filter((expense: any) => {
    const expenseDate = new Date(expense.date || expense.created_at);
    return expenseDate >= thirtyDaysAgo;
  });
  const recentExpenseTotal = recentExpenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);

  // Current month expenses
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = financialData.expenses.filter((expense: any) => {
    const expenseDate = new Date(expense.date || expense.created_at);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  const monthlyExpenseTotal = monthlyExpenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);

  // Category-wise breakdown (using string category field)
  const categoryTotals: { [key: string]: number } = {};
  recentExpenses.forEach((expense: any) => {
    const categoryName = expense.category || "Uncategorized";
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Number(expense.amount || 0);
  });

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([name, amount]) => `${name} (₹${(amount as number).toLocaleString()})`);

  // Asset breakdown
  const assetTypes: { [key: string]: number } = {};
  financialData.assets.forEach((asset: any) => {
    const type = asset.type || "Other";
    assetTypes[type] = (assetTypes[type] || 0) + Number(asset.value || asset.amount || 0);
  });

  // Category budgets vs spending
  const budgetAnalysis: { [key: string]: { budget: number; spent: number; } } = {};
  financialData.categories.forEach((cat: any) => {
    if (cat.budget) {
      const spent = recentExpenses
        .filter((exp: any) => exp.category === cat.name)
        .reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
      budgetAnalysis[cat.name] = {
        budget: Number(cat.budget),
        spent: spent
      };
    }
  });

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    totalExpenses,
    recentExpenseTotal,
    monthlyExpenseTotal,
    topCategories,
    assetTypes: Object.entries(assetTypes).map(([type, value]) => `${type}: ₹${(value as number).toLocaleString()}`),
    budgetAnalysis,
    expenseCount: financialData.expenses.length,
    assetCount: financialData.assets.length,
    liabilityCount: financialData.liabilities.length
  };
}

// POST: Send message to AI advisor
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user's financial data
    const financialData = await getUserFinancialData(userId);
    if (!financialData) {
      return NextResponse.json({ error: "Could not fetch financial data" }, { status: 500 });
    }

    // Calculate financial context
    const financialContext = calculateFinancialContext(financialData);

    // Call Gemini API
    try {
      const aiResponse = await callGeminiAPI(message, financialContext);
      
      return NextResponse.json({
        response: aiResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError);
      
      // Check if it's an API key issue
      if (geminiError.message?.includes("API key not configured")) {
        return NextResponse.json(
          { error: "AI service not configured. Please contact administrator." },
          { status: 503 }
        );
      }
      
      // Fallback response if Gemini API fails
      const fallbackResponse = `I apologize, but I'm currently experiencing technical difficulties connecting to the AI service. However, based on your financial data, here's a quick summary:

📊 FINANCIAL OVERVIEW:
• Net Worth: ₹${financialContext.netWorth.toLocaleString()}
• Monthly Expenses: ₹${financialContext.monthlyExpenseTotal.toLocaleString()}
• Recent Spending (30 days): ₹${financialContext.recentExpenseTotal.toLocaleString()}

${financialContext.topCategories.length > 0 ? `💰 TOP SPENDING CATEGORIES:
${financialContext.topCategories.slice(0, 3).map(cat => `• ${cat}`).join('\n')}` : ''}

${Object.keys(financialContext.budgetAnalysis).length > 0 ? `📈 BUDGET STATUS:
${Object.entries(financialContext.budgetAnalysis).slice(0, 3).map(([category, data]: [string, any]) => 
  `• ${category}: ${((data.spent/data.budget)*100).toFixed(0)}% used`).join('\n')}` : ''}

For detailed AI-powered financial advice, please try again in a few moments.`;

      return NextResponse.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        isFailback: true,
      });
    }
  } catch (error) {
    console.error("Error in advisor API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

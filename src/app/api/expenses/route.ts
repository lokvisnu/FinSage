import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getAuthenticatedUserId } from "@/lib/auth";

// Helper function to get authenticated user ID
// GET: List all expenses for the authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
    [userId]
  );
  return NextResponse.json(result.rows);
}

// POST: Add a new expense for the authenticated user
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, category, description, date } = await req.json();
  if (!amount || !category || !date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await query(
    "INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?) RETURNING *",
    [userId, amount, category, description, date]
  );
  return NextResponse.json({ success: true }, { status: 200 });
}

// PUT: Update an expense for the authenticated user
export async function PUT(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, amount, category, description, date } = await req.json();
  if (!id || !amount || !category || !date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await query(
    "UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ? RETURNING *",
    [amount, category, description, date, id, userId]
  );
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

// DELETE: Delete an expense for the authenticated user
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing expense ID" }, { status: 400 });
  }

  const result = await query(
    "DELETE FROM expenses WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Expense deleted successfully" });
}

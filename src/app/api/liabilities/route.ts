import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getAuthenticatedUserId } from "@/lib/auth";



// GET: List all liabilities for the authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT * FROM liabilities WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return NextResponse.json(result.rows);
}

// POST: Add a new liability for the authenticated user
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, amount, description } = await req.json();
  if (!name || !amount) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  const result = await query(
    "INSERT INTO liabilities (user_id, name, amount, description) VALUES (?, ?, ?, ?) RETURNING *",
    [userId, name, amount, description]
  );
  return NextResponse.json({ success: true }, { status: 200 });
}

// PUT: Update a liability for the authenticated user
export async function PUT(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, amount, description } = await req.json();
  if (!id || !name || !amount) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await query(
    "UPDATE liabilities SET name = ?, amount = ?, description = ? WHERE id = ? AND user_id = ? RETURNING *",
    [name, amount, description, id, userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Liability not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Delete a liability for the authenticated user
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json(
      { error: "Missing liability ID" },
      { status: 400 }
    );
  }

  const result = await query(
    "DELETE FROM liabilities WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Liability not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Liability deleted successfully" });
}

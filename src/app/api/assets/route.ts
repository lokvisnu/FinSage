import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getAuthenticatedUserId } from "@/lib/auth";

// Helper function to get authenticated user ID

// GET: List all assets for the authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return NextResponse.json(result.rows);
}

// POST: Add a new asset for the authenticated user
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, type, amount, description } = await req.json();
  if (!name || !type || !amount) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await query(
    "INSERT INTO assets (user_id, name, type, amount, description) VALUES (?, ?, ?, ?, ?) RETURNING *",
    [userId, name, type, amount, description]
  );

  return NextResponse.json({ success: true }, { status: 200 });
}

// PUT: Update an asset for the authenticated user
export async function PUT(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, type, amount, description } = await req.json();
  if (!id || !name || !type || !amount) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await query(
    "UPDATE assets SET name = ?, type = ?, amount = ?, description = ? WHERE id = ? AND user_id = ? RETURNING *",
    [name, type, amount, description, id, userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

// DELETE: Delete an asset for the authenticated user
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing asset ID" }, { status: 400 });
  }

  const result = await query(
    "DELETE FROM assets WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Asset deleted successfully" });
}

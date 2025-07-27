import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getAuthenticatedUserId } from "@/lib/auth";
function toTitleCase(str:string):string{
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

// Helper function to get authenticated user ID

// GET: Get categories for the authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get categories from the categories table first
  const categoriesResult = await query(
    "SELECT * FROM categories WHERE user_id = ? ORDER BY name",
    [userId]
  );
  
  // Get unique categories from expenses for this user as fallback
  const expenseCategoriesResult = await query(
    "SELECT DISTINCT category FROM expenses WHERE user_id = ? AND category IS NOT NULL ORDER BY category",
    [userId]
  );
  
  const existingCategories = categoriesResult.rows || [];
  const expenseCategories = expenseCategoriesResult.rows?.map((row: any) => ({
    id: null,
    name: row.category,
    budget: null,
    user_id: userId,
    created_at: null
  })) || [];

  // Add some default categories if none exist
  const defaultCategories = [
    { id: null, name: "Food & Dining", budget: 0, user_id: userId, created_at: null },
    { id: null, name: "Transportation", budget: 0, user_id: userId, created_at: null },
    { id: null, name: "Healthcare", budget: 0, user_id: userId, created_at: null },
    { id: null, name: "Entertainment", budget: 0, user_id: userId, created_at: null },
    { id: null, name: "Shopping", budget: 0, user_id: userId, created_at: null },
    { id: null, name: "Bills & Utilities", budget: 0, user_id: userId, created_at: null },
    { id: null, name: "Other", budget: 0, user_id: userId, created_at: null },
  ];

  // Combine all categories and remove duplicates by name
  const allCategoryNames = new Set();
  const allCategories = [];
  
  // Add saved categories first
  for (const cat of existingCategories) {
    if (!allCategoryNames.has(cat.name)) {
      allCategories.push(cat);
      allCategoryNames.add(cat.name);
    }
  }
  
  // Add expense categories that aren't already saved
  for (const cat of expenseCategories) {
    if (!allCategoryNames.has(cat.name)) {
      allCategories.push(cat);
      allCategoryNames.add(cat.name);
    }
  }
  
  // Add default categories that aren't already present
  for (const cat of defaultCategories) {
    if (!allCategoryNames.has(cat.name)) {
      allCategories.push(cat);
      allCategoryNames.add(cat.name);
    }
  }

  return NextResponse.json(allCategories.sort((a, b) => a.name.localeCompare(b.name)));
}

// POST: Add a new category for the authenticated user
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, budget } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Category name is required" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      "INSERT INTO categories (user_id, name, budget) VALUES (?, ?, ?) RETURNING *",
      [userId, toTitleCase(name.trim()), budget || null]
    );
    
    return NextResponse.json({success:true}, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT: Update a category for the authenticated user
export async function PUT(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, budget } = await req.json();
  if (!id || !name?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      "UPDATE categories SET name = ?, budget = ? WHERE id = ? AND user_id = ? RETURNING *",
      [toTitleCase(name.trim()), budget || null, id, userId]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 409 }
      );
    }
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a category for the authenticated user
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
  }

  try {
    // Check if category is used in expenses
    const expenseCheck = await query(
      "SELECT COUNT(*) as count FROM expenses WHERE user_id = ? AND category = (SELECT name FROM categories WHERE id = ? AND user_id = ?)",
      [userId, id, userId]
    );
    
    if (expenseCheck.rows[0]?.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that is being used in expenses" },
        { status: 400 }
      );
    }

    const result = await query(
      "DELETE FROM categories WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

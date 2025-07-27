import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get("auth-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "No authentication token found", isAuthenticated: false },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token", isAuthenticated: false },
        { status: 401 }
      );
    }

    // Get user data from database
    const result = await query(
      "SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found", isAuthenticated: false },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
        },
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Token verification failed", isAuthenticated: false },
      { status: 401 }
    );
  }
}

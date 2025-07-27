import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verifyPassword, validateEmail, createToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check if user is already logged in
    const existingToken = req.cookies.get("auth-token")?.value;
    if (existingToken) {
      const decoded = await verifyToken(existingToken);
      if (decoded && decoded.userId) {
        // User is already authenticated, get user data
        const result = await query(
          "SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?",
          [decoded.userId]
        );
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          return NextResponse.json(
            {
              user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                createdAt: user.created_at,
              },
              message: "Already logged in",
              success: true,
              alreadyAuthenticated: true
            },
            { status: 200 }
          );
        }
      }
    }

    const { email, password } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await query(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create token
    const token = await createToken(user.id);

    // Set HTTP-only cookie and return user data
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
        },
        message: "Login successful",
        success:true
      },
      { status: 200 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { hashPassword, validateEmail, validatePassword, createToken, verifyToken } from "@/lib/auth";

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

    const { email, password, firstName, lastName } = await req.json();

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

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (existingUser?.rows?.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name) 
       VALUES (?, ?, ?, ?) 
       RETURNING id, email, first_name, last_name, created_at`,
      [email.toLowerCase(), hashedPassword, firstName || null, lastName || null]
    );
    let signed_user = result?.rows[0];
    if(signed_user)
      signed_user = await query("SELECT * FROM users WHERE email = ?",[email.toLowerCase()])
    
    const user = signed_user.rows[0];
    const token = await createToken(user.id);

    // Set HTTP-only cookie
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
        },
        message: "User created successfully"
      },
      { status: 201 }
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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

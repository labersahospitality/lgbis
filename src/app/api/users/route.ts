import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Verify the requester is a super admin
    const supabase = await createServerSupabaseClient();

    // Get session from cookies
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's profile to check role
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users from the users table
    const adminSupabase = createAdminClient();
    const {
      data: users,
      error: usersError,
    } = await adminSupabase.from('users').select('id, email, full_name, role, active, created_at, updated_at');

    if (usersError) {
      throw usersError;
    }

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is a super admin
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { email, password, full_name, role, active } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['super_admin', 'management', 'admin_input', 'auditor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Create the auth user
    const {
      data: { user },
      error: authError,
    } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm the email
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError || !user) {
      throw authError || new Error('Failed to create auth user');
    }

    // Create the profile in the users table
    const {
      data: newUser,
      error: userError,
    } = await adminSupabase
      .from('users')
      .insert({
        id: user.id,
        email,
        full_name,
        role,
        active: active ?? true, // default to active if not provided
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      // If there was an error creating the profile, we should clean up the auth user
      await adminSupabase.auth.admin.deleteUser(user.id);
      throw userError;
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
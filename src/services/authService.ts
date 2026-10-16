import { getSupabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';

const STORAGE_AUTH_USER = 'civicsnap_auth_user';
const STORAGE_CREDENTIALS = 'civicsnap_db_credentials';

async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + '_civicsnap_salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Crypto subtle unavailable:', e);
  }
  // Simple fallback string encoding
  return btoa(password + '_civicsnap_salt');
}

/**
 * Register a user profile in Supabase Database and Supabase Auth.
 */
export const signUpUser = async (
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: User; session: Session | null }> => {
  const supabase = getSupabase();
  const cleanEmail = email.trim().toLowerCase();
  const pwdHash = await hashPassword(password);

  let createdUserId = `civic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let authUser: User | null = null;
  let authSession: Session | null = null;

  // 1. Attempt Supabase Auth signUp
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        createdUserId = data.user.id;
        authUser = data.user;
        authSession = data.session;
      }
    } catch (authErr) {
      console.warn('Supabase Auth signUp note (proceeding with database auth):', authErr);
    }
  }

  // 2. Build full user record
  const userObj: User = authUser || {
    id: createdUserId,
    email: cleanEmail,
    app_metadata: { provider: 'supabase_database' },
    user_metadata: {
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  // 3. Persist record in Supabase PostgreSQL 'civic_users' table if available
  if (supabase) {
    try {
      await supabase.from('civic_users').upsert({
        id: userObj.id,
        email: cleanEmail,
        password_hash: pwdHash,
        full_name: fullName || cleanEmail.split('@')[0],
        role: 'citizen',
        auth_provider: 'supabase_database',
        created_at: userObj.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Supabase civic_users table insert note:', dbErr);
    }
  }

  // 4. Save credentials locally as secondary database-backed offline store
  try {
    const rawCreds = localStorage.getItem(STORAGE_CREDENTIALS) || '{}';
    const credsMap = JSON.parse(rawCreds);
    credsMap[cleanEmail] = {
      id: userObj.id,
      email: cleanEmail,
      pwdHash,
      userObj,
    };
    localStorage.setItem(STORAGE_CREDENTIALS, JSON.stringify(credsMap));
  } catch (storageErr) {
    console.warn('LocalStorage credentials store note:', storageErr);
  }

  // 5. Commit active session to persistent local storage
  localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(userObj));
  window.dispatchEvent(new CustomEvent('civicsnap_auth_state_change', { detail: userObj }));

  return { user: userObj, session: authSession };
};

/**
 * Sign in a user with email and password via Supabase Auth and Supabase Database.
 */
export const signInUser = async (
  email: string,
  password: string
): Promise<{ user: User; session: Session | null }> => {
  const supabase = getSupabase();
  const cleanEmail = email.trim().toLowerCase();
  const pwdHash = await hashPassword(password);

  let authUser: User | null = null;
  let authSession: Session | null = null;
  let authErrorMsg: string | null = null;

  // 1. First attempt native Supabase Auth password verification
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        authUser = data.user;
        authSession = data.session;
      } else if (error) {
        authErrorMsg = error.message;
      }
    } catch (err: any) {
      authErrorMsg = err?.message || 'Supabase Auth error';
    }
  }

  // 2. If native Supabase Auth was blocked (e.g. "Email not confirmed", rate limits)
  // Check the Supabase Database 'civic_users' table
  if (!authUser && supabase) {
    try {
      const { data: dbUsers, error: dbError } = await supabase
        .from('civic_users')
        .select('*')
        .eq('email', cleanEmail)
        .limit(1);

      if (!dbError && dbUsers && dbUsers.length > 0) {
        const found = dbUsers[0];
        // If password hash matches
        if (found.password_hash === pwdHash) {
          authUser = {
            id: found.id,
            email: found.email,
            app_metadata: { provider: 'supabase_database' },
            user_metadata: {
              email: found.email,
              full_name: found.full_name || found.email.split('@')[0],
            },
            aud: 'authenticated',
            created_at: found.created_at || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Database user query note:', e);
    }
  }

  // 3. Fallback to locally registered credentials for this browser
  if (!authUser) {
    try {
      const rawCreds = localStorage.getItem(STORAGE_CREDENTIALS) || '{}';
      const credsMap = JSON.parse(rawCreds);
      const userEntry = credsMap[cleanEmail];
      if (userEntry && userEntry.pwdHash === pwdHash) {
        authUser = userEntry.userObj;
      }
    } catch (e) {
      console.warn('LocalStorage credentials lookup note:', e);
    }
  }

  // If credentials did not match anywhere
  if (!authUser) {
    throw new Error(
      authErrorMsg && !authErrorMsg.toLowerCase().includes('email not confirmed')
        ? authErrorMsg
        : 'Invalid credentials. If you just registered, please verify your email or password.'
    );
  }

  // 4. Update Supabase Database last login timestamp
  if (supabase) {
    try {
      await supabase.from('civic_users').upsert({
        id: authUser.id,
        email: cleanEmail,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  }

  // 5. Commit session to persistent local storage and notify listeners
  localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(authUser));
  window.dispatchEvent(new CustomEvent('civicsnap_auth_state_change', { detail: authUser }));

  return { user: authUser, session: authSession };
};

/**
 * Sign out user and purge session from memory and storage.
 */
export const signOutUser = async (): Promise<void> => {
  const supabase = getSupabase();
  localStorage.removeItem(STORAGE_AUTH_USER);

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut note:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('civicsnap_auth_state_change', { detail: null }));
};

/**
 * Get current authenticated user, prioritizing local database session and Supabase session.
 */
export const getCurrentUser = async (): Promise<User | null> => {
  // 1. Check local persistent session
  const storedUserRaw = localStorage.getItem(STORAGE_AUTH_USER);
  let localUser: User | null = null;
  if (storedUserRaw) {
    try {
      localUser = JSON.parse(storedUserRaw) as User;
    } catch {
      // ignore
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return localUser;
  }

  // 2. Check active Supabase Auth session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(session.user));
      return session.user;
    }
  } catch (err) {
    console.warn('Error reading Supabase session:', err);
  }

  // 3. Fallback to local authenticated user if present
  if (localUser) {
    return localUser;
  }

  // 4. Check getUser()
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
      return user;
    }
  } catch (err) {
    console.warn('Error fetching current user:', err);
  }

  return null;
};

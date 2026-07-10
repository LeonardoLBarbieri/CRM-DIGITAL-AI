import { createClient } from '@supabase/supabase-js';

// We need SUPABASE_URL and SUPABASE_ANON_KEY for storage and client-side access
// However, the user provided DATABASE_URL and DIRECT_URL.
// The Supabase URL is the base URL of the database:
// e.g. https://aws-1-sa-east-1.pooler.supabase.com -> https://ybbjbyeyhxoysvojljco.supabase.co
// The user provided the project ID previously: org/ybbjbyeyhxoysvojljco (ybbjbyeyhxoysvojljco)
// So the URL is https://ybbjbyeyhxoysvojljco.supabase.co

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybbjbyeyhxoysvojljco.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-to-be-replaced';

export const supabase = createClient(supabaseUrl, supabaseKey);

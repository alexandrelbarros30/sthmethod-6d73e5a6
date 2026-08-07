import { createClient } from '@supabase/supabase-js';
import { createHipertrofiaMaxProgram } from '../src/lib/create-hipertrofia-max';

async function run() {
  const url = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || '';
  
  // Use a minimal client without localStorage for the script
  const adminClient = createClient(url, key);
  
  const userId = '00000000-0000-0000-0000-000000000000';
  console.log('Running sync for Hipertrofia Max 1.0...');
  
  const result = await createHipertrofiaMaxProgram(userId);
  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

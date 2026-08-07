import { createHipertrofiaMaxProgram } from '../src/lib/create-hipertrofia-max';
import { supabase } from '../src/integrations/supabase/client';

async function run() {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';
  console.log('Using userId:', userId);
  const result = await createHipertrofiaMaxProgram(userId);
  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

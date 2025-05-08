/**
Tanda seru (!) di TypeScript ini namanya non-null assertion operator
Variable tidak akan undefined atau null ketika dipakai
*/

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default supabase;

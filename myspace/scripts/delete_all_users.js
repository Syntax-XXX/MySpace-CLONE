/**
 * Danger: permanently deletes auth users. Run only with service role key.
 * Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function listAllUsers() {
  let users = [];
  let page = 1;
  const per_page = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, per_page });
    if (error) throw error;
    if (!data?.users || data.users.length === 0) break;
    users = users.concat(data.users);
    if (data.users.length < per_page) break;
    page++;
  }
  return users;
}

(async () => {
  try {
    const users = await listAllUsers();
    console.log('Found users:', users.length);
    for (const u of users) {
      console.log('Deleting', u.id, u.email);
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (error) console.error('Delete error for', u.id, error);
    }
    console.log('Auth users deletion finished');
  } catch (err) {
    console.error('Error', err);
  }
})();
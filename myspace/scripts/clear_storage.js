/**
 * Remove all objects from listed buckets. Uses service role key.
 * Set environment variables before running:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function clearBucket(bucket) {
  console.log('Clearing bucket', bucket);
  // list all files (may need paging for many objects)
  const { data: list, error: listErr } = await supabase.storage.from(bucket).list('', { limit: 1000 });
  if (listErr) {
    console.error('List error', listErr);
    return;
  }
  const paths = list.map((f) => f.name);
  if (paths.length === 0) {
    console.log('No objects in', bucket);
    return;
  }
  const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
  if (rmErr) console.error('Remove error', rmErr);
  else console.log('Removed', paths.length, 'objects from', bucket);
}

(async () => {
  try {
    const buckets = ['public-avatars','public-backgrounds','private-media']; // adjust to your buckets
    for (const b of buckets) {
      await clearBucket(b);
    }
    console.log('Storage cleanup done');
  } catch (err) {
    console.error(err);
  }
})();
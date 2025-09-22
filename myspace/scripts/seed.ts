import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
    const seedFilePath = join(__dirname, '../supabase/seed/seed.sql');
    const seedSQL = readFileSync(seedFilePath, 'utf-8');

    try {
        const { data, error } = await supabase.rpc('execute_sql', { sql: seedSQL });
        if (error) {
            console.error('Error executing seed SQL:', error);
        } else {
            console.log('Database seeded successfully:', data);
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

seedDatabase();
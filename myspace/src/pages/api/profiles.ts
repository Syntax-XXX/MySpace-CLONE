import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { method } = req;

    switch (method) {
        case 'GET':
            const { data: profiles, error } = await supabase
                .from('users')
                .select('*');
            if (error) return res.status(400).json({ error: error.message });
            return res.status(200).json(profiles);

        case 'POST':
            const { username, email, bio, profile_picture, background_style } = req.body;
            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert([{ username, email, bio, profile_picture, background_style }]);
            if (createError) return res.status(400).json({ error: createError.message });
            return res.status(201).json(newProfile);

        case 'PUT':
            const { id, ...updates } = req.body;
            const { data: updatedProfile, error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id);
            if (updateError) return res.status(400).json({ error: updateError.message });
            return res.status(200).json(updatedProfile);

        case 'DELETE':
            const { profileId } = req.body;
            const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', profileId);
            if (deleteError) return res.status(400).json({ error: deleteError.message });
            return res.status(204).end();

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
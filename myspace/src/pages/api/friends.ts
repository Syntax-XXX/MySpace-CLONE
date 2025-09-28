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
            const { user_id } = req.query;
            const { data: friends, error } = await supabase
                .from('friends')
                .select('*')
                .eq('user_id', user_id);

            if (error) return res.status(400).json({ error: error.message });
            return res.status(200).json(friends);

        case 'POST':
            const { friend_id } = req.body;
            const { data: newFriend, error: postError } = await supabase
                .from('friends')
                .insert([{ user_id: req.body.user_id, friend_id, status: 'pending' }]);

            if (postError) return res.status(400).json({ error: postError.message });
            return res.status(201).json(newFriend);

        case 'DELETE':
            const { id } = req.body;
            const { error: deleteError } = await supabase
                .from('friends')
                .delete()
                .eq('id', id);

            if (deleteError) return res.status(400).json({ error: deleteError.message });
            return res.status(204).end();

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
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
            const { post_id } = req.query;
            const { data: comments, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', post_id)
                .order('created_at', { ascending: true });

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(comments);

        case 'POST':
            const { user_id, content } = req.body;
            const { data: newComment, error: insertError } = await supabase
                .from('comments')
                .insert([{ post_id: req.body.post_id, user_id, content }]);

            if (insertError) return res.status(500).json({ error: insertError.message });
            return res.status(201).json(newComment);

        case 'DELETE':
            const { id } = req.body;
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('id', id);

            if (deleteError) return res.status(500).json({ error: deleteError.message });
            return res.status(204).end();

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
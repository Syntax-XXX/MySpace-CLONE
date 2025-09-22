import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case 'GET':
            const { data: posts, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(posts);

        case 'POST':
            const { user_id, content } = req.body;
            const { data: newPost, error: postError } = await supabase
                .from('posts')
                .insert([{ user_id, content }])
                .single();

            if (postError) return res.status(500).json({ error: postError.message });
            return res.status(201).json(newPost);

        case 'DELETE':
            const { id } = req.body;
            const { error: deleteError } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (deleteError) return res.status(500).json({ error: deleteError.message });
            return res.status(204).end();

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
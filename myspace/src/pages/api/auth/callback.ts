import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '../../../lib/supabaseClient';

export default async function callback(req: NextApiRequest, res: NextApiResponse) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { access_token, refresh_token } = req.query;

    if (!access_token) {
        return res.status(400).json({ error: 'Access token is required' });
    }

    const { data, error } = await supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
    });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    // Redirect to the user's profile or home page after successful authentication
    res.redirect(`/profile/${data.user?.user_metadata.username}`);
}
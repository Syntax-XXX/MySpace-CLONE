import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function callback(req: NextApiRequest, res: NextApiResponse) {
    const { access_token, refresh_token } = req.query;

    if (!access_token) {
        return res.status(400).json({ error: 'Access token is required' });
    }

    const { user, error } = await supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
    });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    // Redirect to the user's profile or home page after successful authentication
    res.redirect(`/profile/${user?.user_metadata.username}`);
}
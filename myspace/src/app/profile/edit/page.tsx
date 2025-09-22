import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';

const EditProfilePage = () => {
    const router = useRouter();
    const { username } = router.query;
    const [profile, setProfile] = useState({
        bio: '',
        profile_picture: '',
        background_style: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
            setLoading(false);
        };

        if (username) {
            fetchProfile();
        }
    }, [username]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('users')
            .update(profile)
            .eq('username', username);

        if (error) {
            console.error('Error updating profile:', error);
        } else {
            router.push(`/profile/${username}`);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="bio">About Me</label>
                    <textarea
                        id="bio"
                        name="bio"
                        value={profile.bio}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                        rows="4"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="profile_picture">Profile Picture URL</label>
                    <input
                        type="text"
                        id="profile_picture"
                        name="profile_picture"
                        value={profile.profile_picture}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="background_style">Background Color</label>
                    <input
                        type="text"
                        id="background_style"
                        name="background_style"
                        value={profile.background_style}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    />
                </div>
                <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2">Save Changes</button>
            </form>
        </div>
    );
};

export default EditProfilePage;
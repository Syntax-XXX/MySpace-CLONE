import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CommentForm = ({ postId }) => {
    const [comment, setComment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment) return;

        const { data, error } = await supabase
            .from('comments')
            .insert([{ post_id: postId, content: comment }]);

        if (error) {
            console.error('Error adding comment:', error);
        } else {
            setComment('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col mt-4">
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="p-2 border rounded-md"
                rows="3"
            />
            <button
                type="submit"
                className="mt-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
                Submit
            </button>
        </form>
    );
};

export default CommentForm;
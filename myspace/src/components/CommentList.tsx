import React from 'react';

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="mt-4">
      {comments.length === 0 ? (
        <p className="text-gray-500">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 py-2">
            <p className="font-semibold">{comment.userId}</p>
            <p className="text-gray-700">{comment.content}</p>
            <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default CommentList;
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../lib/supabaseClient";

interface Post {
  id: string;
  content: string;
  media_urls?: string[];
  created_at: string;
  user_id: string;
  users: {
    id: string;
    username: string;
    display_name?: string;
    profile_picture?: string;
  };
  comments?: any[];
  likes_count?: number;
  comments_count?: number;
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    if (!supabase) return;
    
    try {
      // Toggle like state optimistically
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      
      // TODO: Implement actual like functionality with database
      // This would require a likes table and proper API endpoints
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setLikesCount(likesCount);
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !supabase) return;

    setLoading(true);
    try {
      // TODO: Implement actual comment functionality
      // This would require a comments table and proper API endpoints
      
      // For now, just add to local state
      const mockComment = {
        id: Date.now().toString(),
        content: newComment,
        created_at: new Date().toISOString(),
        user: {
          username: "current_user",
          display_name: "Current User",
          profile_picture: "/default-avatar.png",
        },
      };
      
      setComments([...comments, mockComment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.users.display_name || post.users.username}`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // TODO: Show toast notification
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  return (
    <article className="card p-6 hover:shadow-lg transition-shadow">
      {/* Post Header */}
      <div className="flex items-center space-x-3 mb-4">
        <Link
  href={`/profile/${post.users?.username ?? post.users?.id ?? "unknown"}`}
>
  <img
    src={post.users?.profile_picture ?? "/default-avatar.png"}
    alt={post.users?.display_name ?? post.users?.username ?? "User"}
    className="w-10 h-10 rounded-full"
  />
</Link>
        <div className="flex-1">
          <Link 
  href={`/profile/${post.users?.username ?? post.users?.id ?? "unknown"}`}
  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
>
  {post.users?.display_name ?? post.users?.username ?? "Unknown User"}
</Link>
          {post.users?.display_name && post.users?.username && (
  <p className="text-sm text-gray-600">@{post.users.username}</p>
)}

          <p className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</p>
        </div>
        
        {/* Post Menu */}
        <div className="relative group">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-2">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Save Post
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Report Post
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Hide Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        
        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2">
            {post.media_urls.map((url, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => {
                    // TODO: Open image in modal/lightbox
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all hover:scale-105 ${
              liked
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <svg
              className={`w-5 h-5 ${liked ? "fill-current" : ""}`}
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">{comments.length}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>

        {/* Bookmark Button */}
        <button className="p-2 rounded-lg text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 transition-all hover:scale-105">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          {/* Comment Form */}
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-3">
              <img
                src="/default-avatar.png"
                alt="Your avatar"
                className="avatar avatar-sm"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || loading}
                    className="btn btn-primary btn-sm"
                  >
                    {loading ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.user?.profile_picture || "/default-avatar.png"}
                  alt={comment.user?.display_name || comment.user?.username}
                  className="avatar avatar-sm"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.user?.display_name || comment.user?.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-900 text-sm">{comment.content}</p>
                  </div>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4 mt-2 ml-3">
                    <button className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                      Like
                    </button>
                    <button className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
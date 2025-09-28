"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";
import PostComposer from "../../components/PostComposer";
import PostCard from "../../components/PostCard";

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

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const loadFeed = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in to view your feed");
          setLoading(false);
          return;
        }
        setUser(user);

        // Load posts from friends and own posts
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select(`
            *,
            users (
              id,
              username,
              display_name,
              profile_picture
            )
          `)
          .order("created_at", { ascending: false })
          .limit(20);

        if (postsError) throw postsError;

        setPosts(posts || []);
      } catch (err: any) {
        console.error("Error loading feed:", err);
        setError(err?.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };

    loadFeed();

    // Set up real-time subscription for new posts
    const subscription = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          // Reload feed when new posts are added
          loadFeed();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleNewPost = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="modern-container py-8">
          <div className="modern-grid">
            <div className="main-content">
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/auth/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="modern-container py-8">
        <div className="modern-grid">
          {/* Sidebar */}
          <div className="sidebar">
            {/* User Profile Card */}
            <div className="card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={`/api/avatars/${user?.id}`}
                  alt="Your avatar"
                  className="avatar avatar-lg"
                  onError={(e: any) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
                  </h3>
                  <p className="text-sm text-gray-600">@{user?.email?.split("@")[0]}</p>
                </div>
              </div>
              <Link
                href={`/profile/${user?.id}`}
                className="btn btn-secondary w-full"
              >
                View Profile
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/friends" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Find Friends</div>
                    <div className="text-sm text-gray-600">Connect with people</div>
                  </div>
                </Link>

                <Link href="/profile/edit" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Customize Profile</div>
                    <div className="text-sm text-gray-600">Make it yours</div>
                  </div>
                </Link>

                <Link href="/messages" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Messages</div>
                    <div className="text-sm text-gray-600">Chat with friends</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Trending</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium text-gray-900">#ProfileCustomization</div>
                  <div className="text-sm text-gray-600">1.2k posts</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium text-gray-900">#MySpaceRevival</div>
                  <div className="text-sm text-gray-600">856 posts</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium text-gray-900">#SocialMedia</div>
                  <div className="text-sm text-gray-600">2.1k posts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {/* Post Composer */}
            <div className="card p-6 mb-6">
              <PostComposer onPostCreated={handleNewPost} />
            </div>

            {/* Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your feed is empty</h3>
                  <p className="text-gray-600 mb-6">
                    Start following friends or create your first post to see content here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/friends" className="btn btn-primary">
                      Find Friends
                    </Link>
                    <button
                      onClick={() => {
                        const composer = document.querySelector('textarea');
                        composer?.focus();
                      }}
                      className="btn btn-secondary"
                    >
                      Create Post
                    </button>
                  </div>
                </div>
              ) : (
                posts.map((post, index) => (
                  <PostCard key={post.id ?? `${post.users?.id}-${index}`} post={post} />
                ))
              )}
            </div>

            {/* Load More */}
            {posts.length > 0 && (
              <div className="text-center py-8">
                <button className="btn btn-secondary">
                  Load More Posts
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
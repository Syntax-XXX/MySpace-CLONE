"use client";

import React, { useState, useRef } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState("public");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !supabase) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      if (!token) throw new Error("No session token");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("content", content);
      formData.append("privacy", privacy);
      
      mediaFiles.forEach((file, index) => {
        formData.append(`media_${index}`, file);
      });

      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }

      const newPost = await response.json();
      
      // Reset form
      setContent("");
      setMediaFiles([]);
      setMediaPreview([]);
      setPrivacy("public");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component
      if (onPostCreated) {
        onPostCreated(newPost);
      }

    } catch (error: any) {
      console.error("Error creating post:", error);
      setError(error.message || "Failed to create post");
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 4 files
    const selectedFiles = files.slice(0, 4);
    setMediaFiles([...mediaFiles, ...selectedFiles].slice(0, 4));

    // Create preview URLs
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setMediaPreview([...mediaPreview, ...newPreviews].slice(0, 4));
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreview.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(mediaPreview[index]);
    
    setMediaFiles(newFiles);
    setMediaPreview(newPreviews);
  };

  const getCharacterCount = () => content.length;
  const getCharacterLimit = () => 500;
  const isOverLimit = () => getCharacterCount() > getCharacterLimit();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Main Input */}
      <div className="flex space-x-4">
        <img
          src="/default-avatar.png"
          alt="Your avatar"
          className="avatar avatar-md flex-shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className={`w-full p-4 border-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
              isOverLimit() ? "border-red-300" : "border-gray-200"
            }`}
            rows={3}
            maxLength={getCharacterLimit() + 50} // Allow slight overflow for warning
          />
          
          {/* Character Count */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500">
              <span className={isOverLimit() ? "text-red-500" : ""}>
                {getCharacterCount()}
              </span>
              <span className="text-gray-400">/{getCharacterLimit()}</span>
            </div>
            
            {/* Privacy Selector */}
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="private">🔒 Only Me</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Preview */}
      {mediaPreview.length > 0 && (
        <div className="ml-16">
          <div className="grid grid-cols-2 gap-3">
            {mediaPreview.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between ml-16">
        <div className="flex items-center space-x-4">
          {/* Media Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaFiles.length >= 4}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Photo</span>
          </button>

          {/* Emoji Picker (placeholder) */}
          <button
            type="button"
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Emoji</span>
          </button>

          {/* Poll (placeholder) */}
          <button
            type="button"
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium">Poll</span>
          </button>
        </div>

        {/* Post Button */}
        <button
          type="submit"
          disabled={!content.trim() || loading || isOverLimit()}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Posting...</span>
            </div>
          ) : (
            "Post"
          )}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleMediaSelect}
      />
    </form>
  );
}
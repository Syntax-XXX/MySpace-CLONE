"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import Link from 'next/link';

export default function HomePage() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users to feed
    window.location.href = '/feed';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-gradient mb-8">
              MySpace
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Express yourself, connect with friends, and build your digital identity. 
              The modern social network that puts <em>you</em> in control.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup" className="btn btn-primary text-lg px-8 py-4">
                🚀 Get Started
              </Link>
              <Link href="/auth/login" className="btn btn-secondary text-lg px-8 py-4">
                👋 Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MySpace?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the modern web with features that matter to you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Ultimate Customization',
                description: 'Design your profile exactly how you want it. Custom themes, layouts, colors, and backgrounds - your creativity is the limit.'
              },
              {
                icon: '🔒',
                title: 'Privacy First',
                description: 'Control who sees what. Granular privacy settings ensure your content reaches exactly who you want it to.'
              },
              {
                icon: '📱',
                title: 'Mobile Optimized',
                description: 'Beautiful on every device. Responsive design that works perfectly on desktop, tablet, and mobile.'
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Built with modern technology for instant loading and smooth interactions. No more waiting around.'
              },
              {
                icon: '🎵',
                title: 'Rich Media',
                description: 'Share photos, videos, music, and more. Express yourself with all types of content.'
              },
              {
                icon: '👥',
                title: 'Real Connections',
                description: 'Find and connect with friends, discover new people, and build meaningful relationships online.'
              }
            ].map((feature, index) => (
              <div key={index} className="card p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Showcase */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Make It Yours
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create a profile that truly represents you with our advanced customization tools
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Custom Themes</h3>
                  <p className="text-gray-600">Choose from beautiful presets or create your own color schemes and layouts.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Dynamic Sections</h3>
                  <p className="text-gray-600">Add, remove, and reorder profile sections. Share your interests, music, photos, and more.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔗</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Social Integration</h3>
                  <p className="text-gray-600">Connect all your social accounts and websites in one beautiful profile.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
                  <p className="text-gray-600">See your changes in real-time as you customize your profile.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="card p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Your Name</h3>
                    <p className="text-indigo-100">@username</p>
                  </div>
                </div>
                <p className="text-indigo-100 mb-6">
                  This is where your bio would go. Express yourself and let people know what you're all about!
                </p>
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">🎵 Now Playing</h4>
                    <p className="text-sm text-indigo-100">Your favorite song</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">📍 Location</h4>
                    <p className="text-sm text-indigo-100">Your city, country</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Express Yourself?
          </h2>
          <p className="text-xl text-indigo-100 mb-12">
            Join thousands of users who are already creating amazing profiles and connecting with friends.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold">
              🎉 Create Your Profile
            </Link>
            <Link href="/auth/login" className="btn border-2 border-white text-white hover:bg-white hover:text-indigo-600 text-lg px-8 py-4 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-gradient mb-4">MySpace</h3>
              <p className="text-gray-400 mb-4">
                The modern social network that puts you in control of your digital identity.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">📧</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">🐦</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">📷</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">💼</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Beta</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MySpace. Made with ❤️ for the modern web.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
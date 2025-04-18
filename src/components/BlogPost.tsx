"use client";

import { useEffect, useState } from "react";
import { getBlogBySlug, getBlogs } from "../lib/blogs";
import type { Blog } from "../lib/blogs";

export function BlogPost({ slug }: { slug: string }) {
  const [post, setPost] = useState<Blog | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
    loadRecentBlogs();
  }, [slug]);

  async function loadPost() {
    try {
      const post = await getBlogBySlug(slug);
      setPost(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blog post");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentBlogs() {
    try {
      const recentBlogs = await getBlogs();
      setBlogs(recentBlogs);
    } catch (err) {
      console.error("Failed to load recent blogs:", err);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#87B440] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600">Loading blog post...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-white pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Blog post not found</h1>
            <p className="text-gray-600 mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <a href="/blog" className="text-[#87B440] hover:underline">
              Back to Blog
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-serif mb-4">Blog</h1>
          <p className="text-xl">Read our blog from top talents</p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{post.category}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>By {post.author}</span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>

                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full rounded-lg"
                />

                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-line">{post.content}</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Search */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-4 py-2 rounded border border-gray-200"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2">
                    🔍
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Categories</h3>
                <ul className="space-y-2">
                  {[
                    { name: "Technology", count: 5 },
                    { name: "Business", count: 3 },
                    { name: "Career", count: 4 },
                    { name: "Industry", count: 2 }
                  ].map((category, index) => (
                    <li key={index} className="flex justify-between items-center text-gray-900">
                      <span>{category.name}</span>
                      <span className="text-gray-500">({category.count})</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent Posts */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Recent Posts</h3>
                <div className="space-y-4">
                  {blogs.slice(0, 3).map((recentPost) => (
                    <div key={recentPost.id} className="flex gap-4">
                      <img
                        src={recentPost.image_url}
                        alt={recentPost.title}
                        className="w-[73px] h-[73px] rounded object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 hover:text-[#87B440] cursor-pointer">
                          <a href={`/blog/${recentPost.slug}`}>{recentPost.title}</a>
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(recentPost.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
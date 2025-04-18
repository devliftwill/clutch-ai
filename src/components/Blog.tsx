"use client";

import { useEffect, useState } from "react";
import { getBlogs } from "../lib/blogs";
import type { Blog } from "../lib/blogs";
import { Skeleton } from "./ui/skeleton";

function BlogSkeleton() {
  return (
    <div className="group">
      <div className="relative">
        <Skeleton className="w-full h-64 rounded-lg" />
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-4">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function Blog() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      const blogs = await getBlogs();
      setBlogs(blogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-serif mb-4">Blog</h1>
          <p className="text-xl">Read our latest articles</p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          {error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                Array(6).fill(0).map((_, index) => (
                  <BlogSkeleton key={index} />
                ))
              ) : (
                blogs.map((post) => (
                  <a href={`/blog/${post.slug}`} key={post.id}>
                    <div className="group cursor-pointer">
                      <div className="relative">
                        <img 
                          src={post.image_url} 
                          alt={post.title} 
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <span className="absolute bottom-4 left-4 bg-[#87B440] text-white text-xs px-3 py-1 rounded">
                          {post.category}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-[#87B440] transition-colors">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-gray-600 line-clamp-2">{post.excerpt}</p>
                        <div className="mt-4">
                          <span className="text-[#87B440] text-sm group-hover:underline">
                            Continue Reading →
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
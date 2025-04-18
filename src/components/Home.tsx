"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Code, Video, Palette, Headphones, Building2, MapPin, Calendar, UserPlus, FileText, Zap } from "lucide-react";
import { Link } from "./ui/link";
import { getJobs } from "../lib/jobs";
import type { Job } from "../lib/jobs";
import { Skeleton } from "./ui/skeleton";
import { JobSearch } from "./JobSearch";

function JobSkeleton() {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-300" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-300" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const result = await getJobs();
      // Handle the updated return structure from getJobs
      const fetchedJobs = result?.jobs || [];
      setJobs(fetchedJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (query: string) => {
    if (query) {
      window.location.href = `/jobs?search=${encodeURIComponent(query)}`;
    }
  };

  return (
    <main className="min-h-screen overflow-hidden">      
      {/* Hero Section */}
      <section className="relative h-screen bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-white text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 px-4">
            Empowering Your Next Career Move.
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl px-4">
            Discover the future of hiring. Clutch Jobs' AI guides every step, connecting top talent with visionary employers. Your dream job or perfect candidate is just a click away.
          </p>
          
          <div className="w-full max-w-2xl px-4">
            <JobSearch 
              onSearch={handleSearch}
              placeholder="Search jobs by title, company, or location..."
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Most Demanding Categories.</h2>
            <a href="#" className="text-[#87B440] hover:underline">
              Explore all fields →
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Palette, label: "UI/UX Design", bg: "bg-blue-50" },
              { icon: Code, label: "Development", bg: "bg-yellow-50" },
              { icon: Headphones, label: "Telemarketing", bg: "bg-pink-50" },
              { icon: Building2, label: "Marketing", bg: "bg-green-50" },
              { icon: Video, label: "Editing", bg: "bg-purple-50" },
              { icon: Building2, label: "Accounting", bg: "bg-orange-50" },
            ].map((category, index) => (
              <div
                key={index}
                className={`${category.bg} p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer`}
              >
                <category.icon className="w-6 h-6 mb-2 text-[#87B440]" />
                <span className="text-sm font-medium text-gray-900">{category.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="py-20 bg-[#166A9A] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Let's get started.</h2>
            <p className="text-3xl mb-4">It's <span className="text-[#87B440]">effortless</span>.</p>
            <p className="text-lg text-white">
              Unlock opportunities with our AI-powered platform that seamlessly connects top talent with visionary employers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: UserPlus,
                title: "Set up your profile in minutes.",
                cta: "JOIN NOW",
                ctaClass: "text-[#87B440]"
              },
              {
                icon: FileText,
                title: "Discover tailored job matches and top talent.",
                cta: "EXPLORE",
                ctaClass: "text-[#87B440]"
              },
              {
                icon: Zap,
                title: "Experience seamless, AI-powered hiring.",
                cta: "LEARN MORE",
                ctaClass: "text-[#87B440]"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-8 hover:bg-white/20 transition-colors">
                <div className="bg-[#87B440] w-12 h-12 rounded-full flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <a href="#" className={`${item.ctaClass} text-sm font-medium hover:underline`}>
                  {item.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Powered Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative w-[400px] h-[400px]">
                {/* Outer circle */}
                <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
                
                {/* Middle circle */}
                <div className="absolute inset-8 rounded-full border-2 border-gray-100" />
                
                {/* Center circle with Clutch logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <img 
                    src="/logo-icon.jpg" 
                    alt="Clutch" 
                    className="w-10 h-10 object-cover object-center"
                  />
                </div>

                {/* Orbital items */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="w-12 h-12" />
                </div>
                <div className="absolute top-1/2 right-0 translate-x-1/2">
                  <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
                    <img 
                      src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                      alt="Google" 
                      className="w-8 h-8"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 right-1/4 translate-y-1/2">
                  <div className="w-12 h-12 bg-[#4285f4] rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-1/4 left-0 -translate-x-1/2">
                  <div className="w-12 h-12 bg-[#4285f4] rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900 mb-4">AI POWERED</p>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Let our intelligent AI handle the heavy lifting.</h2>
              <p className="text-gray-900 mb-8">
                Our cutting-edge engine works behind the scenes to automate candidate matching, skill development, and application tracking—so you can focus on success.
              </p>
              <Button className="bg-[#87B440] hover:bg-[#759C37] text-white">
                Discover How →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* New Job Listings Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">New job listings</h2>
            <Link href="/jobs" className="text-[#87B440] hover:underline">
              Explore all jobs →
            </Link>
          </div>
          
          {error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, index) => (
                <JobSkeleton key={index} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Jobs Found</h2>
              <p className="text-gray-600">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...jobs].slice(0, 4).map((job) => (
                <div key={job.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {job.company?.avatar_url ? (
                        <img 
                          src={job.company.avatar_url} 
                          alt={`${job.company.company_name} logo`}
                          className="w-12 h-12 rounded-full object-cover bg-white"
                        />
                      ) : (
                        <div className="bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">
                          {job.company?.company_name} • {job.type}
                        </p>
                      </div>
                    </div>
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline">Details</Button>
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={job.created_at}>
                        {new Date(job.created_at).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
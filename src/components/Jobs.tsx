"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { MapPin, Calendar, Building2, ChevronLeft, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { getJobs, getLocations } from "../lib/jobs";
import type { Job } from "../lib/jobs";
import { Skeleton } from "./ui/skeleton";
import { JobSearch } from "./JobSearch";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import React from "react";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Remote"
];

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Junior",
  "Mid Level", 
  "Senior",
  "Lead",
  "Executive"
];

const WORK_SCHEDULES = [
  "Full-time",
  "Part-time",
  "Flexible",
  "Shifts",
  "On-call",
  "Weekends",
  "Nights"
];

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

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-medium mb-3 text-left"
      >
        <h3>{title}</h3>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="animate-accordion-down">
          {children}
        </div>
      )}
    </div>
  );
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as string[],
    experienceLevels: [] as string[],
    workSchedules: [] as string[],
    location: "all" as string
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    console.log('Jobs component initialized');
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered - forcing loading to false');
      setLoading(false);
    }, 8000); // 8 seconds max loading time
    
    setShowFilters(window.innerWidth >= 768);

    const handleResize = () => {
      setShowFilters(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(safetyTimeout);
    };
  }, []);

  useEffect(() => {
    console.log('Loading initial jobs data');
    try {
      // Load locations
      const loadLocations = async () => {
        try {
          const locations = await getLocations();
          setLocations(locations);
        } catch (err) {
          console.error('Error loading locations:', err);
        }
      };
      loadLocations();

      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      const typesParam = params.get('types')?.split(',').filter(Boolean) || [];
      const experienceParam = params.get('experience')?.split(',').filter(Boolean) || [];
      const scheduleParam = params.get('schedule')?.split(',').filter(Boolean) || [];
      const locationParam = params.get('location') || "all";

      setSearchQuery(searchParam || "");
      setFilters({
        types: typesParam,
        experienceLevels: experienceParam,
        workSchedules: scheduleParam,
        location: locationParam
      });

      loadJobs(searchParam || "", {
        types: typesParam,
        experienceLevels: experienceParam,
        workSchedules: scheduleParam,
        location: locationParam
      }, 0, true);
    } catch (err) {
      console.error('Error in jobs initialization:', err);
      setError('Failed to initialize jobs page');
      setLoading(false);
    }
  }, []);

  async function loadJobs(query: string, jobFilters = filters, currentPage: number, reset: boolean = false) {
    console.log('Loading jobs:', { query, jobFilters, currentPage, reset });
    try {
      setLoadingMore(true);
      const { jobs: newJobs, hasMore: more } = await getJobs(query, jobFilters, currentPage);
      console.log(`Loaded ${newJobs.length} jobs, hasMore: ${more}`);
      
      if (reset) {
        setJobs(newJobs);
      } else {
        setJobs(prev => [...prev, ...newJobs]);
      }
      
      setHasMore(more);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      console.log('Setting loading states to false');
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const lastJobElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          loadJobs(searchQuery, filters, nextPage);
          return nextPage;
        });
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, searchQuery, filters]);

  const handleSearch = (query: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('search', query);
    window.location.href = url.toString();
  };

  const handleFilterChange = (category: keyof typeof filters, value: string) => {
    const newFilters = { ...filters };
    if (category === 'location') {
      newFilters.location = value;
    } else {
      const currentValues = newFilters[category] as string[];
      if (currentValues.includes(value)) {
        newFilters[category] = currentValues.filter(v => v !== value) as any;
      } else {
        newFilters[category] = [...currentValues, value] as any;
      }
    }
    setFilters(newFilters);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (filters.types.length) params.set('types', filters.types.join(','));
    if (filters.experienceLevels.length) params.set('experience', filters.experienceLevels.join(','));
    if (filters.workSchedules.length) params.set('schedule', filters.workSchedules.join(','));
    if (filters.location !== 'all') params.set('location', filters.location);

    window.location.href = `${window.location.pathname}?${params.toString()}`;
  };

  const resetFilters = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="w-full max-w-2xl mx-auto">
            <JobSearch 
              onSearch={handleSearch}
              placeholder="Search jobs by title..."
              initialValue={searchQuery}
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${jobs.length} jobs found`}
            </p>
          </div>

          <div className="flex gap-8 relative">
            <div 
              className={`transition-all duration-300 ease-in-out ${
                showFilters 
                  ? 'w-80 opacity-100 relative md:relative absolute md:translate-x-0 z-20 bg-white md:bg-transparent' 
                  : 'w-0 opacity-0 absolute -translate-x-full md:translate-x-0'
              }`}
            >
              <div className="md:sticky md:top-4" style={{ position: 'sticky', top: '20px' }}>
                <form onSubmit={handleFilterSubmit} className="bg-white rounded-lg border p-6 overflow-y-auto max-h-[calc(100vh-100px)]">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">Filters</h2>
                      <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-gray-400 hover:text-gray-600 transition-colors md:hidden"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={resetFilters}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Reset
                    </Button>
                  </div>

                  <FilterSection title="Location">
                    <Select
                      value={filters.location}
                      onValueChange={(value) => handleFilterChange('location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterSection>

                  <FilterSection title="Employment Type">
                    <div className="space-y-2">
                      {EMPLOYMENT_TYPES.map((type) => (
                        <div key={type} className="flex items-center">
                          <Checkbox
                            id={`type-${type}`}
                            checked={filters.types.includes(type)}
                            onCheckedChange={() => handleFilterChange('types', type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Experience Level">
                    <div className="space-y-2">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <div key={level} className="flex items-center">
                          <Checkbox
                            id={`level-${level}`}
                            checked={filters.experienceLevels.includes(level)}
                            onCheckedChange={() => handleFilterChange('experienceLevels', level)}
                          />
                          <label
                            htmlFor={`level-${level}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {level}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Work Schedule">
                    <div className="space-y-2">
                      {WORK_SCHEDULES.map((schedule) => (
                        <div key={schedule} className="flex items-center">
                          <Checkbox
                            id={`schedule-${schedule}`}
                            checked={filters.workSchedules.includes(schedule)}
                            onCheckedChange={() => handleFilterChange('workSchedules', schedule)}
                          />
                          <label
                            htmlFor={`schedule-${schedule}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {schedule}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  <Button 
                    type="submit"
                    className="w-full bg-[#87B440] hover:bg-[#759C37] mt-6"
                  >
                    Apply Filters
                  </Button>
                </form>
              </div>
            </div>

            <div className="flex-1">
              {error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, index) => (
                    <JobSkeleton key={index} />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Jobs Found</h2>
                  <p className="text-gray-600">
                    {searchQuery || Object.values(filters).some(arr => arr.length > 0)
                      ? "Try adjusting your search terms or filters"
                      : "Check back later for new opportunities"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job, index) => {
                    if (jobs.length === index + 1) {
                      return (
                        <div ref={lastJobElementRef} key={job.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {job.company?.avatar_url ? (
                                <img 
                                  src={job.company.avatar_url} 
                                  alt={`${job.company.company_name} logo`}
                                  className="w-12 h-12 rounded-full object-cover bg-white"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-[#166A9A] font-semibold text-xl">
                                    {job.company?.company_name?.[0] || 'C'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.company?.company_name}</p>
                              </div>
                            </div>
                            <a href={`/jobs/${job.id}`}>
                              <Button variant="outline">Details</Button>
                            </a>
                          </div>
                          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              <span>{job.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
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
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-[#166A9A] font-semibold text-xl">
                                    {job.company?.company_name?.[0] || 'C'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.company?.company_name}</p>
                              </div>
                            </div>
                            <a href={`/jobs/${job.id}`}>
                              <Button variant="outline">Details</Button>
                            </a>
                          </div>
                          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              <span>{job.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  {loadingMore && (
                    <div className="space-y-4 mt-4">
                      {Array(2).fill(0).map((_, index) => (
                        <JobSkeleton key={`loading-more-${index}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
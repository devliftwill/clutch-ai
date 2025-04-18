"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Building2, Globe, MapPin, Briefcase } from "lucide-react";
import { getCompanies } from "../lib/companies";
import type { Company } from "../lib/companies";
import { Skeleton } from "./ui/skeleton";

function CompanySkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-300" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-300" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-300" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

export function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const companies = await getCompanies();
      setCompanies(companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-serif mb-4">Companies</h1>
          <p className="text-xl">Discover great companies hiring now</p>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          {error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(6).fill(0).map((_, index) => (
                  <CompanySkeleton key={index} />
                ))
              ) : companies.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Companies Found</h2>
                  <p className="text-gray-600">Check back later for new companies</p>
                </div>
              ) : (
                companies.map((company) => (
                  <div key={company.id} className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {company.avatar_url ? (
                        <img 
                          src={company.avatar_url} 
                          alt={`${company.company_name} logo`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{company.company_name}</h2>
                        <p className="text-sm text-gray-600">
                          {company._count?.jobs || 0} open positions
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 text-sm text-gray-600">
                      {company.industry && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Canada</span>
                      </div>
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#87B440] hover:underline"
                          >
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    <a href={`/jobs?company=${company.id}`}>
                      <Button className="w-full bg-[#87B440] hover:bg-[#759C37]">
                        <Briefcase className="w-4 h-4 mr-2" />
                        View Jobs
                      </Button>
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
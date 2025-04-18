"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

interface JobSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export function JobSearch({ 
  onSearch, 
  placeholder = "Search jobs...", 
  className = "",
  initialValue = "" 
}: JobSearchProps) {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-6 py-4 rounded-lg text-black text-sm pr-24"
      />
      <Button 
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#87B440] hover:bg-[#759C37]"
      >
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </form>
  );
}
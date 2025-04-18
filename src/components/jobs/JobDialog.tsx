"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { supabase } from "../../lib/auth";
import type { Database } from "../../lib/database.types";
import type { ExperienceLevel } from "../../lib/database.types";
import { getProfile } from "../../lib/auth";

type Job = Database['public']['Tables']['jobs']['Row'];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
  "Remote"
] as const;

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "Entry Level",
  "Junior",
  "Mid Level",
  "Senior",
  "Lead",
  "Executive"
];

const SALARY_PERIODS = [
  "HOUR",
  "DAY",
  "WEEK",
  "MONTH",
  "YEAR"
] as const;

const CURRENCIES = [
  "CAD",
  "USD"
] as const;

const COMMON_BENEFITS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "Life Insurance",
  "401(k) / RRSP",
  "Paid Time Off",
  "Remote Work",
  "Flexible Hours",
  "Professional Development",
  "Gym Membership",
  "Stock Options",
  "Performance Bonus"
];

const WORK_SCHEDULES = [
  "Full-time",
  "Part-time",
  "Flexible",
  "Shifts",
  "On-call",
  "Weekends",
  "Nights"
] as const;

export function JobDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    location: "",
    overview: "",
    requirements: [] as string[],
    responsibilities: [] as string[],
    salary_min: "",
    salary_max: "",
    salary_currency: "CAD",
    salary_period: "YEAR",
    experience_level: "Entry Level" as ExperienceLevel,
    benefits: [] as string[],
    work_schedule: "Full-time",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        type: job.type,
        location: job.location,
        overview: job.overview,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        salary_min: job.salary_min?.toString() || "",
        salary_max: job.salary_max?.toString() || "",
        salary_currency: job.salary_currency,
        salary_period: job.salary_period,
        experience_level: job.experience_level,
        benefits: job.benefits,
        work_schedule: job.work_schedule,
      });
    } else {
      setFormData({
        title: "",
        type: "",
        location: "",
        overview: "",
        requirements: [""],
        responsibilities: [""],
        salary_min: "",
        salary_max: "",
        salary_currency: "CAD",
        salary_period: "YEAR",
        experience_level: "Entry Level",
        benefits: [],
        work_schedule: "Full-time",
      });
    }
  }, [job]);

  const validateSalaryRange = () => {
    const minSalary = formData.salary_min ? parseFloat(formData.salary_min) : null;
    const maxSalary = formData.salary_max ? parseFloat(formData.salary_max) : null;

    // If both values are empty, that's valid (no salary range specified)
    if (!minSalary && !maxSalary) {
      return true;
    }

    // If only one value is provided, that's invalid
    if ((minSalary && !maxSalary) || (!minSalary && maxSalary)) {
      setError("Please provide both minimum and maximum salary, or leave both empty");
      return false;
    }

    // Only validate that max is greater than min and max is less than 10M
    if (minSalary && maxSalary) {
      if (maxSalary > 10000000) {
        setError("Maximum salary cannot exceed 10,000,000");
        return false;
      }

      if (minSalary > maxSalary) {
        setError("Maximum salary must be greater than minimum salary");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate salary range before proceeding
    if (!validateSalaryRange()) {
      return;
    }

    setLoading(true);

    try {
      const profile = await getProfile();
      if (!profile) throw new Error("Not authenticated");

      const jobData = {
        ...formData,
        requirements: formData.requirements.filter(Boolean),
        responsibilities: formData.responsibilities.filter(Boolean),
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        company_id: profile.id,
      };

      if (job) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', job.id);

        if (error) throw error;
      } else {
        // Create new job
        const { error } = await supabase
          .from('jobs')
          .insert([jobData]);

        if (error) throw error;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-semibold text-gray-900">
            {job ? "Edit Job Posting" : "Create New Job Posting"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title" className="text-gray-900">Job Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-gray-900">Employment Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" className="text-gray-900">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1"
              placeholder="e.g., Toronto, Remote"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary_min" className="text-gray-900">Minimum Salary</Label>
              <Input
                id="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={(e) => {
                  setFormData({ ...formData, salary_min: e.target.value });
                  setError(null); // Clear error when user starts typing
                }}
                className="mt-1"
                placeholder="e.g., 50000"
                step="1000"
              />
            </div>
            <div>
              <Label htmlFor="salary_max" className="text-gray-900">Maximum Salary</Label>
              <Input
                id="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={(e) => {
                  setFormData({ ...formData, salary_max: e.target.value });
                  setError(null); // Clear error when user starts typing
                }}
                className="mt-1"
                placeholder="e.g., 80000"
                step="1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary_currency" className="text-gray-900">Currency</Label>
              <Select
                value={formData.salary_currency}
                onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salary_period" className="text-gray-900">Pay Period</Label>
              <Select
                value={formData.salary_period}
                onValueChange={(value) => setFormData({ ...formData, salary_period: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_PERIODS.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="experience_level" className="text-gray-900">Experience Level</Label>
            <Select
              value={formData.experience_level}
              onValueChange={(value) => setFormData({ ...formData, experience_level: value as ExperienceLevel })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="work_schedule" className="text-gray-900">Work Schedule</Label>
            <Select
              value={formData.work_schedule}
              onValueChange={(value) => setFormData({ ...formData, work_schedule: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select work schedule" />
              </SelectTrigger>
              <SelectContent>
                {WORK_SCHEDULES.map((schedule) => (
                  <SelectItem key={schedule} value={schedule}>
                    {schedule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-900">Benefits</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {COMMON_BENEFITS.map((benefit) => (
                <label key={benefit} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.benefits.includes(benefit)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          benefits: [...formData.benefits, benefit]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          benefits: formData.benefits.filter(b => b !== benefit)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-[#87B440] focus:ring-[#87B440]"
                  />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="overview" className="text-gray-900">Job Overview</Label>
            <Textarea
              id="overview"
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-gray-900">Requirements</Label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...formData.requirements];
                    newReqs[index] = e.target.value;
                    setFormData({ ...formData, requirements: newReqs });
                  }}
                  placeholder={`Requirement ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newReqs = formData.requirements.filter((_, i) => i !== index);
                    setFormData({ ...formData, requirements: newReqs });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ ...formData, requirements: [...formData.requirements, ""] })}
              className="mt-2"
            >
              Add Requirement
            </Button>
          </div>

          <div>
            <Label className="text-gray-900">Responsibilities</Label>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={resp}
                  onChange={(e) => {
                    const newResps = [...formData.responsibilities];
                    newResps[index] = e.target.value;
                    setFormData({ ...formData, responsibilities: newResps });
                  }}
                  placeholder={`Responsibility ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newResps = formData.responsibilities.filter((_, i) => i !== index);
                    setFormData({ ...formData, responsibilities: newResps });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ ...formData, responsibilities: [...formData.responsibilities, ""] })}
              className="mt-2"
            >
              Add Responsibility
            </Button>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#87B440] hover:bg-[#759C37]"
              disabled={loading}
            >
              {loading ? "Saving..." : (job ? "Update Job" : "Create Job")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
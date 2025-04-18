"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { signUp, signInWithGoogle } from "../lib/auth";
import type { IndustryType } from "../lib/database.types";

const INDUSTRIES: IndustryType[] = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Media',
  'Construction',
  'Transportation',
  'Entertainment',
  'Agriculture',
  'Energy',
  'Real Estate',
  'Hospitality',
  'Consulting',
  'Other'
];

export function Register() {
  const [accountType, setAccountType] = useState<"candidates" | "employer">("candidates");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    website: "",
    industry: "" as IndustryType | "",
    resume: null as File | null,
    agreeToTerms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Validate terms agreement
      if (!formData.agreeToTerms) {
        throw new Error("Please agree to the Terms and Conditions");
      }

      // Prepare registration data
      const registrationData = {
        full_name: formData.name,
        account_type: accountType,
        ...(accountType === "employer" && {
          company_name: formData.companyName,
          website: formData.website,
          industry: formData.industry,
        }),
      };

      // Register user with Supabase
      await signUp(formData.email, formData.password, registrationData);

      // Redirect to success page or show success message
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle(accountType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up with Google");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-serif mb-4">Register</h1>
          <p className="text-xl">Create an account & Start posting or hiring talents</p>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-20">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Create Account</h2>
            <p className="text-center text-gray-600 mb-8">
              Select an account type and enter your details to get started
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 mb-8">
              <Button
                variant={accountType === "candidates" ? "default" : "outline"}
                className={`flex-1 ${
                  accountType === "candidates" ? "bg-[#166A9A]" : ""
                }`}
                onClick={() => setAccountType("candidates")}
                type="button"
              >
                Candidates
              </Button>
              <Button
                variant={accountType === "employer" ? "default" : "outline"}
                className={`flex-1 ${
                  accountType === "employer" ? "bg-[#166A9A]" : ""
                }`}
                onClick={() => setAccountType("employer")}
                type="button"
              >
                Employer
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password*
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password*
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              {accountType === "employer" && (
                <>
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name*
                    </label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Enter your company name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData({ ...formData, industry: value as IndustryType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {accountType === "candidates" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="resume"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-[#166A9A] hover:text-[#166A9A]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#166A9A]"
                        >
                          <span>Upload a file</span>
                          <input
                            id="resume"
                            name="resume"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                              setFormData({ ...formData, resume: e.target.files?.[0] || null })
                            }
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                  required
                />
                <label
                  htmlFor="agreeToTerms"
                  className="text-sm text-gray-700"
                >
                  I agree to the{" "}
                  <a href="/terms" className="text-[#166A9A] hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  &{" "}
                  <a href="/privacy" className="text-[#166A9A] hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#87B440] hover:bg-[#759C37]"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "REGISTER"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-200"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <img
                  src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Sign up with Google
              </Button>

              <p className="text-center text-sm text-gray-600">
                Have an account?{" "}
                <a href="#" className="text-[#166A9A] hover:underline" onClick={() => window.history.back()}>
                  Sign In
                </a>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
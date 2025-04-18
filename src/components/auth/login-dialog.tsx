"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { signIn, signInWithGoogle, supabase } from "../../lib/auth";

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    keepLoggedIn: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(formData.email, formData.password);
      onOpenChange(false);
      window.location.reload(); // Refresh to update auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle('candidates');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Welcome Back</DialogTitle>
          <p className="text-center text-gray-600">
            Sign in to your account to continue
          </p>
        </DialogHeader>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email*
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keepLoggedIn"
                checked={formData.keepLoggedIn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, keepLoggedIn: checked as boolean })
                }
              />
              <label
                htmlFor="keepLoggedIn"
                className="text-sm text-gray-700"
              >
                Keep me logged in
              </label>
            </div>
            <a href="#" className="text-sm text-[#166A9A] hover:underline">
              Forget Password?
            </a>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#87B440] hover:bg-[#759C37]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "LOGIN"}
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
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Login with Google
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-[#166A9A] hover:underline" onClick={() => onOpenChange(false)}>
              Sign up
            </a>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
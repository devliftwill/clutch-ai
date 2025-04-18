"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { getProfile, signOut, supabase } from "../../lib/auth";
import type { Profile } from "../../lib/auth";
import { ProfileDialog } from "./profile-dialog";
import { SettingsDialog } from "./settings-dialog";

export function UserAvatar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    loadProfile();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Don't use await here, just set loading state and call the function
        setIsLoading(true);
        loadProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const profile = await getProfile();
      setProfile(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Avatar>
        <AvatarFallback className="bg-gray-200">
          <span className="animate-pulse">...</span>
        </AvatarFallback>
      </Avatar>
    );
  }

  if (!profile) return null;

  const initials = profile.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || profile.email[0].toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-[#87B440] text-white">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-gray-900">{profile.full_name}</p>
              <p className="text-xs leading-none text-gray-500">{profile.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-gray-700 hover:text-gray-900"
            onClick={() => setShowProfileDialog(true)}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer text-gray-700 hover:text-gray-900"
            onClick={() => setShowSettingsDialog(true)}
          >
            Settings
          </DropdownMenuItem>
          {profile.account_type === 'employer' ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-gray-700 hover:text-gray-900"
                onClick={() => window.location.href = '/jobs/manage'}
              >
                Job Postings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-gray-700 hover:text-gray-900"
                onClick={() => window.location.href = '/applications/employer'}
              >
                View Applications
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-gray-700 hover:text-gray-900"
                onClick={() => window.location.href = '/applications'}
              >
                My Applications
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 hover:text-red-700" 
            onClick={() => signOut()}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </>
  );
}
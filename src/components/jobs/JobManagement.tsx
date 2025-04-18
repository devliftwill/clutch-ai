"use client";

import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../lib/auth";
import type { Database } from "../../lib/database.types";
import { JobDialog } from "./JobDialog";
import { getProfile } from "../../lib/auth";
import { Switch } from "../../components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Skeleton } from "../../components/ui/skeleton";

type Job = Database['public']['Tables']['jobs']['Row'];

function JobSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

export function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const profile = await getProfile();
      if (!profile) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setShowJobDialog(true);
  };

  const handleDelete = async (job: Job) => {
    setJobToDelete(job);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobToDelete.id);

      if (error) throw error;
      await loadJobs();
      setShowDeleteDialog(false);
      setJobToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  const toggleJobStatus = async (job: Job) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ active: !job.active })
        .eq('id', job.id);

      if (error) throw error;
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job status");
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-white">Manage Job Postings</h1>
            <Button 
              onClick={() => {
                setSelectedJob(null);
                setShowJobDialog(true);
              }}
              className="bg-[#87B440] hover:bg-[#759C37]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Postings Yet</h3>
              <p className="text-gray-600 mb-6">Start by creating your first job posting</p>
              <Button 
                onClick={() => {
                  setSelectedJob(null);
                  setShowJobDialog(true);
                }}
                className="bg-[#87B440] hover:bg-[#759C37]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post New Job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                    !job.active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="space-y-1 text-gray-600">
                        <p>{job.type} • {job.location}</p>
                        <div className="flex items-center gap-4">
                          <p className="text-sm">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Active</span>
                            <Switch
                              checked={job.active}
                              onCheckedChange={() => toggleJobStatus(job)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(job)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(job)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <JobDialog
        open={showJobDialog}
        onOpenChange={setShowJobDialog}
        job={selectedJob}
        onSuccess={loadJobs}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
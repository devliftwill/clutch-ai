"use client";

import { useEffect, useState } from "react";
import { getApplications, deleteApplication } from "../lib/applications";
import type { Application } from "../lib/applications";
import { Building2, ExternalLink, Trash2, Calendar } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

function ApplicationSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

function ApplicationCard({ application, isDragging = false, onClick }: { 
  application: Application; 
  isDragging?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`bg-white rounded-lg border p-6 mb-4 ${
        isDragging ? 'shadow-xl scale-105' : 'hover:shadow-md'
      } transition-all cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-center gap-4 mb-4">
        {application.job?.company?.avatar_url ? (
          <img 
            src={application.job.company.avatar_url} 
            alt={application.job.company.company_name || "Company logo"} 
            className="w-12 h-12 rounded-full object-cover bg-white"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">
            {application.job?.title}
          </h3>
          <p className="text-sm text-gray-600">
            {application.job?.company?.company_name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>{new Date(application.created_at).toLocaleDateString()}</span>
      </div>
      {onClick && (
        <Button 
          variant="ghost" 
          className="w-full mt-2 text-sm hover:bg-gray-50"
          onClick={onClick}
        >
          View Details
        </Button>
      )}
    </div>
  );
}

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const applications = await getApplications();
      setApplications(applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (application: Application) => {
    try {
      setDeleting(true);
      await deleteApplication(application.id);
      setApplications(applications.filter(app => app.id !== application.id));
      setApplicationToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-serif mb-4">My Applications</h1>
          <p className="text-xl">Track your job applications</p>
        </div>
      </section>

      {/* Applications List */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          {error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, index) => (
                <ApplicationSkeleton key={index} />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Applications Yet</h2>
              <p className="text-gray-600 mb-8">Start applying for jobs to see them here</p>
              <a href="/jobs" className="text-[#87B440] hover:underline">
                Browse Jobs
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {application.job?.company?.avatar_url ? (
                        <img 
                          src={application.job.company.avatar_url} 
                          alt={`${application.job.company.company_name} logo`}
                          className="w-12 h-12 rounded-full object-cover bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {application.job?.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {application.job?.company?.company_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/jobs/${application.job_id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Job
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setApplicationToDelete(application)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6">
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Applied on {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!applicationToDelete} 
        onOpenChange={(open) => !open && setApplicationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your application for {applicationToDelete?.job?.title} at {applicationToDelete?.job?.company?.company_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applicationToDelete && handleDelete(applicationToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
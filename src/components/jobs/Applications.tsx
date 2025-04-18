"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/auth";
import { Skeleton } from "../ui/skeleton";
import { Building2, Calendar, User, Briefcase } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Application = {
  id: string;
  status: 'Applied' | 'Qualified' | 'Interview' | 'Rejected';
  created_at: string;
  job: {
    title: string;
    company?: {
      company_name: string;
    };
  };
  candidate: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

function ApplicationSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4 mb-4">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function ApplicationCard({ application, isDragging = false, onClick }: { 
  application: Application; 
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const candidateName = application.candidate?.full_name || 'Unknown Candidate';

  return (
    <div 
      className={`bg-white rounded-lg border p-4 mb-4 ${
        isDragging ? 'shadow-xl scale-105' : 'hover:shadow-md'
      } transition-all cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-center gap-4 mb-4">
        {application.candidate?.avatar_url ? (
          <img 
            src={application.candidate.avatar_url} 
            alt={candidateName} 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-500 font-medium text-lg">
              {candidateName.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">
            {candidateName}
          </h3>
          <p className="text-sm text-gray-600">
            {application.job.title}
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

function DraggableCard({ application, onClick }: { application: Application; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    visibility: isDragging ? 'hidden' : 'visible',
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <ApplicationCard application={application} onClick={onClick} />
    </div>
  );
}

function Column({ id, title, applications, onCardClick }: { 
  id: string;
  title: string; 
  applications: Application[];
  onCardClick: (application: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const bgColors = {
    'Applied': 'bg-blue-50 border-blue-200',
    'Qualified': 'bg-yellow-50 border-yellow-200',
    'Interview': 'bg-green-50 border-green-200',
    'Rejected': 'bg-red-50 border-red-200'
  };

  const bgColor = bgColors[title as keyof typeof bgColors] || 'bg-gray-50 border-gray-200';

  return (
    <div 
      ref={setNodeRef}
      className={`${bgColor} rounded-lg p-4 min-h-[500px] border-2 transition-colors ${
        isOver ? 'border-[#87B440] bg-opacity-70 ring-2 ring-[#87B440] ring-opacity-50' : ''
      }`}
    >
      <h3 className="font-semibold text-lg mb-4 text-gray-900 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-sm font-normal text-gray-500">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </span>
      </h3>
      <SortableContext items={applications.map(app => app.id)} strategy={verticalListSortingStrategy}>
        {applications.map((application) => (
          <DraggableCard 
            key={application.id} 
            application={application}
            onClick={() => onCardClick(application)}
          />
        ))}
      </SortableContext>
    </div>
  );
}

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<{ id: string; title: string; applications: Application[] }[]>([
    { id: 'Applied', title: 'Applied', applications: [] },
    { id: 'Qualified', title: 'Qualified', applications: [] },
    { id: 'Interview', title: 'Interview', applications: [] },
    { id: 'Rejected', title: 'Rejected', applications: [] }
  ]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job:jobs(
            title,
            company:profiles(company_name)
          ),
          candidate:public_profiles!applications_candidate_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);

      // Group applications by status
      const newColumns = columns.map(column => ({
        ...column,
        applications: (data || []).filter(app => app.status === column.title)
      }));

      setColumns(newColumns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) return;

    const application = applications.find(app => app.id === active.id);
    if (!application) return;

    const targetColumnId = over.id as string;
    if (targetColumnId === application.status) return;

    try {
      // Optimistically update the UI
      const updatedApplications = applications.map(app =>
        app.id === application.id ? { ...app, status: targetColumnId as Application['status'] } : app
      );
      setApplications(updatedApplications);

      // Update columns immediately
      const newColumns = columns.map(column => ({
        ...column,
        applications: updatedApplications.filter(app => app.status === column.title)
      }));
      setColumns(newColumns);

      // Update status in database
      const { error } = await supabase
        .from('applications')
        .update({ status: targetColumnId })
        .eq('id', application.id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application status");
      // Reload applications to ensure UI is in sync with database
      loadApplications();
    } finally {
      setActiveId(null);
    }
  };

  const activeApplication = activeId ? applications.find(app => app.id === activeId) : null;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#166A9A] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-serif mb-4">Applications</h1>
          <p className="text-xl">Track and manage your job applications</p>
        </div>
      </section>

      {/* Kanban Board */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          {error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <Skeleton className="h-6 w-32 mb-6" />
                  {Array(3).fill(0).map((_, j) => (
                    <ApplicationSkeleton key={j} />
                  ))}
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Applications Yet</h2>
              <p className="text-gray-600">
                Your job postings haven't received any applications yet.
              </p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {columns.map((column) => (
                  <Column
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    applications={column.applications}
                    onCardClick={setSelectedApplication}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeApplication ? (
                  <div style={{ width: '100%' }}>
                    <ApplicationCard 
                      application={activeApplication} 
                      isDragging={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </section>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedApplication.candidate?.avatar_url ? (
                    <img 
                      src={selectedApplication.candidate.avatar_url} 
                      alt={selectedApplication.candidate.full_name || 'Candidate'} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-medium text-2xl">
                        {selectedApplication.candidate?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedApplication.candidate?.full_name || 'Unknown Candidate'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-medium">{selectedApplication.job.title}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{selectedApplication.job.company?.company_name || 'Company name not available'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedApplication.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                  selectedApplication.status === 'Qualified' ? 'bg-yellow-100 text-yellow-800' :
                  selectedApplication.status === 'Interview' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedApplication.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
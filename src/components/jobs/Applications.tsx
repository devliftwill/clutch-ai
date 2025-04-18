"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/auth";
import { Skeleton } from "../ui/skeleton";
import { Building2, Calendar, User, Briefcase, Play, Pause, Volume2, VolumeX, BarChart3, PieChart, Clock, User2, Video } from "lucide-react";
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
  video_url?: string;
  metadata?: {
    audio_url?: string;
    transcript?: string;
    [key: string]: any;
  };
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
          variant="secondary" 
          className="w-full mt-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900"
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
    visibility: isDragging ? 'hidden' : 'visible' as 'hidden' | 'visible',
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

function VideoPlayer({ src, poster }: { src?: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // Try to play the video and ensure it starts
      try {
        const playPromise = videoRef.current.play();
        
        // Handle async play promise
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
              setIsPlaying(true);
              // Force an initial progress update
              if (videoRef.current) {
                const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                setProgress(isNaN(currentProgress) ? 0 : currentProgress);
              }
            })
            .catch(error => {
              // Autoplay prevented or other error
              console.error("Video play error:", error);
              setHasError(true);
            });
        }
      } catch (e) {
        console.error("Video play exception:", e);
        setHasError(true);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const videoDuration = videoRef.current.duration;
    // Check if duration is a valid number before setting it
    if (videoDuration && isFinite(videoDuration)) {
      setDuration(videoDuration);
    } else {
      setDuration(0); // Default to 0 for invalid duration
    }
  };

  const formatTime = (seconds: number) => {
    // Make sure seconds is a valid number
    if (!isFinite(seconds) || isNaN(seconds)) {
      return "0:00"; 
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  useEffect(() => {
    return () => {
      // Cleanup
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  if (!src) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <Video className="w-12 h-12 opacity-40" />
        <p className="absolute bottom-4 text-sm">No video available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progress) ? 0 : progress}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-500 rounded-full appearance-none cursor-pointer accent-[#87B440]"
        />
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay}
              className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button 
              onClick={toggleMute}
              className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-xs">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>
          
          {hasError && (
            <span className="text-xs text-red-300">
              Error loading video
            </span>
          )}
        </div>
      </div>
      
      {/* Play button overlay */}
      {!isPlaying && (
        <button 
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          aria-label="Play video"
        >
          <Play className="w-8 h-8 text-white" />
        </button>
      )}
    </div>
  );
}

function StatCards() {
  // These would be real metrics in a production app
  const stats = [
    { label: "Technical Score", value: 78, icon: <BarChart3 className="w-4 h-4 text-blue-500" /> },
    { label: "Communication", value: 85, icon: <User2 className="w-4 h-4 text-green-500" /> },
    { label: "Interview Duration", value: "12:24", icon: <Clock className="w-4 h-4 text-purple-500" /> },
    { label: "Cultural Fit", value: 92, icon: <PieChart className="w-4 h-4 text-yellow-500" /> }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">{stat.label}</h4>
            {stat.icon}
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {typeof stat.value === 'number' ? `${stat.value}%` : stat.value}
          </p>
          {typeof stat.value === 'number' && (
            <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#87B440] rounded-full"
                style={{ width: `${stat.value}%` }}
              />
            </div>
          )}
        </div>
      ))}
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
          video_url,
          metadata,
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

      // Transform the data to match the Application type
      const typedApplications = (data || []).map(app => {
        // Ensure job and candidate fields are properly handled
        const jobData = Array.isArray(app.job) ? app.job[0] : app.job;
        const candidateData = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
        
        return {
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          video_url: app.video_url,
          metadata: app.metadata,
          job: {
            title: jobData?.title || 'Unknown Position',
            company: jobData?.company ? {
              company_name: Array.isArray(jobData.company) 
                ? jobData.company[0]?.company_name 
                : jobData.company?.company_name
            } : undefined
          },
          candidate: {
            id: candidateData?.id || '',
            full_name: candidateData?.full_name,
            avatar_url: candidateData?.avatar_url
          }
        };
      }) as Application[];

      setApplications(typedApplications);

      // Group applications by status
      const newColumns = columns.map(column => ({
        ...column,
        applications: typedApplications.filter(app => app.status === column.title)
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Candidate Info */}
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
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Briefcase className="w-4 h-4" />
                      <span>{selectedApplication.job.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
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

              {/* Video Player */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Interview Recording</h4>
                <VideoPlayer 
                  src={selectedApplication.video_url} 
                  poster={selectedApplication.candidate?.avatar_url || undefined} 
                />
              </div>

              {/* Audio Player */}
              {selectedApplication.metadata?.audio_url && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Interview Audio</h4>
                  <audio 
                    controls 
                    className="w-full rounded-lg" 
                    src={selectedApplication.metadata.audio_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Analytics */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Interview Analytics</h4>
                <StatCards />
              </div>

              {/* Transcript Preview */}
              {selectedApplication.metadata?.transcript && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Interview Transcript</h4>
                  <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4 text-sm">
                    <pre className="whitespace-pre-wrap font-sans">
                      {selectedApplication.metadata.transcript}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
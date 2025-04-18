"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Plus, Pencil, Trash2, MapPin, Calendar, Building2, Clock, DollarSign, Award, Heart, Globe, Video, Mic, X, ChevronLeft, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { getJob } from "../lib/jobs";
import { createApplication, checkApplication } from "../lib/applications";
import { getProfile } from "../lib/auth";
import type { Job } from "../lib/jobs";
import { Skeleton } from "./ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ChatWidget } from "./ui/chat-widget";
import { Conversation } from '@11labs/client';
import { supabase } from "../lib/supabase";
import { triggerStoreAudio } from "../lib/audio";

// Add this type at the top of the file
type DisconnectionDetails = {
  reason: string;
  message?: string;
  context?: any;
};

// Create a WeakMap to track connection state outside the component
const connectionStates = new WeakMap<Conversation, boolean>();

// Create a base64 encoded fallback image of a male avatar
const DEFAULT_MALE_AVATAR = `/recruiter.png`;

// Move formatTranscript outside the component since it doesn't use component state
const formatTranscript = (rawTranscript: string): Array<{message: string, sender: string}> => {
  if (!rawTranscript) return [];
  
  try {
    // Split the transcript by newlines to process each message
    const lines = rawTranscript.split('\n').filter(line => line.trim());
    
    // Process each line to extract message and sender
    return lines.map((line, index) => {
      try {
        // Try to extract a JSON object from the line
        let jsonData: any = null;
        
        // First try to parse the line as JSON
        try {
          if (line.includes('{') && line.includes('}')) {
            // Try to extract JSON from the line
            const jsonMatch = line.match(/(\{.*\})/);
            if (jsonMatch && jsonMatch[1]) {
              jsonData = JSON.parse(jsonMatch[1]);
            } else {
              // Try parsing the whole line
              jsonData = JSON.parse(line);
            }
          }
        } catch (jsonError) {
          // Continue to fallback handling
        }
        
        // If we successfully parsed JSON and it has source/message fields
        if (jsonData && (typeof jsonData === 'object')) {
          // Get the source information
          let sender = jsonData.source || jsonData.role || 'unknown';
          
          // Normalize sender values
          if (['ai', 'assistant', 'interviewer'].includes(sender.toLowerCase())) {
            sender = 'ai';
          } else if (['user', 'candidate', 'human'].includes(sender.toLowerCase())) {
            sender = 'user';
          }
          
          return {
            message: jsonData.message || jsonData.text || jsonData.content || '',
            sender: sender
          };
        }
        
        // If JSON parsing failed, try regex extraction
        const messageMatch = line.match(/message[":]*\s*["']?(.*?)["']?[,}]/);
        const sourceMatch = line.match(/source[":]*\s*["']?(.*?)["']?[,}]/);
        
        if (messageMatch || sourceMatch) {
          // Get sender, defaulting to alternating based on position if not found
          const sender = sourceMatch ? 
            sourceMatch[1].trim().toLowerCase() : 
            (index % 2 === 0 ? 'ai' : 'user');
          
          // Normalize sender
          const normalizedSender = 
            ['ai', 'assistant', 'interviewer'].includes(sender) ? 'ai' : 
            ['user', 'candidate', 'human'].includes(sender) ? 'user' : 
            sender;
          
          return {
            message: messageMatch ? messageMatch[1].trim() : line,
            sender: normalizedSender
          };
        }
        
        // Last resort fallback - clean up the line and guess sender based on position
        return {
          message: line.replace(/[{}"\[\]]/g, '').replace(/source:.*?,message:/, '').trim(),
          sender: index % 2 === 0 ? 'ai' : 'user' // Alternate based on position
        };
      } catch (e) {
        console.error('Error parsing line:', line, e);
        return {
          message: line,
          sender: 'unknown'
        };
      }
    });
  } catch (e) {
    console.error('Error processing transcript:', e);
    return [];
  }
};

// Update the MessageBubble component to clearly distinguish between AI and user
const MessageBubble = ({ message, sender }: { message: string, sender: string }) => {
  const isAI = sender === 'ai';
  
  return (
    <div className={`mb-4 ${isAI ? 'text-left' : 'text-right'}`}>
      {/* Display the sender label BEFORE the message for AI */}
      {isAI && (
        <div className="text-xs font-semibold text-gray-500 mb-1 ml-1">
          AI Interviewer
        </div>
      )}
      
      <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
        isAI ? 'bg-gray-100 text-gray-800' : 'bg-[#87B440] text-white'
      }`}>
        <p className="text-sm">{message}</p>
      </div>
      
      {/* Display the sender label AFTER the message for user */}
      {!isAI && (
        <div className="text-xs font-semibold text-gray-500 mt-1 mr-1">
          You
        </div>
      )}
    </div>
  );
};

function JobDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-white pt-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 w-2/3 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-1/3 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobDetails({ id }: { id: string }) {
  console.log('JobDetails component initialized with ID:', id);
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showScreeningDialog, setShowScreeningDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  
  // Add canvas reference and rendering state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(true);
  const videoRenderRef = useRef<number | null>(null);
  
  // Update the state type
  const [conversation, setConversation] = useState<any>(null);
  const [transcription, setTranscription] = useState<string>("");

  // Add these variable declarations
  const [videoStreamActive, setVideoStreamActive] = useState(true);
  const videoTrackMonitorRef = useRef<number | null>(null);
  const [isElevenLabsInitializing, setIsElevenLabsInitializing] = useState(false);
  const [isElevenLabsConnected, setIsElevenLabsConnected] = useState(false);

  // Define proper types for the recorder and chunks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Add audio context and destination node for capturing AI output
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioOutputRef = useRef<HTMLAudioElement | null>(null);
  // Add state to store all audio URLs from ElevenLabs
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  // Add state to store audio blobs for upload
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  // Add a reference to track audio fetch operations
  const pendingAudioFetches = useRef<Promise<any>[]>([]);

  // Add reference to track direct audio recording
  const directAudioChunksRef = useRef<Blob[]>([]);
  const directMediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Add state to store conversation ID
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Function to initialize recording with proper TypeScript typing
  const initializeRecording = (stream: MediaStream) => {
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      
      // Set up audio mixing instructions for user
      if (audioOutputRef.current) {
        console.log('🔊 IMPORTANT: Please enable "System Audio" in your screen capture settings to include AI voice');
      }
      
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      recorder.start();
      console.log('Recording started - remember to enable system sound to capture AI voice');
    } catch (err) {
      console.error('Error initializing recording:', err);
    }
  };

  // Add a canvas rendering function that runs in a loop
  const startCanvasRendering = () => {
    if (!canvasRef.current || !videoRef.current || !videoStream) {
      console.error('Canvas, video element, or stream not available');
      return;
    }
    
    // Stop any existing render loop
    if (videoRenderRef.current) {
      cancelAnimationFrame(videoRenderRef.current);
      videoRenderRef.current = null;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Draw function that runs recursively
    const drawVideo = () => {
      if (videoRef.current && canvasRef.current && videoStream && videoStreamActive) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        } catch (e) {
          console.error('Error drawing video to canvas:', e);
        }
      }
      videoRenderRef.current = requestAnimationFrame(drawVideo);
    };
    
    // Start the render loop
    drawVideo();
    console.log('Canvas rendering started');
  };

  // Add state variable for camera permission status
  const [cameraPermissionState, setCameraPermissionState] = useState<'pending' | 'granted' | 'denied' | 'error'>('pending');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);

  // Add global conversation ID reference
  let globalConversationId: string | null = null;

  // Modify the ElevenLabs initialization function
  const initializeElevenLabs = async () => {
    if (isElevenLabsInitializing || isElevenLabsConnected) {
      console.log('ElevenLabs is already initializing or connected');
      return;
    }
    
    setIsElevenLabsInitializing(true);
    console.log('🔌 Starting ElevenLabs initialization...');
    
    try {
      // Create audio context for processing
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        console.log('🔊 Created audio context for processing');
      }
      
      if (!job) {
        console.error('🔌 Job data missing, cannot initialize ElevenLabs');
        throw new Error('Job information is missing');
      }
      
      console.log('🔌 Using job data:', {
        title: job.title,
        company: job.company?.company_name,
        responsibilities: job.responsibilities.length,
        requirements: job.requirements.length
      });
      
      // Create the custom prompt
      const customPrompt = `
You are an AI recruiter conducting a video screening interview for a ${job.title} position at ${job.company?.company_name || "our company"}.

Job Details:
- Position: ${job.title}
- Company: ${job.company?.company_name || "our company"}
- Location: ${job.location}
- Experience Level: ${job.experience_level}

Key Requirements:
${job.requirements.map(req => `- ${req}`).join('\n')}

Key Responsibilities:
${job.responsibilities.map(resp => `- ${resp}`).join('\n')}

Your task is to interview the candidate in a professional, friendly manner. Ask relevant screening questions about their experience, skills, and fit for this specific role. Focus on their qualifications related to the job requirements. Ask one question at a time and wait for their response.

Begin the interview by introducing yourself as an AI recruiter for ${job.company?.company_name || "the company"}, welcoming them, and explaining this is a preliminary screening for the ${job.title} position. Then ask your first question.
`;

      // Create first message
      const firstMessage = `Hello! I'm your AI interviewer from ${job.company?.company_name || "the company"}. Welcome to this video screening for the ${job.title} position. I'll be asking you a few questions to learn more about your experience and how you might fit with the role. Let's start: Could you briefly introduce yourself and tell me about your relevant experience for this ${job.title} position?`;

      console.log('🔌 ElevenLabs prompt & first message prepared');
      
      // Check if the Conversation API is available
      if (!Conversation || typeof Conversation.startSession !== 'function') {
        console.error('🔌 ERROR: ElevenLabs SDK not available');
        throw new Error('ElevenLabs SDK not loaded correctly');
      }
      
      console.log('🔌 ElevenLabs SDK is available, creating session...');
      
      // Create the session with specific options to avoid conflicts
      // @ts-ignore - Bypassing TypeScript error about conversationId not existing
      const conv = await Conversation.startSession({
        agentId: 'KyQmFDIO63UegXTl7MvJ',
        overrides: {
          agent: {
            prompt: {
              prompt: customPrompt
            },
            firstMessage: firstMessage
          }
        },
        onConnect: () => {
          console.log('🔌 Successfully connected to ElevenLabs');
          setIsElevenLabsConnected(true);
          setIsElevenLabsInitializing(false);
          
          // When ElevenLabs connects, ensure the canvas rendering is active
          if (useCanvas) {
            startCanvasRendering();
          }
        },
        onDisconnect: (details) => {
          console.log('🔌 Disconnected from ElevenLabs:', details);
          setIsElevenLabsConnected(false);
        },
        onMessage: (msg: any) => {
          console.log('🔌 Message received from ElevenLabs:', msg);
          
          // Add detailed logging of message structure
          console.log('🔎 Message structure:', {
            type: typeof msg,
            hasAudioProp: msg && typeof msg === 'object' && 'audio' in msg,
            fullObject: JSON.stringify(msg, null, 2)
          });
          
          // Process message
          let source = 'ai';
          let messageText = '';
          
          try {
            if (typeof msg === 'string') {
              messageText = msg;
            } else if (msg && typeof msg === 'object') {
              // @ts-ignore - Handle different message formats
              source = msg.source || msg?.role || 'ai';
              // @ts-ignore - Handle different message formats
              messageText = msg.message || msg?.text || msg?.content || JSON.stringify(msg);
              
              // Look for audio URL in different possible locations in the message object
              let audioUrl = null;
              
              // Check standard structure (msg.audio.url)
              // @ts-ignore - Access audio property
              if (msg.audio && msg.audio.url) {
                audioUrl = msg.audio.url;
                console.log('�� Found audio URL in standard location (msg.audio.url):', audioUrl);
              } 
              // Check for direct audio URL (msg.audioUrl)
              // @ts-ignore - Check alternative properties
              else if (msg.audioUrl) {
                // @ts-ignore
                audioUrl = msg.audioUrl;
                console.log('🎵 Found audio URL in alternative location (msg.audioUrl):', audioUrl);
              }
              // Check for audio in content object (msg.content.audio.url)
              // @ts-ignore
              else if (msg.content && typeof msg.content === 'object' && msg.content.audio && msg.content.audio.url) {
                // @ts-ignore
                audioUrl = msg.content.audio.url;
                console.log('🎵 Found audio URL in content object (msg.content.audio.url):', audioUrl);
              }
              // Look for any property that might contain a URL to audio
              else {
                console.log('🎵 Searching for potential audio URL in message properties');
                const findAudioUrl = (obj: any): string | null => {
                  if (!obj || typeof obj !== 'object') return null;
                  
                  // Check all properties for URLs that might be audio
                  for (const key in obj) {
                    const value = obj[key];
                    
                    // Check if this property is a string that looks like an audio URL
                    if (typeof value === 'string' && 
                        (value.endsWith('.mp3') || 
                         value.endsWith('.wav') || 
                         value.includes('audio') || 
                         value.includes('speech'))) {
                      return value;
                    }
                    
                    // Recursively check nested objects, but avoid circular references
                    if (value && typeof value === 'object' && key !== 'parent' && key !== 'target') {
                      const nestedUrl = findAudioUrl(value);
                      if (nestedUrl) return nestedUrl;
                    }
                  }
                  
                  return null;
                };
                
                audioUrl = findAudioUrl(msg);
                if (audioUrl) {
                  console.log('🎵 Found potential audio URL in message:', audioUrl);
                }
              }
              
              // Process the audio URL if found
              if (audioUrl && audioOutputRef.current) {
                // Set audio source to the URL provided
                audioOutputRef.current.src = audioUrl;
                console.log('🔊 Playing AI audio response');
                
                // Store the audio URL for reference
                setAudioUrls(prev => {
                  const newUrls = [...prev, audioUrl];
                  console.log(`🎵 Updated audio URLs array (${newUrls.length} total):`, newUrls);
                  return newUrls;
                });
                
                // Fetch and store the audio data asynchronously
                console.log('🎵 Starting fetch operation for audio URL');
                const fetchPromise = fetchAndStoreAudio(audioUrl);
                pendingAudioFetches.current.push(fetchPromise);
                console.log(`🎵 Added fetch to pending queue (${pendingAudioFetches.current.length} total)`);
              } else {
                console.log('🎵 No audio URL found in this message');
              }
            } else {
              messageText = String(msg);
            }
            
            // Create formatted message
            const formattedMsg = JSON.stringify({
              source: source,
              message: messageText
            });
            
            // Update transcript
            setTranscription(prev => prev ? `${prev}\n${formattedMsg}` : formattedMsg);
          } catch (err) {
            console.error('Error processing message:', err);
            setTranscription(prev => 
              prev ? `${prev}\n${JSON.stringify({source: 'system', message: 'Error processing message'})}` : 
              JSON.stringify({source: 'system', message: 'Error processing message'})
            );
          }
        },
        onError: (error) => {
          console.error('🔌 ElevenLabs error:', error);
          setServiceError('An error occurred with the AI interviewer');
          setIsElevenLabsInitializing(false);
        },
        onStatusChange: (status) => console.log('🔌 Status changed:', status),
        onModeChange: (mode) => console.log('🔌 Mode changed:', mode),
      });
      
      if (!conv) {
        console.error('🔌 Failed to create ElevenLabs session - null response');
        throw new Error('Failed to create ElevenLabs session');
      }
      
      // Safely store conversation ID globally for later access
      try {
        // @ts-ignore - Accessing conversationId property which TypeScript doesn't know about
        globalConversationId = conv?.conversationId || null;
        if (globalConversationId) {
          console.log('🔌 Storing global conversation ID:', globalConversationId);
          setConversationId(globalConversationId);
        }
      } catch (e) {
        console.error('Failed to access conversation ID:', e);
      }
      
      // Save the conversation ID
      const conversationId = conv.conversationId;
      console.log('🔌 ElevenLabs session created with ID:', conversationId);
      
      // Store the conversation ID for later use
      setConversationId(conversationId);
      
      console.log('🔌 ElevenLabs session created!');
      // Save both conversation and ID separately
      setConversation(conv);
      
      // Get the conversation ID if available from the response
      if (conv) {
        // Try to extract the conversation ID from the response
        try {
          // Access the property safely using an indexer
          const convId = (conv as any)?.conversationId ?? null;
          if (convId) {
            console.log('🔌 ElevenLabs session created with ID:', convId);
            setConversationId(convId);
          } else {
            console.log('🔌 ElevenLabs session created but no ID could be extracted');
          }
        } catch (err) {
          console.error('Error extracting conversation ID:', err);
        }
      } else {
        console.log('🔌 ElevenLabs session created but no ID available');
      }
      
      return true;
    } catch (error) {
      console.error('🔌 Error initializing ElevenLabs:', error);
      setServiceError(`Failed to connect to the interview service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsElevenLabsInitializing(false);
      return false;
    }
  };

  // Add a useEffect to start canvas rendering when video is ready
  useEffect(() => {
    if (useCanvas && videoStream && videoRef.current && canvasRef.current && cameraPermissionState === 'granted') {
      console.log('Starting canvas-based video rendering');
      
      // Make sure video element has the stream
      if (videoRef.current.srcObject !== videoStream) {
        videoRef.current.srcObject = videoStream;
      }
      
      // Start canvas rendering after a short delay to ensure video is ready
      const startRenderingTimeout = setTimeout(() => {
        startCanvasRendering();
      }, 500);
      
      return () => {
        clearTimeout(startRenderingTimeout);
        if (videoRenderRef.current) {
          cancelAnimationFrame(videoRenderRef.current);
          videoRenderRef.current = null;
        }
      };
    }
  }, [videoStream, cameraPermissionState, useCanvas]);

  // Update the handleStartWithPermission function to use the canvas-based approach
  const handleStartWithPermission = async () => {
    try {
      // Set state to pending to show loading spinner
      setCameraPermissionState('pending');
      
      // Add a small delay to ensure the dialog is rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if video and canvas elements exist
      if (!videoRef.current || (useCanvas && !canvasRef.current)) {
        console.error('Video or canvas element reference is not available');
        setCameraPermissionState('error');
        setCameraErrorMessage('Video element not found - please try again');
        return;
      }
      
      // Clean up any existing streams to prevent conflicts
      if (videoStream) {
        console.log('Cleaning up existing video stream');
        videoStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping track:', e);
          }
        });
        setVideoStream(null);
      }

      if (audioStream) {
        console.log('Cleaning up existing audio stream');
        audioStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping track:', e);
          }
        });
        setAudioStream(null);
      }
      
      // Clear the video element source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Stop any existing render loop
      if (videoRenderRef.current) {
        cancelAnimationFrame(videoRenderRef.current);
        videoRenderRef.current = null;
      }
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First get VIDEO ONLY stream
      console.log('Requesting video-only permission');
      try {
        const videoConstraints = {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user"
          },
          audio: false // Only get video, no audio
        };
        
        console.log('Using video constraints:', JSON.stringify(videoConstraints));
        const vStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        
        console.log('Video permission granted, tracks:', vStream.getTracks().length);
        setVideoStream(vStream);
        
        // Assign video stream to video element
        if (videoRef.current) {
          console.log('Setting video source with stream');
          videoRef.current.srcObject = vStream;
          videoRef.current.muted = true;
          
          try {
            await videoRef.current.play();
            console.log('Video playback started successfully');
            
            // Start canvas rendering if using canvas approach
            if (useCanvas && canvasRef.current) {
              startCanvasRendering();
            }
          } catch (playError) {
            console.error('Error playing video:', playError);
          }
        }
        
        // Verify video tracks
        const videoTracks = vStream.getVideoTracks();
        console.log(`Video tracks: ${videoTracks.length}`);
        
        if (videoTracks.length === 0) {
          setCameraPermissionState('error');
          setCameraErrorMessage('No video track available. Please check your camera.');
          return;
        }
        
        // Explicitly enable video tracks
        videoTracks.forEach(track => {
          track.enabled = true;
        });
        
        // Now get AUDIO ONLY stream separately
        console.log('Requesting audio-only permission');
        try {
          const audioConstraints = {
            audio: true,
            video: false // No video, only audio
          };
          
          const aStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
          console.log('Audio permission granted, tracks:', aStream.getTracks().length);
          setAudioStream(aStream);
          
          // Create a combined stream for recording
          const combinedStream = new MediaStream();
          
          // Add video tracks
          videoTracks.forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Add audio tracks
          aStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Update permission state to granted
          setCameraPermissionState('granted');
          
          // Initialize recording with the combined stream
          initializeRecording(combinedStream);
          console.log('Recording initialized successfully');
          
          // Initialize ElevenLabs with a significant delay to ensure streams are stable
          setTimeout(async () => {
            try {
              console.log('Now attempting to initialize ElevenLabs...');
              const success = await initializeElevenLabs();
              if (!success) {
                console.error('Failed to initialize ElevenLabs');
                setServiceError('The AI interviewer could not be initialized. The video will still be recorded.');
              }
            } catch (error) {
              console.error('Error initializing ElevenLabs:', error);
              setServiceError('Failed to initialize AI interviewer. The video will still be recorded.');
            }
          }, 2000); // Increased delay to 2 seconds
          
        } catch (audioError) {
          console.error('Error accessing audio:', audioError);
          setServiceError('Could not access microphone. The video will be recorded without audio.');
          
          // Even without audio, mark camera as granted and proceed
          setCameraPermissionState('granted');
          
          // Initialize recording with video only
          initializeRecording(vStream);
          console.log('Video-only recording initialized');
          
          // Try ElevenLabs anyway after delay
          setTimeout(async () => {
            await initializeElevenLabs();
          }, 2000);
        }
        
      } catch (mediaError: any) {
        console.error('Error accessing media devices:', mediaError);
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          setCameraPermissionState('denied');
          setCameraErrorMessage('Camera access was denied. Please grant permission and try again.');
        } else {
          setCameraPermissionState('error');
          setCameraErrorMessage(`Camera error: ${mediaError.message}`);
        }
      }
    } catch (err: any) {
      console.error('Error starting with permission:', err);
      setCameraPermissionState('error');
      setCameraErrorMessage(err.message || 'Unknown error occurred');
    }
  };

  // Add a click handler to restart video if it stops
  const handleVideoContainerClick = () => {
    if (cameraPermissionState === 'granted' && !videoStreamActive && videoStream) {
      console.log('Attempting to restart video stream');
      
      // Re-enable all tracks
      videoStream.getTracks().forEach(track => {
        track.enabled = true;
      });
      
      // If using the canvas approach, restart the canvas rendering
      if (useCanvas && canvasRef.current) {
        startCanvasRendering();
      } else {
        // Reassign stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = videoStream;
              videoRef.current.play().catch(e => {
                console.error('Play error on restart:', e);
              });
            }
          }, 100);
        }
      }
    }
  };

  // Add the handleUserSpeech function
  const handleUserSpeech = (userText: string) => {
    if (!userText) return;
    
    console.log('User speech detected:', userText);
    
    // Create a properly formatted user message with explicit source
    const userMessageObj = {
      source: 'user', // Explicitly set 'user' source
      message: userText
    };
    
    // Convert to JSON string for storage
    const jsonString = JSON.stringify(userMessageObj);
    
    // Update transcript with user message
    setTranscription(prevTranscript => {
      const updated = prevTranscript ? `${prevTranscript}\n${jsonString}` : jsonString;
      
      // Parse and update the display immediately
      const messages = formatTranscript(updated);
      setParsedTranscript(messages);
      
      // Auto-scroll
      setTimeout(() => {
        if (transcriptRef.current) {
          transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
      }, 50);
      
      return updated;
    });
    
    // Send to AI conversation if available
    if (conversation && isElevenLabsConnected) {
      try {
        console.log('🔌 Sending message to ElevenLabs:', userText);
        conversation.sendTextMessage(userText);
      } catch (err) {
        console.error('🔌 Error sending message to ElevenLabs:', err);
      }
    } else {
      console.warn('🔌 Cannot send message - ElevenLabs not connected');
    }
  };

  // Add cleanup function
  useEffect(() => {
    console.log('JobDetails useEffect triggered with id:', id);
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds max loading time
    
    try {
      loadJob();
      checkAuth();
    } catch (err) {
      console.error('Error in JobDetails useEffect:', err);
      setLoading(false); // Ensure loading is set to false even on error
    }
    
    return () => clearTimeout(safetyTimeout);
  }, [id]);

  // Add monitoring for video tracks
  useEffect(() => {
    if (videoStream && cameraPermissionState === 'granted') {
      console.log('Starting video track monitoring');
      
      // Clear any existing interval
      if (videoTrackMonitorRef.current) {
        clearInterval(videoTrackMonitorRef.current);
      }
      
      // Start a monitoring interval
      videoTrackMonitorRef.current = window.setInterval(() => {
        const videoTracks = videoStream.getVideoTracks();
        
        // Check if video tracks are active
        const allTracksActive = videoTracks.every(track => track.enabled && track.readyState === 'live');
        
        // Log status occasionally
        console.log('Video track status:', {
          tracksCount: videoTracks.length,
          allActive: allTracksActive,
          isElevenLabsConnected
        });
        
        // Update state if changed
        if (videoStreamActive !== allTracksActive) {
          setVideoStreamActive(allTracksActive);
        }
        
        // Re-enable any disabled tracks
        videoTracks.forEach(track => {
          if (!track.enabled) {
            console.log('Re-enabling disabled video track');
            track.enabled = true;
          }
        });
      }, 2000); // Check every 2 seconds
      
      // Return cleanup function
      return () => {
        if (videoTrackMonitorRef.current) {
          clearInterval(videoTrackMonitorRef.current);
          videoTrackMonitorRef.current = null;
        }
      };
    }
  }, [videoStream, cameraPermissionState, videoStreamActive, isElevenLabsConnected]);

  // Add missing functions
  async function loadJob() {
    try {
      console.log('Loading job data for ID:', id);
      const job = await getJob(id);
      console.log('Job data received:', job);
      setJob(job);
      if (isAuthenticated) {
        const applied = await checkApplication(id);
        setHasApplied(applied);
      }
    } catch (err) {
      console.error('Error loading job:', err);
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }

  async function checkAuth() {
    try {
      const profile = await getProfile();
      setIsAuthenticated(!!profile);
      setIsCandidate(profile?.account_type === 'candidates');
      if (profile) {
        const applied = await checkApplication(id);
        setHasApplied(applied);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    }
  }

  const handleApply = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openLoginDialog'));
      return;
    }

    if (!isCandidate) {
      setShowLoginDialog(true);
      return;
    }

    if (hasApplied) {
      window.location.href = '/applications';
      return;
    }

    // Show the screening dialog
    setShowScreeningDialog(true);
  };

  // Add visual indicator function
  const renderCameraStatus = () => {
    if (cameraPermissionState === 'granted' && !videoStreamActive) {
      return (
        <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs z-20">
          Camera inactive - click to restart
        </div>
      );
    }
    
    if (cameraPermissionState === 'granted' && !isElevenLabsConnected && isElevenLabsInitializing) {
      return (
        <div className="absolute top-4 right-24 bg-blue-500 text-white px-3 py-1 rounded-full text-xs z-20 flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Connecting AI interviewer...
        </div>
      );
    }
    
    if (cameraPermissionState === 'granted' && isElevenLabsConnected) {
      return (
        <div className="absolute top-4 right-24 bg-green-500 text-white px-3 py-1 rounded-full text-xs z-20 flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
          AI interviewer connected
        </div>
      );
    }
    
    return null;
  };

  // Add transcript ref and state
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [parsedTranscript, setParsedTranscript] = useState<Array<{message: string, sender: string}>>([]);

  // Add transcript effect
  useEffect(() => {
    if (transcription) {
      const formattedMessages = formatTranscript(transcription);
      setParsedTranscript(formattedMessages);
      
      // Auto-scroll to the bottom of transcript
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    }
  }, [transcription]);

  // Add utils
  const formatSalary = (min: number | null, max: number | null, currency: string, period: string) => {
    if (!min && !max) return null;
    
    const formatter = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    });
    
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)} per ${period.toLowerCase()}`;
    } else if (min) {
      return `From ${formatter.format(min)} per ${period.toLowerCase()}`;
    } else if (max) {
      return `Up to ${formatter.format(max)} per ${period.toLowerCase()}`;
    }
    return null;
  };

  // Add other functions
  const startVideoScreening = async () => {
    try {
      // Reset states
      setServiceError(null);
      setCameraPermissionState('denied'); // Start with denied to show the "Start Camera" button
      setCameraErrorMessage(null);
      
      // Clean up any existing streams to prevent conflicts
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      
      // Just open the dialog - don't try to access the camera yet
      setShowScreeningDialog(false);
      setShowVideoDialog(true);
      
    } catch (err: any) {
      console.error('Error preparing video screening:', err);
      setServiceError(`Failed to prepare video screening: ${err.message}`);
    }
  };

  const stopVideoScreening = async () => {
    if (videoStream) {
      console.log('Stopping video stream with tracks:', videoStream.getTracks().length);
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    
    if (audioStream) {
      console.log('Stopping audio stream with tracks:', audioStream.getTracks().length);
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    if (conversation) {
      console.log('🔌 Ending ElevenLabs session...');
      try {
        await conversation.endSession();
        console.log('🔌 ElevenLabs session ended successfully');
        setIsElevenLabsConnected(false);
      } catch (e) {
        console.error('🔌 Error ending ElevenLabs session:', e);
      }
      setConversation(null);
    } else {
      console.log('🔌 No active ElevenLabs conversation to end');
    }
    
    setShowVideoDialog(false);
  };

  // Add more detailed logging to the fetchAndStoreAudio function
  const fetchAndStoreAudio = async (audioUrl: string) => {
    try {
      console.log('🎵 Fetching audio data from URL:', audioUrl);
      
      if (!audioUrl.startsWith('http')) {
        console.error('🎵 Invalid audio URL format:', audioUrl);
        return null;
      }
      
      console.log('🎵 Starting fetch request...');
      const response = await fetch(audioUrl);
      console.log('🎵 Fetch response received:', {
        ok: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type')
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      console.log('🎵 Converting response to blob...');
      const audioBlob = await response.blob();
      console.log(`🎵 Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      // Store the blob for later upload
      setAudioBlobs(prev => {
        const newBlobs = [...prev, audioBlob];
        console.log(`🎵 Updated audio blobs array (${newBlobs.length} total)`);
        return newBlobs;
      });
      
      return audioBlob;
    } catch (error) {
      console.error('🎵 Error fetching audio:', error);
      return null;
    }
  };

  // Set up audio output element with direct recording
  useEffect(() => {
    // Set up audio output element
    const audioOutput = document.createElement('audio');
    audioOutput.id = 'ai-output-audio';
    audioOutput.autoplay = true;
    document.body.appendChild(audioOutput);
    audioOutputRef.current = audioOutput;
    
    // Set up direct recording from the audio element
    try {
      console.log('🎧 Setting up direct audio recording from ElevenLabs output');
      
      // Initialize empty array for audio chunks
      directAudioChunksRef.current = [];
      
      // Add event listener for when audio starts playing
      audioOutput.onplay = () => {
        console.log('🎧 ElevenLabs audio started playing');
        
        try {
          // Create audio context if needed
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          
          // Create a destination node to get a MediaStream
          const destination = audioContextRef.current.createMediaStreamDestination();
          
          // Create a source from the audio element
          const source = audioContextRef.current.createMediaElementSource(audioOutput);
          
          // Connect the source to both the destination node and audio context destination
          source.connect(destination);
          source.connect(audioContextRef.current.destination);
          
          // Start recording this audio segment
          const recorder = new MediaRecorder(destination.stream);
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              console.log(`🎧 Recorded audio chunk: ${event.data.size} bytes`);
              directAudioChunksRef.current.push(event.data);
            }
          };
          
          recorder.onstop = () => {
            console.log(`🎧 Audio segment recording stopped, total chunks: ${directAudioChunksRef.current.length}`);
            
            // Create a blob from these chunks
            if (directAudioChunksRef.current.length > 0) {
              const audioBlob = new Blob(directAudioChunksRef.current, { type: 'audio/webm' });
              console.log(`🎧 Created audio blob: ${audioBlob.size} bytes`);
              
              // Add to the audio blobs array for later upload
              setAudioBlobs(prev => [...prev, audioBlob]);
            }
          };
          
          // Start recording this segment
          recorder.start();
          console.log('🎧 Started recording ElevenLabs audio output');
          
          // Save the recorder reference
          directMediaRecorderRef.current = recorder;
          
          // Set up stop recording when audio ends
          audioOutput.onended = () => {
            console.log('🎧 Audio ended, stopping recorder');
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          };
    } catch (err) {
          console.error('🎧 Error setting up audio recording:', err);
        }
      };
      
      console.log('🎧 Audio element event handlers set up');
    } catch (err) {
      console.error('🎧 Error in audio recording setup:', err);
    }
    
    // Make sure to clean up
    return () => {
      if (audioOutputRef.current) {
        document.body.removeChild(audioOutputRef.current);
      }
    };
  }, []);

  // Update the handleCompleteScreening function to include conversation_id
  const handleCompleteScreening = async () => {
    try {
      setApplying(true);
      
      console.log('⚙️ Starting complete screening process');
      
      // Stop ongoing direct audio recording if active
      if (directMediaRecorderRef.current && directMediaRecorderRef.current.state !== 'inactive') {
        console.log('⚙️ Stopping direct audio recorder');
        directMediaRecorderRef.current.stop();
        
        // Wait for the recorder to finish
        await new Promise<void>(resolve => {
          setTimeout(() => {
            console.log('⚙️ Direct audio recorder stop timeout');
            resolve();
          }, 500);
        });
      }
      
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('⚙️ Stopping media recorder');
        mediaRecorderRef.current.stop();
        
        // Wait for last data to be captured
        await new Promise<void>(resolve => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => {
              console.log('⚙️ Media recorder stopped successfully');
              resolve();
            };
          }
          setTimeout(() => {
            console.log('⚙️ Media recorder stop timeout triggered');
            resolve();
          }, 1000); // Fallback in case onstop doesn't fire
        });
      }
      
      // Check audio data status
      console.log(`⚙️ Audio URLs array contains ${audioUrls.length} items:`, audioUrls);
      console.log(`⚙️ Audio blobs array contains ${audioBlobs.length} items`);
      console.log(`⚙️ Direct audio chunks contains ${directAudioChunksRef.current.length} items`);
      console.log(`⚙️ Conversation ID: ${conversationId || 'Not available'}`);
      
      // If we have direct audio chunks but they haven't been processed into a blob yet
      if (directAudioChunksRef.current.length > 0) {
        console.log('⚙️ Processing remaining direct audio chunks');
        const audioBlob = new Blob(directAudioChunksRef.current, { type: 'audio/webm' });
        console.log(`⚙️ Created audio blob from direct chunks: ${audioBlob.size} bytes`);
        
        if (audioBlob.size > 0) {
          setAudioBlobs(prev => [...prev, audioBlob]);
          
          // Small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Wait for any pending audio fetch operations to complete
      if (pendingAudioFetches.current.length > 0) {
        console.log(`⚙️ Waiting for ${pendingAudioFetches.current.length} audio fetches to complete...`);
        const results = await Promise.allSettled(pendingAudioFetches.current);
        console.log('⚙️ All audio fetches completed with results:', 
          results.map((r, i) => `Fetch ${i}: ${r.status}`));
        
        // Check again after fetches complete
        console.log(`⚙️ After fetches: Audio blobs array contains ${audioBlobs.length} items`);
      } else {
        console.log('⚙️ No pending audio fetches to wait for');
      }
      
      // Stop video stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      
      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      
      // Close conversation with AI
      let finalConversationId = conversationId;
      if (conversation) {
        try {
          // If we don't have a conversation ID yet, try to extract it
          if (!finalConversationId) {
            finalConversationId = globalConversationId;
            console.log('⚙️ Retrieved conversation ID before closing:', finalConversationId);
          }
          
          await conversation.endSession();
          console.log('⚙️ Ended ElevenLabs conversation session');
        } catch (err) {
          console.error('⚙️ Error ending conversation:', err);
        }
        setConversation(null);
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (err) {
          console.error('Error closing audio context:', err);
        }
      }
      
      // Default to no_video in case upload fails
      let videoUrl = "no_video";
      let audioFileUrls: string[] = [];
      
      try {
        // Check Supabase auth status first
        const { data: authData } = await supabase.auth.getSession();
        if (!authData?.session) {
          throw new Error("Not authenticated with Supabase");
        }
        
        // Generate base information for file uploads
        const userId = authData.session.user.id;
        const timestamp = Date.now();
        const bucketName = 'candidate-videos';
        
        // Upload audio files if available
        if (audioBlobs.length > 0) {
          console.log(`⚙️ Uploading ${audioBlobs.length} audio files to bucket`);
          
          const audioUploadPromises = audioBlobs.map(async (blob, index) => {
            try {
              const audioFileName = `interview_audio_${userId}_${timestamp}_${index}.mp3`;
              const audioFilePath = `interviews/audio/${audioFileName}`;
              
              console.log(`⚙️ Uploading audio file ${index+1}/${audioBlobs.length}: ${audioFilePath}`);
              console.log(`⚙️ Audio blob details: size=${blob.size}, type=${blob.type}`);
              
              const { data: audioData, error: audioError } = await supabase.storage
                .from(bucketName)
                .upload(audioFilePath, blob, {
                  cacheControl: '3600',
                  upsert: true,
                  contentType: 'audio/mpeg'
                });
              
              if (audioError) {
                console.error(`⚙️ Error uploading audio file ${index}:`, audioError);
                return null;
              }
              
              // Get the URL for the uploaded audio
              const { data: audioUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(audioFilePath);
              
              if (!audioUrlData || !audioUrlData.publicUrl) {
                console.error(`⚙️ Failed to get URL for uploaded audio ${index}`);
                return null;
              }
              
              console.log(`⚙️ Successfully uploaded audio file ${index+1}: ${audioUrlData.publicUrl}`);
              return audioUrlData.publicUrl;
            } catch (err) {
              console.error(`⚙️ Error in audio upload process ${index}:`, err);
              return null;
            }
          });
          
          // Wait for all audio uploads to complete
          const audioUploadResults = await Promise.all(audioUploadPromises);
          audioFileUrls = audioUploadResults.filter(Boolean) as string[];
          console.log(`⚙️ Successfully uploaded ${audioFileUrls.length}/${audioBlobs.length} audio files`);
        } else {
          console.log('⚙️ No audio blobs to upload');
        }
        
        // Upload video if available
        if (recordedChunksRef.current.length > 0) {
          console.log(`Recorded chunks: ${recordedChunksRef.current.length}`);
          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          console.log(`Video blob created: ${videoBlob.size} bytes`);
          
          if (videoBlob.size > 0) {
            // Generate a unique filename with user ID
            const fileName = `interview_${userId}_${timestamp}.webm`;
            const filePath = `interviews/${fileName}`;
            
            console.log(`Uploading video to bucket '${bucketName}': ${filePath}`);
            
            // Upload to the bucket
            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(filePath, videoBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'video/webm'
              });
            
            if (error) {
              console.error("Video upload error:", error);
              throw error;
            }
            
            // Successfully uploaded, get the URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            if (!urlData || !urlData.publicUrl) {
              throw new Error("Failed to get URL for uploaded video");
            }
            
            videoUrl = urlData.publicUrl;
            console.log("Successfully uploaded video. URL:", videoUrl);
          }
        }
        
        // Now try to save all the metadata
        const metadata: Record<string, any> = {
          video_url: videoUrl
        };
        
        // Add transcript if available
        if (transcription) {
          console.log("Adding transcript to metadata");
          metadata.transcript = transcription;
        }
        
        // Add ElevenLabs original audio URLs for reference (these might expire)
        if (audioUrls.length > 0) {
          console.log(`Adding ${audioUrls.length} original ElevenLabs audio URLs to metadata`);
          metadata.elevenlabs_audio_urls = audioUrls;
        }
        
        // Add our permanently stored audio URLs
        if (audioFileUrls.length > 0) {
          console.log(`Adding ${audioFileUrls.length} permanent audio URLs to metadata`);
          metadata.audio_urls = audioFileUrls;
          metadata.audio_url = audioFileUrls[0]; // Primary audio URL
        }
        
        // Create application with the video reference, metadata, and conversation ID
        console.log(`Creating application with video, audio, metadata and conversation_id: ${finalConversationId}`);
        const applicationId = await createApplication(id, videoUrl, metadata, finalConversationId);
        
        // If we have a conversation ID and application ID, trigger the edge function to fetch the audio
        if (finalConversationId && applicationId) {
          console.log(`Triggering audio retrieval for application: ${applicationId}`);
          try {
            const result = await triggerStoreAudio(applicationId);
            if (result.success) {
              console.log('Audio retrieval triggered successfully:', result);
            } else {
              console.error('Failed to trigger audio retrieval:', result.message);
            }
          } catch (fetchError) {
            console.error('Error triggering audio retrieval:', fetchError);
            // Continue anyway, this is just a background task
          }
        }
        
      } catch (uploadError: any) {
        console.error("Upload failed:", uploadError);
        
        // Create application without video, but with transcript
        videoUrl = "upload_failed";
        
        const fallbackMetadata: Record<string, any> = {};
        if (transcription) fallbackMetadata.transcript = transcription;
        if (audioUrls.length > 0) {
          fallbackMetadata.elevenlabs_audio_urls = audioUrls;
        }
        if (audioFileUrls.length > 0) {
          fallbackMetadata.audio_urls = audioFileUrls;
          fallbackMetadata.audio_url = audioFileUrls[0];
        }
        
        // Still include the conversation ID even in fallback scenario
        const fallbackAppId = await createApplication(id, videoUrl, 
          Object.keys(fallbackMetadata).length > 0 ? fallbackMetadata : undefined,
          finalConversationId);
          
        // Trigger audio storage for fallback path if we have a conversation ID
        if (finalConversationId && fallbackAppId) {
          console.log(`Triggering audio retrieval for fallback application: ${fallbackAppId}`);
          try {
            const result = await triggerStoreAudio(fallbackAppId);
            if (result.success) {
              console.log('Fallback audio retrieval triggered successfully:', result);
            } else {
              console.error('Failed to trigger fallback audio retrieval:', result.message);
            }
          } catch (fetchError) {
            console.error('Error triggering fallback audio retrieval:', fetchError);
            // Continue anyway, this is just a background task
          }
        }
        
        setServiceError(`Upload failed: ${uploadError.message}. Your application will be submitted with limited media.`);
      }
      
      setHasApplied(true);
      window.location.href = '/applications';
    } catch (err) {
      console.error("Complete screening error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete screening");
    } finally {
      setApplying(false);
      setShowVideoDialog(false);
    }
  };

  const skipVideoAndApply = async () => {
    try {
      setApplying(true);
      setShowScreeningDialog(false);
      
      // Create application without video
      const appId = await createApplication(id, "no_video");
      
      // Check if there's a conversation ID from previous chat
      if (globalConversationId && appId) {
        console.log(`Triggering audio retrieval for no_video application: ${appId}`);
        try {
          const result = await triggerStoreAudio(appId);
          if (!result.success) {
            console.error('Failed to trigger audio retrieval:', result.message);
          }
        } catch (error) {
          console.error('Error triggering audio retrieval:', error);
        }
      }
      
      setHasApplied(true);
      window.location.href = '/applications';
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
      setApplying(false);
    }
  };

  const createDirectApplication = async () => {
    try {
      setApplying(true);
      const appId = await createApplication(id, "no_video");
      
      // Check if there's a conversation ID from previous interaction
      if (globalConversationId && appId) {
        console.log(`Triggering audio retrieval for direct application: ${appId}`);
        try {
          const result = await triggerStoreAudio(appId);
          if (!result.success) {
            console.error('Failed to trigger audio retrieval:', result.message);
          }
        } catch (error) {
          console.error('Error triggering audio retrieval:', error);
        }
      }
      
      setHasApplied(true);
      window.location.href = '/applications';
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
      setApplying(false);
    }
  };

  // Add cleanup to handle audio context
  useEffect(() => {
    return () => {
      // Clean up audio context on unmount
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
            } catch (err) {
          console.error('Error closing audio context:', err);
        }
      }
    };
  }, []);

  if (loading) {
    console.log("Returning JobDetailsSkeleton (loading is true)");
    return <JobDetailsSkeleton />;
  }

  if (error || !job) {
    console.log("Error or no job data:", error);
    return (
      <main className="min-h-screen bg-white pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Job not found</h1>
            <p className="text-gray-600 mb-8">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <a href="/jobs" className="text-[#87B440] hover:underline">
              Browse All Jobs
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Fix the jobContext type issue by using the correct type
  const jobContext = {
    title: job.title || undefined,
    company: job.company?.company_name || undefined,
    location: job.location || undefined,
    type: job.type || undefined,
    salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period) || undefined,
    experience: job.experience_level || undefined,
    overview: job.overview || undefined
  };

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-[#166A9A] pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-6 text-white">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{job.title}</h1>
                <div className="flex items-center gap-6 text-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <span>{job.company?.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleApply}
                className="bg-[#87B440] hover:bg-[#759C37] text-white px-8"
                disabled={applying}
              >
                {applying ? "Applying..." : hasApplied ? "View Application" : "Apply Now"}
              </Button>
            </div>
          </div>
        </section>

        {/* Job Content */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2">
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold mb-6">Overview</h2>
                  <p className="text-gray-600 whitespace-pre-line mb-8">{job.overview}</p>

                  <h2 className="text-2xl font-bold mb-6">Requirements</h2>
                  <ul className="list-disc pl-6 space-y-2 mb-8">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="text-gray-600">{req}</li>
                    ))}
                  </ul>

                  <h2 className="text-2xl font-bold mb-6">Responsibilities</h2>
                  <ul className="list-disc pl-6 space-y-2 mb-8">
                    {job.responsibilities.map((resp, index) => (
                      <li key={index} className="text-gray-600">{resp}</li>
                    ))}
                  </ul>

                  {job.benefits.length > 0 && (
                    <>
                      <h2 className="text-2xl font-bold mb-6">Benefits</h2>
                      <ul className="list-disc pl-6 space-y-2 mb-8">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="text-gray-600">{benefit}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6 space-y-6 sticky top-24">
                  <div>
                    <h3 className="font-semibold mb-4">Job Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span>{job.type}</span>
                      </div>
                      {job.salary_min || job.salary_max ? (
                        <div className="flex items-center gap-3 text-gray-600">
                          <DollarSign className="w-5 h-5" />
                          <span>
                            {formatSalary(
                              job.salary_min,
                              job.salary_max,
                              job.salary_currency,
                              job.salary_period
                            )}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-3 text-gray-600">
                        <Award className="w-5 h-5" />
                        <span>{job.experience_level}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {job.company && (
                    <div>
                      <h3 className="font-semibold mb-4">About the Company</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          {job.company.avatar_url ? (
                            <img
                              src={job.company.avatar_url}
                              alt={job.company.company_name || "Company logo"}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{job.company.company_name}</h4>
                            {job.company.industry && (
                              <p className="text-sm text-gray-600">{job.company.industry}</p>
                            )}
                          </div>
                        </div>
                        {job.company.website && (
                          <a
                            href={job.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#87B440] hover:underline"
                          >
                            <Globe className="w-4 h-4" />
                            <span>{job.company.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleApply}
                    className="w-full bg-[#87B440] hover:bg-[#759C37] text-white"
                    disabled={applying}
                  >
                    {applying ? "Applying..." : hasApplied ? "View Application" : "Apply Now"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Video Screening Dialog */}
      <Dialog open={showScreeningDialog} onOpenChange={setShowScreeningDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Video Screening</DialogTitle>
            <DialogDescription>
              Complete a quick video interview with our AI assistant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {serviceError ? (
              <div className="text-center">
                <p className="text-red-600 mb-4">{serviceError}</p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowScreeningDialog(false)}
                    className="mx-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={skipVideoAndApply}
                    className="bg-[#87B440] hover:bg-[#759C37]"
                    disabled={applying}
                  >
                    {applying ? "Applying..." : "Apply Without Video"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Complete a quick 5-minute video screening to increase your chances of getting noticed! 
                  Our AI interviewer will ask you a few questions about your experience and skills.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Video className="w-4 h-4 text-[#87B440]" />
                    <span>Takes only 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mic className="w-4 h-4 text-[#87B440]" />
                    <span>AI-powered conversation</span>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={skipVideoAndApply}
                    disabled={applying}
                  >
                    {applying ? "Applying..." : "Skip & Apply Directly"}
                  </Button>
                  <Button onClick={startVideoScreening} className="bg-[#87B440] hover:bg-[#759C37]">
                    Start Screening
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Interview Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={(open) => !applying && setShowVideoDialog(open)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Video Screening Interview</DialogTitle>
            <p className="text-sm text-gray-500">
              Speak clearly and answer the questions asked by the AI interviewer.
            </p>
          </DialogHeader>
          
          <div className="grid gap-6">
            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer" 
              onClick={handleVideoContainerClick}
            >
              {/* Hidden video element used as source */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover bg-black ${useCanvas ? 'hidden' : 'block'}`}
                autoPlay
                playsInline
                muted
                style={{ 
                  transform: "scaleX(-1)",
                  display: useCanvas ? "none" : "block",
                  visibility: "visible",
                  opacity: 1,
                  zIndex: 10
                }}
                id="interview-video-element"
              />
              
              {/* Canvas element for rendering video */}
              {useCanvas && (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full bg-black"
                  style={{ 
                    transform: "scaleX(-1)",
                    display: "block",
                    visibility: "visible",
                    opacity: 1,
                    zIndex: 10
                  }}
                />
              )}
              
              {/* Permission Overlay */}
              {cameraPermissionState !== 'granted' && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white p-6">
                  {cameraPermissionState === 'pending' ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
                      <p className="text-center mb-2">Accessing camera...</p>
                      <p className="text-sm text-gray-300 text-center">Please allow camera access when prompted</p>
                    </>
                  ) : cameraPermissionState === 'denied' ? (
                    <>
                      <Video className="w-16 h-16 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Camera Permission Required</h3>
                      <p className="text-center mb-6">We need access to your camera for the video interview</p>
                      <Button
                        onClick={handleStartWithPermission}
                        className="bg-[#87B440] hover:bg-[#759C37] px-8 py-2"
                      >
                        Start Camera
                      </Button>
                    </>
                  ) : (
                    <>
                      <X className="w-16 h-16 text-red-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
                      <p className="text-center mb-2">{cameraErrorMessage || 'Something went wrong with your camera'}</p>
                      <p className="text-sm text-gray-300 text-center mb-6">Make sure your camera is connected and not in use by another application</p>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowVideoDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={startVideoScreening}
                          className="bg-[#87B440] hover:bg-[#759C37]"
                        >
                          Try Again
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* AI Avatar */}
              {cameraPermissionState === 'granted' && (
                <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                  <img
                    src={DEFAULT_MALE_AVATAR}
                    alt="AI Interviewer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Avatar image failed to load');
                      e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23166A9A'/%3E%3Ccircle cx='100' cy='70' r='40' fill='%23FFFFFF'/%3E%3Cpath d='M160,200 C160,155 125,140 100,140 C75,140 40,155 40,200' fill='%23FFFFFF'/%3E%3C/svg%3E`;
                    }}
                  />
                  {isElevenLabsInitializing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
                </div>
              )}
              
              {renderCameraStatus()}
            </div>
            
            {/* Conversation Transcript */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-gray-50">
                <h3 className="font-medium">Conversation Transcript:</h3>
              </div>
              
              <div 
                ref={transcriptRef}
                className="p-4 max-h-[200px] overflow-y-auto"
              >
                {parsedTranscript.length > 0 ? (
                  parsedTranscript.map((item, index) => (
                    <MessageBubble 
                      key={index} 
                      message={item.message} 
                      sender={item.sender} 
                    />
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    The conversation will appear here...
                  </p>
                )}
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (videoStream) {
                      const videoTrack = videoStream.getVideoTracks()[0];
                      if (videoTrack) {
                        videoTrack.enabled = !videoTrack.enabled;
                        setVideoEnabled(videoTrack.enabled);
                      }
                    }
                  }}
                >
                  <Video className={!videoEnabled ? "text-red-500" : ""} />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (videoStream) {
                      const audioTrack = videoStream.getAudioTracks()[0];
                      if (audioTrack) {
                        audioTrack.enabled = !audioTrack.enabled;
                        setAudioEnabled(audioTrack.enabled);
                      }
                    }
                  }}
                >
                  <Mic className={!audioEnabled ? "text-red-500" : ""} />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => stopVideoScreening()}
                  disabled={applying}
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={handleCompleteScreening}
                  disabled={applying}
                  className="bg-[#87B440] hover:bg-[#759C37]"
                >
                  {applying ? "Submitting..." : "Complete & Submit"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Employer Account Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently logged in with an employer account. To apply for jobs, please create a candidate account or switch to an existing candidate account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#87B440] hover:bg-[#759C37]"
              onClick={() => {
                setShowLoginDialog(false);
                window.location.href = '/register';
              }}
            >
              Create Candidate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChatWidget jobContext={jobContext} />
    </>
  );
}
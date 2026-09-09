import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertTriangle, SwitchCamera } from 'lucide-react';

export interface CapturedImageData {
  dataUrl: string;
  name: string;
  size: string;
  width: number;
  height: number;
}

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (image: CapturedImageData) => void;
  panelTitle?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  panelTitle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera with chosen device
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setIsLoading(true);
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("System camera API is not supported in this browser environment. Please use an HTTPS connection or modern browser.");
      setIsLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // autoPlay was intercepted or awaiting user interaction
        });
      }

      // Enumerate cameras
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (!selectedDeviceId && videoDevs.length > 0) {
          const currentTrack = stream.getVideoTracks()[0];
          const settings = currentTrack ? currentTrack.getSettings() : null;
          if (settings && settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }
      } catch {
        // enumeration optional
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Camera access was denied. Please allow camera permissions in your browser address bar.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage("No system camera was detected. Please verify your webcam connection.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage("Camera is currently in use by another application. Please close other camera windows.");
      } else {
        setErrorMessage(err.message || "Failed to initialize system camera.");
      }
    }
  };

  // Start on modal open, stop on close
  useEffect(() => {
    if (isOpen) {
      startCamera(selectedDeviceId || undefined);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Switch between cameras
  const handleSwitchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startCamera(nextDevice.deviceId);
  };

  // Capture snapshot from live stream
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const approxKb = Math.round((dataUrl.length * 3) / 4 / 1024);

    stopCamera();
    onCapture({
      dataUrl,
      name: `Camera_Capture_${Date.now()}.jpg`,
      size: `${approxKb} KB`,
      width,
      height
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '720px',
        width: '100%',
        background: '#090d16',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}>
              <Camera size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                {panelTitle ? `Camera Capture: ${panelTitle}` : 'System Camera Viewfinder'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Position commodity packaging inside the alignment frame for high-accuracy OCR
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Camera"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          background: '#000000',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: errorMessage ? 'none' : 'block'
            }}
          />

          {/* Shutter Flash Effect */}
          {isFlashing && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: '#ffffff',
              opacity: 0.85,
              zIndex: 30,
              pointerEvents: 'none'
            }} />
          )}

          {/* Loading Overlay */}
          {isLoading && !errorMessage && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 20
            }}>
              <RefreshCw size={36} className="animate-spin" color="#60a5fa" />
              <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                Connecting to System Camera...
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Please accept the browser camera prompt if requested
              </div>
            </div>
          )}

          {/* Error State Overlay */}
          {errorMessage && (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              maxWidth: '480px',
              zIndex: 20
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ef4444'
              }}>
                <AlertTriangle size={28} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff', marginBottom: '8px' }}>
                Camera Access Notice
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>
                {errorMessage}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => startCamera(selectedDeviceId || undefined)}
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={15} />
                  <span>Retry Camera</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Alignment Reticle & Guidelines (shown when video is streaming without error) */}
          {!isLoading && !errorMessage && (
            <div style={{
              position: 'absolute',
              inset: '30px 40px',
              border: '2px dashed rgba(59, 130, 246, 0.45)',
              borderRadius: '16px',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Corner Accents */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '24px', height: '24px', borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6' }} />
                <div style={{ width: '24px', height: '24px', borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6' }} />
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                color: '#93c5fd',
                fontWeight: 600,
                letterSpacing: '0.03em'
              }}>
                ALIGN COMMODITY LABEL INSIDE BOX
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '24px', height: '24px', borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6' }} />
                <div style={{ width: '24px', height: '24px', borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div style={{
          padding: '18px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Switch Camera Button if multiple video devices exist */}
          <div>
            {devices.length > 1 && !errorMessage && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="btn btn-secondary"
                style={{ gap: '8px', padding: '8px 14px', fontSize: '0.8rem' }}
                title="Switch between available cameras"
              >
                <SwitchCamera size={16} />
                <span>Switch Camera</span>
              </button>
            )}
          </div>

          {/* Shutter Capture Button */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={isLoading || !!errorMessage}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: 800,
              gap: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 18px rgba(37, 99, 235, 0.45)',
              borderRadius: '9999px'
            }}
          >
            <Camera size={20} />
            <span>Capture Label Photo</span>
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

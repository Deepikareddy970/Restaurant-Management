import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  X,
  RefreshCw,
  Navigation
} from 'lucide-react';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const { addToast } = useSocket();
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check-In flow states
  const [inCheckInFlow, setInCheckInFlow] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64 string
  const [gpsCoords, setGpsCoords] = useState(null); // {latitude, longitude}
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/attendance/history');
      const data = await res.json();
      if (data.success) {
        const active = data.logs.find(log => !log.clockOutTime && log.status !== 'REJECTED');
        setActiveSession(active || null);
      }
    } catch (e) {
      console.error('Error fetching attendance status:', e);
      addToast('Could not load attendance details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    return () => {
      stopCamera();
    };
  }, []);

  // Fetch coordinates automatically
  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
        addToast('GPS coordinates fetched automatically.', 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGpsLoading(false);
        let errorMsg = 'Location permission denied. Please enable location services.';
        if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS location is unavailable. Check your connection/GPS hardware.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        setGpsError(errorMsg);
        addToast(errorMsg, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Camera compatibility & permissions handler
  const startCamera = async () => {
    setCameraError('');
    setCapturedPhoto(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // target front/selfie camera on mobile/tablet devices
        audio: false
      });

      streamRef.current = stream;
      setCameraActive(true);

      // Timeout to ensure video element ref is fully bound
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for Mobile Chrome, iOS, Android PWAs, and APK builds
          videoRef.current.play()
            .then(() => console.log('Video stream active.'))
            .catch(err => {
              console.error('Video playing error:', err);
              setCameraError('Failed to display camera feed.');
            });
        }
      }, 300);
    } catch (err) {
      console.error('Camera access error:', err);
      let userMsg = 'Camera access denied. Please check site permissions in your browser.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMsg = 'No camera hardware detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMsg = 'Camera is already in use by another application.';
      }
      setCameraError(userMsg);
      addToast(userMsg, 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      // Capture at video resolution or standard 640x480 ratio
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const startCheckInFlow = () => {
    setInCheckInFlow(true);
    // Automatically trigger GPS lookup and Camera initialization
    getGPSLocation();
    startCamera();
  };

  const cancelCheckInFlow = () => {
    stopCamera();
    setInCheckInFlow(false);
    setCapturedPhoto(null);
    setGpsCoords(null);
    setGpsError('');
    setCameraError('');
  };

  const handleCheckInSubmit = async () => {
    if (!capturedPhoto) {
      addToast('Selfie photo capture is mandatory.', 'error');
      return;
    }
    if (!gpsCoords) {
      addToast('GPS location is mandatory to clock in.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      // Convert captured base64 data to image blob file
      const resBlob = await fetch(capturedPhoto);
      const blob = await resBlob.blob();
      const file = new File([blob], 'attendance-selfie.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('latitude', gpsCoords.latitude);
      formData.append('longitude', gpsCoords.longitude);

      const response = await apiRequest('/attendance/clock-in', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        addToast('Checked in successfully! Shift is active.', 'success');
        cancelCheckInFlow();
        fetchStatus();
      } else {
        addToast(data.message || 'Check-in failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error during check-in.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await apiRequest('/attendance/clock-out', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        addToast('Clocked out successfully. Thank you for your work!', 'success');
        fetchStatus();
      } else {
        addToast(data.message || 'Clock-out failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error during clock-out.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Attendance Check In/Out
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify and record your daily shift presence and GPS metrics
        </p>
      </div>

      {!inCheckInFlow ? (
        activeSession ? (
          // Active Session Panel
          <div className="p-8 rounded-3xl glass-panel relative overflow-hidden text-center space-y-6 border border-emerald-500/20">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">
                You are Checked In
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your shift was marked active today. You have immediate access to orders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 text-xs text-left divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 font-semibold">Check-In Time:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {new Date(activeSession.clockInTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 font-semibold">Date:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {new Date(activeSession.clockInTime).toLocaleDateString()}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 font-semibold">Attendance Status:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {activeSession.status}
                </span>
              </div>
            </div>

            <button
              onClick={handleClockOut}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition duration-200 shadow-lg shadow-rose-600/15"
            >
              Clock Out Shift
            </button>
          </div>
        ) : (
          // Inactive Session Panel (Prompt to Check In)
          <div className="p-8 rounded-3xl glass-panel text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/20 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">
                Not Checked In
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please check in with your selfie and GPS location to begin processing orders.
              </p>
            </div>

            <button
              onClick={startCheckInFlow}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition duration-200 shadow-lg shadow-indigo-600/20"
            >
              Check In Now
            </button>
          </div>
        )
      ) : (
        // Check-In Active Flow
        <div className="p-6 rounded-3xl glass-panel space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Selfie & Location Verification
            </h3>
            <button
              onClick={cancelCheckInFlow}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Camera Viewport */}
          <div className="w-full aspect-video rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Selfie Preview"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                {cameraError ? (
                  <div className="space-y-2 text-rose-500 font-semibold">
                    <AlertCircle className="w-8 h-8 mx-auto" />
                    <p>{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-xs hover:bg-rose-500/10"
                    >
                      Retry Camera Permissions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    <p>Requesting camera access...</p>
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} width={320} height={240} className="hidden" />
          </div>

          {/* Camera Buttons */}
          {cameraActive && (
            <button
              onClick={capturePhoto}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              <span>Capture Selfie</span>
            </button>
          )}

          {!cameraActive && capturedPhoto && (
            <button
              onClick={startCamera}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Retake Selfie</span>
            </button>
          )}

          {/* Location Status Indicator */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-700 dark:text-slate-350">GPS Coordinates</span>
              </div>
              {gpsLoading && (
                <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Fetching...</span>
                </span>
              )}
            </div>

            {gpsCoords ? (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold space-y-1">
                <p>Latitude: <span className="text-slate-800 dark:text-slate-200 font-bold">{gpsCoords.latitude}</span></p>
                <p>Longitude: <span className="text-slate-800 dark:text-slate-200 font-bold">{gpsCoords.longitude}</span></p>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                {gpsError ? (
                  <div className="flex items-center justify-between">
                    <span className="text-rose-500 font-semibold">{gpsError}</span>
                    <button
                      onClick={getGPSLocation}
                      className="px-2 py-1 bg-rose-50 dark:bg-rose-950/20 text-[10px] text-rose-600 rounded border border-rose-500/25 hover:bg-rose-100"
                    >
                      Retry GPS
                    </button>
                  </div>
                ) : (
                  <span>GPS loading initiated automatically...</span>
                )}
              </div>
            )}
          </div>

          {/* Submission button */}
          <button
            onClick={handleCheckInSubmit}
            disabled={submitLoading || !capturedPhoto || !gpsCoords}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition duration-200 shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2"
          >
            {submitLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Check In</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;

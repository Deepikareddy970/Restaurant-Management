import React, { useEffect, useRef, useState } from 'react';
import { apiRequest, FILE_BASE_URL } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useSocket();
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Geolocation & Webcam States
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64 string
  const [gpsCoords, setGpsCoords] = useState(null); // {lat, lng}
  const [simulateOutside, setSimulateOutside] = useState(false); // test helper
  const [clockInLoading, setClockInLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, ordersRes] = await Promise.all([
        apiRequest('/attendance/history'),
        apiRequest('/orders')
      ]);

      const hData = await historyRes.json();
      const oData = await ordersRes.json();

      if (hData.success) {
        setHistory(hData.logs);
        // Find if there is an active clock-in session
        const active = hData.logs.find(log => !log.clockOutTime && log.status !== 'REJECTED');
        setActiveSession(active || null);
      }
      if (oData.success) {
        setOrders(oData.orders);
      }
    } catch (e) {
      console.error('Error fetching employee dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Web Cam Controls
  const startCamera = async () => {
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      addToast('Could not access webcam camera. Please grant permissions.', 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  // Get GPS Coordinates
  const fetchGPS = () => {
    if (simulateOutside) {
      // Simulate Chennai location (outside 100m of Bangalore restaurant)
      setGpsCoords({ latitude: 13.0826802, longitude: 80.2707184 });
      addToast('Simulated location: Outside Geofence (Chennai)', 'info');
      return;
    }

    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        addToast('GPS coordinates fetched successfully.', 'success');
      },
      (error) => {
        // Fallback: If geolocation permissions are blocked on desktop, simulate inside restaurant coordinates
        console.warn('Geolocation blocked. Simulating inside restaurant coordinates.', error.message);
        setGpsCoords({ latitude: 12.9715987, longitude: 77.5945627 });
        addToast('Geolocation blocked. Simulated inside geofence coordinates.', 'warning');
      },
      { enableHighAccuracy: true }
    );
  };

  // Handle Clock In
  const handleClockInSubmit = async () => {
    if (!capturedPhoto) {
      addToast('Please capture your photo/selfie first.', 'error');
      return;
    }
    if (!gpsCoords) {
      addToast('Please capture your GPS coordinates.', 'error');
      return;
    }

    setClockInLoading(true);
    try {
      // Convert base64 capturedPhoto to Blob file
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
        addToast(data.message, 'success');
        setCapturedPhoto(null);
        setGpsCoords(null);
        fetchData();
      } else {
        addToast(data.message || 'Clock-in failed.', 'error');
        fetchData();
      }
    } catch (err) {
      addToast('Connection error during Clock-in.', 'error');
    } finally {
      setClockInLoading(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    try {
      const response = await apiRequest('/attendance/clock-out', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        addToast('Clocked out successfully.', 'success');
        fetchData();
      } else {
        addToast(data.message || 'Clock-out failed.', 'error');
      }
    } catch (err) {
      addToast('Connection error during Clock-out.', 'error');
    }
  };

  // Order Handlers
  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await apiRequest(`/orders/${orderId}/assign`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        addToast('Order accepted! Check order details below.', 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Error accepting order.', 'error');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Order advanced to ${status}.`, 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Error updating status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          DineFlow Employee Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform clock-in, handle orders, and monitor your shifts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proximity Attendance Widget */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Shift Attendance</span>
            </h3>

            {activeSession ? (
              // Clocked In view
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Clocked In Shift Active</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Started: {new Date(activeSession.clockInTime).toLocaleTimeString()}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Check-in Geofence distance: {activeSession.distanceMeters}m
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClockOut}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition duration-200 shadow-lg shadow-rose-600/15"
                >
                  Clock Out Shift
                </button>
              </div>
            ) : (
              // Clocked Out, need to Clock In
              <div className="space-y-4">
                {/* Selfie Webcam Feed container */}
                <div className="w-full aspect-video rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center overflow-hidden relative">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : capturedPhoto ? (
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-[10px] text-slate-450 mt-2 font-semibold">Webcam Selfie Capture</p>
                    </div>
                  )}

                  {/* Overlay Canvas */}
                  <canvas ref={canvasRef} width={320} height={240} className="hidden" />
                </div>

                {/* Cam Controls */}
                <div className="flex gap-2">
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{capturedPhoto ? 'Retake Photo' : 'Start Camera'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Capture Selfie</span>
                    </button>
                  )}
                  {cameraActive && (
                    <button
                      onClick={stopCamera}
                      className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* GPS trigger */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">GPS Coordinates</p>
                      {gpsCoords ? (
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-400 mt-0.5">Not fetched yet</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={fetchGPS}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold"
                  >
                    Fetch GPS
                  </button>
                </div>

                {/* Location simulation toggler */}
                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 dark:bg-slate-900"
                    checked={simulateOutside}
                    onChange={(e) => {
                      setSimulateOutside(e.target.checked);
                      setGpsCoords(null); // Force refetch
                    }}
                  />
                  <span>Simulate Geofence Failure (Outside 100m)</span>
                </label>

                {/* Submit button */}
                <button
                  onClick={handleClockInSubmit}
                  disabled={clockInLoading || !capturedPhoto || !gpsCoords}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm transition duration-200 shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5"
                >
                  {clockInLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Clock In Shift</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Assigned and Available Orders Queue */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            Orders Desk
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No active orders found.</div>
            ) : (
              // Filter orders: employee can see unassigned orders (to accept) or orders assigned to them
              orders
                .filter(order => !order.assignedEmployee?.name || order.assignedEmployee.id === user?.id)
                .map((order) => {
                  const isMyOrder = order.assignedEmployee?.id === user?.id;
                  return (
                    <div key={order._id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{order.orderNumber}</span>
                          <span className="text-[10px] font-semibold text-slate-400 ml-2">
                            ({order.customerName})
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            order.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                              order.status === 'READY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {order.items.map((i, idx) => (
                          <span key={idx} className="mr-3 font-semibold">
                            {i.name} x{i.quantity}
                          </span>
                        ))}
                      </div>

                      {/* Assign button / advance status */}
                      <div className="flex justify-between items-center text-xs mt-1">
                        <div>
                          {isMyOrder ? (
                            <p className="text-[10px] text-indigo-500 font-bold">Assigned to You</p>
                          ) : (
                            <p className="text-[10px] text-amber-500 font-bold">Unassigned Order</p>
                          )}
                        </div>

                        <div>
                          {!isMyOrder ? (
                            <button
                              onClick={() => handleAcceptOrder(order._id)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                              Accept Order
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              {order.status === 'PREPARING' && (
                                <button
                                  onClick={() => handleUpdateStatus(order._id, 'READY')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Ready</span>
                                </button>
                              )}
                              {order.status === 'READY' && (
                                <button
                                  onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Deliver Order</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Shifts History Log */}
      <div className="p-6 rounded-3xl glass-panel">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
          Shift Log History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Date</th>
                <th className="pb-3">Clock In</th>
                <th className="pb-3">Clock Out</th>
                <th className="pb-3">Work Hours</th>
                <th className="pb-3">Proximity</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">No shift histories found.</td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log._id}>
                    <td className="py-3.5 font-semibold">{new Date(log.clockInTime).toLocaleDateString()}</td>
                    <td className="py-3.5 text-indigo-500 font-medium">
                      {new Date(log.clockInTime).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 text-emerald-500 font-medium">
                      {log.clockOutTime ? new Date(log.clockOutTime).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3.5 font-bold">{log.workHours ? `${log.workHours} hrs` : 'N/A'}</td>
                    <td className="py-3.5 text-slate-450">{log.distanceMeters} meters</td>
                    <td className="py-3.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          log.status === 'LATE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350'
                        }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

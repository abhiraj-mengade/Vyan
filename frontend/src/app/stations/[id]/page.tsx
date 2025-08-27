"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import PaymentSuccess from "@/components/PaymentSuccess";
import AnimatedBattery from "@/components/AnimatedBattery";
import DraggableSlider from "@/components/DraggableSlider";
import { getStationByNumericId, type Station } from "@/data/stations";
import { TbBattery, TbBolt, TbCoin, TbWallet, TbArrowLeft, TbQrcode, TbCamera } from "react-icons/tb";
// QR Scanner will be dynamically imported to avoid SSR issues

// Station-specific InfoCard component
function StationInfoCard({ title, subtitle, className = "flex-1" }: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={`bg-custom-bg-shadow-dark rounded-lg shadow-neuro-dark-deep p-4 ${className} flex flex-col justify-center items-center text-center`}>
      <div className="text-emerald-600 text-2xl mb-1">{subtitle}</div>
      <div className="text-neutral-400 text-xs font-medium">{title}</div>
    </div>
  );
}

export default function StationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const account = undefined as any; // wallet removed for prototype
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [batteryInserted, setBatteryInserted] = useState(false);
  const [batteryReady, setBatteryReady] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scannedStationId, setScannedStationId] = useState<string | null>(null);
  const [swapFee, setSwapFee] = useState<bigint>(BigInt("212000000000000000000"));
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userBatteryId, setUserBatteryId] = useState<bigint | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [batteryForm, setBatteryForm] = useState({
    capacity: '75',
    currentCharge: '15',
    healthScore: '85'
  });
  const [userBalance, setUserBalance] = useState<bigint>(BigInt("960000000000000000000"));
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [finalSwapFee, setFinalSwapFee] = useState<bigint>(BigInt(0));
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrScannerRef = useRef<any | null>(null);
  const isDragging = useRef(false);

  // Cleanup camera on unmount (must be before any conditional returns)
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Cleanup global listeners on unmount (must be before any conditional returns)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Get station data from centralized data
  const station = getStationByNumericId(parseInt(params.id));
  
  if (!station) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-sm mx-auto space-y-8">
          <Header />
          <div className="text-center pt-6">
            <h1 className="text-neutral-200 text-2xl">Station Not Found</h1>
            <p className="text-neutral-400 text-sm mt-2">The requested station could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      
      // Dynamically import QR Scanner to avoid SSR issues
      const QrScanner = (await import('qr-scanner')).default;
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      // Wait for video to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          // Initialize QR Scanner
          qrScannerRef.current = new QrScanner(
            videoRef.current!,
            (result) => handleQRScanResult(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment'
            }
          );
          qrScannerRef.current.start();
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleQRScanResult = async (qrData: string) => {
    try {
      setQrResult(qrData);
      // For prototype: any QR is accepted; proceed to swipe-to-pay
      setScannedStationId(params.id);
      stopCamera();
      
      // Load station details and fee for display
      await loadStationDetails(params.id);

      // Populate a demo KRW balance
      await checkUserBalance();

      // Move to the next step (show slider UI)
      setHasScanned(true);
      setBatteryInserted(true);
      setBatteryReady(true);
      setIsProcessingPayment(false);
      setPaymentSuccessful(false);
    } catch (error) {
      console.error('QR scan error:', error);
      setCameraError(error instanceof Error ? error.message : 'Failed to process QR code');
      stopCamera();
    }
  };

  const checkUserBalance = async () => {
    // prototype: return fixed balance
    const balance = BigInt("960000000000000000000"); // 960 KRW units (display scaled)
        setUserBalance(balance);
        return balance;
  };

  const loadStationDetails = async (stationId: string) => {
    // prototype: simulate fee calculation
    await new Promise(r => setTimeout(r, 300));
    setSwapFee(BigInt("212000000000000000000")); // 212 KRW
    setUserBatteryId(BigInt(101));
  };

  const handleStartScan = () => {
    startCamera();
  };

  const handleBatteryInserted = () => {
    setBatteryInserted(true);
    setBatteryReady(true);
  };

  const handleRegisterBattery = async () => {

    // Validate form inputs
    const capacity = parseFloat(batteryForm.capacity);
    const currentCharge = parseFloat(batteryForm.currentCharge);
    const healthScore = parseFloat(batteryForm.healthScore);

    if (capacity <= 0 || capacity > 200) {
      setCameraError('Battery capacity must be between 1-200 kWh');
      return;
    }
    if (currentCharge < 0 || currentCharge > 100) {
      setCameraError('Current charge must be between 0-100%');
      return;
    }
    if (healthScore < 0 || healthScore > 100) {
      setCameraError('Health score must be between 0-100%');
      return;
    }

      setIsProcessingPayment(true);
    await new Promise(r => setTimeout(r, 1200));
    setUserBatteryId(BigInt(202));
    if (scannedStationId) await loadStationDetails(scannedStationId);
      setCameraError(null);
      setShowRegisterForm(false);
      setIsProcessingPayment(false);
  };

  const handleSwapPayment = async () => {
    if (!scannedStationId) {
      setCameraError('Invalid session. Please scan QR code again.');
      setIsSliderActive(false);
      setSliderPosition(0);
      return;
    }

    try {
      setIsProcessingPayment(true);
      setShowToast(true);
      await new Promise(r => setTimeout(r, 600));
      setTransactionHash(`#SWP-${Date.now().toString().slice(-8)}`);
      setFinalSwapFee(swapFee);
      
      // Reset slider and show success
      setIsSliderActive(false);
      setSliderPosition(0);
      setIsProcessingPayment(false);
      
      setTimeout(() => {
        setPaymentSuccessful(true);
      }, 400);
    } catch (error) {
      console.error('Payment failed:', error);
      setIsSliderActive(false);
      setSliderPosition(0);
      setIsProcessingPayment(false);
        setCameraError('Transaction failed. Please try again.');
    }
  };

  

  

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    try {
      const rect = sliderRef.current.getBoundingClientRect();
      const newPosition = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSliderPosition(newPosition);
      
      if (newPosition >= 90) {
        setIsSliderActive(true);
        // Trigger actual swap process with blockchain
        handleSwapPayment();
      }
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
      isDragging.current = false;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    try {
      const rect = sliderRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const newPosition = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      setSliderPosition(newPosition);
      
      if (newPosition >= 90) {
        setIsSliderActive(true);
        // Trigger actual swap process with blockchain
        handleSwapPayment();
      }
    } catch (error) {
      console.error('Error in handleTouchMove:', error);
      isDragging.current = false;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (!isSliderActive) {
      setSliderPosition(0);
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (!isSliderActive) {
      setSliderPosition(0);
    }
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  

  // Show QR Scanner Interface
  if (!hasScanned) {
    return (
      <div className="min-h-screen">
        <div className="max-w-sm mx-auto space-y-8">
          <Header />
          
          <div className="px-6">
            {/* Station Name */}
            <div className="text-center pb-8">
              <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
              <p className="text-neutral-400 text-sm mt-2">{station.location}</p>
            </div>

            {/* QR Scanner Interface */}
            <div className="text-center space-y-6">
              {!isScanning ? (
                <>
                  <div className="bg-custom-bg-shadow-dark rounded-2xl shadow-neuro-dark-deep p-8">
                    <TbQrcode className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-neutral-200 text-xl mb-2">Scan QR Code</h2>
                    <p className="text-neutral-400 text-sm mb-6">
                      Scan the QR code on your battery to begin the swap process
                    </p>
                    <button
                      onClick={handleStartScan}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
                    >
                      <TbCamera className="w-5 h-5" />
                      <span>Start Scanning</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-custom-bg-shadow-dark rounded-2xl shadow-neuro-dark-deep p-8">
                    <div className="relative w-64 h-64 mx-auto mb-6">
                      {/* Camera Frame with Video */}
                      <div className="absolute inset-0 border-4 border-emerald-400 rounded-2xl overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Corner Indicators */}
                          <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-emerald-400"></div>
                          <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-emerald-400"></div>
                          <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-emerald-400"></div>
                          <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-emerald-400"></div>
                          
                          {/* Center Crosshair */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 border-2 border-emerald-400 rounded-lg relative">
                              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400 transform -translate-y-1/2"></div>
                              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400 transform -translate-x-1/2"></div>
                            </div>
                          </div>
                          
                          {/* Scanning Lines */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 animate-pulse"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 animate-pulse" style={{ animationDelay: '1s' }}></div>
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <h2 className="text-neutral-200 text-xl mb-2">Scanning...</h2>
                    <p className="text-neutral-400 text-sm">
                      Please hold the QR code steady in the frame
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-6 w-full bg-custom-bg-dark rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-2 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: '20%' }}
                      ></div>
                    </div>
                    
                    <p className="text-emerald-400 text-sm mt-2">Processing...</p>
                  </div>
                </>
              )}
              
              {/* Camera Error Display */}
              {cameraError && (
                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{cameraError}</p>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        setShowInsufficientFunds(false);
                      }}
                      className="mt-2 text-red-300 text-xs underline hover:text-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                  
                  {showInsufficientFunds && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                      <h3 className="text-yellow-400 font-semibold mb-3">💰 Balance Low</h3>
                      <p className="text-custom-text-light/80 text-sm mb-2">
                        Please add funds to continue. Prototype uses KRW.
                      </p>
                          </div>
                        )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Battery Info and Insertion Flow after QR scan
  if (!batteryReady) {
    return (
      <div className="min-h-screen">
        <div className="max-w-sm mx-auto space-y-8">
          <Header />
          
          <div className="px-6">
            {/* Station Name */}
            <div className="text-center pb-8">
              <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
              <p className="text-neutral-400 text-sm mt-2">{station.location}</p>
              {scannedStationId && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
                  <p className="text-green-400 text-sm">
                    ✓ Connected to Station {scannedStationId}
                  </p>
                  {sessionId && (
                    <p className="text-green-300 text-xs mt-1">
                      Session: {sessionId.substring(0, 8)}...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Main Content: Battery + Info Cards */}
            <div className="flex space-x-8 p-6">
              {/* Left Half: Animated Battery */}
              <div className="flex-1 flex items-end justify-center">
                <AnimatedBattery percentage={station.percentage || Math.round((station.charged / station.total) * 100)} />
              </div>
              
              {/* Right Half: Three Info Cards */}
              <div className="flex-1 space-y-4">
                <StationInfoCard
                  title="Available Batteries"
                  subtitle={`${station.availableBatteries || station.charged}/${station.totalSlots || station.total}`}
                  className="w-full h-20"
                />
                <StationInfoCard
                  title="Swap Fee"
                  subtitle={`${(Number(swapFee) / 1e18).toFixed(2)} KRW`}
                  className="w-full h-20"
                />
                <StationInfoCard
                  title="KRW Swap Token"
                  subtitle={`${(Number(userBalance) / 1e18).toFixed(2)} KRW`}
                  className="w-full h-20"
                />
                <StationInfoCard
                  title="Tokens Earned"
                  subtitle={"+10 KRW Swap"}
                  className="w-full h-20"
                />
              </div>
            </div>

            {/* Battery Insertion Instructions */}
            <div className="text-center space-y-6">
              {!batteryInserted ? (
                <div className="p-6">
                  <p className="text-neutral-400 text-xs mb-6">
                    Please insert your discharged battery into the designated slot and press the button below once completed.
                  </p>
                  
                  {/* Battery Registration Required */}
                  {!userBatteryId && account && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                      <h4 className="text-red-400 text-sm font-medium mb-2">Battery Registration Required</h4>
                      <p className="text-neutral-400 text-xs mb-3">
                        You need to register a battery before you can swap. This only needs to be done once.
                      </p>
                      
                      {!showRegisterForm ? (
                        <button
                          onClick={() => setShowRegisterForm(true)}
                          className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Register My Battery
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-neutral-400 text-xs mb-1">
                              Battery Capacity (kWh)
                              <span className="text-neutral-500 ml-1">• Will be stored as kWh × 1000</span>
                            </label>
                            <input
                              type="number"
                              value={batteryForm.capacity}
                              onChange={(e) => setBatteryForm(prev => ({ ...prev, capacity: e.target.value }))}
                              placeholder="75"
                              min="1"
                              max="200"
                              step="0.1"
                              className="w-full px-3 py-2 bg-custom-bg-dark border border-neutral-600 rounded-lg text-neutral-200 text-sm focus:border-red-500 focus:outline-none"
                            />
                            <p className="text-neutral-500 text-xs mt-1">Example: 75 kWh for standard EV battery</p>
                          </div>
                          
                          <div>
                            <label className="block text-neutral-400 text-xs mb-1">
                              Current Charge Level (%)
                              <span className="text-neutral-500 ml-1">• 0-100 percentage</span>
                            </label>
                            <input
                              type="number"
                              value={batteryForm.currentCharge}
                              onChange={(e) => setBatteryForm(prev => ({ ...prev, currentCharge: e.target.value }))}
                              placeholder="15"
                              min="0"
                              max="100"
                              step="1"
                              className="w-full px-3 py-2 bg-custom-bg-dark border border-neutral-600 rounded-lg text-neutral-200 text-sm focus:border-red-500 focus:outline-none"
                            />
                            <p className="text-neutral-500 text-xs mt-1">Current battery charge percentage</p>
                          </div>
                          
                          <div>
                            <label className="block text-neutral-400 text-xs mb-1">
                              Battery Health Score (%)
                              <span className="text-neutral-500 ml-1">• 0-100, 100 = perfect</span>
                            </label>
                            <input
                              type="number"
                              value={batteryForm.healthScore}
                              onChange={(e) => setBatteryForm(prev => ({ ...prev, healthScore: e.target.value }))}
                              placeholder="85"
                              min="0"
                              max="100"
                              step="1"
                              className="w-full px-3 py-2 bg-custom-bg-dark border border-neutral-600 rounded-lg text-neutral-200 text-sm focus:border-red-500 focus:outline-none"
                            />
                            <p className="text-neutral-500 text-xs mt-1">Battery condition: 100% = new, 85% = good, 70% = fair</p>
                          </div>
                          
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => setShowRegisterForm(false)}
                              className="flex-1 py-2 bg-neutral-600 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleRegisterBattery}
                              disabled={isProcessingPayment}
                              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
                            >
                              {isProcessingPayment ? 'Registering...' : 'Register'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transaction Preview */}
                  {swapFee > 0 && userBatteryId && (
                    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                      <h4 className="text-blue-400 text-sm font-medium mb-2">Transaction Preview</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Swap Fee:</span>
                          <span className="text-blue-300">{(Number(swapFee) / 1e18).toFixed(2)} KRW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Battery ID:</span>
                          <span className="text-green-400">#{userBatteryId?.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Your Balance:</span>
                          <span className={`${userBalance >= swapFee ? 'text-green-400' : 'text-red-400'}`}>
                            {(Number(userBalance) / 1e18).toFixed(2)} KRW
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Wallet Connected:</span>
                          <span className="text-green-400">{account ? '✓' : '✗'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleBatteryInserted}
                    disabled={!userBatteryId}
                    className="bg-custom-bg-shadow-dark hover:bg-custom-bg-dark text-emerald-400 text-sm hover:text-emerald-300 px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 mx-auto shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed border border-custom-bg-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TbBattery className="w-5 h-5" />
                    <span>{!userBatteryId ? 'Register Battery First' : 'Battery Inserted'}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Payment Success Screen
  if (paymentSuccessful) {
    return (
      <div className="min-h-screen">
        <div className="max-w-sm mx-auto">
          <Header />
          <PaymentSuccess 
            transactionHash={transactionHash}
            swapFee={finalSwapFee}
            stationId={scannedStationId ?? undefined}
            batteryId={userBatteryId?.toString()}
          />
        </div>
      </div>
    );
  }

  // Show Existing UI with slider after battery is ready
  return (
    <div className="min-h-screen">
      <div className="max-w-sm mx-auto space-y-8">
        <Header />
        
        <div className="px-6">
        {/* Station Name */}
        <div className="text-center pb-8">
          <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
          <p className="text-neutral-400 text-sm mt-2">{station.location}</p>
          {scannedStationId && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm">
                ✓ Connected to Station {scannedStationId}
              </p>
              {sessionId && (
                <p className="text-green-300 text-xs mt-1">
                  Session: {sessionId.substring(0, 8)}...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main Content: Battery + Info Cards */}
        <div className="flex space-x-8 p-6">
          {/* Left Half: Animated Battery */}
          <div className="flex-1 flex items-end justify-center">
            <AnimatedBattery percentage={station.percentage || Math.round((station.charged / station.total) * 100)} />
          </div>
          
          {/* Right Half: Three Info Cards */}
          <div className="flex-1 space-y-4">
            <StationInfoCard
              title="Available Batteries"
              subtitle={`${station.availableBatteries || station.charged}/${station.totalSlots || station.total}`}
              className="w-full h-20"
            />
            <StationInfoCard
              title="Swap Fee"
              subtitle={`${(Number(swapFee) / 1e18).toFixed(2)} KRW`}
              className="w-full h-20"
            />
            <StationInfoCard
              title="KRW Swap Token"
              subtitle={`${(Number(userBalance) / 1e18).toFixed(2)} KRW`}
              className="w-full h-20"
            />
            <StationInfoCard
              title="Tokens Earned"
              subtitle={"+10 SWAP"}
              className="w-full h-20"
            />
          </div>
        </div>

        {/* Battery Status Message */}
        {batteryInserted && (
          <div className="text-center pt-6">
            <p className="text-emerald-400 text-sm font-medium">
              ✓ Your battery has been inserted
            </p>
          </div>
        )}

        {/* Draggable Slider Component */}
        <div className="pt-6">
          {isProcessingPayment ? (
            <div className="text-center p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-blue-400 text-sm font-medium">Processing Payment...</p>
              <p className="text-blue-300 text-xs mt-1">Please confirm transaction in your wallet</p>
            </div>
          ) : (
            <DraggableSlider
              isSliderActive={isSliderActive}
              sliderPosition={sliderPosition}
              sliderRef={sliderRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            />
          )}
        </div>
      </div>
    </div>
    </div>
  );
}




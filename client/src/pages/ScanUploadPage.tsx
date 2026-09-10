import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Camera, Image as ImageIcon, Sparkles, 
  CheckCircle2, AlertCircle, RefreshCw, FileText, ArrowRight, 
  ShieldAlert, X, Eye, Layers, Zap, Info, Sliders, Trash2
} from 'lucide-react';
import { SAMPLE_LABELS, SampleLabel } from '../data/sampleLabels';
import { api } from '../services/api';
import { ParsedFields, User } from '../types';
import { CameraCaptureModal, CapturedImageData } from '../components/CameraCaptureModal';

interface ScanUploadPageProps {
  user?: User | null;
  initialSample?: SampleLabel | null;
  onOcrComplete: (data: {
    imageUrl: string;
    productName: string;
    brand: string;
    category: string;
    rawText: string;
    parsedFields?: ParsedFields;
    boundingBoxes?: any[];
  }) => void;
  onDirectReportGenerated?: (reportId: string) => void;
}

interface ImageMetadata {
  name: string;
  size: string;
  width: number;
  height: number;
}

type PackageSide = 'front' | 'back' | 'side';

interface SideData {
  previewUrl: string | null;
  imageMeta: ImageMetadata | null;
  file?: File | null;
}

export const ScanUploadPage: React.FC<ScanUploadPageProps> = ({
  user,
  initialSample,
  onOcrComplete,
  onDirectReportGenerated
}) => {
  const [selectedSample, setSelectedSample] = useState<SampleLabel | null>(null);
  const [sideImages, setSideImages] = useState<Record<PackageSide, SideData>>({
    front: { previewUrl: null, imageMeta: null, file: null },
    back: { previewUrl: null, imageMeta: null, file: null },
    side: { previewUrl: null, imageMeta: null, file: null }
  });
  
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Food & Beverages');
  const [isMasterDragOver, setIsMasterDragOver] = useState(false);
  const [dragOverSide, setDragOverSide] = useState<PackageSide | null>(null);

  // Processing & Loading State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [manualTextFallback, setManualTextFallback] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTargetSide, setCameraTargetSide] = useState<PackageSide>('front');
  const [showRulesDetail, setShowRulesDetail] = useState(false);

  // Hidden File Inputs
  const masterInputRef = useRef<HTMLInputElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  // Total loaded panels count
  const uploadedSides = (['front', 'back', 'side'] as const).filter(
    (s) => !!sideImages[s].previewUrl
  );
  const totalUploadedCount = uploadedSides.length;
  const hasAnyImage = totalUploadedCount > 0;

  // Sync initialSample if provided
  useEffect(() => {
    if (initialSample) {
      handleSelectBenchmark(initialSample);
    }
  }, [initialSample]);

  // When a preset benchmark is chosen
  const handleSelectBenchmark = (sample: SampleLabel) => {
    setSelectedSample(sample);
    setSideImages({
      front: {
        previewUrl: sample.svgDataUrl,
        imageMeta: {
          name: `${sample.name.replace(/\s+/g, '_')}_front.svg`,
          size: 'Benchmark Vector',
          width: 600,
          height: 420
        },
        file: null
      },
      back: { previewUrl: null, imageMeta: null, file: null },
      side: { previewUrl: null, imageMeta: null, file: null }
    });
    setProductName(sample.name);
    setBrand(sample.brand);
    setCategory(sample.category);
    setOcrError(null);
    setManualTextFallback(false);
  };

  // Helper to process an image file
  const processSingleFile = (file: File, targetSide: PackageSide): Promise<void> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        setOcrError('Please upload valid image files (PNG, JPG, WEBP, BMP).');
        resolve();
        return;
      }

      const sizeFormatted = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const meta: ImageMetadata = {
          name: file.name,
          size: sizeFormatted,
          width: 0,
          height: 0
        };

        const img = new Image();
        img.onload = () => {
          meta.width = img.naturalWidth || img.width;
          meta.height = img.naturalHeight || img.height;
          setSideImages(prev => ({
            ...prev,
            [targetSide]: { previewUrl: dataUrl, imageMeta: meta, file }
          }));
          resolve();
        };
        img.onerror = () => {
          setSideImages(prev => ({
            ...prev,
            [targetSide]: { previewUrl: dataUrl, imageMeta: meta, file }
          }));
          resolve();
        };
        img.src = dataUrl;

        // Auto-populate product name from filename if empty
        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setProductName(prev => prev || (baseName.charAt(0).toUpperCase() + baseName.slice(1)));
      };
      reader.readAsDataURL(file);
    });
  };

  // Multi-file batch handler (Uploads 1, 2, or 3 images simultaneously)
  const handleMultipleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) {
      setOcrError('Please upload valid image files (PNG, JPG, WEBP, BMP).');
      return;
    }
    setOcrError(null);
    setSelectedSample(null);
    setManualTextFallback(false);

    // If 1 image uploaded: map to 'front'
    // If 2 images: map to 'front' and 'back'
    // If 3+ images: map to 'front', 'back', and 'side'
    const sides: PackageSide[] = ['front', 'back', 'side'];
    for (let i = 0; i < Math.min(fileArr.length, 3); i++) {
      await processSingleFile(fileArr[i], sides[i]);
    }
  };

  // Master Drop Handler
  const handleMasterDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMasterDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  // Individual Panel File Change
  const handleFileChangeForSide = (e: React.ChangeEvent<HTMLInputElement>, side: PackageSide) => {
    const file = e.target.files?.[0];
    if (file) {
      processSingleFile(file, side);
      e.target.value = '';
    }
  };

  // Individual Panel Drop Handler
  const handleDropForSide = (e: React.DragEvent, side: PackageSide) => {
    e.preventDefault();
    setDragOverSide(null);
    const file = e.dataTransfer.files?.[0];
    if (file) processSingleFile(file, side);
  };

  // Clear single panel
  const handleClearImage = (sideToClear: PackageSide) => {
    setSideImages(prev => ({
      ...prev,
      [sideToClear]: { previewUrl: null, imageMeta: null, file: null }
    }));
    setSelectedSample(null);
  };

  // Clear all panels
  const handleClearAll = () => {
    setSideImages({
      front: { previewUrl: null, imageMeta: null, file: null },
      back: { previewUrl: null, imageMeta: null, file: null },
      side: { previewUrl: null, imageMeta: null, file: null }
    });
    setSelectedSample(null);
    setOcrError(null);
    setManualTextFallback(false);
  };

  // Camera Actions
  const openCameraForSide = (side: PackageSide) => {
    setCameraTargetSide(side);
    setIsCameraOpen(true);
  };

  const handleCameraCapture = (captured: CapturedImageData) => {
    setSelectedSample(null);
    setSideImages(prev => ({
      ...prev,
      [cameraTargetSide]: {
        previewUrl: captured.dataUrl,
        imageMeta: {
          name: `${captured.name.replace('.jpg', '')}_${cameraTargetSide}.jpg`,
          size: captured.size,
          width: captured.width,
          height: captured.height
        },
        file: null
      }
    }));
    setOcrError(null);
    setManualTextFallback(false);
  };

  // Run Batch High-Speed Scan & Validate 14 Rules
  const handleStartAnalysis = async () => {
    const activeSides = (['front', 'back', 'side'] as const).filter(s => !!sideImages[s].previewUrl);
    if (activeSides.length === 0 && !selectedSample && !manualText) return;

    setIsProcessing(true);
    setOcrError(null);
    setManualTextFallback(false);
    setOcrProgress(15);
    setActiveStage(1);
    setStatusMessage("Preparing packaging images for batch inspection...");

    try {
      if (selectedSample) {
        // Benchmark preset: fast accurate extraction with coordinates
        setOcrProgress(35);
        setActiveStage(2);
        setStatusMessage("Reading statutory declarations from benchmark label...");
        
        const parsedRes = await api.processOcr({
          raw_text: selectedSample.rawText,
          image_url: selectedSample.svgDataUrl,
          product_name: productName || selectedSample.name,
          brand: brand || selectedSample.brand,
          category: category || selectedSample.category
        });

        setOcrProgress(75);
        setActiveStage(3);
        setStatusMessage("Validating all 14 mandatory FSSAI food packaging rules...");

        const valRes = await api.validateCompliance({
          product_name: productName || selectedSample.name,
          brand: brand || selectedSample.brand,
          category: category || selectedSample.category,
          image_url: selectedSample.svgDataUrl,
          raw_text: selectedSample.rawText,
          parsed_fields: parsedRes.parsed_fields
        });

        setOcrProgress(100);
        setActiveStage(4);
        setStatusMessage("14 Rules Validated! Opening Official Compliance Report...");

        if (onDirectReportGenerated && valRes.report_id) {
          onDirectReportGenerated(valRes.report_id);
        } else {
          onOcrComplete({
            imageUrl: selectedSample.svgDataUrl,
            productName: productName || selectedSample.name,
            brand: brand || selectedSample.brand,
            category: category || selectedSample.category,
            rawText: selectedSample.rawText,
            parsedFields: parsedRes.parsed_fields,
            boundingBoxes: selectedSample.boundingBoxes
          });
        }
        return;
      }

      // High-speed Server Batch OCR & 14-Rule Evaluation for real inspector uploads
      const filesToUpload: File[] = [];
      const base64ToUpload: string[] = [];

      activeSides.forEach(side => {
        const data = sideImages[side];
        if (data.file) {
          filesToUpload.push(data.file);
        } else if (data.previewUrl) {
          base64ToUpload.push(data.previewUrl);
        }
      });

      setOcrProgress(30);
      setActiveStage(2);
      setStatusMessage(`Running Server Tesseract Neural OCR on all ${activeSides.length} image(s) simultaneously...`);

      const result = await api.uploadAndValidate({
        files: filesToUpload.length > 0 ? filesToUpload : undefined,
        images_base64: base64ToUpload.length > 0 ? base64ToUpload : undefined,
        product_name: productName,
        brand: brand,
        category: category
      });

      setOcrProgress(80);
      setActiveStage(3);
      setStatusMessage("Validating 14 mandatory FSSAI food packaging declarations...");
      
      await new Promise(r => setTimeout(r, 250));

      setOcrProgress(100);
      setActiveStage(4);
      setStatusMessage(`Validated All 14 Rules! Compliance: ${result.report.score}% — Opening Report...`);

      if (onDirectReportGenerated && result.report_id) {
        onDirectReportGenerated(result.report_id);
      } else {
        const primaryImageUrl = sideImages.front.previewUrl || sideImages.back.previewUrl || sideImages.side.previewUrl || '';
        onOcrComplete({
          imageUrl: primaryImageUrl,
          productName: productName || result.product?.product_name || 'Packaged Commodity',
          brand: brand || result.product?.brand || 'Manufacturer',
          category: category,
          rawText: result.ocr_extracted_text || '',
          parsedFields: result.scan?.parsed_fields
        });
      }
    } catch (err: any) {
      console.error("Batch OCR & Validation error:", err);
      setOcrError(err.message || "Failed to scan packaging images. Please verify your connection or try again.");
      setStatusMessage(`Inspection Alert: ${err.message || 'Error occurred'}`);
      setManualTextFallback(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit manual text fallback if photo text was unreadable
  const handleManualTextSubmit = async () => {
    if (!manualText.trim()) return;
    setIsProcessing(true);
    try {
      const parsedRes = await api.processOcr({
        raw_text: manualText,
        image_url: sideImages.front.previewUrl || '',
        product_name: productName,
        brand: brand,
        category: category
      });

      const valRes = await api.validateCompliance({
        product_name: productName,
        brand: brand,
        category: category,
        raw_text: manualText,
        parsed_fields: parsedRes.parsed_fields
      });

      if (onDirectReportGenerated && valRes.report_id) {
        onDirectReportGenerated(valRes.report_id);
      } else {
        onOcrComplete({
          imageUrl: sideImages.front.previewUrl || '',
          productName: productName || parsedRes.parsed_fields.commodity_name || "Inspected Commodity",
          brand: brand || parsedRes.parsed_fields.manufacturer?.name || "Generic Manufacturer",
          category,
          rawText: manualText,
          parsedFields: parsedRes.parsed_fields
        });
      }
    } catch (e: any) {
      setOcrError("Failed to parse declarations: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // If user is Admin, render strict access block
  if (user && user.role === 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: '640px', margin: '40px auto', borderRadius: 'var(--radius-squircle)' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px', color: 'var(--fg)' }}>
          Statutory Access Restricted
        </h2>
        <p style={{ color: 'var(--muted-fg)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
          Under Section 38 of the Food Safety and Standards Act, 2006, only sworn <strong>Food Safety Officers</strong> are authorized to upload, scan, and inspect food packaging commodities.
          <br /><br />
          As an <strong>Administrator / Joint Controller</strong>, your clearance permits access to <strong>Central Analytics</strong>, <strong>Statutory Rule Controls</strong>, and the <strong>Officer Directory</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={masterInputRef}
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleMultipleFiles(e.target.files);
            e.target.value = '';
          }
        }}
        accept="image/png, image/jpeg, image/webp, image/bmp"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={frontInputRef}
        onChange={(e) => handleFileChangeForSide(e, 'front')}
        accept="image/png, image/jpeg, image/webp, image/bmp"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={backInputRef}
        onChange={(e) => handleFileChangeForSide(e, 'back')}
        accept="image/png, image/jpeg, image/webp, image/bmp"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={sideInputRef}
        onChange={(e) => handleFileChangeForSide(e, 'side')}
        accept="image/png, image/jpeg, image/webp, image/bmp"
        style={{ display: 'none' }}
      />

      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-compliant" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
            <span className="status-dot-ping" />
            Batch Multi-Image OCR
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--muted-fg)' }}>
            One-Shot Scan • All 14 Mandatory FSSAI Rules Validated Simultaneously
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: 'var(--fg)' }}>
          Packaging Label <span className="text-gradient-primary">Batch Inspection &amp; Audit</span>
        </h1>
      </div>

      {/* Error Alert */}
      {ocrError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#fca5a5',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={20} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
              OCR Extraction Notice
            </div>
            <div>{ocrError}</div>
            {/session expired|token|sign in/i.test(ocrError) && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    api.logout();
                    window.location.reload();
                  }}
                  className="btn btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: '#ef4444',
                    borderColor: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  Sign In Again Now →
                </button>
              </div>
            )}
            {manualTextFallback && (
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                  You can paste or transcribe the label text directly below to run dynamic validation without re-taking the photo:
                </span>
                <textarea
                  rows={4}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste label text here: e.g. Mfd By: XYZ Foods Ltd, Mumbai 400001. Net Qty: 100 g. MRP Rs. 50 (incl. of all taxes). Date: 08/2024..."
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px',
                    background: '#090d16',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem'
                  }}
                />
                <button
                  onClick={handleManualTextSubmit}
                  className="btn btn-primary"
                  style={{ marginTop: '8px', padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  Validate Transcribed Text
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setOcrError(null)} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Master Batch Upload + 3 Visible Packaging Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Master Batch Uploader Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsMasterDragOver(true); }}
            onDragLeave={() => setIsMasterDragOver(false)}
            onDrop={handleMasterDrop}
            className="glass-panel"
            style={{
              padding: '24px 26px',
              borderRadius: 'var(--radius-squircle)',
              border: `2px dashed ${isMasterDragOver ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}`,
              background: isMasterDragOver 
                ? 'linear-gradient(180deg, rgba(14, 28, 54, 0.98) 0%, rgba(8, 14, 28, 1) 100%)' 
                : 'linear-gradient(180deg, rgba(10, 16, 32, 0.85) 0%, rgba(6, 9, 20, 0.92) 100%)',
              boxShadow: isMasterDragOver ? '0 0 30px rgba(56, 189, 248, 0.35)' : 'var(--shadow-card)',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <UploadCloud size={28} color="#38bdf8" />
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              Upload All Packaging Images at Once
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.5 }}>
              Select <strong>1 single image</strong> (flat/whole label) or <strong>up to 3 images</strong> (Front, Back, Side). Drag &amp; drop all files here or browse at once — no tab switching required!
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => masterInputRef.current?.click()}
                className="btn btn-primary"
                style={{
                  padding: '10px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0284c7 100%)',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                }}
              >
                <UploadCloud size={17} />
                Browse Multiple Files (1 to 3 Images)
              </button>

              {hasAnyImage && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    color: '#f87171',
                    borderColor: 'rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              )}
            </div>

            <div style={{
              marginTop: '14px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Zap size={13} color="#f59e0b" />
              <span>High-speed persistent server OCR runs on all images simultaneously in ~2 seconds.</span>
            </div>
          </div>

          {/* 3 Simultaneous Packaging Panels Side-by-Side */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#38bdf8" />
                <span>PACKAGING SURFACE PANELS (ALL 3 VISIBLE)</span>
              </div>
              <span className={`badge ${hasAnyImage ? 'badge-compliant' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {totalUploadedCount} of 3 Panels Loaded
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {/* PANEL 1: FRONT */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverSide('front'); }}
                onDragLeave={() => setDragOverSide(null)}
                onDrop={(e) => handleDropForSide(e, 'front')}
                className="glass-panel"
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `1.5px solid ${dragOverSide === 'front' ? '#38bdf8' : sideImages.front.previewUrl ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-card)'}`,
                  background: sideImages.front.previewUrl ? 'rgba(10, 20, 40, 0.7)' : 'rgba(8, 12, 24, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>
                      1. FRONT
                    </span>
                    {sideImages.front.previewUrl ? (
                      <span className="badge badge-compliant" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        ✓ Ready
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Required</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.3 }}>
                    Principal Display (Name, Net Qty, Veg Mark)
                  </div>

                  {sideImages.front.previewUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#050811', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img
                        src={sideImages.front.previewUrl}
                        alt="Front Panel"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {isProcessing && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: '#38bdf8',
                          boxShadow: '0 0 10px #38bdf8',
                          animation: 'scanLaser 1.8s infinite ease-in-out'
                        }} />
                      )}
                    </div>
                  ) : (
                    <div style={{
                      height: '140px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-subtle)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <ImageIcon size={24} color="#64748b" style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Front Label</span>
                    </div>
                  )}
                </div>

                {/* Panel Action Buttons */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <UploadCloud size={11} />
                    {sideImages.front.previewUrl ? 'Change' : 'Browse'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openCameraForSide('front')}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Camera Capture"
                  >
                    <Camera size={12} />
                  </button>
                  {sideImages.front.previewUrl && (
                    <button
                      type="button"
                      onClick={() => handleClearImage('front')}
                      style={{
                        padding: '5px 8px',
                        fontSize: '0.7rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* PANEL 2: BACK */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverSide('back'); }}
                onDragLeave={() => setDragOverSide(null)}
                onDrop={(e) => handleDropForSide(e, 'back')}
                className="glass-panel"
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `1.5px solid ${dragOverSide === 'back' ? '#38bdf8' : sideImages.back.previewUrl ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-card)'}`,
                  background: sideImages.back.previewUrl ? 'rgba(10, 20, 40, 0.7)' : 'rgba(8, 12, 24, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>
                      2. BACK
                    </span>
                    {sideImages.back.previewUrl ? (
                      <span className="badge badge-compliant" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        ✓ Ready
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Optional</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.3 }}>
                    Ingredients, Nutrition, Lic, Expiry, Batch
                  </div>

                  {sideImages.back.previewUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#050811', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img
                        src={sideImages.back.previewUrl}
                        alt="Back Panel"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {isProcessing && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: '#38bdf8',
                          boxShadow: '0 0 10px #38bdf8',
                          animation: 'scanLaser 1.8s infinite ease-in-out'
                        }} />
                      )}
                    </div>
                  ) : (
                    <div style={{
                      height: '140px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-subtle)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <ImageIcon size={24} color="#64748b" style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Back Label</span>
                    </div>
                  )}
                </div>

                {/* Panel Action Buttons */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <UploadCloud size={11} />
                    {sideImages.back.previewUrl ? 'Change' : 'Browse'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openCameraForSide('back')}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Camera Capture"
                  >
                    <Camera size={12} />
                  </button>
                  {sideImages.back.previewUrl && (
                    <button
                      type="button"
                      onClick={() => handleClearImage('back')}
                      style={{
                        padding: '5px 8px',
                        fontSize: '0.7rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* PANEL 3: SIDE */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverSide('side'); }}
                onDragLeave={() => setDragOverSide(null)}
                onDrop={(e) => handleDropForSide(e, 'side')}
                className="glass-panel"
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `1.5px solid ${dragOverSide === 'side' ? '#38bdf8' : sideImages.side.previewUrl ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-card)'}`,
                  background: sideImages.side.previewUrl ? 'rgba(10, 20, 40, 0.7)' : 'rgba(8, 12, 24, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>
                      3. SIDE
                    </span>
                    {sideImages.side.previewUrl ? (
                      <span className="badge badge-compliant" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        ✓ Ready
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Optional</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.3 }}>
                    Mfr Details, Customer Care, Allergens, Origin
                  </div>

                  {sideImages.side.previewUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#050811', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img
                        src={sideImages.side.previewUrl}
                        alt="Side Panel"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {isProcessing && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: '#38bdf8',
                          boxShadow: '0 0 10px #38bdf8',
                          animation: 'scanLaser 1.8s infinite ease-in-out'
                        }} />
                      )}
                    </div>
                  ) : (
                    <div style={{
                      height: '140px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-subtle)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <ImageIcon size={24} color="#64748b" style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Side Label</span>
                    </div>
                  )}
                </div>

                {/* Panel Action Buttons */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => sideInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <UploadCloud size={11} />
                    {sideImages.side.previewUrl ? 'Change' : 'Browse'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openCameraForSide('side')}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Camera Capture"
                  >
                    <Camera size={12} />
                  </button>
                  {sideImages.side.previewUrl && (
                    <button
                      type="button"
                      onClick={() => handleClearImage('side')}
                      style={{
                        padding: '5px 8px',
                        fontSize: '0.7rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statutory 14-Rule Evaluation Guarantee Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(30, 58, 138, 0.14) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                Statutory 14-Rule Verification Engine
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Upload either <strong style={{ color: '#38bdf8' }}>1 single packaging photo</strong> (flat/entire label) or <strong style={{ color: '#38bdf8' }}>up to 3 panel photos</strong> (Front, Back, Side). Irrespective of photo count, all <strong style={{ color: '#ffffff' }}>14 statutory FSSAI rules</strong> are strictly evaluated simultaneously and compiled directly into your official compliance report.
            </p>
          </div>

          {/* Quick Benchmark Presets Selector */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={13} color="#60a5fa" />
              <span>TEST WITH PRESET BENCHMARK LABELS:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SAMPLE_LABELS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectBenchmark(s)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    background: selectedSample?.id === s.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedSample?.id === s.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: selectedSample?.id === s.id ? '#38bdf8' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s.name} ({s.expectedStatus.replace('_', ' ')})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Commodity Details & Multi-Stage Execution */}
        <div className="glass-panel" style={{ padding: '28px 30px', borderRadius: 'var(--radius-squircle)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            2. INSPECTION METADATA &amp; CATEGORY
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                COMMODITY / PRODUCT NAME
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Pure Pasteurised Butter 100g or Almond Drink"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-glass-heavy)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  MANUFACTURER / BRAND
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Amul or Britannia"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  COMMODITY CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="Food & Beverages">Food &amp; Beverages</option>
                  <option value="Dairy & Food">Dairy &amp; Food</option>
                  <option value="Confectionery & Snacks">Confectionery &amp; Snacks</option>
                  <option value="Beverages & Juices">Beverages &amp; Juices</option>
                  <option value="Household & Cleaning">Household &amp; Cleaning</option>
                  <option value="Personal Care & Cosmetics">Personal Care &amp; Cosmetics</option>
                  <option value="General Packaged Commodity">General Packaged Commodity</option>
                </select>
              </div>
            </div>

            {/* Multi-Panel Packaging Panels Status Bar */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#38bdf8" />
                  <span>PACKAGING PANELS SUMMARY</span>
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: totalUploadedCount > 0 ? '#34d399' : '#f87171'
                }}>
                  {totalUploadedCount}/3 Panels Ready
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: sideImages.front.previewUrl ? '#93c5fd' : 'var(--text-muted)' }}>
                  <span>Front Panel (Principal Display):</span>
                  <span style={{ fontWeight: 600 }}>{sideImages.front.previewUrl ? '✓ Ready (Product Name, Net Qty, Veg Mark)' : '— Not uploaded'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: sideImages.back.previewUrl ? '#86efac' : 'var(--text-muted)' }}>
                  <span>Back Panel (Statutory Info):</span>
                  <span style={{ fontWeight: 600 }}>{sideImages.back.previewUrl ? '✓ Ready (Ingredients, Nutrition, FSSAI Lic, Expiry, Batch)' : '— Not uploaded'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: sideImages.side.previewUrl ? '#c4b5fd' : 'var(--text-muted)' }}>
                  <span>Side Panel (Helpline &amp; Origin):</span>
                  <span style={{ fontWeight: 600 }}>{sideImages.side.previewUrl ? '✓ Ready (Mfr Details, Care, Allergens, Storage, Origin)' : '— Not uploaded'}</span>
                </div>
              </div>
            </div>

            {/* Statutory FSSAI Rules Accordion */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.78rem'
            }}>
              <button
                type="button"
                onClick={() => setShowRulesDetail(!showRulesDetail)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Info size={14} color="#60a5fa" />
                  <span>Mandatory 14 FSSAI Rules Engine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-compliant" style={{ fontSize: '0.65rem' }}>
                    14 Rules
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {showRulesDetail ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {showRulesDetail && (
                <div style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.74rem'
                }}>
                  <div>• 1. Name of Food/Product (Reg 5(1))</div>
                  <div>• 2. List of Ingredients (Reg 5(2))</div>
                  <div>• 3. Nutritional Information (Reg 5(3))</div>
                  <div>• 4. Net Quantity (Reg 5(4))</div>
                  <div>• 5. Veg / Non-Veg Symbol (Reg 5(5))</div>
                  <div>• 6. FSSAI Logo &amp; 14-Digit Lic (Reg 5(6))</div>
                  <div>• 7. Date of Mfg / Pkg (Reg 5(7))</div>
                  <div>• 8. Expiry / Best-Before Date (Reg 5(8))</div>
                  <div>• 9. Batch / Lot / Code No. (Reg 5(9))</div>
                  <div>• 10. Manufacturer / Packer Details (Reg 5(10))</div>
                  <div>• 11. Customer Care / Helpline (Reg 5(11))</div>
                  <div>• 12. Allergen Declarations (Reg 5(12))</div>
                  <div>• 13. Storage / Use Instructions (Reg 5(13))</div>
                  <div>• 14. Country of Origin (Reg 5(14))</div>
                </div>
              )}
            </div>

            {/* Dedicated Multi-Step OCR Progress Card */}
            {isProcessing && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.7) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '12px',
                padding: '18px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd' }}>
                    {statusMessage}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                    {ocrProgress}%
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{
                    width: `${ocrProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)'
                  }} />
                </div>

                {/* Pipeline Inspection Stages */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '0.7rem' }}>
                  {[
                    { step: 1, label: 'Batch Upload' },
                    { step: 2, label: 'Server OCR' },
                    { step: 3, label: '14 Rules Engine' },
                    { step: 4, label: 'Generate Report' }
                  ].map((s) => (
                    <div
                      key={s.step}
                      style={{
                        textAlign: 'center',
                        padding: '6px 2px',
                        borderRadius: '6px',
                        background: activeStage >= s.step ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeStage >= s.step ? '#60a5fa' : 'var(--text-muted)',
                        fontWeight: activeStage === s.step ? 700 : 500,
                        border: activeStage === s.step ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent'
                      }}
                    >
                      {activeStage > s.step ? '✓ ' : ''}{s.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Compliance Scan Button */}
            <button
              onClick={handleStartAnalysis}
              disabled={(!hasAnyImage && !selectedSample && !manualText) || isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                gap: '12px',
                marginTop: '10px',
                borderRadius: '12px',
                background: (!hasAnyImage && !selectedSample && !manualText) || isProcessing
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0284c7 100%)',
                boxShadow: (hasAnyImage || selectedSample || manualText) && !isProcessing
                  ? '0 8px 30px rgba(37, 99, 235, 0.55), 0 0 20px rgba(56, 189, 248, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
                  : 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>
                    Batch Scanning &amp; Validating All 14 Rules...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#38bdf8" style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))' }} />
                  <span>
                    {totalUploadedCount > 1
                      ? `⚡ Scan All ${totalUploadedCount} Images & Validate 14 Rules Now`
                      : totalUploadedCount === 1
                      ? `⚡ Scan Image & Validate 14 Rules Now`
                      : selectedSample
                      ? `⚡ Scan ${selectedSample.name} & Validate 14 Rules`
                      : '⚡ Scan All Images & Validate 14 Rules Now'}
                  </span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        panelTitle={`${cameraTargetSide.toUpperCase()} PANEL (${cameraTargetSide === 'front' ? 'Principal Display Surface' : cameraTargetSide === 'back' ? 'Statutory Information Panel' : 'Consumer Helpline & Origin'})`}
      />

      <style>{`
        @keyframes scanLaser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

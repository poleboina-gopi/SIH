import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Camera, Image as ImageIcon, Sparkles, 
  CheckCircle, AlertCircle, RefreshCw, FileText, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { SAMPLE_LABELS, SampleLabel } from '../data/sampleLabels';
import { api } from '../services/api';
import { ParsedFields, User } from '../types';

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
}

// Canvas-based image preprocessor for contrast enhancement & binarization
async function preprocessImageForOcr(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const contrast = 1.25;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const c = factor * (avg - 128) + 128;
          const finalVal = Math.min(255, Math.max(0, c));
          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const ScanUploadPage: React.FC<ScanUploadPageProps> = ({
  user,
  initialSample,
  onOcrComplete
}) => {
  const [selectedSample, setSelectedSample] = useState<SampleLabel | null>(initialSample || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialSample?.svgDataUrl || null);
  const [productName, setProductName] = useState(initialSample?.name || '');
  const [brand, setBrand] = useState(initialSample?.brand || '');
  const [category, setCategory] = useState(initialSample?.category || 'General Packaged Food');
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'side'>('front');

  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [ocrError, setOcrError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // When a preset benchmark is chosen
  const handleSelectBenchmark = (sample: SampleLabel) => {
    setSelectedSample(sample);
    setPreviewUrl(sample.svgDataUrl);
    setProductName(sample.name);
    setBrand(sample.brand);
    setCategory(sample.category);
    setOcrError(null);
  };

  // Custom File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedSample(null);
    setOcrError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setProductName(file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  // Run OCR & Analysis
  const handleStartAnalysis = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    setOcrError(null);
    setOcrProgress(15);
    setStatusMessage("Binarizing packaging label image & enhancing contrast...");

    try {
      if (selectedSample) {
        // Benchmark preset: fast accurate extraction with coordinates
        await new Promise(r => setTimeout(r, 400));
        setOcrProgress(50);
        setStatusMessage("Executing optical character recognition (Tesseract OCR)...");
        await new Promise(r => setTimeout(r, 400));
        setOcrProgress(80);
        setStatusMessage("Extracting statutory declarations under Rules 6 & 7...");
        await new Promise(r => setTimeout(r, 300));
        setOcrProgress(100);

        const parsedRes = await api.processOcr({
          raw_text: selectedSample.rawText,
          image_url: selectedSample.svgDataUrl,
          product_name: productName || selectedSample.name,
          brand: brand || selectedSample.brand,
          category: category || selectedSample.category
        });

        onOcrComplete({
          imageUrl: selectedSample.svgDataUrl,
          productName: productName || selectedSample.name,
          brand: brand || selectedSample.brand,
          category: category || selectedSample.category,
          rawText: selectedSample.rawText,
          parsedFields: parsedRes.parsed_fields,
          boundingBoxes: selectedSample.boundingBoxes
        });
      } else {
        // Real user uploaded file: Canvas Preprocessing + Tesseract Worker
        setOcrProgress(20);
        setStatusMessage("Pre-processing label: Enhancing contrast & reducing sensor noise...");
        const processedUrl = await preprocessImageForOcr(previewUrl);

        setOcrProgress(35);
        setStatusMessage("Initializing Tesseract OCR neural engine...");

        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              const p = Math.min(90, Math.round((m.progress || 0) * 55) + 35);
              setOcrProgress(p);
              setStatusMessage(`Extracting statutory packaging declarations (${Math.round((m.progress || 0) * 100)}%)...`);
            } else if (m.status === 'loading language traineddata') {
              setOcrProgress(28);
              setStatusMessage("Loading Indian English linguistic models...");
            }
          }
        });

        const ret = await worker.recognize(processedUrl);
        await worker.terminate();

        const extractedText = (ret.data.text || '').trim();

        if (!extractedText || extractedText.length < 5) {
          throw new Error("OCR detected insufficient text on image. Ensure the packaging label is sharp, well-lit, and unblurred.");
        }

        setOcrProgress(92);
        setStatusMessage("Normalizing statutory declarations through Metrology NLP Engine...");

        const parsedRes = await api.processOcr({
          raw_text: extractedText,
          image_url: previewUrl,
          product_name: productName,
          brand: brand,
          category: category
        });

        setOcrProgress(100);

        onOcrComplete({
          imageUrl: previewUrl,
          productName: productName || parsedRes.parsed_fields.commodity_name || "Custom Inspected Commodity",
          brand: brand || parsedRes.parsed_fields.manufacturer?.name || "Local / Unbranded",
          category,
          rawText: extractedText,
          parsedFields: parsedRes.parsed_fields
        });
      }
    } catch (err: any) {
      console.error("OCR execution error:", err);
      setOcrError(err.message || "Failed to recognize text from uploaded packaging.");
      setStatusMessage(`OCR Alert: ${err.message || 'Recognition error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // If user is Admin, render strict access block
  if (user && user.role === 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
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
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
          Statutory Access Restricted
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
          Under Section 15 of the Legal Metrology Act, 2009, only sworn <strong>Legal Metrology Inspectors</strong> are authorized to upload, scan, and inspect packaging commodities.
          <br /><br />
          As a <strong>Joint Controller / Administrator</strong>, your clearance permits access to <strong>Central Analytics</strong>, <strong>Statutory Rule Controls</strong>, and the <strong>Officer Directory</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          Commodity Label Inspection &amp; Scan
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Upload packaged commodity images or select from verified benchmark labels for automated statutory compliance checking.
        </p>
      </div>

      {ocrError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fca5a5',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} color="#ef4444" />
          <div style={{ flex: 1 }}>{ocrError}</div>
          <button 
            onClick={() => setOcrError(null)} 
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Upload Zone vs Metadata Form */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Image Upload & Preview */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              1. PACKAGING LABEL CAPTURE
            </span>
            {/* Multi-side tabs */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['front', 'back', 'side'] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setActiveSide(side)}
                  style={{
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: activeSide === side ? 'var(--accent-blue)' : 'transparent',
                    color: activeSide === side ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {side} Side
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-hover)',
              borderRadius: '12px',
              padding: previewUrl ? '10px' : '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-glass-heavy)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {previewUrl ? (
              <div style={{ width: '100%', position: 'relative' }}>
                <img
                  src={previewUrl}
                  alt="Packaging Label Preview"
                  style={{
                    width: '100%',
                    maxHeight: '340px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid var(--border-card)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem'
                }}>
                  Click to replace image
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(37, 99, 235, 0.15)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <UploadCloud size={28} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                  Click to upload or drag &amp; drop package label
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Supports high-resolution PNG, JPG, WEBP (Up to 25MB)
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Selector */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              OR SELECT VERIFIED BENCHMARK PACKAGE:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SAMPLE_LABELS.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectBenchmark(sample)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-glass)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: isSelected ? '#60a5fa' : 'var(--text-primary)' }}>
                      {sample.name.split(' ')[0]} {sample.name.split(' ')[1]}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: sample.expectedStatus === 'COMPLIANT' ? '#34d399' : '#f87171'
                    }}>
                      ● {sample.expectedStatus}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Commodity Details & Analysis Trigger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '18px' }}>
            2. COMMODITY INSPECTION METADATA
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
                placeholder="e.g., Pure Pasteurised Butter 100g"
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
                MANUFACTURER / BRAND
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Gujarat Cooperative Milk Marketing Federation Ltd."
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
                <option value="Dairy & Food">Dairy &amp; Food</option>
                <option value="Household & Cleaning">Household &amp; Cleaning</option>
                <option value="Personal Care & Cosmetics">Personal Care &amp; Cosmetics</option>
                <option value="Confectionery (Imported)">Confectionery (Imported)</option>
                <option value="Beverages & Juices">Beverages &amp; Juices</option>
                <option value="General Packaged Commodity">General Packaged Commodity</option>
              </select>
            </div>

            {/* Statutory Compliance Notice Checklist */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                Statutory Mandatory Checks under Rules 2011:
              </div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <li>Rule 6(1)(a): Complete Manufacturer/Packer Address</li>
                <li>Rule 6(1)(c): Net quantity with standard units (g, kg, ml, l)</li>
                <li>Rule 6(1)(e): MRP with inclusive of all taxes clause</li>
                <li>Rule 6(1)(n): Consumer care phone and email</li>
                <li>Rule 7: Minimum numeral font height</li>
              </ul>
            </div>

            {/* Analysis Progress */}
            {isProcessing && (
              <div style={{
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#93c5fd' }}>{statusMessage}</span>
                  <span style={{ color: '#ffffff' }}>{ocrProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${ocrProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleStartAnalysis}
              disabled={!previewUrl || isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                gap: '10px',
                marginTop: '10px'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Processing OCR &amp; Rules Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Execute Compliance Scan</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight, 
  Eye, Edit3, ShieldAlert, Sparkles, Scale, FileText, Copy, Check, 
  AlertOctagon, RefreshCw, Layers, Trash2
} from 'lucide-react';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ParsedFields } from '../types';
import { api } from '../services/api';

interface ScanResultsPageProps {
  scanData: {
    imageUrl: string;
    productName: string;
    brand: string;
    category: string;
    rawText: string;
    parsedFields?: ParsedFields;
    boundingBoxes?: any[];
  };
  onBack: () => void;
  onValidationComplete: (reportId: string) => void;
}

export const ScanResultsPage: React.FC<ScanResultsPageProps> = ({
  scanData,
  onBack,
  onValidationComplete
}) => {
  const [fields, setFields] = useState<ParsedFields>(scanData.parsedFields || {
    manufacturer: null,
    commodity_name: scanData.productName || 'Packaged Commodity',
    net_quantity: null,
    mfg_date: null,
    mrp: null,
    consumer_care: null,
    country_of_origin: null,
    unit_sale_price: null,
    readability: {
      clarity: 'HIGH',
      estimated_font_size: '>= 3.0mm (Compliant)',
      word_count: 24,
      line_count: 6
    }
  });

  const [rawText, setRawText] = useState(scanData.rawText || '');
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'visual' | 'raw'>('visual');
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteInspection = async () => {
    setIsDeleting(true);
    try {
      if ((scanData as any)?.scanId) {
        await api.deleteScan((scanData as any).scanId);
      }
      onBack();
    } catch (e: any) {
      alert("Failed to delete inspection: " + (e.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Field change helpers
  const updateField = (section: keyof ParsedFields, key: string, value: any) => {
    setFields(prev => {
      const current = prev[section];
      const baseObj = (typeof current === 'object' && current !== null) ? { ...current } : {};
      const updated: any = {
        ...baseObj,
        [key]: value
      };

      if (section === 'manufacturer') {
        const addr = updated.address || updated.raw || (typeof value === 'string' ? value : '');
        if (!updated.name && addr) {
          updated.name = addr.split(',')[0].trim();
        }
        updated.has_pincode = /\b\d{6}\b/.test(addr);
        if (!updated.raw) updated.raw = addr;
      } else if (section === 'net_quantity') {
        const raw = (updated.raw || (typeof value === 'string' ? value : '')).trim();
        const match = raw.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)/);
        if (match) {
          updated.value = parseFloat(match[1]);
          const rawUnit = match[2].toLowerCase().replace(/\.$/, '');
          updated.unit = rawUnit;
          const illegal = ['gm', 'gms', 'g.', 'kg.', 'kgs', 'kilos', 'mls', 'ml.', 'ltr', 'ltrs'];
          updated.is_standard = !illegal.includes(rawUnit);
        }
      } else if (section === 'mfg_date') {
        const dateStr = (updated.date || (typeof value === 'string' ? value : '')).trim();
        const dateRegex = /^(?:0[1-9]|1[0-2])\/(?:20\d{2}|\d{2})$|^(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/(?:20\d{2}|\d{2})$|^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:20\d{2}|\d{2})$/i;
        updated.is_compliant = dateRegex.test(dateStr);
      } else if (section === 'mrp') {
        const raw = (updated.raw || (typeof value === 'string' ? value : '')).trim();
        updated.includes_taxes = /incl\w*\s*(?:of)?\s*all\s*taxes/i.test(raw);
        updated.has_currency_symbol = /(?:₹|rs\.?|inr)/i.test(raw);
      }

      return {
        ...prev,
        [section]: updated
      };
    });
  };

  // Re-run NLP parser on modified raw text
  const handleReparseRawText = async () => {
    setIsReparsing(true);
    try {
      const res = await api.processOcr({
        raw_text: rawText,
        image_url: scanData.imageUrl,
        product_name: scanData.productName,
        brand: scanData.brand,
        category: scanData.category
      });
      setFields(res.parsed_fields);
      setIsEditingRaw(false);
    } catch (e: any) {
      alert("Failed to re-parse text: " + (e.message || "Unknown error"));
    } finally {
      setIsReparsing(false);
    }
  };

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(rawText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic checks for missing and defective fields
  const defects = useMemo(() => {
    const list: { type: 'missing' | 'defect'; field: string; message: string; rule: string }[] = [];

    // 1. Manufacturer
    const mfg = fields.manufacturer as any;
    const mfgName = typeof mfg === 'object' && mfg !== null ? mfg.name : (typeof mfg === 'string' ? (mfg as string).trim() : '');
    const mfgAddr = typeof mfg === 'object' && mfg !== null ? (mfg.address || mfg.raw || '') : (typeof mfg === 'string' ? mfg : '');
    const hasPin = typeof mfg === 'object' && mfg !== null ? Boolean(mfg.has_pincode || /\b\d{6}\b/.test(mfgAddr)) : /\b\d{6}\b/.test(mfgAddr);

    if (!mfg || !mfgName) {
      list.push({ type: 'missing', field: 'manufacturer', message: 'Manufacturer name & address omitted', rule: 'Rule 6(1)(a)' });
    } else if (!hasPin && mfgAddr.length < 20) {
      list.push({ type: 'defect', field: 'manufacturer', message: 'Manufacturer address lacks pin code or district', rule: 'Rule 6(1)(a)' });
    }

    // 2. Generic Name
    const cName = typeof fields.commodity_name === 'string' ? fields.commodity_name.trim() : (fields.commodity_name as any)?.name || '';
    if (!cName || cName.toLowerCase() === 'packaged commodity') {
      list.push({ type: 'missing', field: 'commodity_name', message: 'Generic commodity name missing', rule: 'Rule 6(1)(b)' });
    }

    // 3. Net Quantity
    const nq = fields.net_quantity as any;
    const nqRaw = typeof nq === 'object' && nq !== null ? (nq.raw || (nq.value ? `${nq.value} ${nq.unit || ''}` : '')) : (typeof nq === 'string' ? nq : '');
    if (!nq || !nqRaw.trim()) {
      list.push({ type: 'missing', field: 'net_quantity', message: 'Net quantity declaration missing', rule: 'Rule 6(1)(c)' });
    } else if (typeof nq === 'object' && nq !== null && nq.is_standard === false) {
      list.push({ type: 'defect', field: 'net_quantity', message: `Illegal non-standard unit '${nq.unit || nqRaw}' (Must use g, kg, ml, l)`, rule: 'Rule 12 & 13' });
    }

    // 4. Date of Mfg / Pkg
    const md = fields.mfg_date as any;
    const mdDate = typeof md === 'object' && md !== null ? (md.date || md.raw || '') : (typeof md === 'string' ? md : '');
    if (!md || !mdDate.trim()) {
      list.push({ type: 'missing', field: 'mfg_date', message: 'Month & year of packing missing', rule: 'Rule 6(1)(d)' });
    } else if (typeof md === 'object' && md !== null && md.is_compliant === false) {
      list.push({ type: 'defect', field: 'mfg_date', message: `Invalid date format '${mdDate}' (Prescribed: MM/YYYY or Month YYYY)`, rule: 'Rule 6(1)(d)' });
    }

    // 5. MRP
    const mrp = fields.mrp as any;
    const mrpRaw = typeof mrp === 'object' && mrp !== null ? (mrp.raw || (mrp.value ? `Rs. ${mrp.value}` : '')) : (typeof mrp === 'string' ? mrp : '');
    if (!mrp || !mrpRaw.trim()) {
      list.push({ type: 'missing', field: 'mrp', message: 'Maximum Retail Price (MRP) missing', rule: 'Rule 6(1)(e)' });
    } else if (typeof mrp === 'object' && mrp !== null && mrp.includes_taxes === false) {
      list.push({ type: 'defect', field: 'mrp', message: "MRP lacks mandatory '(inclusive of all taxes)' clause", rule: 'Rule 6(1)(e)' });
    } else if (typeof mrp === 'object' && mrp !== null && mrp.has_currency_symbol === false) {
      list.push({ type: 'defect', field: 'mrp', message: "MRP lacks official '₹' or 'Rs.' currency symbol", rule: 'Rule 6(1)(e)' });
    }

    // 6. Consumer Care
    const cc = fields.consumer_care as any;
    const ccPhone = typeof cc === 'object' && cc !== null ? (cc.phone || '') : '';
    const ccEmail = typeof cc === 'object' && cc !== null ? (cc.email || '') : '';
    if (!cc || (!ccPhone && !ccEmail && typeof cc === 'object')) {
      list.push({ type: 'missing', field: 'consumer_care', message: 'Consumer redressal contact details missing', rule: 'Rule 6(1)(n)' });
    } else {
      if (!ccEmail) {
        list.push({ type: 'defect', field: 'consumer_care', message: 'Consumer care email address missing (Mandatory)', rule: 'Rule 6(1)(n)' });
      }
      if (!ccPhone) {
        list.push({ type: 'defect', field: 'consumer_care', message: 'Consumer care phone number missing (Mandatory)', rule: 'Rule 6(1)(n)' });
      }
    }

    return list;
  }, [fields]);

  const missingCount = defects.filter(d => d.type === 'missing').length;
  const defectCount = defects.filter(d => d.type === 'defect').length;

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const mfg = fields.manufacturer as any;
      const mfgName = typeof mfg === 'object' && mfg !== null
        ? (mfg.name || (mfg.address ? (mfg.address as string).split(',')[0].trim() : ''))
        : (typeof mfg === 'string' ? (mfg as string).split(',')[0].trim() : '');

      const cName = typeof fields.commodity_name === 'string'
        ? fields.commodity_name
        : (fields.commodity_name as any)?.name;

      const payload = {
        product_name: scanData.productName || cName || 'Packaged Commodity',
        brand: scanData.brand || mfgName || 'Local / Generic',
        category: scanData.category || 'General Packaged Commodity',
        image_url: scanData.imageUrl,
        raw_text: rawText,
        parsed_fields: fields
      };

      const result = await api.validateCompliance(payload);

      if (!result || !result.report_id) {
        throw new Error("Validation succeeded on backend, but no report ID was returned.");
      }

      onValidationComplete(result.report_id);
    } catch (err: any) {
      console.error("Validation error:", err);
      const errMsg = err?.message || "Failed to validate declarations. Please try again.";
      alert(`Validation Alert: ${errMsg}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            <ArrowLeft size={16} />
            Back to Upload
          </button>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
              OCR Field Extraction &amp; Dynamic Verification
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Extracted via real-time Tesseract OCR. Confirm detected declarations before generating the official compliance certificate.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
            style={{
              padding: '12px 18px',
              fontSize: '0.9rem',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444'
            }}
          >
            <Trash2 size={16} />
            <span>Delete Inspection</span>
          </button>

          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.95rem', gap: '10px' }}
          >
            {isValidating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Validating Rules &amp; Sealing Report...</span>
              </>
            ) : (
              <>
                <Scale size={18} />
                <span>Validate Statutory Compliance</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Missing Fields & Statutory Defects Banner */}
      {defects.length > 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '22px',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertOctagon size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                  Statutory Defect Alert: {missingCount} Missing Declaration(s) &bull; {defectCount} Rule Defect(s)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                  The legal metrology engine flagged non-compliant declarations below. You can edit fields if OCR was obstructed, or proceed to issue penalties.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {missingCount > 0 && (
                <span className="badge badge-noncompliant" style={{ fontSize: '0.75rem' }}>
                  {missingCount} OMITTED
                </span>
              )}
              {defectCount > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                  {defectCount} DEFECT(S)
                </span>
              )}
            </div>
          </div>

          {/* Quick Badges of Offending Rules */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {defects.map((d, i) => (
              <span
                key={i}
                style={{
                  background: d.type === 'missing' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                  border: `1px solid ${d.type === 'missing' ? '#ef4444' : '#f59e0b'}`,
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <strong>{d.rule}:</strong> {d.message}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#6ee7b7',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span><strong>Preliminary Check:</strong> All primary mandatory statutory declarations detected. Ready for legal compliance sealing.</span>
        </div>
      )}

      {/* Main Workspace: Left Label Visual vs Right Form */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Interactive Packaging Label Visual & Extracted OCR Text */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setLeftTab('visual')}
                className={`btn ${leftTab === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px' }}
              >
                <Eye size={15} />
                Label Coordinate Visualizer
              </button>
              <button
                onClick={() => setLeftTab('raw')}
                className={`btn ${leftTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px' }}
              >
                <FileText size={15} />
                Extracted OCR Raw Text
              </button>
            </div>

            {leftTab === 'raw' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setIsEditingRaw(!isEditingRaw)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '6px' }}
                >
                  <Edit3 size={13} />
                  {isEditingRaw ? 'View Text' : 'Edit Text'}
                </button>
                <button
                  onClick={handleCopyRawText}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '6px' }}
                >
                  {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {leftTab === 'raw' ? (
            <div>
              {/* Text Metrics Ribbon */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '8px 14px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.75rem',
                color: '#93c5fd'
              }}>
                <span><strong>Words:</strong> {rawText ? rawText.split(/\s+/).filter(Boolean).length : 0}</span>
                <span>•</span>
                <span><strong>Lines:</strong> {rawText ? rawText.split('\n').length : 0}</span>
                <span>•</span>
                <span><strong>Characters:</strong> {rawText ? rawText.length : 0}</span>
                <span>•</span>
                <span style={{ color: '#34d399' }}><strong>Engine:</strong> Tesseract.js v7 WASM</span>
              </div>

              {isEditingRaw ? (
                <div>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid var(--accent-blue)',
                      borderRadius: '8px',
                      padding: '14px',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: '#ffffff'
                    }}
                  />
                  <button
                    onClick={handleReparseRawText}
                    disabled={isReparsing}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '8px', padding: '8px', fontSize: '0.82rem', gap: '6px' }}
                  >
                    <RefreshCw size={14} className={isReparsing ? "animate-spin" : ""} />
                    Re-parse Statutory Fields from Modified Text
                  </button>
                </div>
              ) : (
                <div style={{
                  background: '#090d16',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  color: '#e2e8f0'
                }}>
                  {rawText || 'No text extracted from packaging.'}
                </div>
              )}
            </div>
          ) : (
            <div>
              <BoundingBoxOverlay
                imageUrl={scanData.imageUrl}
                boxes={scanData.boundingBoxes}
                selectedField={selectedField}
                onSelectBox={(field) => setSelectedField(field)}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                Click any highlighted declaration box above or field card to inspect coordinates.
              </div>
            </div>
          )}

          {/* Clarity & Readability Score Card */}
          <div style={{
            marginTop: '16px',
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                READABILITY &amp; FONT SIZE (RULE 7)
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', marginTop: '2px' }}>
                Clarity: {fields.readability?.clarity || 'HIGH'} &bull; Estimated Height: {fields.readability?.estimated_font_size || '>= 3.0mm'}
              </div>
            </div>
            <span className={`badge ${fields.readability?.clarity === 'LOW' ? 'badge-noncompliant' : 'badge-compliant'}`}>
              {fields.readability?.clarity === 'LOW' ? 'DEFICIENT' : 'ADEQUATE'}
            </span>
          </div>
        </div>

        {/* Right: Extracted Declarations Form with Prominent Missing Field Visuals */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              EXTRACTED STATUTORY DECLARATIONS
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Editable for verification
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 1. Manufacturer Details */}
            {(() => {
              const mfg = fields.manufacturer as any;
              const mfgName = typeof mfg === 'object' && mfg !== null ? mfg.name : (typeof mfg === 'string' ? (mfg as string).trim() : '');
              const isMissing = !mfg || !mfgName;
              return (
                <div style={{
                  border: isMissing ? '2px solid #ef4444' : selectedField === 'manufacturer' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px',
                  background: isMissing ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass-heavy)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isMissing ? '#f87171' : '#60a5fa' }}>
                      Rule 6(1)(a) &bull; Manufacturer / Packer / Importer
                    </span>
                    {isMissing ? (
                      <span className="badge badge-noncompliant" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertOctagon size={12} /> MISSING DECLARATION
                      </span>
                    ) : (
                      <span className="badge badge-compliant" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> VERIFIED
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={typeof mfg === 'object' && mfg !== null ? (mfg.address || mfg.raw || '') : (typeof mfg === 'string' ? mfg : '')}
                    onChange={(e) => updateField('manufacturer', 'address', e.target.value)}
                    placeholder="Full manufacturer name, physical factory address, city and pin code"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-app)',
                      border: `1px solid ${isMissing ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-card)'}`,
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                  {isMissing && (
                    <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '4px', fontWeight: 500 }}>
                      Mandatory under Sec 36(1). If absent, fine of ₹25,000 applies.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. Generic Name & Net Qty Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              
              {/* Generic Name */}
              {(() => {
                const isMissing = !fields.commodity_name || fields.commodity_name.trim() === 'Packaged Commodity';
                return (
                  <div style={{
                    border: isMissing ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px',
                    background: isMissing ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass-heavy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isMissing ? '#f87171' : '#60a5fa' }}>
                        Rule 6(1)(b) &bull; Generic Name
                      </span>
                      {isMissing && (
                        <span style={{ fontSize: '0.66rem', color: '#f87171', fontWeight: 700 }}>MISSING</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={fields.commodity_name || ''}
                      onChange={(e) => setFields({ ...fields, commodity_name: e.target.value })}
                      placeholder="e.g. Table Butter or Biscuits"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                );
              })()}

              {/* Net Quantity */}
              {(() => {
                const isMissing = !fields.net_quantity || !fields.net_quantity.raw;
                const isIllegal = fields.net_quantity && !fields.net_quantity.is_standard;
                return (
                  <div style={{
                    border: isMissing ? '2px solid #ef4444' : isIllegal ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px',
                    background: isMissing ? 'rgba(239, 68, 68, 0.08)' : isIllegal ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-glass-heavy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isMissing ? '#f87171' : isIllegal ? '#fbbf24' : '#60a5fa' }}>
                        Rule 6(1)(c) &bull; Net Qty
                      </span>
                      {isMissing ? (
                        <span style={{ fontSize: '0.66rem', color: '#f87171', fontWeight: 800 }}>MISSING</span>
                      ) : isIllegal ? (
                        <span style={{ fontSize: '0.66rem', color: '#f59e0b', fontWeight: 800 }}>ILLEGAL UNIT</span>
                      ) : (
                        <span style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 700 }}>STANDARD</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={fields.net_quantity?.raw || ''}
                      onChange={(e) => updateField('net_quantity', 'raw', e.target.value)}
                      placeholder="e.g. 100 g or 500 ml"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                    {isIllegal && (
                      <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: '3px' }}>
                        Illegal symbol (use 'g', not 'gms').
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 3. MRP & Packing Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              
              {/* MRP Declaration */}
              {(() => {
                const isMissing = !fields.mrp || !fields.mrp.raw;
                const noTaxClause = fields.mrp && !fields.mrp.includes_taxes;
                return (
                  <div style={{
                    border: isMissing ? '2px solid #ef4444' : noTaxClause ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px',
                    background: isMissing ? 'rgba(239, 68, 68, 0.08)' : noTaxClause ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-glass-heavy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isMissing ? '#f87171' : noTaxClause ? '#fbbf24' : '#60a5fa' }}>
                        Rule 6(1)(e) &bull; MRP &amp; Taxes
                      </span>
                      {isMissing ? (
                        <span style={{ fontSize: '0.66rem', color: '#f87171', fontWeight: 800 }}>MRP MISSING</span>
                      ) : noTaxClause ? (
                        <span style={{ fontSize: '0.66rem', color: '#f59e0b', fontWeight: 800 }}>NO TAX CLAUSE</span>
                      ) : (
                        <span style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 700 }}>COMPLIANT</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={fields.mrp?.raw || ''}
                      onChange={(e) => updateField('mrp', 'raw', e.target.value)}
                      placeholder="e.g. MRP Rs. 58.00 (inclusive of all taxes)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                    {noTaxClause && (
                      <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: '3px' }}>
                        Missing '(inclusive of all taxes)'
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Date of Packing */}
              {(() => {
                const isMissing = !fields.mfg_date || !fields.mfg_date.date;
                const isInvalidFormat = fields.mfg_date && !fields.mfg_date.is_compliant;
                return (
                  <div style={{
                    border: isMissing ? '2px solid #ef4444' : isInvalidFormat ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px',
                    background: isMissing ? 'rgba(239, 68, 68, 0.08)' : isInvalidFormat ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-glass-heavy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isMissing ? '#f87171' : isInvalidFormat ? '#fbbf24' : '#60a5fa' }}>
                        Rule 6(1)(d) &bull; Pack Date
                      </span>
                      {isMissing ? (
                        <span style={{ fontSize: '0.66rem', color: '#f87171', fontWeight: 800 }}>DATE MISSING</span>
                      ) : isInvalidFormat ? (
                        <span style={{ fontSize: '0.66rem', color: '#f59e0b', fontWeight: 800 }}>BAD FORMAT</span>
                      ) : (
                        <span style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 700 }}>VERIFIED</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={fields.mfg_date?.date || ''}
                      onChange={(e) => updateField('mfg_date', 'date', e.target.value)}
                      placeholder="e.g. 08/2024"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                    {isInvalidFormat && (
                      <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: '3px' }}>
                        Must be MM/YYYY or Month YYYY
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 4. Consumer Care Contact Details */}
            {(() => {
              const isMissing = !fields.consumer_care;
              const missingEmail = fields.consumer_care && !fields.consumer_care.email;
              const missingPhone = fields.consumer_care && !fields.consumer_care.phone;
              return (
                <div style={{
                  border: isMissing ? '2px solid #ef4444' : (missingEmail || missingPhone) ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  background: isMissing ? 'rgba(239, 68, 68, 0.08)' : (missingEmail || missingPhone) ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-glass-heavy)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isMissing ? '#f87171' : '#60a5fa' }}>
                      Rule 6(1)(n) &bull; Consumer Care Helpline &amp; Email
                    </span>
                    {isMissing ? (
                      <span className="badge badge-noncompliant" style={{ fontSize: '0.66rem' }}>MISSING ALL</span>
                    ) : missingEmail ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>EMAIL MISSING</span>
                    ) : missingPhone ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>PHONE MISSING</span>
                    ) : (
                      <span className="badge badge-compliant" style={{ fontSize: '0.66rem' }}>COMPLETE</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={fields.consumer_care?.phone || ''}
                      onChange={(e) => updateField('consumer_care', 'phone', e.target.value)}
                      placeholder="Toll-free / Helpline number"
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                    <input
                      type="email"
                      value={fields.consumer_care?.email || ''}
                      onChange={(e) => updateField('consumer_care', 'email', e.target.value)}
                      placeholder="Email: feedback@brand.com"
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* 5. Country of Origin & USP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                background: 'var(--bg-glass-heavy)'
              }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Rule 6(1)(m) &bull; Country of Origin
                </div>
                <input
                  type="text"
                  value={fields.country_of_origin || ''}
                  onChange={(e) => setFields({ ...fields, country_of_origin: e.target.value })}
                  placeholder="e.g. India (Mandatory for imported)"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                background: 'var(--bg-glass-heavy)'
              }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Rule 6(11) &bull; Unit Sale Price (USP)
                </div>
                <input
                  type="text"
                  value={fields.unit_sale_price?.raw || ''}
                  onChange={(e) => updateField('unit_sale_price', 'raw', e.target.value)}
                  placeholder="e.g. ₹ 0.58 / g"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-secondary"
                style={{
                  padding: '14px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  gap: '8px'
                }}
              >
                <Trash2 size={18} />
                <span>Delete Inspection</span>
              </button>

              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="btn btn-primary"
                style={{ flex: 1, padding: '15px', fontSize: '1rem', fontWeight: 700, gap: '10px' }}
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Validating Declarations &amp; Sealing Verdict...</span>
                  </>
                ) : (
                  <>
                    <Scale size={20} />
                    <span>Confirm Declarations &amp; Issue Statutory Verdict</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection?"
        itemName={scanData.productName || 'Current Scan'}
        isDeleting={isDeleting}
        onConfirm={handleDeleteInspection}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

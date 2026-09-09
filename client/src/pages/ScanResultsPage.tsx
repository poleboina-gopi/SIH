import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight, 
  Eye, Edit3, ShieldAlert, Sparkles, Scale, FileText, Copy, Check 
} from 'lucide-react';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
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

  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'visual' | 'raw'>('visual');
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(scanData.rawText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Field change helpers
  const updateField = (section: keyof ParsedFields, key: string, value: any) => {
    setFields(prev => {
      const currentSection = prev[section] as any;
      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [key]: value
          }
        };
      }
      return {
        ...prev,
        [section]: value
      };
    });
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await api.validateCompliance({
        product_name: scanData.productName || fields.commodity_name,
        brand: scanData.brand || fields.manufacturer?.name || 'Local / Generic',
        category: scanData.category,
        image_url: scanData.imageUrl,
        raw_text: scanData.rawText,
        parsed_fields: fields
      });

      onValidationComplete(result.report_id);
    } catch (err) {
      console.error("Validation error:", err);
      alert("Failed to validate declarations. Please try again.");
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
              OCR Field Extraction &amp; Verification
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Confirm extracted statutory declarations before final enforcement scoring under Rules 2011.
            </p>
          </div>
        </div>

        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.95rem', gap: '10px' }}
        >
          {isValidating ? (
            <span>Sealing Legal Inspection Report...</span>
          ) : (
            <>
              <Scale size={18} />
              <span>Validate Statutory Compliance</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Main Workspace: Left Label Visual vs Right Form */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Left: Interactive Packaging Label Visual & Extracted OCR Text */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setLeftTab('visual')}
                className={`btn ${leftTab === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '5px 12px' }}
              >
                <Eye size={14} />
                Visual Inspection Overlay
              </button>
              <button
                onClick={() => setLeftTab('raw')}
                className={`btn ${leftTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '5px 12px' }}
              >
                <FileText size={14} />
                Extracted OCR Raw Text
              </button>
            </div>

            {leftTab === 'raw' && (
              <button
                onClick={handleCopyRawText}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '6px' }}
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            )}
          </div>

          {leftTab === 'raw' ? (
            <div>
              {/* Text Metrics Ribbon */}
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '0.75rem',
                color: '#93c5fd'
              }}>
                <span><strong>Words:</strong> {scanData.rawText ? scanData.rawText.split(/\s+/).filter(Boolean).length : 0}</span>
                <span>•</span>
                <span><strong>Lines:</strong> {scanData.rawText ? scanData.rawText.split('\n').length : 0}</span>
                <span>•</span>
                <span><strong>Characters:</strong> {scanData.rawText ? scanData.rawText.length : 0}</span>
                <span>•</span>
                <span style={{ color: '#34d399' }}><strong>OCR Status:</strong> Extracted</span>
              </div>

              <div style={{
                background: '#090d16',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflowY: 'auto',
                color: '#e2e8f0'
              }}>
                {scanData.rawText || 'No text recognized.'}
              </div>
            </div>
          ) : (
            <BoundingBoxOverlay
              imageUrl={scanData.imageUrl}
              boxes={scanData.boundingBoxes}
              selectedField={selectedField}
              onSelectBox={(field) => setSelectedField(field)}
            />
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
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
                Clarity: {fields.readability?.clarity || 'HIGH'} • Numeral Height: {fields.readability?.estimated_font_size || '>= 3.0mm'}
              </div>
            </div>
            <span className={`badge ${fields.readability?.clarity === 'LOW' ? 'badge-noncompliant' : 'badge-compliant'}`}>
              {fields.readability?.clarity === 'LOW' ? 'DEFICIENT' : 'ADEQUATE'}
            </span>
          </div>
        </div>

        {/* Right: Extracted Declarations Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
            EXTRACTED STATUTORY DECLARATIONS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Manufacturer Details */}
            <div style={{
              border: `1px solid ${selectedField === 'manufacturer' ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              padding: '14px',
              background: 'var(--bg-glass-heavy)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>
                  Rule 6(1)(a) • Manufacturer / Packer / Importer
                </span>
                {fields.manufacturer ? (
                  <span style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Extracted
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} /> Omitted
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={fields.manufacturer?.address || fields.manufacturer?.raw || ''}
                onChange={(e) => updateField('manufacturer', 'address', e.target.value)}
                placeholder="Full manufacturer name, factory address, district, state and pin code"
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

            {/* 2. Generic Name & Net Qty Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              {/* Generic Name */}
              <div style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                background: 'var(--bg-glass-heavy)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Rule 6(1)(b) • Generic Name
                </div>
                <input
                  type="text"
                  value={fields.commodity_name || ''}
                  onChange={(e) => setFields({ ...fields, commodity_name: e.target.value })}
                  placeholder="e.g. Table Butter"
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

              {/* Net Quantity */}
              <div style={{
                border: `1px solid ${fields.net_quantity && !fields.net_quantity.is_standard ? 'rgba(239, 68, 68, 0.6)' : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '12px',
                background: fields.net_quantity && !fields.net_quantity.is_standard ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass-heavy)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>
                    Rule 6(1)(c) • Net Qty
                  </span>
                  {fields.net_quantity && !fields.net_quantity.is_standard && (
                    <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>
                      ILLEGAL UNIT
                    </span>
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
              </div>
            </div>

            {/* 3. MRP & Packing Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              {/* MRP Declaration */}
              <div style={{
                border: `1px solid ${fields.mrp && !fields.mrp.includes_taxes ? 'rgba(239, 68, 68, 0.6)' : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '12px',
                background: fields.mrp && !fields.mrp.includes_taxes ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass-heavy)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>
                    Rule 6(1)(e) • MRP &amp; Tax Clause
                  </span>
                  {fields.mrp && !fields.mrp.includes_taxes && (
                    <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>
                      NO TAX CLAUSE
                    </span>
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
              </div>

              {/* Date of Packing */}
              <div style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                background: 'var(--bg-glass-heavy)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Rule 6(1)(d) • Date (MM/YYYY)
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
              </div>
            </div>

            {/* 4. Consumer Care Contact Details */}
            <div style={{
              border: `1px solid ${fields.consumer_care && (!fields.consumer_care.email || !fields.consumer_care.phone) ? 'rgba(245, 158, 11, 0.6)' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              padding: '12px',
              background: 'var(--bg-glass-heavy)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>
                  Rule 6(1)(n) • Consumer Redressal Contact (Phone &amp; Email Mandatory)
                </span>
                {fields.consumer_care?.email ? (
                  <span style={{ fontSize: '0.72rem', color: '#34d399' }}>Email Included</span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#f87171' }}>Email Missing</span>
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
                  placeholder="Email: grievance@brand.com"
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

            {/* 5. Country of Origin & USP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                background: 'var(--bg-glass-heavy)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Rule 6(1)(m) • Country of Origin
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
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Rule 6(11) • Unit Sale Price (USP)
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

            {/* Bottom Actions */}
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', gap: '10px' }}
              >
                <Scale size={18} />
                <span>Confirm &amp; Run Legal Rules Validation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

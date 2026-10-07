'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Check, 
  RefreshCw,
  PlusCircle,
  FileText,
  Globe,
  Link2,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';

export function UnifiedSubmission() {
  const [submissionType, setSubmissionType] = useState<'EMPLOYEE' | 'VENDOR'>('EMPLOYEE');
  
  // Form states
  const [employeeId, setEmployeeId] = useState('E001');
  const [employeeName, setEmployeeName] = useState('Marcus Vance');
  const [employeeDept, setEmployeeDept] = useState('Operations');
  
  const [vendorId, setVendorId] = useState('V001');
  const [vendorName, setVendorName] = useState('AWS Cloud Services');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-' + Math.floor(1000 + Math.random() * 9000));
  
  const [category, setCategory] = useState('Software');
  const [amount, setAmount] = useState('45000');
  const [description, setDescription] = useState('Q3 Cloud infrastructure compute capacity & licensing');
  const [receiptStatus, setReceiptStatus] = useState<'UPLOADED' | 'MISSING'>('UPLOADED');
  const [attachmentMode, setAttachmentMode] = useState<'FILE' | 'ONLINE_URL'>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [onlineUrl, setOnlineUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  // Submission response state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setReceiptStatus('UPLOADED');
      setIsScanning(true);
      setOcrNotice(null);

      try {
        const scanRes = await api.invoices.scanReceipt(file);
        if (scanRes && scanRes.extracted_data) {
          const d = scanRes.extracted_data;
          if (d.amount) setAmount(String(d.amount));
          if (d.invoice_number) setInvoiceNumber(d.invoice_number);
          if (d.vendor_name && submissionType === 'VENDOR') {
            setVendorName(d.vendor_name);
            if (d.vendor_id) setVendorId(d.vendor_id);
          }
          if (d.category) setCategory(d.category);
          setOcrNotice(`Document Digitized (${scanRes.source_engine || 'Microsoft AI Engine'}): Extracted ₹${Number(d.amount).toLocaleString('en-IN')}, Invoice #${d.invoice_number}`);
        }
      } catch (err) {
        // Continue gracefully
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleScanOnlineUrl = async (urlToScan?: string) => {
    const targetUrl = (urlToScan || onlineUrl).trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setErrorMessage('Please enter a valid HTTP/HTTPS online invoice or hosted PDF link.');
      return;
    }
    setReceiptStatus('UPLOADED');
    setIsScanning(true);
    setOcrNotice(null);
    setErrorMessage(null);

    try {
      const scanRes = await api.invoices.scanOnlineInvoice(targetUrl);
      if (scanRes && scanRes.extracted_data) {
        const d = scanRes.extracted_data;
        if (d.amount) setAmount(String(d.amount));
        if (d.invoice_number) setInvoiceNumber(d.invoice_number);
        if (d.vendor_name && submissionType === 'VENDOR') {
          setVendorName(d.vendor_name);
          if (d.vendor_id) setVendorId(d.vendor_id);
        }
        if (d.category) setCategory(d.category);
        setOcrNotice(`Online PDF / E-Invoice Digitized (${scanRes.source_engine || 'Microsoft AI'}): Extracted ₹${Number(d.amount).toLocaleString('en-IN')}, Invoice #${d.invoice_number}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to scan online invoice link. Please check the URL or upload directly.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetForm = () => {
    setSubmissionSuccess(null);
    setErrorMessage(null);
    setSelectedFile(null);
    setOnlineUrl('');
    setOcrNotice(null);
    setInvoiceNumber('INV-2026-' + Math.floor(1000 + Math.random() * 9000));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSubmissionSuccess(null);

    const generatedId = `${submissionType === 'EMPLOYEE' ? 'EXP' : 'INV'}-${Math.floor(100000 + Math.random() * 900000)}`;

    let rawOcrText = 'Direct system entry';
    let finalDesc = description;

    if (receiptStatus === 'MISSING') {
      rawOcrText = 'Notice: Missing supporting receipt attachment.';
    } else if (attachmentMode === 'ONLINE_URL' && onlineUrl.trim()) {
      rawOcrText = `Online E-Invoice: ${onlineUrl.trim()} | Verified Amount: INR ${amount}`;
      if (!finalDesc.includes('http')) {
        finalDesc = `${finalDesc} [Attached E-Invoice: ${onlineUrl.trim()}]`;
      }
    } else if (selectedFile) {
      rawOcrText = `Scanned document: ${selectedFile.name} | Total Amount: INR ${amount}`;
    }

    const payload = {
      invoice_id: generatedId,
      invoice_number: submissionType === 'VENDOR' ? invoiceNumber : `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor_id: submissionType === 'VENDOR' ? vendorId : 'EMP_REIMBURSE',
      vendor_name: submissionType === 'VENDOR' ? vendorName : 'Employee Reimbursement',
      employee_id: employeeId,
      employee_name: employeeName,
      employee_dept: employeeDept,
      amount: parseFloat(amount) || 0,
      currency: 'INR',
      category: category,
      description: finalDesc,
      receipt_status: receiptStatus,
      raw_ocr_text: rawOcrText,
    };

    try {
      const res = await api.invoices.submit(payload);
      if (res && res.error) {
        setErrorMessage(res.error);
      } else if (res && res.invoice_id) {
        setSubmissionSuccess(res);
      } else {
        setErrorMessage('Unexpected response from server.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-white to-[#F0FDF4] p-6 rounded-3xl border border-[#E2ECE4] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              The Originator Portal
            </span>
            <span className="text-xs text-[#64748B]">• Submission Portal</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
            Unified Receipt & Invoice Submission
          </h2>
          <p className="text-xs text-[#64748B] max-w-2xl">
            Single entry point for employee expense claims and external vendor invoices. All submitted documents are queued directly for accounts payable processing.
          </p>
        </div>
      </div>

      {/* Success Confirmation Card */}
      {submissionSuccess && (
        <div className="p-6 bg-[#E8F8EE] border border-[#D1EED8] rounded-3xl shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#16A34A] flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  Submission Successful
                </h3>
                <p className="text-xs text-[#166534]">
                  {submissionType === 'EMPLOYEE' ? 'Expense receipt' : 'Vendor invoice'} recorded under Reference ID: <strong className="font-mono">{submissionSuccess.invoice_id}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#D5EFE0] text-[#16A34A] text-xs font-bold rounded-xl border border-[#D1EED8] shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Another</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3 rounded-xl border border-[#D1EED8]">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">Entity</span>
              <div className="text-xs font-bold text-[#0F172A] mt-0.5 truncate">
                {submissionSuccess.vendor_name || submissionSuccess.employee_name}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#D1EED8]">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">Amount</span>
              <div className="text-xs font-bold font-mono text-[#0F172A] mt-0.5">
                ₹{Number(submissionSuccess.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#D1EED8]">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">Category</span>
              <div className="text-xs font-bold text-[#0F172A] mt-0.5">
                {submissionSuccess.category}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#D1EED8]">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">Routing Status</span>
              <div className="text-xs font-bold text-[#16A34A] mt-0.5">
                Queued for Review
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <div className="bg-white rounded-3xl border border-[#E2ECE4] p-6 shadow-xs space-y-6">
        {/* Submission Mode Toggle */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
            Submission Mode
          </label>
          <div className="grid grid-cols-2 p-1 bg-[#F3F8F4] border border-[#E2ECE4] rounded-2xl">
            <button
              type="button"
              onClick={() => setSubmissionType('EMPLOYEE')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                submissionType === 'EMPLOYEE'
                  ? 'bg-white text-[#16A34A] shadow-xs border border-[#E2ECE4]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Employee Expense Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType('VENDOR')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                submissionType === 'VENDOR'
                  ? 'bg-white text-[#16A34A] shadow-xs border border-[#E2ECE4]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Vendor Invoice (B2B AP)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dynamic Fields based on Type */}
          {submissionType === 'EMPLOYEE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Department</label>
                <select
                  value={employeeDept}
                  onChange={(e) => setEmployeeDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Operations">Operations</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Vendor Code</label>
                <input
                  type="text"
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Amount and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Disbursement Amount (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] font-bold focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Expense / Spend Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all cursor-pointer font-medium"
              >
                <option value="Software">Enterprise Software & SaaS</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure & AWS</option>
                <option value="Hardware">Hardware & Equipment</option>
                <option value="Consulting">Professional Consulting Services</option>
                <option value="Logistics">Logistics & Freight</option>
                <option value="Travel & Meals">Employee Travel & Accommodation</option>
                <option value="Client Entertainment">Client Entertainment</option>
                <option value="Office Supplies">Office Supplies & Facilities</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Purpose / Itemized Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the corporate business rationale..."
              className="w-full px-3 py-2 text-xs bg-[#FAFCFA] border border-[#E2ECE4] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Drag & Drop Upload Component */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#0F172A]">
                {submissionType === 'EMPLOYEE' ? 'Attach Expense Receipt (PDF / PNG / JPG)' : 'Attach Vendor Invoice Tax Document'}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-[#64748B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptStatus === 'MISSING'}
                    onChange={(e) => {
                      setReceiptStatus(e.target.checked ? 'MISSING' : 'UPLOADED');
                      if (e.target.checked) setSelectedFile(null);
                    }}
                    className="rounded border-[#E2ECE4] text-[#DC2626] focus:ring-0"
                  />
                  <span>No receipt available</span>
                </label>
              </div>
            </div>

            {receiptStatus === 'MISSING' ? (
              <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0" />
                <div className="text-xs text-[#92400E]">
                  <span className="font-bold">No receipt document attached.</span> This submission will be noted as missing an attachment upon review.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Segmented Attachment Mode Switcher */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAttachmentMode('FILE')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attachmentMode === 'FILE'
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload Local File (PDF / Scan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachmentMode('ONLINE_URL')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attachmentMode === 'ONLINE_URL'
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Online Invoice (Hosted PDF / E-Invoice URL)</span>
                  </button>
                </div>

                {attachmentMode === 'FILE' ? (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#CBD5E1] hover:border-[#16A34A] bg-[#FAFCFA] hover:bg-[#F0FDF4]/40 rounded-2xl cursor-pointer transition-all group">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E2ECE4] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                      <UploadCloud className="w-5 h-5 text-[#64748B] group-hover:text-[#16A34A] transition-colors" />
                    </div>
                    {selectedFile ? (
                      <div className="text-center">
                        <div className="text-xs font-bold text-[#16A34A] flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {selectedFile.name}
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF Invoice Document' : 'Optical Image Scan'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                          Click to upload or drag & drop invoice PDF / receipt
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">
                          PDF (standard & multi-page), PNG, JPG up to 10MB
                        </div>
                      </div>
                    )}
                  </label>
                ) : (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2ECE4] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Direct E-Invoice or Cloud Hosted PDF Link</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] font-bold">
                        Microsoft OCR Live Resolver
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={onlineUrl}
                          onChange={(e) => setOnlineUrl(e.target.value)}
                          placeholder="https://invoice.stripe.com/... or https://vendor.corp/invoice.pdf"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-all font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScanOnlineUrl()}
                        disabled={isScanning || !onlineUrl.trim()}
                        className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                      >
                        {isScanning ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Fetch & Scan PDF</span>
                      </button>
                    </div>

                    {/* Enterprise Presets for Quick Testing */}
                    <div className="space-y-1.5 pt-1 border-t border-[#E2E8F0]">
                      <div className="text-[10px] text-[#64748B] font-semibold">Quick Sample Online Invoices:</div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://invoices.aws.amazon.com/invoice-2026-9041.pdf';
                            setOnlineUrl(u);
                            handleScanOnlineUrl(u);
                          }}
                          className="text-[10px] font-mono font-medium px-2 py-1 bg-white hover:bg-[#F0FDF4] hover:text-[#16A34A] border border-[#CBD5E1] hover:border-[#86EFAC] rounded-lg transition-all text-[#334155] cursor-pointer"
                        >
                          + AWS Cloud Invoice PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://invoice.stripe.com/i/acct_enterprise/inv_998124.pdf';
                            setOnlineUrl(u);
                            handleScanOnlineUrl(u);
                          }}
                          className="text-[10px] font-mono font-medium px-2 py-1 bg-white hover:bg-[#F0FDF4] hover:text-[#16A34A] border border-[#CBD5E1] hover:border-[#86EFAC] rounded-lg transition-all text-[#334155] cursor-pointer"
                        >
                          + Stripe E-Invoice PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://portal.azure.com/invoices/azure-corp-disbursement.pdf';
                            setOnlineUrl(u);
                            handleScanOnlineUrl(u);
                          }}
                          className="text-[10px] font-mono font-medium px-2 py-1 bg-white hover:bg-[#F0FDF4] hover:text-[#16A34A] border border-[#CBD5E1] hover:border-[#86EFAC] rounded-lg transition-all text-[#334155] cursor-pointer"
                        >
                          + Microsoft Azure Invoice PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OCR Progress & Detection Feedback */}
            {isScanning && (
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#1D4ED8] font-semibold flex items-center gap-2 animate-pulse mt-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span>Scanning document via Optical Character Engine...</span>
              </div>
            )}

            {ocrNotice && !isScanning && (
              <div className="p-3 bg-[#E8F8EE] border border-[#D1EED8] rounded-xl text-xs text-[#16A34A] font-semibold flex items-center gap-2 mt-2 animate-fade-in">
                <Sparkles className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>{ocrNotice}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(22,163,74,0.25)] hover:shadow-[0_6px_16px_rgba(22,163,74,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting to Accounts Payable...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit {submissionType === 'EMPLOYEE' ? 'Expense Claim' : 'Vendor Invoice'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

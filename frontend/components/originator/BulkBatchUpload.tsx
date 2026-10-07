'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Download, 
  BarChart3, 
  Check, 
  Info,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export function BulkBatchUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number>(100);
  const [simCount, setSimCount] = useState<number>(100);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setErrorMessage(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await api.invoices.uploadCsv(selectedFile);
      if (res && res.error) {
        setErrorMessage(res.error);
      } else {
        setUploadResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'CSV processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulate = async (count: number) => {
    setIsSimulating(true);
    setSimCount(count);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      const res = await api.invoices.simulateBatch(count);
      if (res && res.error) {
        setErrorMessage(res.error);
      } else {
        setUploadResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Enterprise volume simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 
`invoice_id,invoice_number,vendor_id,vendor_name,employee_id,employee_name,employee_dept,amount,currency,category,description,receipt_status
INV-CORP-9001,INV-2026-001,V001,AWS Cloud Services,E001,Marcus Vance,Engineering,42500,INR,Software,Monthly AWS cloud hosting and database cluster,UPLOADED
EXP-CORP-9002,REC-2026-002,EMP_REIMBURSE,Employee Reimbursement,E002,Aisha Patel,Operations,3200,INR,Office Supplies,Office stationery and whiteboard materials,UPLOADED
INV-CORP-9003,INV-2026-003,V002,Infosys Technologies,E003,Rahul Mehta,Engineering,750000,INR,Consulting,Enterprise architecture review milestones,UPLOADED
EXP-CORP-9004,REC-2026-004,EMP_REIMBURSE,Employee Reimbursement,E004,Siddharth Rao,Marketing,85000,INR,Client Entertainment,Executive dinner with enterprise prospects,MISSING
INV-CORP-9005,INV-2026-005,V003,Unverified Global Logistics,E001,Marcus Vance,Operations,6400000,INR,Logistics,Expedited shipment override,UPLOADED
INV-CORP-9006,INV-2026-001,V001,AWS Cloud Services,E001,Marcus Vance,Engineering,42500,INR,Software,Monthly AWS cloud hosting and database cluster duplicate,UPLOADED`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'wisepay_enterprise_batch_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-white to-[#EFF6FF] p-6 rounded-3xl border border-[#E2ECE4] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                Bulk Batch Upload
              </span>
              <span className="text-xs text-[#64748B]">• Accounts Payable Invoicing</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
              Enterprise Batch Upload &amp; Volume Simulator
            </h2>
            <p className="text-xs text-[#64748B] max-w-2xl">
              Upload enterprise invoice and receipt files in bulk to simulate and test high-volume accounts payable processing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-[#0F172A] border border-[#E2ECE4] hover:bg-[#F3F8F4] shadow-xs transition-colors cursor-pointer self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-[#16A34A]" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: CSV File Drag & Drop on Left, Enterprise Volume Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: CSV/Excel File Uploader (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">Direct File Batch Upload</h3>
                <p className="text-[11px] text-[#64748B]">Upload enterprise CSV or Excel sheet with multiple records</p>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] bg-[#FAFCFA] hover:bg-[#EFF6FF]/30 rounded-2xl cursor-pointer transition-all group">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors mb-2" />
              {selectedFile ? (
                <div className="text-center">
                  <div className="text-xs font-bold text-[#2563EB] flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to Upload
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                    Click to select CSV / Excel spreadsheet
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Supports SAP, Oracle NetSuite, and QuickBooks standard export schemas
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleCsvUpload}
              disabled={!selectedFile || isUploading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading Batch Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process Uploaded File ({selectedFile ? selectedFile.name : '0 selected'})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Enterprise Volume Simulator (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E8F8EE] border border-[#D1EED8] flex items-center justify-center text-[#16A34A]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">Enterprise Volume Simulator</h3>
                <p className="text-[11px] text-[#64748B]">Simulate enterprise transaction volume for accounts payable testing</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Test system throughput with realistic enterprise transaction batches, generating both standard disbursements and exception cases for review.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCount(100)}
                disabled={isSimulating}
                className={`p-3 border rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50 ${
                  selectedCount === 100
                    ? 'bg-[#E8F8EE] border-[#16A34A] ring-2 ring-[#16A34A]/20'
                    : 'bg-[#FAFCFA] hover:bg-[#F0FDF4] border-[#E2ECE4] hover:border-[#16A34A]'
                }`}
              >
                <div className={`text-base font-extrabold ${selectedCount === 100 ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                  100 Rows
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Quick Sanity Run</div>
                <div className="text-[9px] text-[#16A34A] font-bold mt-1">~10 Exceptions</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCount(500)}
                disabled={isSimulating}
                className={`p-3 border rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50 ${
                  selectedCount === 500
                    ? 'bg-[#E8F8EE] border-[#16A34A] ring-2 ring-[#16A34A]/20'
                    : 'bg-[#FAFCFA] hover:bg-[#F0FDF4] border-[#E2ECE4] hover:border-[#16A34A]'
                }`}
              >
                <div className={`text-base font-extrabold ${selectedCount === 500 ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                  500 Rows
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Medium Enterprise</div>
                <div className="text-[9px] text-[#16A34A] font-bold mt-1">~50 Exceptions</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCount(1000)}
                disabled={isSimulating}
                className={`p-3 border rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50 ${
                  selectedCount === 1000
                    ? 'bg-[#E8F8EE] border-[#16A34A] ring-2 ring-[#16A34A]/20'
                    : 'bg-[#FAFCFA] hover:bg-[#F0FDF4] border-[#E2ECE4] hover:border-[#16A34A]'
                }`}
              >
                <div className={`text-base font-extrabold ${selectedCount === 1000 ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                  1,000 Rows
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5">High-Scale Volume</div>
                <div className="text-[9px] text-[#16A34A] font-bold mt-1">~100 Exceptions</div>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => handleSimulate(selectedCount)}
              disabled={isSimulating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(22,163,74,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing {simCount} Transactions in Parallel...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Trigger {selectedCount.toLocaleString()}-Row Enterprise Batch Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Batch Ingestion Confirmation Card */}
      {uploadResult && (
        <div className="bg-white rounded-3xl border border-[#E2ECE4] p-6 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EAEFEA]">
            <div className="w-8 h-8 rounded-xl bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">Batch Ingestion Successful</h3>
              <p className="text-[11px] text-[#64748B]">
                {uploadResult.total_processed || uploadResult.total_simulated || 0} rows submitted to the accounts payable processing queue.
              </p>
            </div>
          </div>

          {/* Simple Confirmation Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAFCFA] rounded-2xl border border-[#E2ECE4]">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Total Rows Ingested</span>
              <div className="text-2xl font-black text-[#0F172A] mt-1 font-mono">
                {(uploadResult.total_processed || uploadResult.total_simulated || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-[#16A34A] font-semibold mt-0.5">100% Ingested</div>
            </div>

            <div className="p-4 bg-[#FAFCFA] rounded-2xl border border-[#E2ECE4]">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Source / File</span>
              <div className="text-sm font-bold text-[#0F172A] mt-2 truncate">
                {uploadResult.filename || 'Enterprise Volume Simulator'}
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Batch Mode</div>
            </div>

            <div className="p-4 bg-[#E8F8EE]/60 rounded-2xl border border-[#D1EED8]">
              <span className="text-[10px] font-bold uppercase text-[#16A34A]">Processing Status</span>
              <div className="text-sm font-bold text-[#16A34A] mt-2 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Received &amp; Queued
              </div>
              <div className="text-[11px] text-[#166534] mt-0.5">Routed to Accounts Payable</div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAEFEA]">
            <span className="text-xs text-[#64748B]">
              Transactions are ingested into the AI Risk Pipeline and sealed to the audit ledger.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/queue"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] hover:bg-[#CCFBF1] transition-colors"
              >
                <span>View Exception Pile (AP Reviewer)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/audit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] hover:bg-[#FEF3C7] transition-colors"
              >
                <span>Inspect Audit Ledger (Auditor)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

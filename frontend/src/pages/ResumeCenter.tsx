import { useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadResume } from '@/services/api';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Upload, Download, CheckCircle2, XCircle, Trash2, Plus } from 'lucide-react';

export default function ResumeCenter() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadResume(file);
      setUploadedFile(file.name);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    }
  };

  const mockVersions = [
    { id: '1', name: 'Software Engineer Resume', score: 92, lastUpdated: '2 hours ago' },
    { id: '2', name: 'Data Science Resume', score: 87, lastUpdated: '1 day ago' },
    { id: '3', name: 'Product Manager Resume', score: 78, lastUpdated: '3 days ago' }
  ];

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resume Center</h1>
          <p className="text-slate-600 mt-1">Upload and optimize your resume</p>
        </div>

        {/* Master Resume Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`card-soft p-12 text-center transition-all ${
            dragOver ? 'border-primary bg-primary/5' : ''
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              uploadedFile ? 'bg-success/10' : 'bg-primary/10'
            }`}>
              {uploadedFile ? <CheckCircle2 className="w-8 h-8 text-success" /> : <Upload className="w-8 h-8 text-primary" />}
            </div>
            <div className="space-y-2">
              {uploadedFile ? (
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Resume Uploaded!</h3>
                  <p className="text-slate-600">{uploadedFile}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Upload Your Master Resume</h3>
                  <p className="text-slate-600">Drag and drop a PDF, or click to browse</p>
                </div>
              )}
            </div>
            {!uploadedFile && (
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
            {uploadedFile && (
              <button
                onClick={() => setUploadedFile(null)}
                className="btn-ghost flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-5 h-5" /> Replace File
              </button>
            )}
          </div>
        </div>

        {/* AI-Generated Versions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">AI-Optimized Versions</h2>
            <button className="btn-secondary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Generate New
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {mockVersions.map((version) => (
              <div key={version.id} className="card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{version.name}</h3>
                        <p className="text-xs text-slate-500">{version.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                      {version.score}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

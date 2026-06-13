import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Download, Plus, ExternalLink } from 'lucide-react';

export default function CoverLetterCenter() {
  const mockCoverLetters = [
    {
      id: '1',
      title: 'Google React Developer',
      company: 'Google',
      date: '2 hours ago',
      preview: 'I am writing to express my strong interest in the React Developer position at Google...'
    },
    {
      id: '2',
      title: 'Microsoft Full Stack Engineer',
      company: 'Microsoft',
      date: '1 day ago',
      preview: 'I am excited to apply for the Full Stack Engineer position at Microsoft...'
    }
  ];

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cover Letter Center</h1>
            <p className="text-slate-600 mt-1">AI-generated cover letters</p>
          </div>
          <Link to="/jobs" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Generate New
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {mockCoverLetters.map((letter) => (
            <div key={letter.id} className="card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{letter.title}</h3>
                    <p className="text-sm text-slate-500">{letter.date}</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm line-clamp-3 mb-4">{letter.preview}</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="btn-ghost flex items-center justify-center gap-2 text-sm py-2">
                  <ExternalLink className="w-4 h-4" /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
}

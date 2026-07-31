'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ClipboardList, Plus, Send, Eye, CheckCircle, Clock, X, Trash2 } from 'lucide-react';

export default function CounselorWorksheetsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'assigned'>('templates');
  const [templates, setTemplates] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null);
  const [studentId, setStudentId] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorksheet, setNewWorksheet] = useState({
    title: '',
    description: '',
    category: 'CBT',
    questions: [] as any[]
  });
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  // Built-in seed templates
  const defaultTemplates = [
    {
      id: 'ws-1',
      title: 'Thought Record',
      description: 'CBT worksheet for identifying and challenging automatic thoughts.',
      category: 'CBT',
      questions: [
        { id: 'q1', text: 'What was the situation?', type: 'text' },
        { id: 'q2', text: 'What were your automatic thoughts?', type: 'text' },
        { id: 'q3', text: 'Rate your emotion intensity (1-10)', type: 'scale' }
      ]
    },
    {
      id: 'ws-2',
      title: 'Stress Log',
      description: 'Daily tracking of stress levels and triggers.',
      category: 'Tracking',
      questions: [
        { id: 'q1', text: 'What caused you stress today?', type: 'text' },
        { id: 'q2', text: 'How did you cope?', type: 'text' }
      ]
    },
    {
      id: 'ws-3',
      title: 'Gratitude Journal',
      description: 'Focusing on positive daily experiences.',
      category: 'Mindfulness',
      questions: [
        { id: 'q1', text: 'List 3 things you are grateful for today.', type: 'text' }
      ]
    }
  ];

  useEffect(() => {
    fetchWorksheets();
  }, []);

  const fetchWorksheets = async () => {
    try {
      const res = await fetch('/api/worksheets');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.worksheets?.length ? data.worksheets : defaultTemplates);
        setAssignments(data.assignments || []);
      } else {
        setTemplates(defaultTemplates);
      }
    } catch (e) {
      console.error(e);
      setTemplates(defaultTemplates);
    }
  };

  const handleAssign = async () => {
    if (!studentId || !selectedWorksheet) return;
    try {
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          worksheetId: selectedWorksheet.id,
          studentId
        })
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        setStudentId('');
        fetchWorksheets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newWorksheet.title,
          description: newWorksheet.description,
          category: newWorksheet.category,
          questions: newWorksheet.questions
        })
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewWorksheet({ title: '', description: '', category: 'CBT', questions: [] });
        fetchWorksheets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addQuestion = () => {
    setNewWorksheet(prev => ({
      ...prev,
      questions: [...prev.questions, { id: Date.now().toString(), text: '', type: 'text', options: [] }]
    }));
  };
  
  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...newWorksheet.questions];
    updated[index] = { ...updated[index], [field]: value };
    setNewWorksheet({ ...newWorksheet, questions: updated });
  };

  const removeQuestion = (index: number) => {
    const updated = [...newWorksheet.questions];
    updated.splice(index, 1);
    setNewWorksheet({ ...newWorksheet, questions: updated });
  };

  const handleReviewFeedback = async () => {
    if (!selectedAssignment) return;
    try {
      const res = await fetch('/api/worksheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          feedback
        })
      });
      if (res.ok) {
        setIsReviewModalOpen(false);
        setFeedback('');
        fetchWorksheets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-content page-transition">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              <ClipboardList size={12} strokeWidth={2.5} /> Clinical Worksheets
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Worksheet Management</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none', background: '#325343', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              <Plus size={16} /> Create Template
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'templates' ? 'border-[#325343] text-[#325343]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'assigned' ? 'border-[#325343] text-[#325343]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned
          </button>
        </div>

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="glass-card p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full bg-white">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
                    {template.category}
                  </span>
                  <div className="flex items-center text-gray-400 text-sm">
                    <ClipboardList size={16} className="mr-1" />
                    {template.questions?.length || 0} Qs
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{template.title}</h3>
                <p className="text-gray-600 text-sm flex-1 mb-6">{template.description}</p>
                <button 
                  onClick={() => {
                    setSelectedWorksheet(template);
                    setIsAssignModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-[#325343]/5 text-[#325343] border border-gray-200 py-2.5 rounded-lg transition-colors font-medium"
                >
                  <Send size={18} />
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assigned' && (
          <div className="glass-card rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Student</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Worksheet</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date Assigned</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.length > 0 ? assignments.map(assignment => (
                  <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{assignment.studentName || 'Student'}</td>
                    <td className="px-6 py-4 text-gray-600">{assignment.worksheetTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(assignment.date || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {assignment.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={14} /> Completed
                        </span>
                      ) : assignment.status === 'reviewed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Eye size={14} /> Reviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {assignment.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsReviewModalOpen(true);
                          }}
                          className="text-[#325343] hover:text-[#264033] font-medium text-sm"
                        >
                          Review Responses
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No worksheets assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-2">Assign Worksheet</h2>
            <p className="text-gray-600 mb-6">Assign "{selectedWorksheet?.title}" to a student in your caseload.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID or Name</label>
              <input 
                type="text" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325343]/50 focus:border-[#325343]"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssign}
                disabled={!studentId}
                className="px-4 py-2 bg-[#325343] hover:bg-[#264033] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Create New Template</h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newWorksheet.title}
                  onChange={(e) => setNewWorksheet({...newWorksheet, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325343]/50 focus:border-[#325343]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newWorksheet.description}
                  onChange={(e) => setNewWorksheet({...newWorksheet, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325343]/50 focus:border-[#325343] min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={newWorksheet.category}
                  onChange={(e) => setNewWorksheet({...newWorksheet, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325343]/50 focus:border-[#325343]"
                >
                  <option value="CBT">CBT</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Tracking">Tracking</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Questions</h3>
                <button 
                  onClick={addQuestion}
                  className="text-sm text-[#325343] hover:text-[#264033] font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>
              
              <div className="space-y-4">
                {newWorksheet.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex gap-4">
                    <div className="flex-1 space-y-3">
                      <input 
                        type="text" 
                        placeholder="Question text..."
                        value={q.text}
                        onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#325343]"
                      />
                      <select 
                        value={q.type}
                        onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#325343]"
                      >
                        <option value="text">Text Response</option>
                        <option value="scale">Scale (1-10)</option>
                        <option value="multiChoice">Multiple Choice</option>
                        <option value="checkbox">Checkboxes</option>
                      </select>
                    </div>
                    <button onClick={() => removeQuestion(idx)} className="text-gray-400 hover:text-red-500 mt-2 self-start">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {newWorksheet.questions.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    No questions added yet.
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTemplate}
                disabled={!newWorksheet.title}
                className="px-4 py-2 bg-[#325343] hover:bg-[#264033] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-2">Review Worksheet</h2>
            <p className="text-gray-600 mb-6">Student: {selectedAssignment.studentName || 'Student'} • {selectedAssignment.worksheetTitle}</p>
            
            <div className="space-y-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              {selectedAssignment.responses?.map((r: any, idx: number) => (
                <div key={idx} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <p className="font-medium text-gray-800 mb-2">{idx + 1}. {r.questionText || `Question ${idx + 1}`}</p>
                  <p className="text-gray-600 bg-white p-3 rounded-lg border border-gray-100">{r.answer}</p>
                </div>
              ))}
              {(!selectedAssignment.responses || selectedAssignment.responses.length === 0) && (
                <p className="text-gray-500 italic">No responses recorded.</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Counselor Feedback (visible to student)</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts or discussion points for next session..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325343]/50 focus:border-[#325343] min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button 
                onClick={handleReviewFeedback}
                disabled={!feedback}
                className="px-4 py-2 bg-[#325343] hover:bg-[#264033] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

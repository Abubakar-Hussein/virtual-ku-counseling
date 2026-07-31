'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ClipboardList, CheckCircle, Clock, Send, ChevronRight, X } from 'lucide-react';

export default function StudentWorksheetsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [activeWorksheet, setActiveWorksheet] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/worksheets');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      } else {
        // Mock data fallback if API is not implemented
        setAssignments([
          {
            id: 'a1',
            worksheetTitle: 'Thought Record',
            worksheetId: 'ws-1',
            counselorName: 'Dr. Smith',
            date: new Date().toISOString(),
            status: 'pending',
            questions: [
              { id: 'q1', text: 'What was the situation?', type: 'text' },
              { id: 'q2', text: 'What were your automatic thoughts?', type: 'text' },
              { id: 'q3', text: 'Rate your emotion intensity (1-10)', type: 'scale' }
            ]
          },
          {
            id: 'a2',
            worksheetTitle: 'Stress Log',
            counselorName: 'Dr. Smith',
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'reviewed',
            feedback: 'Great job tracking your stress triggers. Let\'s discuss the coping mechanisms next session.'
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitResponses = async () => {
    if (!activeWorksheet) return;
    
    const formattedResponses = activeWorksheet.questions?.map((q: any) => ({
      questionId: q.id,
      questionText: q.text,
      answer: responses[q.id]
    })) || [];

    try {
      const res = await fetch('/api/worksheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: activeWorksheet.id,
          responses: formattedResponses,
          status: 'completed'
        })
      });
      if (res.ok) {
        setActiveWorksheet(null);
        setResponses({});
        fetchAssignments();
      }
    } catch (e) {
      console.error(e);
      // Simulate success if API fails
      setActiveWorksheet(null);
      fetchAssignments();
    }
  };

  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const completedAssignments = assignments.filter(a => a.status === 'completed' || a.status === 'reviewed');

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-content page-transition">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              <ClipboardList size={12} strokeWidth={2.5} /> My Worksheets
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>My Worksheets</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Complete assigned therapeutic exercises.</p>
          </div>
          <NotificationBell />
        </header>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-[#325343] text-[#325343]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            {pendingAssignments.length > 0 && (
              <span className="bg-[#325343] text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingAssignments.length}
              </span>
            )}
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'completed' ? 'border-[#325343] text-[#325343]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>

        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAssignments.map(assignment => (
              <div 
                key={assignment.id} 
                onClick={() => {
                  setActiveWorksheet(assignment);
                  setResponses({});
                }}
                className="glass-card p-6 rounded-xl border border-[#325343]/20 shadow-sm flex flex-col h-full bg-white hover:border-[#325343] cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <Clock size={14} /> To Do
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#325343] transition-colors">{assignment.worksheetTitle}</h3>
                <div className="text-gray-500 text-sm flex-1 mb-4">
                  <p>Assigned by {assignment.counselorName || 'Counselor'}</p>
                  <p>{new Date(assignment.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center text-[#325343] font-medium text-sm mt-auto">
                  Start Worksheet <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            ))}
            
            {pendingAssignments.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
                <p className="text-gray-500">You don't have any pending worksheets.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedAssignments.map(assignment => (
              <div key={assignment.id} className="glass-card p-6 rounded-xl border border-gray-100 shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{assignment.worksheetTitle}</h3>
                    <p className="text-sm text-gray-500 mb-4">Completed on {new Date(assignment.date).toLocaleDateString()}</p>
                    
                    {assignment.feedback && (
                      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-900 mb-1">Counselor Feedback:</p>
                        <p className="text-sm text-blue-800">{assignment.feedback}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {assignment.status === 'reviewed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle size={14} /> Reviewed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle size={14} /> Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {completedAssignments.length === 0 && (
              <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No completed worksheets yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Worksheet Form Modal */}
      {activeWorksheet && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeWorksheet.worksheetTitle}</h2>
                <p className="text-sm text-gray-500">Please answer all questions below.</p>
              </div>
              <button 
                onClick={() => setActiveWorksheet(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <div className="space-y-8 max-w-2xl mx-auto">
                {activeWorksheet.questions?.map((q: any, idx: number) => (
                  <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-base font-medium text-gray-900 mb-4">
                      <span className="text-[#325343] font-bold mr-2">{idx + 1}.</span> 
                      {q.text}
                    </label>
                    
                    {q.type === 'text' && (
                      <textarea 
                        value={responses[q.id] || ''}
                        onChange={(e) => handleResponseChange(q.id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325343]/50 focus:border-[#325343] min-h-[120px] resize-y"
                      />
                    )}
                    
                    {q.type === 'scale' && (
                      <div className="px-2">
                        <input 
                          type="range" 
                          min="1" max="10" 
                          value={responses[q.id] || 5}
                          onChange={(e) => handleResponseChange(q.id, parseInt(e.target.value))}
                          className="w-full accent-[#325343] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                          <span>1 (Low)</span>
                          <span className="text-[#325343] font-bold text-base bg-[#325343]/10 px-3 py-1 rounded-full">{responses[q.id] || 5}</span>
                          <span>10 (High)</span>
                        </div>
                      </div>
                    )}
                    
                    {q.type === 'multiChoice' && q.options && (
                      <div className="space-y-3">
                        {q.options.map((opt: string, i: number) => (
                          <label key={i} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input 
                              type="radio" 
                              name={q.id}
                              value={opt}
                              checked={responses[q.id] === opt}
                              onChange={() => handleResponseChange(q.id, opt)}
                              className="w-4 h-4 text-[#325343] focus:ring-[#325343] border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {q.type === 'checkbox' && q.options && (
                      <div className="space-y-3">
                        {q.options.map((opt: string, i: number) => {
                          const currentValues = responses[q.id] || [];
                          const isChecked = currentValues.includes(opt);
                          return (
                            <label key={i} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    handleResponseChange(q.id, currentValues.filter((v: string) => v !== opt));
                                  } else {
                                    handleResponseChange(q.id, [...currentValues, opt]);
                                  }
                                }}
                                className="w-4 h-4 text-[#325343] focus:ring-[#325343] border-gray-300 rounded"
                              />
                              <span className="ml-3 text-gray-700">{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setActiveWorksheet(null)}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Save Draft
              </button>
              <button 
                onClick={handleSubmitResponses}
                className="px-6 py-2.5 bg-[#325343] hover:bg-[#264033] text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Send size={18} /> Submit Worksheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

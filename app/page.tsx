"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

// --- HELPERS & CONSTANTS ---
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "X (Twitter)"];
const CONTENT_TYPES = ["Single Image", "Carousel", "Reel", "Story", "Video", "Batch/Bundle"];
const STATUSES = ["Copies Written", "Designing", "Needs Approval", "Scheduled", "Published"];
const ASSIGNEES = ["Yader Calderon", "Massiel Caldera", "Scarleth Orozco"];
const KNOWN_CLIENTS = [
  "Tag Express", "Mary Autopartes", "Tecbify", 
  "Repuestos El Eden", "Huber Rent a Car", "Norte Express", 
  "Pak It Up", "All American Auto Group LLC", "Pro-DG (Internal)"
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Copies Written': return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'Designing': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Needs Approval': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Published': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const formatDateForInput = (d: Date) => {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

export default function ContentCalendarPage() {
  const [activeTab, setActiveTab] = useState<"Dashboard" | "Calendar">("Dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- AUTH CHECK ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login"); 
      } else {
        setIsAuthenticated(true); 
      }
    };
    checkAuth();
  }, [router]);

  // --- DASHBOARD STATE ---
  const [dashDateOption, setDashDateOption] = useState("This Month");
  const [dashStartDate, setDashStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dashEndDate, setDashEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [dashPosts, setDashPosts] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  // --- CALENDAR STATE ---
  const [calDate, setCalDate] = useState(new Date());
  const [calPosts, setCalPosts] = useState<any[]>([]);
  const [calLoading, setCalLoading] = useState(true);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_name: KNOWN_CLIENTS[0],
    publish_date: formatDateForInput(new Date()),
    publish_time: "12:00",
    platforms: [] as string[],
    content_type: "Single Image",
    status: "Copies Written",
    copywriter: "Joel",
    designer: "Graphic Designer",
    publisher: "Joel",
    copies_needed: 1,
    designs_needed: 1,
    copy_text: "",
    internal_notes: "",
    media_urls: [] as string[]
  });

  // --- FETCH DASHBOARD DATA ---
  useEffect(() => {
    async function fetchDashboard() {
      setDashLoading(true);
      const start = new Date(dashStartDate); start.setHours(0, 0, 0, 0);
      const end = new Date(dashEndDate); end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("content_calendar")
        .select("*")
        .gte("publish_date", start.toISOString())
        .lte("publish_date", end.toISOString())
        .order("publish_date", { ascending: true });

      if (!error) setDashPosts(data || []);
      setDashLoading(false);
    }
    fetchDashboard();
  }, [dashStartDate, dashEndDate, refreshTrigger]);

  // --- FETCH CALENDAR DATA ---
  useEffect(() => {
    async function fetchCalendar() {
      setCalLoading(true);
      const startOfMonth = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
      const endOfMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from("content_calendar")
        .select("*")
        .gte("publish_date", startOfMonth.toISOString())
        .lte("publish_date", endOfMonth.toISOString())
        .order("publish_date", { ascending: true });

      if (!error) setCalPosts(data || []);
      setCalLoading(false);
    }
    fetchCalendar();
  }, [calDate, refreshTrigger]);

  // --- DASHBOARD DATE LOGIC ---
  const handleDashDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value;
    setDashDateOption(option);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (option === "Today" || option === "Specific Date") {
      setDashStartDate(todayStart); setDashEndDate(todayStart);
    } else if (option === "Yesterday") {
      const yesterday = new Date(todayStart); yesterday.setDate(yesterday.getDate() - 1);
      setDashStartDate(yesterday); setDashEndDate(yesterday);
    } else if (option === "This Week") {
      const wtd = new Date(todayStart); wtd.setDate(wtd.getDate() - wtd.getDay());
      const endWeek = new Date(wtd); endWeek.setDate(endWeek.getDate() + 6);
      setDashStartDate(wtd); setDashEndDate(endWeek);
    } else if (option === "This Month") {
      const mtdStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      const mtdEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0);
      setDashStartDate(mtdStart); setDashEndDate(mtdEnd);
    } else if (option === "All") {
      setDashStartDate(new Date(2020, 0, 1)); setDashEndDate(new Date(2030, 11, 31));
    }
  };

  // --- CALENDAR GRID MATH ---
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const gridDays = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1;
    if (dayNumber > 0 && dayNumber <= daysInMonth) return new Date(year, month, dayNumber);
    return null;
  });

  const openNewModal = (date: Date = new Date()) => {
    setEditId(null);
    setFormData({
      client_name: KNOWN_CLIENTS[0], publish_date: formatDateForInput(date), publish_time: "12:00",
      platforms: [], content_type: "Single Image", status: "Copies Written", 
      copywriter: "Joel", designer: "Graphic Designer", publisher: "Joel",
      copies_needed: 1, designs_needed: 1, copy_text: "", internal_notes: "", media_urls: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (post: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pubDate = new Date(post.publish_date);
    setEditId(post.id);
    setFormData({
      client_name: post.client_name, publish_date: formatDateForInput(pubDate),
      publish_time: pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      platforms: post.platforms || [], content_type: post.content_type || "Single Image",
      status: post.status || "Copies Written", 
      copywriter: post.copywriter || "Joel", 
      designer: post.designer || "Graphic Designer", 
      publisher: post.publisher || "Joel",
      copies_needed: post.copies_needed || 1, designs_needed: post.designs_needed || 1,
      copy_text: post.copy_text || "", internal_notes: post.internal_notes || "", media_urls: post.media_urls || []
    });
    setIsModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [y, m, d] = formData.publish_date.split('-');
      const [hours, minutes] = formData.publish_time.split(':');
      const combinedDate = new Date(Number(y), Number(m) - 1, Number(d), Number(hours), Number(minutes));

      const { publish_time, ...dataToSave } = formData; 
      const payload = { ...dataToSave, publish_date: combinedDate.toISOString() };

      if (editId) {
        const { error } = await supabase.from("content_calendar").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_calendar").insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error("Save Error:", err);
      alert(`Error saving to database: ${err.message}\n\nDid you run the SQL command to add the copywriter/designer roles?`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this brief?")) return;
    await supabase.from("content_calendar").delete().eq("id", editId);
    setIsModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const filePath = `${formData.client_name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('agency_assets').upload(filePath, file);
    if (!error) {
      const { data } = supabase.storage.from('agency_assets').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, media_urls: [...prev.media_urls, data.publicUrl] }));
    } else alert("Upload failed.");
    setIsUploading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const activeClients = Array.from(new Set(dashPosts.map(p => p.client_name)));
  const setLoading = (val: boolean) => activeTab === "Dashboard" ? setDashLoading(val) : setCalLoading(val);
  
  // FIX: Moved the early return inside the main render block using a ternary operator
  return !isAuthenticated ? (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
      Verifying access...
    </div>
  ) : (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen relative">
      
      {/* --- TOP APP HEADER & TABS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
  {/* Update the src to match your file's exact name (e.g., /logo.png or /logo.svg) */}
  <img src="/logo.png" alt="Pro-DG Logo" className="h-8 w-auto object-contain drop-shadow-sm" />
</h1>
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => setActiveTab("Dashboard")} className={`cursor-pointer px-6 py-2 text-sm font-black uppercase tracking-wider rounded-md transition-all ${activeTab === "Dashboard" ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
          <button onClick={() => setActiveTab("Calendar")} className={`cursor-pointer px-6 py-2 text-sm font-black uppercase tracking-wider rounded-md transition-all ${activeTab === "Calendar" ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Calendar</button>
        </div>

        <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="cursor-pointer px-4 py-2.5 text-slate-500 font-bold hover:text-slate-800 transition-all">
                Log Out
            </button>
            <button onClick={() => openNewModal()} className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-95">
            + New Brief
            </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DASHBOARD VIEW */}
      {/* ========================================================= */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6">
          
          {/* Dashboard Controls */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-wrap">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Date Range:</span>
            <select value={dashDateOption} onChange={handleDashDateChange} className="cursor-pointer text-sm font-black text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded outline-none transition-all uppercase tracking-wider">
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Specific Date">Specific Date</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="All">All Time</option>
              <option value="Custom Date">Custom Range</option>
            </select>

            {dashDateOption === "Specific Date" && (
              <input type="date" value={formatDateForInput(dashStartDate)} onChange={e => {
                if(e.target.value) {
                  const [y, m, d] = e.target.value.split('-');
                  const dObj = new Date(Number(y), Number(m) - 1, Number(d));
                  setDashStartDate(dObj); setDashEndDate(dObj);
                }
              }} className="cursor-pointer text-sm font-black text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1.5 rounded outline-none" />
            )}

            {dashDateOption === "Custom Date" && (
              <div className="flex items-center gap-2">
                <input type="date" value={formatDateForInput(dashStartDate)} onChange={e => setDashStartDate(new Date(e.target.value))} className="cursor-pointer text-sm font-black text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1.5 rounded outline-none" />
                <span className="text-slate-400 font-bold">-</span>
                <input type="date" value={formatDateForInput(dashEndDate)} onChange={e => setDashEndDate(new Date(e.target.value))} className="cursor-pointer text-sm font-black text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1.5 rounded outline-none" />
              </div>
            )}
          </div>

          {dashLoading ? (
            <div className="p-20 text-center font-bold text-slate-400 animate-pulse bg-white rounded-xl border border-slate-200">Loading metrics...</div>
          ) : (
            <>
              {/* STATUS KPI CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {STATUSES.map(status => {
                  const postsInStatus = dashPosts.filter(p => p.status === status);
                  return (
                    <div key={status} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${getStatusColor(status).replace('bg-', 'border-').split(' ')[2]}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{status}</h3>
                      <div className="text-3xl font-black text-slate-800">{postsInStatus.length} <span className="text-sm text-slate-400 font-semibold">Briefs</span></div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- NEW DYNAMIC AGENT WORKLOAD TABLE --- */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-800 p-3 text-white text-xs font-black uppercase tracking-widest">Agent Workload Pipeline</div>
                  <div className="p-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3">Team Member</th>
                          <th className="p-3 text-center">Copies 📝</th>
                          <th className="p-3 text-center">Designs 🎨</th>
                          <th className="p-3 text-center">Published 🚀</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ASSIGNEES.map(agent => {
                          const copiesPending = dashPosts.filter(p => p.copywriter === agent && (!p.status || p.status === 'Ideation')).reduce((s, p) => s + (p.copies_needed || 0), 0);
                          const copiesWritten = dashPosts.filter(p => p.copywriter === agent && p.status && p.status !== 'Ideation').reduce((s, p) => s + (p.copies_needed || 0), 0);
                          
                          const designsPending = dashPosts.filter(p => p.designer === agent && ['Ideation', 'Copies Written', 'Designing'].includes(p.status)).reduce((s, p) => s + (p.designs_needed || 0), 0);
                          const designsDone = dashPosts.filter(p => p.designer === agent && ['Needs Approval', 'Scheduled', 'Published'].includes(p.status)).reduce((s, p) => s + (p.designs_needed || 0), 0);
                          
                          const publishedBriefs = dashPosts.filter(p => p.publisher === agent && p.status === 'Published').length;

                          if (copiesPending + copiesWritten + designsPending + designsDone + publishedBriefs === 0) return null;

                          return (
                            <tr key={agent} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800 text-sm">{agent}</td>
                              
                              <td className="p-3 text-center">
                                <span className="font-black text-slate-700">{copiesWritten}</span> 
                                <span className="text-[10px] font-bold text-slate-400 ml-1" title="Pending">/ {copiesPending} pend</span>
                              </td>
                              
                              <td className="p-3 text-center">
                                <span className="font-black text-slate-700">{designsDone}</span> 
                                <span className="text-[10px] font-bold text-slate-400 ml-1" title="Pending">/ {designsPending} pend</span>
                              </td>
                              
                              <td className="p-3 text-center font-black text-green-600 bg-green-50/30">
                                {publishedBriefs} <span className="text-[10px] font-bold text-green-600/50 uppercase">Posts</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CLIENT BREAKDOWN */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-800 p-3 text-white text-xs font-black uppercase tracking-widest">Client Metrics</div>
                  <div className="p-0 overflow-y-auto max-h-[300px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                          <th className="p-3">Client</th>
                          <th className="p-3 text-center">Total Posts</th>
                          <th className="p-3 text-center">Needs Approval</th>
                          <th className="p-3 text-center">Published</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeClients.length === 0 ? (
                          <tr><td colSpan={4} className="p-6 text-center text-slate-400 font-bold text-sm">No data for this range.</td></tr>
                        ) : (
                          activeClients.map(client => {
                            const clientPosts = dashPosts.filter(p => p.client_name === client);
                            const needsApproval = clientPosts.filter(p => p.status === 'Needs Approval').length;
                            const published = clientPosts.filter(p => p.status === 'Published').length;
                            return (
                              <tr key={client} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActiveTab('Calendar')}>
                                <td className="p-3 font-bold text-slate-800 text-sm">{client}</td>
                                <td className="p-3 text-center font-black text-slate-600">{clientPosts.length}</td>
                                <td className="p-3 text-center font-bold text-amber-600">{needsApproval > 0 ? needsApproval : '-'}</td>
                                <td className="p-3 text-center font-bold text-green-600">{published > 0 ? published : '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CALENDAR VIEW */}
      {/* ========================================================= */}
      {activeTab === "Calendar" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mt-4">
          
          <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
              <button onClick={() => setCalDate(new Date(year, month - 1, 1))} className="cursor-pointer px-3 py-1 hover:bg-slate-100 rounded-md font-bold text-slate-600 transition-all active:scale-95">←</button>
              <span className="px-4 font-black text-slate-800 uppercase tracking-wider text-sm min-w-[140px] text-center">
                {calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCalDate(new Date(year, month + 1, 1))} className="cursor-pointer px-3 py-1 hover:bg-slate-100 rounded-md font-bold text-slate-600 transition-all active:scale-95">→</button>
            </div>
            <button onClick={() => setCalDate(new Date())} className="cursor-pointer px-4 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-all active:scale-95">
              Jump to Today
            </button>
          </div>

          <div className="grid grid-cols-7 bg-slate-800 text-white border-b border-slate-700">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-black uppercase tracking-wider border-r border-slate-700 last:border-0">{day}</div>
            ))}
          </div>

          {calLoading ? (
            <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Loading strategy...</div>
          ) : (
            <div className="grid grid-cols-7 bg-slate-200 gap-[1px]">
              {gridDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="bg-slate-50 min-h-[140px]"></div>;

                const isToday = new Date().toDateString() === date.toDateString();
                const dayPosts = calPosts.filter(p => new Date(p.publish_date).toDateString() === date.toDateString());

                return (
                  <div key={index} onClick={() => openNewModal(date)} className={`bg-white min-h-[140px] p-2 flex flex-col group cursor-pointer hover:bg-slate-50 transition-colors relative ${isToday ? 'ring-inset ring-2 ring-blue-500 bg-blue-50/20' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>{date.getDate()}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-blue-500 transition-opacity">+ Add</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                      {dayPosts.map((post) => (
                        <div 
                          key={post.id} 
                          onClick={(e) => openEditModal(post, e)} 
                          title={post.copy_text || "No caption yet"}
                          className={`px-1.5 py-1 rounded border-l-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-[1px] cursor-pointer text-[10px] font-bold leading-tight flex justify-between items-center ${getStatusColor(post.status)}`}
                        >
                          <span className="truncate pr-1">{post.client_name}</span>
                          <div className="flex items-center gap-1 shrink-0 bg-white/40 px-1 rounded shadow-sm text-[9px]">
                            <span title={`${post.copies_needed || 0} Copies`} className="opacity-90">📝{post.copies_needed || 0}</span>
                            <span title={`${post.designs_needed || 0} Designs`} className="opacity-90">🎨{post.designs_needed || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-wider">{editId ? 'Edit Content Brief' : 'New Content Brief'}</h2>
              {editId && <button onClick={handleDelete} className="cursor-pointer text-xs font-bold bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition-all">Delete Post</button>}
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
              <div className="flex-1 p-6 border-r border-slate-200 bg-slate-50 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client / Account</label>
                  <select value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 font-bold text-slate-800 bg-white">
                    {KNOWN_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Other">Other (Type below)</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Publish Date</label>
                    <input type="date" required value={formData.publish_date} onChange={(e) => setFormData({...formData, publish_date: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 font-bold text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time</label>
                    <input type="time" required value={formData.publish_time} onChange={(e) => setFormData({...formData, publish_time: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 font-bold text-slate-700" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(plat => (
                      <button type="button" key={plat} onClick={() => setFormData(p => ({...p, platforms: p.platforms.includes(plat) ? p.platforms.filter(x => x !== plat) : [...p.platforms, plat]}))} className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-lg border transition-all active:scale-95 ${formData.platforms.includes(plat) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}>
                        {formData.platforms.includes(plat) ? '✓ ' : '+ '}{plat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Format</label>
                    <select value={formData.content_type} onChange={e => setFormData({...formData, content_type: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                      {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* --- ROLE ASSIGNMENTS --- */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Role Assignments</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Copywriter</label>
                      <select value={formData.copywriter} onChange={e => setFormData({...formData, copywriter: e.target.value})} className="w-full border border-slate-200 rounded p-1 outline-none text-xs font-bold">
                        {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Designer</label>
                      <select value={formData.designer} onChange={e => setFormData({...formData, designer: e.target.value})} className="w-full border border-slate-200 rounded p-1 outline-none text-xs font-bold">
                        {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Publisher</label>
                      <select value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full border border-slate-200 rounded p-1 outline-none text-xs font-bold">
                        {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">📝 Copies</label>
                    <input type="number" min="0" value={formData.copies_needed} onChange={e => setFormData({...formData, copies_needed: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded p-1.5 outline-none focus:border-blue-500 text-sm font-bold bg-slate-50" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">🎨 Designs</label>
                    <input type="number" min="0" value={formData.designs_needed} onChange={e => setFormData({...formData, designs_needed: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded p-1.5 outline-none focus:border-blue-500 text-sm font-bold bg-slate-50" />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pipeline Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full border-2 rounded-lg p-2.5 outline-none font-bold text-slate-800 ${getStatusColor(formData.status)}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex-1 p-6 bg-white space-y-5 flex flex-col">
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Caption / Copy</label>
                  <textarea value={formData.copy_text} onChange={e => setFormData({...formData, copy_text: e.target.value})} placeholder="Write the caption here..." className="w-full flex-1 min-h-[120px] border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 text-sm resize-none custom-scrollbar" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Designer / Internal Notes</label>
                  <textarea value={formData.internal_notes} onChange={e => setFormData({...formData, internal_notes: e.target.value})} placeholder="E.g., Make sure to use the new logo." className="w-full h-20 border-2 border-amber-200 bg-amber-50 rounded-lg p-3 outline-none focus:border-amber-400 text-sm resize-none custom-scrollbar" />
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visual Assets</label>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold py-2 px-4 rounded transition-all active:scale-95 flex items-center gap-2">
                      {isUploading ? 'Uploading...' : '📁 Upload File'}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,video/*" />
                    </label>
                  </div>
                  {formData.media_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                      {formData.media_urls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative group block w-16 h-16 rounded overflow-hidden border border-slate-300 shadow-sm">
                          <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-95">Cancel</button>
              <button onClick={handleSavePost} className="cursor-pointer px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 hover:shadow-md transition-all active:scale-95">Save Brief</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
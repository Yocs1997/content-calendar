"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PLATFORMS     = ["Instagram", "Facebook", "TikTok", "LinkedIn", "X (Twitter)"];
const CONTENT_TYPES = ["Single Image", "Carousel", "Reel", "Story", "Video", "Batch/Bundle"];
const STATUSES      = ["Copies Written", "Designing", "Needs Approval", "Scheduled", "Published"];
const ASSIGNEES     = ["Yader Calderon", "Massiel Caldera", "Scarleth Orozco"];
const BASE_CLIENTS  = [
  "Tag Express","Mary Autopartes","My Office CoWorking","Repuestos El Eden",
  "Huber Rent a Car","Rasheila Daniels","David EST","Pro-DG (Internal)","NRT","Frozzzy Pop","SuperCargo",
];

// Available accent colors for new clients
const COLOR_OPTIONS = [
  { label:"Red",    dot:"bg-red-500",    text:"text-red-400",    border:"border-red-500" },
  { label:"Orange", dot:"bg-orange-500", text:"text-orange-400", border:"border-orange-500" },
  { label:"Amber",  dot:"bg-amber-400",  text:"text-amber-300",  border:"border-amber-400" },
  { label:"Yellow", dot:"bg-yellow-400", text:"text-yellow-300", border:"border-yellow-400" },
  { label:"Lime",   dot:"bg-lime-400",   text:"text-lime-300",   border:"border-lime-400" },
  { label:"Green",  dot:"bg-emerald-400",text:"text-emerald-400",border:"border-emerald-400" },
  { label:"Teal",   dot:"bg-teal-400",   text:"text-teal-300",   border:"border-teal-400" },
  { label:"Cyan",   dot:"bg-cyan-400",   text:"text-cyan-300",   border:"border-cyan-400" },
  { label:"Sky",    dot:"bg-sky-400",    text:"text-sky-300",    border:"border-sky-400" },
  { label:"Blue",   dot:"bg-blue-400",   text:"text-blue-300",   border:"border-blue-400" },
  { label:"Indigo", dot:"bg-indigo-400", text:"text-indigo-300", border:"border-indigo-400" },
  { label:"Purple", dot:"bg-purple-400", text:"text-purple-300", border:"border-purple-400" },
  { label:"Pink",   dot:"bg-pink-400",   text:"text-pink-400",   border:"border-pink-400" },
  { label:"Rose",   dot:"bg-rose-400",   text:"text-rose-400",   border:"border-rose-400" },
  { label:"Slate",  dot:"bg-slate-400",  text:"text-slate-300",  border:"border-slate-400" },
];

// Platform colored dots
const PLATFORM_DOT: Record<string,string> = {
  "Instagram":   "bg-rose-500",
  "Facebook":    "bg-sky-500",
  "TikTok":      "bg-white",
  "LinkedIn":    "bg-blue-400",
  "X (Twitter)": "bg-slate-300",
};
const PLATFORM_LABEL: Record<string,string> = {
  "Instagram":"IG","Facebook":"FB","TikTok":"TT","LinkedIn":"LI","X (Twitter)":"X",
};

// Status dark-theme card styles
const STATUS_STYLE: Record<string,{card:string;dot:string;badge:string}> = {
  "Copies Written": { card:"bg-[#1a2030] border-slate-500 text-slate-200",    dot:"bg-slate-400",   badge:"bg-slate-600/60 text-slate-100" },
  "Designing":      { card:"bg-[#1a1535] border-purple-500 text-purple-200",  dot:"bg-purple-400",  badge:"bg-purple-700/60 text-purple-100" },
  "Needs Approval": { card:"bg-[#201a08] border-amber-500 text-amber-200",    dot:"bg-amber-400",   badge:"bg-amber-700/60 text-amber-100" },
  "Scheduled":      { card:"bg-[#081828] border-sky-500 text-sky-200",        dot:"bg-sky-400",     badge:"bg-sky-700/60 text-sky-100" },
  "Published":      { card:"bg-[#081a10] border-emerald-500 text-emerald-200",dot:"bg-emerald-400", badge:"bg-emerald-700/60 text-emerald-100" },
};
const getStatusStyle = (s:string) => STATUS_STYLE[s] || { card:"bg-[#1a1f2e] border-slate-600 text-slate-300", dot:"bg-slate-500", badge:"bg-slate-700/60 text-slate-200" };
const getStatusLight  = (s:string) => {
  switch(s){
    case "Copies Written":return "bg-slate-100 text-slate-700 border-slate-300";
    case "Designing":     return "bg-purple-100 text-purple-800 border-purple-300";
    case "Needs Approval":return "bg-amber-100 text-amber-800 border-amber-300";
    case "Scheduled":     return "bg-blue-100 text-blue-800 border-blue-300";
    case "Published":     return "bg-green-100 text-green-800 border-green-300";
    default:              return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// Base client accent colors (hardcoded)
const BASE_CLIENT_DOT:Record<string,string>    = { "Tag Express":"bg-orange-500","Mary Autopartes":"bg-blue-400","My Office CoWorking":"bg-teal-400","Repuestos El Eden":"bg-emerald-400","Huber Rent a Car":"bg-yellow-400","Rasheila Daniels":"bg-pink-400","David EST":"bg-slate-400","Pro-DG (Internal)":"bg-indigo-400","NRT":"bg-sky-400","Frozzzy Pop":"bg-cyan-400","SuperCargo":"bg-red-500" };
const BASE_CLIENT_TEXT:Record<string,string>   = { "Tag Express":"text-orange-400","Mary Autopartes":"text-blue-300","My Office CoWorking":"text-teal-300","Repuestos El Eden":"text-emerald-400","Huber Rent a Car":"text-yellow-300","Rasheila Daniels":"text-pink-400","David EST":"text-slate-300","Pro-DG (Internal)":"text-indigo-300","NRT":"text-sky-300","Frozzzy Pop":"text-cyan-300","SuperCargo":"text-red-400" };
const BASE_CLIENT_BORDER:Record<string,string> = { "Tag Express":"border-orange-500","Mary Autopartes":"border-blue-400","My Office CoWorking":"border-teal-400","Repuestos El Eden":"border-emerald-400","Huber Rent a Car":"border-yellow-400","Rasheila Daniels":"border-pink-400","David EST":"border-slate-400","Pro-DG (Internal)":"border-indigo-400","NRT":"border-sky-400","Frozzzy Pop":"border-cyan-400","SuperCargo":"border-red-500" };

const formatDateForInput = (d:Date) =>
  `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────
function AddClientModal({ isOpen, onClose, onAdd }:{ isOpen:boolean; onClose:()=>void; onAdd:(name:string, colorIdx:number)=>void; }) {
  const [name, setName]         = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  if (!isOpen) return null;
  const preview = COLOR_OPTIONS[colorIdx];
  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, colorIdx);
    setName("");
    setColorIdx(0);
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-[#0d1117] px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">+ Add New Client</h2>
          <button onClick={onClose} className="cursor-pointer text-white/30 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Client Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleSubmit(); }}
              placeholder="e.g. Acme Corp"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none focus:border-white/30 placeholder:text-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c,i)=>(
                <button key={i} type="button" onClick={()=>setColorIdx(i)}
                  title={c.label}
                  className={`cursor-pointer w-7 h-7 rounded-full ${c.dot} transition-all ${colorIdx===i?"ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-110":"opacity-60 hover:opacity-100"}`}/>
              ))}
            </div>
          </div>
          {name.trim() && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${preview.border} bg-white/3`}>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${preview.dot}`}></span>
              <span className={`font-black text-sm ${preview.text}`}>{name.trim()}</span>
              <span className="text-white/20 text-xs ml-auto">preview</span>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-white/8 flex justify-end gap-3">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 text-white/40 font-bold hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim()}
            className="cursor-pointer px-5 py-2 bg-white text-[#0d1117] font-black rounded-xl hover:bg-slate-100 transition-all active:scale-95 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── POST MODAL ───────────────────────────────────────────────────────────────
function PostModal({ isOpen,editId,formData,setFormData,isUploading,onSave,onDelete,onClose,onFileUpload,lockedClient,allClients,clientDot,onAddClientClick }:{
  isOpen:boolean;editId:string|null;formData:any;setFormData:(d:any)=>void;isUploading:boolean;
  onSave:(e:React.FormEvent)=>void;onDelete:()=>void;onClose:()=>void;
  onFileUpload:(e:React.ChangeEvent<HTMLInputElement>)=>void;lockedClient?:string;
  allClients:string[];clientDot:(name:string)=>string;onAddClientClick:()=>void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">

        <div className="bg-[#0d1117] text-white p-4 flex justify-between items-center border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-widest">{editId?"✏️ Edit Brief":"+ New Brief"}</h2>
          {editId && <button onClick={onDelete} className="cursor-pointer text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-all">Delete</button>}
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-h-0">
          <div className="flex-1 p-4 sm:p-5 border-r border-slate-200 bg-slate-50 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</label>
              {lockedClient ? (
                <div className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 bg-white flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${clientDot(lockedClient)}`}></span>{lockedClient}
                </div>
              ) : (
                <div className="flex gap-2">
                  <select value={formData.client_name} onChange={e=>setFormData({...formData,client_name:e.target.value})}
                    className="flex-1 border-2 border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-400 font-bold text-slate-800 bg-white">
                    {allClients.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={onAddClientClick}
                    title="Add new client"
                    className="cursor-pointer flex-shrink-0 w-10 h-10 mt-0.5 flex items-center justify-center rounded-xl bg-[#0d1117] text-white font-black text-lg hover:bg-slate-800 transition-all">
                    +
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Publish Date</label>
                <input type="date" required value={formData.publish_date} onChange={e=>setFormData({...formData,publish_date:e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-xl p-2 outline-none focus:border-indigo-400 font-bold text-slate-700"/>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</label>
                <input type="time" required value={formData.publish_time} onChange={e=>setFormData({...formData,publish_time:e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-xl p-2 outline-none focus:border-indigo-400 font-bold text-slate-700"/>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(plat=>{
                  const active=formData.platforms.includes(plat);
                  return (
                    <button type="button" key={plat}
                      onClick={()=>setFormData((p:any)=>({...p,platforms:p.platforms.includes(plat)?p.platforms.filter((x:string)=>x!==plat):[...p.platforms,plat]}))}
                      className={`cursor-pointer px-2.5 py-1.5 text-xs font-bold rounded-xl border-2 transition-all flex items-center gap-1.5 ${active?"bg-[#0d1117] text-white border-white/10":"bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${PLATFORM_DOT[plat]}`}></span>{plat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Format</label>
              <select value={formData.content_type} onChange={e=>setFormData({...formData,content_type:e.target.value})}
                className="w-full border-2 border-slate-200 rounded-xl p-2 outline-none focus:border-indigo-400 font-bold text-slate-700 bg-white">
                {CONTENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="bg-white p-3 rounded-xl border-2 border-slate-200">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Role Assignments</label>
              <div className="grid grid-cols-3 gap-2">
                {(["copywriter","designer","publisher"] as const).map(role=>(
                  <div key={role}>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 capitalize">{role}</label>
                    <select value={formData[role]} onChange={e=>setFormData({...formData,[role]:e.target.value})}
                      className="w-full border border-slate-200 rounded-lg p-1.5 outline-none text-xs font-bold bg-slate-50">
                      {ASSIGNEES.map(a=><option key={a} value={a}>{a.split(" ")[0]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 bg-white p-3 rounded-xl border-2 border-slate-200">
              {[{label:"📝 Copies",key:"copies_needed"},{label:"🎨 Designs",key:"designs_needed"}].map(({label,key})=>(
                <div key={key} className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                  <input type="number" min="0" value={formData[key]} onChange={e=>setFormData({...formData,[key]:parseInt(e.target.value)||0})}
                    className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-400 text-sm font-bold bg-slate-50"/>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pipeline Status</label>
              <select value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}
                className={`w-full border-2 rounded-xl p-2.5 outline-none font-bold ${getStatusLight(formData.status)}`}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-5 bg-white space-y-4 flex flex-col">
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Caption / Copy</label>
              <textarea value={formData.copy_text} onChange={e=>setFormData({...formData,copy_text:e.target.value})}
                placeholder="Write the caption here..." className="w-full flex-1 min-h-[120px] border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-400 text-sm resize-none"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Designer / Internal Notes</label>
              <textarea value={formData.internal_notes} onChange={e=>setFormData({...formData,internal_notes:e.target.value})}
                placeholder="E.g., Use the new logo." className="w-full h-20 border-2 border-amber-200 bg-amber-50 rounded-xl p-3 outline-none focus:border-amber-400 text-sm resize-none"/>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Assets</label>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2 w-fit">
                {isUploading?"Uploading...":"📁 Upload File"}
                <input type="file" className="hidden" onChange={onFileUpload} disabled={isUploading} accept="image/*,video/*"/>
              </label>
              {formData.media_urls.length>0 && (
                <div className="flex gap-2 flex-wrap mt-3 bg-slate-50 p-2 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {formData.media_urls.map((url:string,idx:number)=>(
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover hover:opacity-75 transition-opacity"/>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="cursor-pointer px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all">Cancel</button>
          <button onClick={onSave}  className="cursor-pointer px-5 py-2.5 bg-[#0d1117] text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95">Save Brief</button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT CALENDAR OVERLAY ──────────────────────────────────────────────────
function ClientCalendarOverlay({ client, onClose, onRefresh, clientDot, clientText, clientBorder, allClients, onAddClient }:{
  client:string; onClose:()=>void; onRefresh:()=>void;
  clientDot:(n:string)=>string; clientText:(n:string)=>string; clientBorder:(n:string)=>string;
  allClients:string[]; onAddClient:(name:string,colorIdx:number)=>void;
}) {
  const [calDate,setCalDate]   = useState(new Date());
  const [posts,setPosts]       = useState<any[]>([]);
  const [loading,setLoading]   = useState(true);
  const [isModalOpen,setIsModalOpen] = useState(false);
  const [isUploading,setIsUploading] = useState(false);
  const [editId,setEditId]     = useState<string|null>(null);
  const [rt,setRt]             = useState(0);
  const [isAddClientOpen,setIsAddClientOpen] = useState(false);

  const defaultForm = useCallback((date:Date=new Date())=>({
    client_name:client, publish_date:formatDateForInput(date), publish_time:"12:00",
    platforms:[] as string[], content_type:"Single Image", status:"Copies Written",
    copywriter:ASSIGNEES[0], designer:ASSIGNEES[0], publisher:ASSIGNEES[0],
    copies_needed:1, designs_needed:1, copy_text:"", internal_notes:"", media_urls:[] as string[],
  }),[client]);

  const [formData,setFormData] = useState(defaultForm());

  const yr=calDate.getFullYear(), mo=calDate.getMonth();
  const firstDay=new Date(yr,mo,1).getDay(), dim=new Date(yr,mo+1,0).getDate();
  const gridDays=Array.from({length:42},(_,i)=>{ const n=i-firstDay+1; return(n>0&&n<=dim)?new Date(yr,mo,n):null; });

  useEffect(()=>{ (async()=>{
    setLoading(true);
    const {data,error}=await supabase.from("content_calendar").select("*")
      .eq("client_name",client)
      .gte("publish_date",new Date(yr,mo,1).toISOString())
      .lte("publish_date",new Date(yr,mo+1,0,23,59,59).toISOString())
      .order("publish_date",{ascending:true});
    if(!error) setPosts(data||[]);
    setLoading(false);
  })();},[client,yr,mo,rt]);

  const total=posts.length, pub=posts.filter(p=>p.status==="Published").length,
    sched=posts.filter(p=>p.status==="Scheduled").length, appr=posts.filter(p=>p.status==="Needs Approval").length;

  const openNew=(date:Date=new Date())=>{ setEditId(null); setFormData(defaultForm(date)); setIsModalOpen(true); };
  const openEdit=(post:any,e?:React.MouseEvent)=>{ if(e) e.stopPropagation(); const d=new Date(post.publish_date); setEditId(post.id);
    setFormData({ client_name:client, publish_date:formatDateForInput(d),
      publish_time:d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false}),
      platforms:post.platforms||[], content_type:post.content_type||"Single Image",
      status:post.status||"Copies Written", copywriter:post.copywriter||ASSIGNEES[0],
      designer:post.designer||ASSIGNEES[0], publisher:post.publisher||ASSIGNEES[0],
      copies_needed:post.copies_needed||1, designs_needed:post.designs_needed||1,
      copy_text:post.copy_text||"", internal_notes:post.internal_notes||"", media_urls:post.media_urls||[],
    }); setIsModalOpen(true); };

  const handleSave=async(e:React.FormEvent)=>{ e.preventDefault(); try {
    const [y,m,d]=formData.publish_date.split("-"); const [h,mn]=formData.publish_time.split(":");
    const dt=new Date(+y,+m-1,+d,+h,+mn); const {publish_time,...rest}=formData;
    const payload={...rest,client_name:client,publish_date:dt.toISOString()};
    if(editId){const{error}=await supabase.from("content_calendar").update(payload).eq("id",editId);if(error)throw error;}
    else{const{error}=await supabase.from("content_calendar").insert([payload]);if(error)throw error;}
    setIsModalOpen(false); setRt(p=>p+1); onRefresh();
  } catch(err:any){ alert(`Error: ${err.message}`); }};

  const handleDelete=async()=>{ if(!confirm("Delete this brief?")) return;
    await supabase.from("content_calendar").delete().eq("id",editId);
    setIsModalOpen(false); setRt(p=>p+1); onRefresh(); };

  const handleFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{ const file=e.target.files?.[0]; if(!file) return;
    setIsUploading(true);
    const path=`${client.replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()}/${Date.now()}.${file.name.split(".").pop()}`;
    const{error}=await supabase.storage.from("agency_assets").upload(path,file);
    if(!error){const{data}=supabase.storage.from("agency_assets").getPublicUrl(path);setFormData((p:any)=>({...p,media_urls:[...p.media_urls,data.publicUrl]}))}
    else alert("Upload failed."); setIsUploading(false); };

  const handleAddClientHere=(name:string,colorIdx:number)=>{
    onAddClient(name,colorIdx);
    setIsAddClientOpen(false);
  };

  const accentBorder = clientBorder(client);
  const accentText   = clientText(client);
  const accentDot    = clientDot(client);

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col overflow-hidden">
      <AddClientModal isOpen={isAddClientOpen} onClose={()=>setIsAddClientOpen(false)} onAdd={handleAddClientHere}/>

      <div className={`bg-[#111827] border-b-2 ${accentBorder} flex-shrink-0`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="cursor-pointer flex items-center gap-2 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white font-bold px-3 sm:px-4 py-2 rounded-xl transition-all border border-white/10 text-sm">
                ← Back
              </button>
              <div>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-0.5">Content Calendar</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 shadow-lg ${accentDot}`}></span>
                  <h1 className={`text-xl sm:text-3xl font-black tracking-tight ${accentText}`}>{client}</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[{l:"Total",v:total,c:"text-white border-white/15 bg-white/5"},{l:"Published",v:pub,c:"text-emerald-400 border-emerald-500/30 bg-emerald-500/8"},{l:"Scheduled",v:sched,c:"text-sky-400 border-sky-500/30 bg-sky-500/8"},{l:"Approval",v:appr,c:"text-amber-400 border-amber-500/30 bg-amber-500/8"}].map(s=>(
                <div key={s.l} className={`border rounded-xl px-3 py-2 text-center min-w-[56px] ${s.c}`}>
                  <div className="text-lg sm:text-2xl font-black">{s.v}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button onClick={()=>setCalDate(new Date(yr,mo-1,1))} className="cursor-pointer px-2 sm:px-3 py-1.5 hover:bg-white/10 rounded-lg font-bold text-white transition-all text-sm">←</button>
                <span className="px-2 sm:px-3 font-black text-xs sm:text-sm text-white min-w-[90px] sm:min-w-[110px] text-center uppercase tracking-wider">
                  {calDate.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
                </span>
                <button onClick={()=>setCalDate(new Date(yr,mo+1,1))} className="cursor-pointer px-2 sm:px-3 py-1.5 hover:bg-white/10 rounded-lg font-bold text-white transition-all text-sm">→</button>
              </div>
              <button onClick={()=>openNew()}
                className="cursor-pointer px-3 sm:px-5 py-2 sm:py-2.5 bg-white text-[#0d1117] font-black rounded-xl hover:bg-slate-100 transition-all active:scale-95 text-xs sm:text-sm shadow-lg whitespace-nowrap">
                + New Brief
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl overflow-hidden border border-white/8 shadow-2xl">
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-7 bg-[#111827]">
                  {DAYS_OF_WEEK.map(d=>(
                    <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-white/40 border-r border-white/5 last:border-0">{d}</div>
                  ))}
                </div>
                {loading ? (
                  <div className="p-20 text-center font-bold text-white/20 animate-pulse bg-[#0d1117]">Loading {client} calendar...</div>
                ) : (
                  <div className="grid grid-cols-7 bg-white/5 gap-[1px]">
                    {gridDays.map((date,i)=>{
                      if(!date) return <div key={`e-${i}`} className="bg-[#090e18] min-h-[110px] sm:min-h-[140px]"/>;
                      const isToday=new Date().toDateString()===date.toDateString();
                      const dp=posts.filter(p=>new Date(p.publish_date).toDateString()===date.toDateString());
                      return (
                        <div key={i} onClick={()=>openNew(date)}
                          className={`bg-[#0d1117] min-h-[110px] sm:min-h-[140px] p-1.5 sm:p-2 flex flex-col group cursor-pointer hover:bg-[#111827] transition-colors ${isToday?"ring-inset ring-1 ring-white/25":""}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-black w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday?"bg-white text-[#0d1117]":"text-white/40 group-hover:text-white/70"} transition-colors`}>{date.getDate()}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-white/30 transition-opacity">+</span>
                          </div>
                          <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                            {dp.map(post=>{
                              const ss=getStatusStyle(post.status);
                              return (
                                <div key={post.id} onClick={e=>openEdit(post,e)}
                                  title={post.copy_text||"No caption yet"}
                                  className={`px-1.5 py-1 rounded-lg border-l-[3px] cursor-pointer hover:brightness-110 transition-all text-[9px] sm:text-[10px] leading-tight ${ss.card}`}>
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`}></span>
                                    <span className="font-black truncate opacity-90">{post.content_type||"Post"}</span>
                                  </div>
                                  {post.platforms?.length>0 && (
                                    <div className="flex gap-0.5 flex-wrap mb-0.5">
                                      {post.platforms.map((pl:string)=><span key={pl} title={pl} className={`inline-block w-2 h-2 rounded-full ${PLATFORM_DOT[pl]||"bg-white/30"}`}/>)}
                                    </div>
                                  )}
                                  <div className="opacity-55 truncate text-[8px] sm:text-[9px]">
                                    {post.copywriter&&<span>✍️{post.copywriter.split(" ")[0]} </span>}
                                    {post.designer&&post.designer!==post.copywriter&&<span>🎨{post.designer.split(" ")[0]}</span>}
                                  </div>
                                  <div className={`flex gap-1 mt-0.5 px-1 py-0.5 rounded w-fit text-[8px] font-bold ${ss.badge}`}>
                                    <span>📝{post.copies_needed||0}</span><span>🎨{post.designs_needed||0}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 justify-center items-center">
            {STATUSES.map(st=>{ const ss=getStatusStyle(st); return (
              <div key={st} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${ss.dot}`}></span>
                <span className="text-[10px] font-bold text-white/30">{st}</span>
              </div>
            );})}
            <span className="text-white/10 mx-1">|</span>
            {PLATFORMS.map(p=>(
              <div key={p} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${PLATFORM_DOT[p]}`}></span>
                <span className="text-[10px] font-bold text-white/25">{PLATFORM_LABEL[p]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PostModal isOpen={isModalOpen} editId={editId} formData={formData} setFormData={setFormData}
        isUploading={isUploading} onSave={handleSave} onDelete={handleDelete}
        onClose={()=>setIsModalOpen(false)} onFileUpload={handleFile} lockedClient={client}
        allClients={allClients} clientDot={clientDot} onAddClientClick={()=>setIsAddClientOpen(true)}/>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ContentCalendarPage() {
  const [activeTab,setActiveTab] = useState<"Dashboard"|"Calendar">("Dashboard");
  const [rt,setRt]               = useState(0);
  const router                   = useRouter();
  const [isAuth,setIsAuth]       = useState(false);
  const [activeClient,setActiveClient] = useState<string|null>(null);

  // Dynamic client lists + color maps
  const [allClients,setAllClients]           = useState<string[]>(BASE_CLIENTS);
  const [clientDotMap,setClientDotMap]       = useState<Record<string,string>>(BASE_CLIENT_DOT);
  const [clientTextMap,setClientTextMap]     = useState<Record<string,string>>(BASE_CLIENT_TEXT);
  const [clientBorderMap,setClientBorderMap] = useState<Record<string,string>>(BASE_CLIENT_BORDER);
  const [isAddClientOpen,setIsAddClientOpen] = useState(false);

  const clientDot    = (n:string) => clientDotMap[n]    || "bg-slate-400";
  const clientText   = (n:string) => clientTextMap[n]   || "text-white";
  const clientBorder = (n:string) => clientBorderMap[n] || "border-slate-600";

  const loadCustomClients = async () => {
    const{data}=await supabase.from("custom_clients").select("*").order("created_at",{ascending:true});
    if(!data) return;
    const dotMap:Record<string,string>    = {...BASE_CLIENT_DOT};
    const textMap:Record<string,string>   = {...BASE_CLIENT_TEXT};
    const borderMap:Record<string,string> = {...BASE_CLIENT_BORDER};
    data.forEach((r:any)=>{ dotMap[r.name]=r.dot; textMap[r.name]=r.text; borderMap[r.name]=r.border; });
    const customNames = data.map((r:any)=>r.name).filter((n:string)=>!BASE_CLIENTS.includes(n));
    setAllClients([...BASE_CLIENTS,...customNames]);
    setClientDotMap(dotMap);
    setClientTextMap(textMap);
    setClientBorderMap(borderMap);
  };

  const handleAddClient = async(name:string,colorIdx:number)=>{
    const color=COLOR_OPTIONS[colorIdx];
    await supabase.from("custom_clients").upsert([{name,dot:color.dot,text:color.text,border:color.border}],{onConflict:"name"});
    setIsAddClientOpen(false);
    await loadCustomClients();
    setRt(p=>p+1);
  };

  useEffect(()=>{ supabase.auth.getSession().then(({data:{session}})=>{ if(!session) router.push("/login"); else setIsAuth(true); }); },[router]);
  useEffect(()=>{ loadCustomClients(); },[]);

  const [dashOpt,setDashOpt]    = useState("This Month");
  const [dashStart,setDashStart] = useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [dashEnd,setDashEnd]     = useState(new Date(new Date().getFullYear(),new Date().getMonth()+1,0));
  const [dashPosts,setDashPosts] = useState<any[]>([]);
  const [dashLoad,setDashLoad]   = useState(true);
  const [calDate,setCalDate]     = useState(new Date());
  const [calPosts,setCalPosts]   = useState<any[]>([]);
  const [calLoad,setCalLoad]     = useState(true);
  const [isModalOpen,setIsModalOpen]   = useState(false);
  const [isUploading,setIsUploading]   = useState(false);
  const [editId,setEditId]             = useState<string|null>(null);
  const [formData,setFormData]         = useState({
    client_name:BASE_CLIENTS[0], publish_date:formatDateForInput(new Date()), publish_time:"12:00",
    platforms:[] as string[], content_type:"Single Image", status:"Copies Written",
    copywriter:ASSIGNEES[0], designer:ASSIGNEES[0], publisher:ASSIGNEES[0],
    copies_needed:1, designs_needed:1, copy_text:"", internal_notes:"", media_urls:[] as string[],
  });

  useEffect(()=>{ (async()=>{
    setDashLoad(true);
    const s=new Date(dashStart); s.setHours(0,0,0,0);
    const e=new Date(dashEnd);   e.setHours(23,59,59,999);
    const{data,error}=await supabase.from("content_calendar").select("*")
      .gte("publish_date",s.toISOString()).lte("publish_date",e.toISOString())
      .order("publish_date",{ascending:true});
    if(!error) setDashPosts(data||[]); setDashLoad(false);
  })();},[dashStart,dashEnd,rt]);

  useEffect(()=>{ (async()=>{
    setCalLoad(true);
    const y=calDate.getFullYear(),m=calDate.getMonth();
    const{data,error}=await supabase.from("content_calendar").select("*")
      .gte("publish_date",new Date(y,m,1).toISOString())
      .lte("publish_date",new Date(y,m+1,0,23,59,59).toISOString())
      .order("publish_date",{ascending:true});
    if(!error) setCalPosts(data||[]); setCalLoad(false);
  })();},[calDate,rt]);

  const changeDateOpt=(e:React.ChangeEvent<HTMLSelectElement>)=>{
    const opt=e.target.value; setDashOpt(opt);
    const t=new Date(),ts=new Date(t.getFullYear(),t.getMonth(),t.getDate());
    if(opt==="Today"||opt==="Specific Date"){setDashStart(ts);setDashEnd(ts);}
    else if(opt==="Yesterday"){const y=new Date(ts);y.setDate(y.getDate()-1);setDashStart(y);setDashEnd(y);}
    else if(opt==="This Week"){const w=new Date(ts);w.setDate(w.getDate()-w.getDay());const we=new Date(w);we.setDate(we.getDate()+6);setDashStart(w);setDashEnd(we);}
    else if(opt==="This Month"){setDashStart(new Date(ts.getFullYear(),ts.getMonth(),1));setDashEnd(new Date(ts.getFullYear(),ts.getMonth()+1,0));}
    else if(opt==="All"){setDashStart(new Date(2020,0,1));setDashEnd(new Date(2030,11,31));}
  };

  const year=calDate.getFullYear(),month=calDate.getMonth();
  const firstDay=new Date(year,month,1).getDay(),dim=new Date(year,month+1,0).getDate();
  const gridDays=Array.from({length:42},(_,i)=>{ const n=i-firstDay+1; return(n>0&&n<=dim)?new Date(year,month,n):null; });

  const openNew=(date:Date=new Date())=>{ setEditId(null); setFormData({
    client_name:allClients[0]||BASE_CLIENTS[0], publish_date:formatDateForInput(date), publish_time:"12:00",
    platforms:[], content_type:"Single Image", status:"Copies Written",
    copywriter:ASSIGNEES[0], designer:ASSIGNEES[0], publisher:ASSIGNEES[0],
    copies_needed:1, designs_needed:1, copy_text:"", internal_notes:"", media_urls:[],
  }); setIsModalOpen(true); };

  const openEdit=(post:any,e?:React.MouseEvent)=>{ if(e) e.stopPropagation(); const d=new Date(post.publish_date); setEditId(post.id);
    setFormData({ client_name:post.client_name, publish_date:formatDateForInput(d),
      publish_time:d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false}),
      platforms:post.platforms||[], content_type:post.content_type||"Single Image",
      status:post.status||"Copies Written", copywriter:post.copywriter||ASSIGNEES[0],
      designer:post.designer||ASSIGNEES[0], publisher:post.publisher||ASSIGNEES[0],
      copies_needed:post.copies_needed||1, designs_needed:post.designs_needed||1,
      copy_text:post.copy_text||"", internal_notes:post.internal_notes||"", media_urls:post.media_urls||[],
    }); setIsModalOpen(true); };

  const handleSave=async(e:React.FormEvent)=>{ e.preventDefault(); try{
    const[y,m,d]=formData.publish_date.split("-");const[h,mn]=formData.publish_time.split(":");
    const dt=new Date(+y,+m-1,+d,+h,+mn);const{publish_time,...rest}=formData;
    const payload={...rest,publish_date:dt.toISOString()};
    if(editId){const{error}=await supabase.from("content_calendar").update(payload).eq("id",editId);if(error)throw error;}
    else{const{error}=await supabase.from("content_calendar").insert([payload]);if(error)throw error;}
    setIsModalOpen(false);setRt(p=>p+1);
  }catch(err:any){alert(`Error: ${err.message}`);}};

  const handleDelete=async()=>{ if(!confirm("Delete this brief?")) return;
    await supabase.from("content_calendar").delete().eq("id",editId);
    setIsModalOpen(false);setRt(p=>p+1); };

  const handleFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{ const file=e.target.files?.[0];if(!file)return;
    setIsUploading(true);
    const path=`${formData.client_name.replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()}/${Date.now()}.${file.name.split(".").pop()}`;
    const{error}=await supabase.storage.from("agency_assets").upload(path,file);
    if(!error){const{data}=supabase.storage.from("agency_assets").getPublicUrl(path);setFormData((p:any)=>({...p,media_urls:[...p.media_urls,data.publicUrl]}))}
    else alert("Upload failed.");setIsUploading(false); };

  const activeClients=Array.from(new Set(dashPosts.map(p=>p.client_name)));

  if(!isAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <span className="text-white/30 font-black uppercase tracking-widest text-sm animate-pulse">Verifying access...</span>
    </div>
  );

  return (
    <>
      <AddClientModal isOpen={isAddClientOpen} onClose={()=>setIsAddClientOpen(false)} onAdd={handleAddClient}/>

      {activeClient && (
        <ClientCalendarOverlay
          client={activeClient} onClose={()=>setActiveClient(null)}
          onRefresh={()=>{ loadCustomClients(); setRt(p=>p+1); }}
          clientDot={clientDot} clientText={clientText} clientBorder={clientBorder}
          allClients={allClients} onAddClient={handleAddClient}
        />
      )}

      <div className="min-h-screen bg-[#0d1117]">

        {/* TOP NAV */}
        <div className="bg-[#111827] border-b border-white/8 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
            <img src="/logo.png" alt="Pro-DG" className="h-18 w-auto object-contain"/>
            <div className="flex bg-[#0d1117] p-1 rounded-xl border border-white/10">
              {(["Dashboard","Calendar"] as const).map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)}
                  className={`cursor-pointer px-4 sm:px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab===tab?"bg-white text-[#0d1117] shadow":"text-white/35 hover:text-white/70"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={async()=>{await supabase.auth.signOut();router.push("/login");}}
                className="cursor-pointer px-3 py-2 text-white/35 font-bold hover:text-white transition-all text-sm">
                Log Out
              </button>
              <button onClick={()=>setIsAddClientOpen(true)}
                className="cursor-pointer px-3 py-2 text-white/50 font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm hidden sm:block">
                + Client
              </button>
              <button onClick={()=>openNew()}
                className="cursor-pointer px-4 py-2 bg-white text-[#0d1117] font-black rounded-xl hover:bg-slate-100 transition-all active:scale-95 text-sm shadow-lg">
                + New Brief
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-3 sm:p-6">

          {/* ══ DASHBOARD ══ */}
          {activeTab==="Dashboard" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-[#111827] border border-white/8 rounded-xl p-3 flex-wrap">
                <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">Date Range</span>
                <select value={dashOpt} onChange={changeDateOpt}
                  className="cursor-pointer text-xs font-black text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg outline-none transition-all uppercase tracking-wider flex-1 sm:flex-none">
                  {["Today","Yesterday","Specific Date","This Week","This Month","All","Custom Date"].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                {dashOpt==="Specific Date" && (
                  <input type="date" value={formatDateForInput(dashStart)} onChange={e=>{ if(e.target.value){const[y,m,d]=e.target.value.split("-");const o=new Date(+y,+m-1,+d);setDashStart(o);setDashEnd(o);}}}
                    className="text-xs font-black text-white bg-white/5 border border-white/10 px-2 py-1.5 rounded-lg outline-none flex-1 sm:flex-none"/>
                )}
                {dashOpt==="Custom Date" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={formatDateForInput(dashStart)} onChange={e=>setDashStart(new Date(e.target.value))}
                      className="text-xs font-black text-white bg-white/5 border border-white/10 px-2 py-1.5 rounded-lg outline-none flex-1"/>
                    <span className="text-white/20 font-bold">—</span>
                    <input type="date" value={formatDateForInput(dashEnd)} onChange={e=>setDashEnd(new Date(e.target.value))}
                      className="text-xs font-black text-white bg-white/5 border border-white/10 px-2 py-1.5 rounded-lg outline-none flex-1"/>
                  </div>
                )}
              </div>

              {dashLoad ? (
                <div className="p-20 text-center font-bold text-white/20 animate-pulse">Loading metrics...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {STATUSES.map(status=>{ const ss=getStatusStyle(status); const cnt=dashPosts.filter(p=>p.status===status).length; return (
                      <div key={status} className={`p-4 rounded-xl border-l-4 ${ss.card}`}>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{status}</div>
                        <div className="text-3xl font-black">{cnt}</div>
                        <div className="text-[10px] opacity-30 font-semibold">Briefs</div>
                      </div>
                    );})}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    <div className="bg-[#111827] rounded-xl border border-white/8 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Agent Workload Pipeline</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[360px]">
                          <thead><tr className="border-b border-white/5">
                            <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider">Member</th>
                            <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider text-center">Copies 📝</th>
                            <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider text-center">Designs 🎨</th>
                            <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider text-center">Published 🚀</th>
                          </tr></thead>
                          <tbody>
                            {ASSIGNEES.map(agent=>{
                              const cp=dashPosts.filter(p=>p.copywriter===agent&&(!p.status||p.status==="Ideation")).reduce((s,p)=>s+(p.copies_needed||0),0);
                              const cd=dashPosts.filter(p=>p.copywriter===agent&&p.status&&p.status!=="Ideation").reduce((s,p)=>s+(p.copies_needed||0),0);
                              const dp=dashPosts.filter(p=>p.designer===agent&&["Ideation","Copies Written","Designing"].includes(p.status)).reduce((s,p)=>s+(p.designs_needed||0),0);
                              const dd=dashPosts.filter(p=>p.designer===agent&&["Needs Approval","Scheduled","Published"].includes(p.status)).reduce((s,p)=>s+(p.designs_needed||0),0);
                              const pb=dashPosts.filter(p=>p.publisher===agent&&p.status==="Published").length;
                              if(cp+cd+dp+dd+pb===0) return null;
                              return (
                                <tr key={agent} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3 font-bold text-white text-sm">{agent.split(" ")[0]}</td>
                                  <td className="p-3 text-center"><span className="font-black text-white">{cd}</span><span className="text-[9px] text-white/25 ml-1">/{cp}p</span></td>
                                  <td className="p-3 text-center"><span className="font-black text-white">{dd}</span><span className="text-[9px] text-white/25 ml-1">/{dp}p</span></td>
                                  <td className="p-3 text-center font-black text-emerald-400">{pb}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-[#111827] rounded-xl border border-white/8 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Client Metrics</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-white/20 font-bold">Click a client → open their calendar</span>
                          <button onClick={()=>setIsAddClientOpen(true)}
                            className="cursor-pointer text-[9px] font-black text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg transition-all">
                            + Add Client
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-[280px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[320px]">
                            <thead><tr className="border-b border-white/5 sticky top-0 bg-[#111827]">
                              <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider">Client</th>
                              <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider text-center">Total</th>
                              <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider text-center">Approval</th>
                              <th className="p-3 text-[9px] font-black text-white/25 uppercase tracking-wider text-center">Published</th>
                            </tr></thead>
                            <tbody>
                              {activeClients.length===0 ? (
                                <tr><td colSpan={4} className="p-6 text-center text-white/20 font-bold text-sm">No data for this range.</td></tr>
                              ) : activeClients.map(cl=>{
                                const cp=dashPosts.filter(p=>p.client_name===cl);
                                const na=cp.filter(p=>p.status==="Needs Approval").length;
                                const pb=cp.filter(p=>p.status==="Published").length;
                                return (
                                  <tr key={cl} onClick={()=>setActiveClient(cl)}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="p-3 text-sm font-bold">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${clientDot(cl)}`}></span>
                                        <span className={`${clientText(cl)} group-hover:brightness-125 transition-all`}>{cl}</span>
                                        <span className="hidden sm:inline opacity-0 group-hover:opacity-100 text-[9px] text-white/25 transition-opacity">→</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center font-black text-white">{cp.length}</td>
                                    <td className="p-3 text-center font-bold text-amber-400">{na>0?na:<span className="text-white/15">—</span>}</td>
                                    <td className="p-3 text-center font-bold text-emerald-400">{pb>0?pb:<span className="text-white/15">—</span>}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ CALENDAR ══ */}
          {activeTab==="Calendar" && (
            <div className="mt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <div className="flex items-center bg-[#111827] border border-white/10 rounded-xl p-1">
                  <button onClick={()=>setCalDate(new Date(year,month-1,1))} className="cursor-pointer px-3 py-1.5 hover:bg-white/10 rounded-lg font-bold text-white transition-all text-sm">←</button>
                  <span className="px-4 font-black text-white uppercase tracking-wider text-sm min-w-[130px] sm:min-w-[160px] text-center">
                    {calDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                  </span>
                  <button onClick={()=>setCalDate(new Date(year,month+1,1))} className="cursor-pointer px-3 py-1.5 hover:bg-white/10 rounded-lg font-bold text-white transition-all text-sm">→</button>
                </div>
                <button onClick={()=>setCalDate(new Date())}
                  className="cursor-pointer px-4 py-2 text-xs font-bold text-white/40 bg-[#111827] border border-white/10 hover:bg-white/10 rounded-xl transition-all">
                  Today
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/8 shadow-2xl">
                <div className="overflow-x-auto">
                  <div className="min-w-[560px]">
                    <div className="grid grid-cols-7 bg-[#111827]">
                      {DAYS_OF_WEEK.map(d=>(
                        <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-white/35 border-r border-white/5 last:border-0">{d}</div>
                      ))}
                    </div>
                    {calLoad ? (
                      <div className="p-20 text-center font-bold text-white/20 animate-pulse bg-[#0d1117]">Loading...</div>
                    ) : (
                      <div className="grid grid-cols-7 bg-white/5 gap-[1px]">
                        {gridDays.map((date,i)=>{
                          if(!date) return <div key={`e-${i}`} className="bg-[#090e18] min-h-[120px] sm:min-h-[140px]"/>;
                          const isToday=new Date().toDateString()===date.toDateString();
                          const dp=calPosts.filter(p=>new Date(p.publish_date).toDateString()===date.toDateString());
                          return (
                            <div key={i} onClick={()=>openNew(date)}
                              className={`bg-[#0d1117] min-h-[120px] sm:min-h-[140px] p-1.5 sm:p-2 flex flex-col group cursor-pointer hover:bg-[#111827] transition-colors ${isToday?"ring-inset ring-1 ring-white/20":""}`}>
                              <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-xs font-black w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday?"bg-white text-[#0d1117]":"text-white/35 group-hover:text-white/65"} transition-colors`}>
                                  {date.getDate()}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-white/25 transition-opacity">+</span>
                              </div>
                              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                                {dp.map(post=>{
                                  const ss=getStatusStyle(post.status);
                                  const dot=clientDot(post.client_name);
                                  const ct=clientText(post.client_name);
                                  return (
                                    <div key={post.id}
                                      title={post.copy_text||"No caption"}
                                      className={`px-1.5 py-1 rounded-lg border-l-[3px] text-[9px] sm:text-[10px] leading-tight flex flex-col gap-0.5 ${ss.card}`}>
                                      <div className="flex items-center justify-between gap-0.5">
                                        <button onClick={e=>{e.stopPropagation();setActiveClient(post.client_name);}}
                                          className={`font-black truncate hover:underline flex items-center gap-1 cursor-pointer ${ct}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`}></span>
                                          <span className="truncate">{post.client_name}</span>
                                        </button>
                                        <button onClick={e=>openEdit(post,e)}
                                          className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold flex-shrink-0 hover:brightness-125 transition-all ${ss.badge}`}>
                                          📝{post.copies_needed||0} 🎨{post.designs_needed||0}
                                        </button>
                                      </div>
                                      {post.platforms?.length>0 && (
                                        <div className="flex gap-0.5">
                                          {post.platforms.map((pl:string)=><span key={pl} title={pl} className={`inline-block w-1.5 h-1.5 rounded-full ${PLATFORM_DOT[pl]||"bg-white/30"}`}/>)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 justify-center">
                {STATUSES.map(st=>{ const ss=getStatusStyle(st); return (
                  <div key={st} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ss.dot}`}></span>
                    <span className="text-[10px] font-bold text-white/25">{st}</span>
                  </div>
                );})}
              </div>
            </div>
          )}
        </div>
      </div>

      <PostModal isOpen={isModalOpen} editId={editId} formData={formData} setFormData={setFormData}
        isUploading={isUploading} onSave={handleSave} onDelete={handleDelete}
        onClose={()=>setIsModalOpen(false)} onFileUpload={handleFile}
        allClients={allClients} clientDot={clientDot} onAddClientClick={()=>setIsAddClientOpen(true)}/>
    </>
  );
}
import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const API="http://localhost:5000/api";

function App(){
 const [view,setView]=useState("manager");
 const [outlets,setOutlets]=useState([]);
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [selected,setSelected]=useState("");
 const [file,setFile]=useState(null);
 const [submissions,setSubmissions]=useState([]);
 const [code,setCode]=useState("");
 const [name,setName]=useState("");
 const [editCode,setEditCode]=useState(null);
 const [message,setMessage]=useState("");

 async function loadOutlets(){
   const r=await fetch(`${API}/outlets`); const d=await r.json(); setOutlets(d);
   if(!selected&&d[0])setSelected(d[0].code);
 }
 async function loadSubmissions(){
   const r=await fetch(`${API}/submissions?date=${date}`); setSubmissions(await r.json());
 }
 useEffect(()=>{loadOutlets()},[]);
 useEffect(()=>{loadSubmissions()},[date]);

 async function submit(){
   if(!selected||!file)return setMessage("Outlet ও Photo নির্বাচন করুন।");
   const fd=new FormData(); fd.append("outletCode",selected);fd.append("date",date);fd.append("photo",file);
   const r=await fetch(`${API}/submissions`,{method:"POST",body:fd}); const d=await r.json();
   setMessage(d.message||"Display submitted");setFile(null);loadSubmissions();
 }
 async function saveOutlet(){
   if(!code||!name)return setMessage("Outlet Code ও Name দিন");
   const url=editCode?`${API}/outlets/${editCode}`:`${API}/outlets`;
   const r=await fetch(url,{method:editCode?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,name})});
   const d=await r.json();setMessage(d.message||"Saved");setCode("");setName("");setEditCode(null);loadOutlets();
 }
 async function removeOutlet(c){
   if(!confirm(`${c} outlet deactivate করবেন?`))return;
   await fetch(`${API}/outlets/${c}`,{method:"DELETE"});loadOutlets();
 }
 const submittedCodes=new Set(submissions.map(x=>x.outletCode));
 return <div>
  <header><h1>Outlet Display Monitoring</h1><p>Frontend + Backend Full Stack</p></header>
  <main>
   <nav>
    <button className={view==="manager"?"active":""} onClick={()=>setView("manager")}>Manager</button>
    <button className={view==="zonal"?"active":""} onClick={()=>setView("zonal")}>Zonal Sir</button>
    <button className={view==="outlets"?"active":""} onClick={()=>setView("outlets")}>Outlet Management</button>
   </nav>
   {message&&<div className="message">{message}</div>}
   {view==="manager"&&<section className="card">
    <h2>Display Submit</h2>
    <label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
    <label>Outlet</label><select value={selected} onChange={e=>setSelected(e.target.value)}>{outlets.map(o=><option key={o.code} value={o.code}>{o.code} — {o.name}</option>)}</select>
    <label>Display Photo</label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/>
    <button className="primary" onClick={submit}>Submit Display</button>
   </section>}
   {view==="zonal"&&<section>
    <div className="card"><h2>Zonal Sir Dashboard</h2><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
    <div className="stats"><b>Total: {outlets.length}</b><b>Submitted: {submittedCodes.size}</b><b>Pending: {outlets.length-submittedCodes.size}</b></div></div>
    <div className="grid">{outlets.map(o=>{const s=submissions.find(x=>x.outletCode===o.code);return <div className="outlet" key={o.code}><h3>{o.name}</h3><small>{o.code}</small><p className={s?"ok":"pending"}>{s?"Submitted":"Pending"}</p>{s&&<img src={`${API.replace("/api","")}${s.photoUrl}`} />}</div>})}</div>
   </section>}
   {view==="outlets"&&<section>
    <div className="card"><h2>Outlet Management</h2><div className="formrow"><input placeholder="Outlet Code" value={code} onChange={e=>setCode(e.target.value)}/><input placeholder="Outlet Name" value={name} onChange={e=>setName(e.target.value)}/><button className="primary" onClick={saveOutlet}>{editCode?"Update":"Add Outlet"}</button></div></div>
    <div className="card"><div className="grid">{outlets.map(o=><div className="outlet" key={o.code}><h3>{o.name}</h3><small>{o.code}</small><div><button onClick={()=>{setEditCode(o.code);setCode(o.code);setName(o.name)}}>Edit</button> <button className="danger" onClick={()=>removeOutlet(o.code)}>Delete</button></div></div>)}</div></div>
   </section>}
  </main>
 </div>
}
createRoot(document.getElementById("root")).render(<App/>);
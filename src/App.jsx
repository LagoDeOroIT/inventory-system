import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

const styles = {
  app:{display:"flex",fontFamily:"'Inter',system-ui",background:"#f8fafc",minHeight:"100vh"},
  sidebar:{width:250,background:"#020617",color:"#fff",padding:20},
  logo:{fontSize:22,fontWeight:800,marginBottom:30},
  nav:(a)=>({padding:"12px 14px",borderRadius:10,background:a?"#1e293b":"transparent",border:"none",color:"#fff",width:"100%",textAlign:"left",fontWeight:600,cursor:"pointer",marginBottom:6}),
  main:{flex:1,padding:28},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},
  h1:{margin:0,fontSize:26,fontWeight:800},
  select:{padding:"10px 14px",borderRadius:10,border:"1px solid #cbd5e1"},
  btn:{background:"#020617",color:"#fff",padding:"10px 16px",borderRadius:10,border:"none",fontWeight:600,cursor:"pointer"},
  card:{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 6px 20px rgba(0,0,0,.06)"},
  table:{width:"100%",borderCollapse:"collapse"},
  th:{padding:12,fontSize:12,textTransform:"uppercase",letterSpacing:.7,color:"#475569",borderBottom:"2px solid #e5e7eb",textAlign:"left"},
  td:{padding:12,borderBottom:"1px solid #e5e7eb"},
  modalBg:{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center"},
  modal:{background:"#fff",padding:24,borderRadius:16,width:520},
  grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
  input:{padding:12,borderRadius:10,border:"1px solid #cbd5e1"}
};

export default function App(){
  const [session,setSession]=useState(null);
  const [rooms,setRooms]=useState([]);
  const [room,setRoom]=useState("");
  const [items,setItems]=useState([]);
  const [tx,setTx]=useState([]);
  const [deleted,setDeleted]=useState([]);
  const [tab,setTab]=useState("stock");
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({item_id:"",type:"IN",quantity:"",unit_price:"",date:"",brand:"",unit:"",volume_pack:""});

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>l.subscription.unsubscribe();
  },[]);

  useEffect(()=>{ if(session) loadRooms(); },[session]);
  useEffect(()=>{ if(room) loadData(room); },[room]);

  async function loadRooms(){
    const {data}=await supabase.from("stock_rooms").select("*");
    setRooms(data||[]);
    if(data?.length) setRoom(data[0].id);
  }

  async function loadData(id){
    const {data:i}=await supabase.from("items").select("*").eq("stock_room_id",id);
    const {data:t}=await supabase.from("inventory_transactions").select("*,items(item_name)").eq("stock_room_id",id).eq("deleted",false).order("date",{ascending:false});
    const {data:d}=await supabase.from("inventory_transactions").select("*,items(item_name)").eq("stock_room_id",id).eq("deleted",true).order("deleted_at",{ascending:false});
    setItems(i||[]); setTx(t||[]); setDeleted(d||[]);
  }

  const stock = items.map(i=>{
    const rel=tx.filter(t=>t.item_id===i.id);
    const qty=rel.reduce((s,t)=>s+(t.type==="IN"?+t.quantity:-t.quantity),0);
    return {...i,stock:qty};
  });

  const monthly = tx.reduce((acc,t)=>{
    const m=t.date?.slice(0,7);
    if(!m) return acc;
    if(!acc[m]) acc[m]={in:0,out:0,value:0};
    if(t.type==="IN") acc[m].in+=+t.quantity;
    else{acc[m].out+=+t.quantity;acc[m].value+=t.quantity*t.unit_price;}
    return acc;
  },{});

  async function save(){
    if(!form.item_id||!form.quantity||!form.unit_price||!form.date) return alert("Fill all required fields");
    await supabase.from("inventory_transactions").insert([{...form,stock_room_id:room}]);
    setShow(false); loadData(room);
  }

  if(!session) return (
    <div style={{padding:80,textAlign:"center"}}>
      <h2>Enterprise Inventory Login</h2>
      <button style={styles.btn} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  return(
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Lago De Oro</div>
        <button style={styles.nav(tab==="stock")} onClick={()=>setTab("stock")}>📦 Stock</button>
        <button style={styles.nav(tab==="tx")} onClick={()=>setTab("tx")}>📄 Transactions</button>
        <button style={styles.nav(tab==="deleted")} onClick={()=>setTab("deleted")}>🗑 Deleted</button>
        <button style={styles.nav(tab==="report")} onClick={()=>setTab("report")}>📊 Monthly Report</button>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.h1}>Inventory System</h1>
          <div style={{display:"flex",gap:12}}>
            <select style={styles.select} value={room} onChange={e=>setRoom(e.target.value)}>
              {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button style={styles.btn} onClick={()=>setShow(true)}>+ Transaction</button>
          </div>
        </div>

        <div style={styles.card}>
          {tab==="stock" && <StockTable data={stock}/>}
          {tab==="tx" && <TxTable data={tx}/>}
          {tab==="deleted" && <DeletedTable data={deleted}/>}
          {tab==="report" && <ReportTable data={monthly}/>}
        </div>
      </main>

      {show && (
        <div style={styles.modalBg} onClick={()=>setShow(false)}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <h3>Add Transaction</h3>
            <div style={styles.grid}>
              <select style={styles.input} onChange={e=>setForm({...form,item_id:e.target.value})}>
                <option value="">Select Item</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
              </select>
              <select style={styles.input} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="IN">IN</option><option value="OUT">OUT</option>
              </select>
              <input style={styles.input} placeholder="Quantity" type="number" onChange={e=>setForm({...form,quantity:e.target.value})}/>
              <input style={styles.input} placeholder="Unit Price" type="number" onChange={e=>setForm({...form,unit_price:e.target.value})}/>
              <input style={styles.input} type="date" onChange={e=>setForm({...form,date:e.target.value})}/>
              <input style={styles.input} placeholder="Brand" onChange={e=>setForm({...form,brand:e.target.value})}/>
              <input style={styles.input} placeholder="Unit" onChange={e=>setForm({...form,unit:e.target.value})}/>
              <input style={styles.input} placeholder="Pack" onChange={e=>setForm({...form,volume_pack:e.target.value})}/>
            </div>
            <div style={{marginTop:16,textAlign:"right"}}>
              <button style={styles.btn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StockTable=({data})=>(
<table style={styles.table}>
<thead><tr><th style={styles.th}>Item</th><th style={styles.th}>Stock</th><th style={styles.th}>Unit Price</th><th style={styles.th}>Value</th></tr></thead>
<tbody>{data.map(i=><tr key={i.id}><td style={styles.td}>{i.item_name}</td><td style={styles.td}>{i.stock}</td><td style={styles.td}>₱{i.unit_price}</td><td style={styles.td}>₱{(i.stock*i.unit_price).toFixed(2)}</td></tr>)}</tbody>
</table>
);

const TxTable=({data})=>(
<table style={styles.table}>
<thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Item</th><th style={styles.th}>Type</th><th style={styles.th}>Qty</th><th style={styles.th}>Price</th></tr></thead>
<tbody>{data.map(t=><tr key={t.id}><td style={styles.td}>{t.date}</td><td style={styles.td}>{t.items?.item_name}</td><td style={styles.td}>{t.type}</td><td style={styles.td}>{t.quantity}</td><td style={styles.td}>₱{t.unit_price}</td></tr>)}</tbody>
</table>
);

const DeletedTable=({data})=>(
<table style={styles.table}>
<thead><tr><th style={styles.th}>Deleted</th><th style={styles.th}>Item</th><th style={styles.th}>Qty</th></tr></thead>
<tbody>{data.map(t=><tr key={t.id}><td style={styles.td}>{t.deleted_at}</td><td style={styles.td}>{t.items?.item_name}</td><td style={styles.td}>{t.quantity}</td></tr>)}</tbody>
</table>
);

const ReportTable=({data})=>(
<table style={styles.table}>
<thead><tr><th style={styles.th}>Month</th><th style={styles.th}>IN</th><th style={styles.th}>OUT</th><th style={styles.th}>Cost</th></tr></thead>
<tbody>{Object.keys(data).sort((a,b)=>b.localeCompare(a)).map(m=><tr key={m}><td style={styles.td}>{m}</td><td style={styles.td}>{data[m].in}</td><td style={styles.td}>{data[m].out}</td><td style={styles.td}>₱{data[m].value.toFixed(2)}</td></tr>)}</tbody>
</table>
);

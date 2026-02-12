import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container:{padding:24,fontFamily:"Inter, Arial",background:"#f8fafc",minHeight:"100vh"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},
  h1:{margin:0,fontSize:26,fontWeight:700},
  sub:{color:"#6b7280",fontSize:13},
  card:{background:"#fff",borderRadius:12,boxShadow:"0 4px 12px rgba(0,0,0,.05)",padding:16,marginBottom:20},
  tabs:{display:"flex",gap:12,marginBottom:20},
  tab:(a)=>({padding:"8px 16px",borderRadius:999,background:a?"#0f172a":"#e5e7eb",color:a?"#fff":"#334155",border:"none",fontWeight:600,cursor:"pointer"}),
  button:{background:"#0f172a",color:"#fff",padding:"10px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600},
  input:{padding:10,borderRadius:8,border:"1px solid #cbd5f5",width:"100%"},
  table:{width:"100%",borderCollapse:"collapse"},
  th:{padding:10,borderBottom:"2px solid #e5e7eb",textAlign:"left",fontWeight:700},
  td:{padding:10,borderBottom:"1px solid #e5e7eb"},
  modalBg:{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999},
  modal:{background:"#fff",padding:24,borderRadius:14,width:480},
  grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}
};

// ================= MAIN =================
export default function App(){
  const [session,setSession]=useState(null);
  const [stockRooms,setStockRooms]=useState([]);
  const [selectedRoom,setSelectedRoom]=useState("");
  const [items,setItems]=useState([]);
  const [transactions,setTransactions]=useState([]);
  const [deleted,setDeleted]=useState([]);
  const [tab,setTab]=useState("stock");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({item_id:"",type:"IN",quantity:"",unit_price:"",date:"",brand:"",unit:"",volume_pack:""});

  // ================= AUTH =================
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:listener}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  // ================= LOAD DATA =================
  async function loadAll(){
    const {data:rooms}=await supabase.from("stock_rooms").select("*").order("name");
    setStockRooms(rooms||[]);
    if(!selectedRoom && rooms?.length) setSelectedRoom(rooms[0].id);
  }

  async function loadData(roomId){
    const {data:items}=await supabase.from("items").select("*").eq("stock_room_id",roomId);
    const {data:tx}=await supabase.from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("stock_room_id",roomId)
      .eq("deleted",false)
      .order("date",{ascending:false});

    const {data:del}=await supabase.from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("stock_room_id",roomId)
      .eq("deleted",true)
      .order("deleted_at",{ascending:false});

    setItems(items||[]);
    setTransactions(tx||[]);
    setDeleted(del||[]);
  }

  useEffect(()=>{ if(session) loadAll(); },[session]);
  useEffect(()=>{ if(selectedRoom) loadData(selectedRoom); },[selectedRoom]);

  // ================= CALCULATIONS =================
  const stock=items.map(i=>{
    const rel=transactions.filter(t=>t.item_id===i.id);
    const qty=rel.reduce((s,t)=>s+(t.type==="IN"?+t.quantity:-t.quantity),0);
    return {...i,stock:qty};
  });

  const monthly=transactions.reduce((acc,t)=>{
    const m=t.date?.slice(0,7);
    if(!m) return acc;
    if(!acc[m]) acc[m]={in:0,out:0,value:0};
    if(t.type==="IN") acc[m].in+=+t.quantity;
    else {acc[m].out+=+t.quantity; acc[m].value+=t.quantity*t.unit_price;}
    return acc;
  },{});

  async function saveTx(){
    if(!form.item_id||!form.quantity||!form.unit_price||!form.date) return alert("Fill required fields");
    await supabase.from("inventory_transactions").insert([{...form,stock_room_id:selectedRoom}]);
    setShowForm(false);
    setForm({item_id:"",type:"IN",quantity:"",unit_price:"",date:"",brand:"",unit:"",volume_pack:""});
    loadData(selectedRoom);
  }

  if(!session) return (
    <div style={{padding:60,textAlign:"center"}}>
      <h2>Inventory Login</h2>
      <button style={styles.button} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  return(
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Lago De Oro Inventory</h1>
          <div style={styles.sub}>Professional Multi-Stockroom Management</div>
        </div>

        <div style={{display:"flex",gap:12}}>
          <select value={selectedRoom} onChange={e=>setSelectedRoom(e.target.value)} style={styles.input}>
            {stockRooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button style={styles.button} onClick={()=>setShowForm(true)}>+ Transaction</button>
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        <button style={styles.tab(tab==="stock")} onClick={()=>setTab("stock")}>📦 Stock</button>
        <button style={styles.tab(tab==="tx")} onClick={()=>setTab("tx")}>📄 Transactions</button>
        <button style={styles.tab(tab==="deleted")} onClick={()=>setTab("deleted")}>🗑 Deleted</button>
        <button style={styles.tab(tab==="report")} onClick={()=>setTab("report")}>📊 Monthly Report</button>
      </div>

      {/* STOCK */}
      {tab==="stock" && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Pack</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Unit Price</th>
                <th style={styles.th}>Value</th>
              </tr>
            </thead>
            <tbody>
              {stock.map(i=>(
                <tr key={i.id} style={i.stock<=5?{background:"#fee2e2"}:{}}>
                  <td style={styles.td}>{i.item_name}</td>
                  <td style={styles.td}>{i.brand}</td>
                  <td style={styles.td}>{i.volume_pack}</td>
                  <td style={styles.td}>{i.stock}</td>
                  <td style={styles.td}>₱{i.unit_price}</td>
                  <td style={styles.td}>₱{(i.stock*i.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSACTIONS */}
      {tab==="tx" && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t=>(
                <tr key={t.id}>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>{t.items?.item_name}</td>
                  <td style={styles.td}>{t.type}</td>
                  <td style={styles.td}>{t.quantity}</td>
                  <td style={styles.td}>₱{t.unit_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DELETED */}
      {tab==="deleted" && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Deleted At</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {deleted.map(t=>(
                <tr key={t.id}>
                  <td style={styles.td}>{t.deleted_at}</td>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>{t.items?.item_name}</td>
                  <td style={styles.td}>{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORT */}
      {tab==="report" && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Total IN</th>
                <th style={styles.th}>Total OUT</th>
                <th style={styles.th}>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthly).sort((a,b)=>b.localeCompare(a)).map(m=>(
                <tr key={m}>
                  <td style={styles.td}>{m}</td>
                  <td style={styles.td}>{monthly[m].in}</td>
                  <td style={styles.td}>{monthly[m].out}</td>
                  <td style={styles.td}>₱{monthly[m].value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div style={styles.modalBg} onClick={()=>setShowForm(false)}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <h3>Add Transaction</h3>

            <div style={styles.grid}>
              <select style={styles.input} onChange={e=>setForm({...form,item_id:e.target.value})}>
                <option value="">Select Item</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
              </select>

              <select style={styles.input} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>

              <input style={styles.input} placeholder="Quantity" type="number" onChange={e=>setForm({...form,quantity:e.target.value})}/>
              <input style={styles.input} placeholder="Unit Price" type="number" onChange={e=>setForm({...form,unit_price:e.target.value})}/>
              <input style={styles.input} type="date" onChange={e=>setForm({...form,date:e.target.value})}/>
              <input style={styles.input} placeholder="Brand" onChange={e=>setForm({...form,brand:e.target.value})}/>
              <input style={styles.input} placeholder="Unit" onChange={e=>setForm({...form,unit:e.target.value})}/>
              <input style={styles.input} placeholder="Pack" onChange={e=>setForm({...form,volume_pack:e.target.value})}/>
            </div>

            <div style={{marginTop:16,textAlign:"right"}}>
              <button style={styles.button} onClick={saveTx}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

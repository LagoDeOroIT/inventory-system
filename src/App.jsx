import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", fontFamily: "Inter, Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6" },
  sidebar: { width: 220, background: "#111827", color: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  sidebarHeader: { fontSize: 20, fontWeight: 700, marginBottom: 24 },
  sidebarSelect: { marginBottom: 24, padding: 8, borderRadius: 6, border: "none", width: "100%" },
  sidebarTabs: { display: "flex", flexDirection: "column", gap: 12 },
  tabButton: (active) => ({ padding: 10, borderRadius: 6, background: active ? "#1f2937" : "transparent", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }),
  main: { flex: 1, padding: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#111827" },
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, transition:"all 0.2s ease" },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, transition:"all 0.2s ease" },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top:0, left:0, width:"100%", height:"100%", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 8, width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #d1d5db" },
  toggleGroup: { display:"flex", gap:12, marginBottom:12 },
  toggleButton: (active)=>({
    flex:1,
    padding:"8px 0",
    borderRadius:6,
    border: active?"none":"1px solid #d1d5db",
    background: active?"#1f2937":"#fff",
    color: active?"#fff":"#374151",
    cursor:"pointer",
    fontWeight:600
  }),
  newOptionButton: { padding:"12px 0", marginBottom:12, borderRadius:8, border:"none", width:"100%", cursor:"pointer", fontWeight:600, fontSize:16, transition:"all 0.2s ease" },
};

// ================= EMPTY ROW =================
const emptyRow = (colSpan, text) => (
  <tr><td colSpan={colSpan} style={styles.emptyRow}>{text}</td></tr>
);

// ================= CONFIRM MODAL =================
function ConfirmModal({ show, title, message, confirmLabel="Confirm", confirmColor="#f87171", onConfirm, onCancel }) {
  if(!show) return null;
  return (
    <div style={{...styles.modalOverlay, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", background:"rgba(0,0,0,0.35)"}} onClick={onCancel}>
      <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
        <h3 style={{marginBottom:12}}>{title}</h3>
        <p style={{marginBottom:24, color:"#374151"}}>{message}</p>
        <div style={{display:"flex", justifyContent:"flex-end", gap:12}}>
          <button style={{padding:"10px 18px", borderRadius:8, fontWeight:600, cursor:"pointer", border:"none", background:"#e5e7eb", color:"#374151"}} onClick={onCancel}>Cancel</button>
          <button style={{padding:"10px 18px", borderRadius:8, fontWeight:600, cursor:"pointer", border:"none", background:confirmColor, color:"#fff"}} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ================= APP =================
export default function App() {
  const [session,setSession] = useState(null);
  const [items,setItems] = useState([]);
  const [transactions,setTransactions] = useState([]);
  const [activeTab,setActiveTab] = useState("stock");
  const [selectedStockRoom,setSelectedStockRoom] = useState("");
  const [inSearch,setInSearch] = useState("");
  const [showModal,setShowModal] = useState(false);
  const [modalType,setModalType] = useState(""); 
  const [form,setForm] = useState({ date:"", item_id:"", brand:"", type:"IN", quantity:"", price:"", item_name:"", id:null });
  const [confirmData,setConfirmData] = useState({ show:false });

  const stockRooms = ["L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"];

  // ================= AUTH =================
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data} = supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>data.subscription.unsubscribe();
  },[]);

  // ================= LOAD DATA =================
  async function loadData(){
    const {data: itemsData} = await supabase.from("items").select("*");
    const {data: tx} = await supabase.from("inventory_transactions").select("*, items(item_name, brand, unit_price)").order("date",{ascending:false});
    setItems(itemsData||[]);
    setTransactions(tx||[]);
  }
  useEffect(()=>{ if(session) loadData(); },[session]);

  // ================= HELPERS =================
  const filteredTransactions = transactions.filter(t=>!selectedStockRoom || t.location===selectedStockRoom);
  const stockInventory = items.filter(i=>!i.deleted).map(i=>{
    const related = transactions.filter(t=>t.item_id===i.id && !t.deleted);
    const stock = related.reduce((sum,t)=>sum+(t.type==="IN"?Number(t.quantity):-Number(t.quantity)),0);
    return {...i, stock};
  });
  const deletedItems = items.filter(i=>i.deleted);
  const deletedTransactions = transactions.filter(t=>t.deleted);
  const handleFormChange = (key,value)=>setForm(prev=>({...prev,[key]:value}));

  const confirmAction = ({ title, message, confirmColor="#f87171", onConfirm })=>{
    setConfirmData({ show:true, title, message, confirmColor, onConfirm: ()=>{ onConfirm(); setConfirmData({show:false}); } });
  };

  if(!session) return (
    <div style={{padding:40,textAlign:"center"}}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  // ================= MODAL SUBMIT HANDLER =================
  const handleSubmit = async () => {
    if(modalType==="item"){
      if(!form.item_name || !form.brand || !form.price) return alert("Fill required fields");
      if(form.id){
        confirmAction({
          title:"Confirm Edit",
          message:`Save changes to "${form.item_name}"?`,
          onConfirm: async ()=>{
            await supabase.from("items").update({item_name:form.item_name, brand:form.brand, unit_price:Number(form.price)}).eq("id",form.id);
            setShowModal(false); loadData();
          }
        });
      } else {
        await supabase.from("items").insert([{item_name:form.item_name, brand:form.brand, unit_price:Number(form.price), location:selectedStockRoom}]);
        setShowModal(false); loadData();
      }
    }
    if(modalType==="transaction"){
      if(!form.item_id || !form.quantity || !form.date) return alert("Fill required fields");
      if(form.id){
        confirmAction({
          title:"Confirm Edit",
          message:"Save changes to this transaction?",
          onConfirm: async ()=>{
            await supabase.from("inventory_transactions").update({
              date: form.date,
              item_id: form.item_id,
              brand: form.brand,
              type: form.type,
              quantity: Number(form.quantity),
              unit_price: items.find(i=>i.id===form.item_id)?.unit_price || 0
            }).eq("id", form.id);
            setShowModal(false); loadData();
          }
        });
      } else {
        await supabase.from("inventory_transactions").insert([{
          date: form.date,
          item_id: form.item_id,
          brand: form.brand,
          type: form.type,
          quantity: Number(form.quantity),
          location: selectedStockRoom,
          unit_price: items.find(i=>i.id===form.item_id)?.unit_price || 0
        }]);
        setShowModal(false); loadData();
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock Inventory</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
            <button style={styles.tabButton(activeTab==="deleted")} onClick={()=>setActiveTab("deleted")}>🗑️ Deleted History</button>
          </div>
        </div>
        <button style={styles.buttonPrimary} onClick={()=>{ setModalType("newOption"); setShowModal(true); }}>+ New</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div style={styles.title}>{activeTab==="stock"?"Stock Inventory":activeTab==="transactions"?"Transactions":"Deleted History"}</div>
        </div>

        {/* ================= TABS ================= */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Stock</th>
                  <th style={styles.thtd}>Item Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length===0 && emptyRow(5,"No stock data")}
                {stockInventory.map(i=>(
                  <tr key={i.id}>
                    <td style={styles.thtd}>{i.stock}</td>
                    <td style={styles.thtd}>{i.item_name}</td>
                    <td style={styles.thtd}>{i.brand}</td>
                    <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                    <td style={styles.thtd}>
                      <button style={{...styles.buttonSecondary, marginRight:8}} onClick={()=>{setForm({id:i.id, item_name:i.item_name, brand:i.brand, price:i.unit_price}); setModalType("item"); setShowModal(true);}}>Edit</button>
                      <button style={{...styles.buttonSecondary, background:"#f87171", color:"#fff"}} onClick={()=>{confirmAction({title:"Delete Item", message:`Delete "${i.item_name}"?`, onConfirm: async()=>{await supabase.from("items").update({deleted:true}).eq("id",i.id); loadData();}});}}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="transactions" && (
          <div style={styles.card}>
            <input style={styles.input} placeholder="Search..." value={inSearch} onChange={e=>setInSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).length===0 && emptyRow(6,"No transactions")}
                {filteredTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).map(t=>(
                  <tr key={t.id}>
                    <td style={styles.thtd}>{t.date}</td>
                    <td style={styles.thtd}>{t.items?.item_name}</td>
                    <td style={styles.thtd}>{t.items?.brand}</td>
                    <td style={styles.thtd}>{t.type}</td>
                    <td style={styles.thtd}>{t.quantity}</td>
                    <td style={styles.thtd}>
                      <button style={{...styles.buttonSecondary, marginRight:8}} onClick={()=>{setForm({id:t.id,date:t.date,item_id:t.item_id,brand:t.brand,type:t.type,quantity:t.quantity}); setModalType("transaction"); setShowModal(true);}}>Edit</button>
                      <button style={{...styles.buttonSecondary, background:"#f87171", color:"#fff"}} onClick={()=>{confirmAction({title:"Delete Transaction", message:`Delete transaction for "${t.items?.item_name}"?`, onConfirm: async()=>{await supabase.from("inventory_transactions").update({deleted:true}).eq("id",t.id); loadData();}});}}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h3>Deleted Items</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.length===0 && emptyRow(4,"No deleted items")}
                {deletedItems.map(i=>(
                  <tr key={i.id}>
                    <td style={styles.thtd}>{i.item_name}</td>
                    <td style={styles.thtd}>{i.brand}</td>
                    <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                    <td style={styles.thtd}>
                      <button style={{...styles.buttonSecondary, background:"#34d399", color:"#fff", marginRight:8}} onClick={()=>{confirmAction({title:"Restore Item", message:`Restore "${i.item_name}"?`, onConfirm: async()=>{await supabase.from("items").update({deleted:false}).eq("id",i.id); loadData();}});}}>Restore</button>
                      <button style={{...styles.buttonSecondary, background:"#f87171", color:"#fff"}} onClick={()=>{confirmAction({title:"Delete Permanently", message:`Permanently delete "${i.item_name}"? This cannot be undone.`, onConfirm: async()=>{await supabase.from("items").delete().eq("id",i.id); loadData();}});}}>Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{marginTop:24}}>Deleted Transactions</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                                    <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.length===0 && emptyRow(6,"No deleted transactions")}
                {deletedTransactions.map(t=>(
                  <tr key={t.id}>
                    <td style={styles.thtd}>{t.date}</td>
                    <td style={styles.thtd}>{t.items?.item_name}</td>
                    <td style={styles.thtd}>{t.items?.brand}</td>
                    <td style={styles.thtd}>{t.type}</td>
                    <td style={styles.thtd}>{t.quantity}</td>
                    <td style={styles.thtd}>
                      <button
                        style={{...styles.buttonSecondary, background:"#34d399", color:"#fff", marginRight:8}}
                        onClick={()=>{confirmAction({
                          title:"Restore Transaction",
                          message:`Restore transaction for "${t.items?.item_name}"?`,
                          onConfirm: async()=>{await supabase.from("inventory_transactions").update({deleted:false}).eq("id",t.id); loadData();}
                        })}}
                      >Restore</button>
                      <button
                        style={{...styles.buttonSecondary, background:"#f87171", color:"#fff"}}
                        onClick={()=>{confirmAction({
                          title:"Delete Transaction Permanently",
                          message:`Permanently delete transaction for "${t.items?.item_name}"? This cannot be undone.`,
                          onConfirm: async()=>{await supabase.from("inventory_transactions").delete().eq("id",t.id); loadData();}
                        })}}
                      >Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= NEW / EDIT MODAL ================= */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={()=>setShowModal(false)}>
            <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
              {modalType==="newOption" && (
                <>
                  <h3>What do you want to add?</h3>
                  <button style={{...styles.newOptionButton, background:"#1f2937", color:"#fff"}} onClick={()=>setModalType("item")}>Add New Item</button>
                  <button style={{...styles.newOptionButton, background:"#e5e7eb", color:"#374151"}} onClick={()=>setModalType("transaction")}>Add New Transaction</button>
                  <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                </>
              )}

              {modalType==="item" && (
                <>
                  <h3>{form.id?"Edit Item":"New Item"}</h3>
                  <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name",e.target.value)} />
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand",e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange("price",e.target.value)} />
                  <div style={{display:"flex", justifyContent:"flex-end", gap:12}}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id?"Save Changes":"Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}

              {modalType==="transaction" && (
                <>
                  <h3>{form.id?"Edit Transaction":"New Transaction"}</h3>
                  <input style={styles.input} type="date" value={form.date} onChange={e=>handleFormChange("date",e.target.value)} />
                  <input style={styles.input} list="items-list" placeholder="Select Item" value={form.item_id} onChange={e=>handleFormChange("item_id",e.target.value)} />
                  <datalist id="items-list">{items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}</datalist>
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand",e.target.value)} />
                  <div style={styles.toggleGroup}>
                    <button style={styles.toggleButton(form.type==="IN")} onClick={()=>handleFormChange("type","IN")}>IN</button>
                    <button style={styles.toggleButton(form.type==="OUT")} onClick={()=>handleFormChange("type","OUT")}>OUT</button>
                  </div>
                  <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e=>handleFormChange("quantity",e.target.value)} />
                  <div style={{display:"flex", justifyContent:"flex-end", gap:12}}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id?"Save Changes":"Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= CONFIRM MODAL ================= */}
        <ConfirmModal
          show={confirmData.show}
          title={confirmData.title}
          message={confirmData.message}
          confirmColor={confirmData.confirmColor}
          onConfirm={confirmData.onConfirm}
          onCancel={()=>setConfirmData({show:false})}
        />
      </div>
    </div>
  );
}


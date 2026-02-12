import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= DEFAULT FORM =================
const defaultForm = {
  item_id: "",
  type: "IN",
  quantity: "",
  unit_price: "",
  date: "",
  brand: "",
  unit: "",
  volume_pack: ""
};

// ================= MAIN APP =================
export default function App() {

  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deleted, setDeleted] = useState([]);

  const [activeTab, setActiveTab] = useState("stock");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [itemSearch, setItemSearch] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(defaultForm);

  const stockRooms = [
    "All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3",
    "L2 Room 4","L3","L5","L6","L7","Maintenance Bodega 1",
    "Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  const [stockRoom, setStockRoom] = useState(stockRooms[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadData(); }, [session]);

  async function loadData() {
    const { data: i } = await supabase.from("items").select("*");
    const { data: t } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", false);
    const { data: d } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", true);
    setItems(i || []);
    setTransactions(t || []);
    setDeleted(d || []);
  }

  async function saveTransaction() {
    if (!form.item_id || !form.quantity || !form.date) return alert("Fill all required fields");
    if (editingId) {
      await supabase.from("inventory_transactions").update(form).eq("id", editingId);
    } else {
      await supabase.from("inventory_transactions").insert([form]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
    loadData();
  }

  const stockInventory = items.map(i => {
    const tx = transactions.filter(t => t.item_id === i.id);
    const stock = tx.reduce((s, t) => s + (t.type === "IN" ? +t.quantity : -t.quantity), 0);
    const last = tx[tx.length - 1];
    return {
      ...i,
      stock,
      brand: last?.brand || i.brand || "",
      unit_price: last?.unit_price || i.unit_price || 0,
      volume_pack: last?.volume_pack || ""
    };
  });

  if (!session) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h2>Lago De Oro Inventory</h2>
          <button style={styles.loginBtn} onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Lago De Oro Inventory System</h2>
        <select value={stockRoom} onChange={e => setStockRoom(e.target.value)}>
          {stockRooms.map(r => <option key={r}>{r}</option>)}
        </select>
      </header>

      <nav style={styles.tabs}>
        {["stock","transactions","deleted"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={activeTab===t?styles.tabActive:styles.tab}>
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      <main style={styles.card}>

        {activeTab === "stock" && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Item</th><th>Brand</th><th>Volume</th><th>Stock</th><th>Unit Price</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.map(i => (
                <tr key={i.id} style={i.stock<=5?{background:"#fee2e2"}:{}}>
                  <td>{i.item_name}</td>
                  <td>{i.brand}</td>
                  <td>{i.volume_pack}</td>
                  <td>{i.stock}</td>
                  <td>₱{Number(i.unit_price).toFixed(2)}</td>
                  <td>₱{(i.stock*i.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "transactions" && (
          <>
            <button style={styles.addButton} onClick={() => setShowForm(true)}>➕ New Transaction</button>
            <input style={styles.input} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Price</th></tr>
              </thead>
              <tbody>
                {transactions.filter(t =>
                  t.items?.item_name?.toLowerCase().includes(search.toLowerCase())
                ).map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.items?.item_name}</td>
                    <td>{t.type}</td>
                    <td>{t.quantity}</td>
                    <td>₱{t.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === "deleted" && (
          <table style={styles.table}>
            <thead>
              <tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th></tr>
            </thead>
            <tbody>
              {deleted.map(t => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.items?.item_name}</td>
                  <td>{t.type}</td>
                  <td>{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </main>

      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>

            <div style={styles.modalHeader}>
              <h3>New Transaction</h3>
              <button style={styles.closeBtn} onClick={()=>setShowForm(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.grid}>
                <div>
                  <label>Item</label>
                  <input list="items" style={styles.input} placeholder="Search..." value={itemSearch}
                    onChange={e=>{
                      const v=e.target.value;
                      setItemSearch(v);
                      const found=items.find(i=>i.item_name===v);
                      if(found) setForm({...form,item_id:found.id});
                    }} />
                  <datalist id="items">
                    {items.map(i=><option key={i.id} value={i.item_name} />)}
                  </datalist>
                </div>

                <div>
                  <label>Type</label>
                  <div style={styles.toggleWrap}>
                    <button style={form.type==="IN"?styles.toggleActive:styles.toggle} onClick={()=>setForm({...form,type:"IN"})}>IN</button>
                    <button style={form.type==="OUT"?styles.toggleDanger:styles.toggle} onClick={()=>setForm({...form,type:"OUT"})}>OUT</button>
                  </div>
                </div>

                <div>
                  <label>Quantity</label>
                  <input type="number" style={styles.input} value={form.quantity}
                    onChange={e=>setForm({...form,quantity:e.target.value})}/>
                </div>

                <div>
                  <label>Unit Price</label>
                  <input type="number" style={styles.input} value={form.unit_price}
                    onChange={e=>setForm({...form,unit_price:e.target.value})}/>
                </div>

                <div>
                  <label>Date</label>
                  <input type="date" style={styles.input} value={form.date}
                    onChange={e=>setForm({...form,date:e.target.value})}/>
                </div>

                <div>
                  <label>Brand</label>
                  <input style={styles.input} value={form.brand}
                    onChange={e=>setForm({...form,brand:e.target.value})}/>
                </div>

                <div>
                  <label>Unit</label>
                  <input style={styles.input} value={form.unit}
                    onChange={e=>setForm({...form,unit:e.target.value})}/>
                </div>

                <div>
                  <label>Volume / Pack</label>
                  <input style={styles.input} value={form.volume_pack}
                    onChange={e=>setForm({...form,volume_pack:e.target.value})}/>
                </div>

              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={()=>setShowForm(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={saveTransaction}>Save</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ================= PROFESSIONAL STYLES =================
const styles = {

container:{ background:"#f8fafc", minHeight:"100vh", padding:20, fontFamily:"Inter, system-ui" },

header:{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff", padding:"14px 20px", borderRadius:10, marginBottom:12 },

tabs:{ display:"flex", gap:12, marginBottom:12 },

tab:{ padding:"10px 18px", background:"#e5e7eb", border:0, borderRadius:8, fontWeight:600, cursor:"pointer" },

tabActive:{ padding:"10px 18px", background:"#2563eb", color:"#fff", border:0, borderRadius:8, fontWeight:600 },

card:{ background:"#fff", borderRadius:12, padding:16, boxShadow:"0 6px 15px rgba(0,0,0,.08)" },

table:{ width:"100%", borderCollapse:"collapse" },

input:{ width:"100%", padding:10, borderRadius:8, border:"1px solid #d1d5db" },

addButton:{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", padding:"10px 18px", border:0, borderRadius:8, fontWeight:600, cursor:"pointer", marginBottom:12 },

modalOverlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },

modalBox:{ width:720, background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,.25)" },

modalHeader:{ padding:"14px 20px", background:"#f8fafc", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" },

modalBody:{ padding:20 },

modalFooter:{ padding:16, background:"#f8fafc", borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"flex-end", gap:12 },

grid:{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 },

toggleWrap:{ display:"flex", border:"1px solid #d1d5db", borderRadius:8, overflow:"hidden" },

toggle:{ flex:1, padding:10, border:0, background:"#fff", cursor:"pointer" },

toggleActive:{ flex:1, padding:10, border:0, background:"#2563eb", color:"#fff", fontWeight:600 },

toggleDanger:{ flex:1, padding:10, border:0, background:"#ef4444", color:"#fff", fontWeight:600 },

saveBtn:{ background:"#2563eb", color:"#fff", border:0, borderRadius:8, padding:"10px 22px", fontWeight:600, cursor:"pointer" },

cancelBtn:{ background:"#e5e7eb", border:0, borderRadius:8, padding:"10px 22px", fontWeight:600, cursor:"pointer" },

closeBtn:{ background:"transparent", border:0, fontSize:18, cursor:"pointer", color:"#6b7280" },

loginPage:{ minHeight:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#f1f5f9" },

loginCard:{ background:"#fff", padding:40, borderRadius:12, boxShadow:"0 10px 30px rgba(0,0,0,.15)", textAlign:"center" },

loginBtn:{ background:"#2563eb", color:"#fff", border:0, borderRadius:8, padding:"10px 24px", fontWeight:600, cursor:"pointer" }

};

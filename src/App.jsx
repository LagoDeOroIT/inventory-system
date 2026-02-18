// ================= FULL INVENTORY APP CODE (READY TO PASTE) =================

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
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 8, width: 420, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #d1d5db" },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active) => ({ flex: 1, padding: "8px 0", borderRadius: 6, border: active ? "none" : "1px solid #d1d5db", background: active ? "#1f2937" : "#fff", color: active ? "#fff" : "#374151", cursor: "pointer", fontWeight: 600 }),
  newOptionButton: { padding: "12px 0", marginBottom: 12, borderRadius: 8, border: "none", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: 16 }
};

// ================= EMPTY ROW =================
const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

export default function App() {

  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalTypeBeforeItem, setModalTypeBeforeItem] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [inSearch, setInSearch] = useState("");

  const [form, setForm] = useState({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
  const [brandConfirmData, setBrandConfirmData] = useState(null);

  // AUTH FORM
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const stockRooms = ["L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!authEmail || !authPassword) return alert("Fill email and password");
    const result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (result.error) alert(result.error.message);
  };

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price, location)")
      .order("date", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= FORM CHANGE =================
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };

      // Item selection
      if (key === "item_name") {
        const sameItems = items.filter(i => i.item_name === value && i.location === selectedStockRoom);
        if (sameItems.length === 1) {
          updated.item_id = sameItems[0].id;
          updated.brand = sameItems[0].brand;
          updated.price = sameItems[0].unit_price;
        } else {
          updated.item_id = "";
          updated.brand = "";
        }
      }

      // Brand selection
      if (key === "brand") {
        const selected = items.find(i => i.item_name === updated.item_name && i.brand === value && i.location === selectedStockRoom);
        if (selected) {
          updated.item_id = selected.id;
          updated.price = selected.unit_price;
        }
      }

      return updated;
    });
  };

  // ================= DUPLICATE CHECK =================
  const checkDuplicateItemBrand = (name, brand) => {
    return items.some(i => i.item_name === name && i.brand === brand && i.location === selectedStockRoom);
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {

    // TRANSACTION
    if(modalType === "transaction"){
      const sameName = items.filter(i => i.item_name === form.item_name && i.location === selectedStockRoom);
      const exact = sameName.find(i => i.brand === form.brand);

      if(sameName.length > 0 && !exact){
        setBrandConfirmData(form);
        setModalType("confirmNewBrand");
        return;
      }

      await supabase.from("inventory_transactions").insert([{ 
        date: form.date,
        item_id: form.item_id,
        brand: form.brand,
        type: form.type,
        quantity: Number(form.quantity),
        location: selectedStockRoom,
        unit_price: Number(form.price || 0)
      }]);

      setShowModal(false);
      setForm({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
      loadData();
    }

    // ITEM CREATION
    if(modalType === "item"){
      if(checkDuplicateItemBrand(form.item_name, form.brand)){
        alert("This item + brand already exists in this stock room!");
        return;
      }

      const { data } = await supabase.from("items").insert([{ 
        item_name: form.item_name,
        brand: form.brand,
        unit_price: Number(form.price),
        location: selectedStockRoom
      }]);

      if(data?.length && modalTypeBeforeItem === "transaction"){
        setForm(prev => ({ ...prev, item_id: data[0].id }));
        setModalType("transaction");
        return;
      }

      setShowModal(false);
      setForm({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
      loadData();
    }
  };

  // ================= AUTH SCREEN =================
  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <input style={styles.input} placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
      <button style={styles.buttonPrimary} onClick={handleAuth}>Login</button>
    </div>
  );

  // ================= MAIN UI =================
  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r => <option key={r}>{r}</option>)}
          </select>
          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
          </div>
        </div>

        <div>
          <button style={styles.buttonPrimary} onClick={()=>{ setModalType("transaction"); setShowModal(true); }}>+ New Transaction</button>
          <button style={{...styles.buttonSecondary, marginTop:8}} onClick={()=>{ setModalType("item"); setShowModal(true); }}>+ New Item</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff", marginTop:8}} onClick={async ()=>{ await supabase.auth.signOut(); setSession(null); }}>Logout</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* TRANSACTIONS TAB */}
        {activeTab==="transactions" && (
          <div style={styles.card}>
            <input style={styles.input} placeholder="Search item..." value={inSearch} onChange={e=>setInSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t=>t.items?.item_name?.toLowerCase().includes(inSearch.toLowerCase())).map(t => (
                  <tr key={t.id}>
                    <td style={styles.thtd}>{t.date}</td>
                    <td style={styles.thtd}>{t.items?.item_name}</td>
                    <td style={styles.thtd}>{t.items?.brand}</td>
                    <td style={styles.thtd}>{t.type}</td>
                    <td style={styles.thtd}>{t.quantity}</td>
                    <td style={styles.thtd}>₱{((t.quantity||0)*(t.unit_price||0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={()=>setShowModal(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>

            {/* TRANSACTION MODAL */}
            {modalType === "transaction" && (
              <>
                <h3>New Transaction</h3>
                <input style={styles.input} type="date" value={form.date} onChange={e=>handleFormChange("date", e.target.value)} />

                <select style={styles.input} value={form.item_name} onChange={e=>handleFormChange("item_name", e.target.value)}>
                  <option value="">Select Item</option>
                  {[...new Set(items.filter(i=>i.location===selectedStockRoom).map(i=>i.item_name))].map(n=> <option key={n}>{n}</option>)}
                </select>

                {form.item_name && (
                  <select style={styles.input} value={form.brand} onChange={e=>handleFormChange("brand", e.target.value)}>
                    <option value="">Select Brand</option>
                    {items.filter(i=>i.item_name===form.item_name && i.location===selectedStockRoom).map(i=> <option key={i.id}>{i.brand}</option>)}
                  </select>
                )}

                <div style={styles.toggleGroup}>
                  <button style={styles.toggleButton(form.type==="IN")} onClick={()=>handleFormChange("type","IN")}>IN</button>
                  <button style={styles.toggleButton(form.type==="OUT")} onClick={()=>handleFormChange("type","OUT")}>OUT</button>
                </div>

                <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e=>handleFormChange("quantity", e.target.value)} />
                <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange("price", e.target.value)} />

                <button style={styles.buttonPrimary} onClick={handleSubmit}>Submit</button>
              </>
            )}

            {/* ITEM MODAL */}
            {modalType === "item" && (
              <>
                <h3>New Item</h3>
                <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name", e.target.value)} />
                <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand", e.target.value)} />
                <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange("price", e.target.value)} />
                <button style={styles.buttonPrimary} onClick={handleSubmit}>Create Item</button>
              </>
            )}

            {/* CONFIRM NEW BRAND */}
            {modalType === "confirmNewBrand" && (
              <>
                <h3>Different Brand Detected</h3>
                <p>This item name exists but brand is different. Create new item?</p>
                <button style={styles.buttonPrimary} onClick={()=>{ setForm(brandConfirmData); setModalTypeBeforeItem("transaction"); setModalType("item"); }}>Yes</button>
                <button style={styles.buttonSecondary} onClick={()=>setModalType("transaction")}>No</button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

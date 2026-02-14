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
  modalCard: { background: "#fff", padding: 24, borderRadius: 8, width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #d1d5db" },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active) => ({
    flex: 1,
    padding: "8px 0",
    borderRadius: 6,
    border: active ? "none" : "1px solid #d1d5db",
    background: active ? "#1f2937" : "#fff",
    color: active ? "#fff" : "#374151",
    cursor: "pointer",
    fontWeight: 600,
  }),
  newOptionButton: { padding: "12px 0", marginBottom: 12, borderRadius: 8, border: "none", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: 16 },
};

// ================= EMPTY ROW =================
const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [form, setForm] = useState({ date:"", item_id:null, item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null, _fromTransaction:false });

  const stockRooms = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price)")
      .order("date", { ascending: false });
    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  const filteredTransactions = transactions.filter(t => !selectedStockRoom || t.location === selectedStockRoom);

  const stockInventory = items.filter(i => !i.deleted).map(i => {
    const related = transactions.filter(t => t.item_id === i.id && !t.deleted);
    const stock = related.reduce((sum, t) => sum + (t.type==="IN"? Number(t.quantity):-Number(t.quantity)),0);
    return { id:i.id, item_name:i.item_name, brand:i.brand, unit_price:i.unit_price, stock };
  });

  const deletedItems = items.filter(i => i.deleted);
  const deletedTransactions = transactions.filter(t => t.deleted);

  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if(modalType==="transaction"){
      if(!form.item_name || !form.quantity || !form.date || !form.brand) return alert("Fill required fields");

      const existingItem = items.find(i => i.item_name===form.item_name && i.brand!==form.brand);
      if(existingItem){
        alert(`An item named "${form.item_name}" exists with a different brand. Create a new item first.`);
        setForm(prev=>({ ...prev, _fromTransaction:true }));
        setModalType("item");
        return;
      }

      const item = items.find(i=>i.item_name===form.item_name && i.brand===form.brand);
      if(!item) return alert("Please create the item first.");

      if(form.id){
        if(!confirm("Save changes for this transaction?")) return;
        await supabase.from("inventory_transactions").update({
          date: form.date,
          item_id: form.item_id,
          brand: form.brand,
          type: form.type,
          quantity: Number(form.quantity),
          unit_price: item.unit_price
        }).eq("id", form.id);
      } else {
        await supabase.from("inventory_transactions").insert([{
          date: form.date,
          item_id: item.id,
          brand: form.brand,
          type: form.type,
          quantity: Number(form.quantity),
          location: selectedStockRoom,
          unit_price: item.unit_price
        }]);
      }

      setShowModal(false); setModalType(""); setForm({ date:"", item_id:null, item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null, _fromTransaction:false });
      loadData(); return;
    }

    if(modalType==="item"){
      if(!form.item_name || !form.brand || !form.price) return alert("Fill required fields");
      let itemId;
      if(form.id){
        if(!confirm(`Save changes to "${form.item_name}"?`)) return;
        await supabase.from("items").update({ item_name: form.item_name, brand: form.brand, unit_price: Number(form.price) }).eq("id", form.id);
        itemId = form.id;
      } else {
        const { data } = await supabase.from("items").insert([{ item_name: form.item_name, brand: form.brand, unit_price: Number(form.price), location:selectedStockRoom }]);
        if(!data?.length) return alert("Failed to create item.");
        itemId = data[0].id;
      }

      loadData();
      if(form._fromTransaction){
        setForm(prev=>({ ...prev, item_id:itemId, _fromTransaction:false }));
        setModalType("transaction"); setShowModal(true);
      } else {
        setShowModal(false); setModalType(""); setForm({ date:"", item_id:null, item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null, _fromTransaction:false });
      }
    }
  };

  const handleNewClick = () => {
    if(!selectedStockRoom){ setModalType("stockRoomPrompt"); setShowModal(true); }
    else { setModalType("newOption"); setShowModal(true); }
  };

  // ================= ITEM & TRANSACTION HANDLERS =================
  const handleEditItem = (i)=>{ setForm({ id:i.id, item_name:i.item_name, brand:i.brand, price:i.unit_price, _fromTransaction:false }); setModalType("item"); setShowModal(true); };
  const handleDeleteItem = async (i)=>{ if(!confirm(`Delete "${i.item_name}"?`)) return; await supabase.from("items").update({ deleted:true }).eq("id", i.id); loadData(); };
  const handleRestoreItem = async (i)=>{ if(!confirm(`Restore "${i.item_name}"?`)) return; await supabase.from("items").update({ deleted:false }).eq("id", i.id); loadData(); };
  const handlePermanentDeleteItem = async (i)=>{ if(!confirm(`Permanently delete "${i.item_name}"?`)) return; await supabase.from("items").delete().eq("id", i.id); loadData(); };
  const handleEditTransaction = (tx)=>{ setForm({ id:tx.id, date:tx.date, item_id:tx.item_id, item_name:tx.items?.item_name, brand:tx.items?.brand, type:tx.type, quantity:tx.quantity, _fromTransaction:false }); setModalType("transaction"); setShowModal(true); };
  const handleDeleteTransaction = async (tx)=>{ if(!confirm(`Delete transaction for "${tx.items?.item_name}"?`)) return; await supabase.from("inventory_transactions").update({ deleted:true }).eq("id", tx.id); loadData(); };
  const handleRestoreTransaction = async (tx)=>{ if(!confirm(`Restore transaction for "${tx.items?.item_name}"?`)) return; await supabase.from("inventory_transactions").update({ deleted:false }).eq("id", tx.id); loadData(); };
  const handlePermanentDeleteTransaction = async (tx)=>{ if(!confirm(`Permanently delete transaction for "${tx.items?.item_name}"?`)) return; await supabase.from("inventory_transactions").delete().eq("id", tx.id); loadData(); };

  // ================= RENDER =================
  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

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
            <button style={styles.tabButton(activeTab==="report")} onClick={()=>setActiveTab("report")}>📊 Monthly Report</button>
          </div>
        </div>
        <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div style={styles.title}>
            {activeTab==="stock" ? "Stock Inventory" : activeTab==="transactions" ? "Transactions" : activeTab==="deleted" ? "Deleted History" : "Monthly Report"}
          </div>
        </div>

        {/* ================= STOCK TAB ================= */}
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
                      <button style={{...styles.buttonSecondary, marginRight:8}} onClick={()=>handleEditItem(i)}>Edit</button>
                      <button style={{...styles.buttonSecondary, background:"#f87171", color:"#fff"}} onClick={()=>handleDeleteItem(i)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TRANSACTIONS TAB ================= */}
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
                      <button style={{ ...styles.buttonSecondary, marginRight: 8 }} onClick={() => handleEditTransaction(t)}>Edit</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => handleDeleteTransaction(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DELETED TAB ================= */}
        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h3>Deleted Inventory</h3>
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
                      <button style={{ ...styles.buttonSecondary, marginRight: 8, background:"#34d399", color:"#fff" }} onClick={()=>handleRestoreItem(i)}>Restore</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={()=>handlePermanentDeleteItem(i)}>Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop:24 }}>Deleted Transactions</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.length===0 && emptyRow(5,"No deleted transactions")}
                {deletedTransactions.map(t=>(
                  <tr key={t.id}>
                    <td style={styles.thtd}>{t.items?.item_name}</td>
                    <td style={styles.thtd}>{t.items?.brand}</td>
                    <td style={styles.thtd}>{t.type}</td>
                    <td style={styles.thtd}>{t.quantity}</td>
                    <td style={styles.thtd}>
                      <button style={{ ...styles.buttonSecondary, marginRight: 8, background:"#34d399", color:"#fff" }} onClick={()=>handleRestoreTransaction(t)}>Restore</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={()=>handlePermanentDeleteTransaction(t)}>Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= MONTHLY REPORT TAB ================= */}
        {activeTab==="report" && (
          <div style={styles.card}>
            <h3>Monthly Report (Placeholder)</h3>
            <p>Here you can implement charts or aggregated data per month.</p>
          </div>
        )}
      </div>

      {/* STOCK ROOM PROMPT MODAL */}
{modalType === "stockRoomPrompt" && (
  <>
    <h3>Select Stock Room</h3>
    <select
      style={styles.input}
      value={selectedStockRoom}
      onChange={(e) => {
        setSelectedStockRoom(e.target.value);
        setModalType("newOption"); // go to the "What do you want to add?" modal
      }}
    >
      <option value="">Select Stock Room</option>
      {stockRooms.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
    <button
      style={styles.buttonSecondary}
      onClick={() => setShowModal(false)}
    >
      Cancel
    </button>
  </>
)}


            {/* NEW OPTION MODAL */}
            {modalType==="newOption" && (
              <>
                <h3>Create</h3>
                <button style={styles.newOptionButton} onClick={()=>{ setModalType("item"); setForm({ date:"", item_name:"", brand:"", price:"", _fromTransaction:false }); }}>New Item</button>
                <button style={styles.newOptionButton} onClick={()=>{ setModalType("transaction"); setForm({ date:"", item_name:"", brand:"", type:"IN", quantity:"", _fromTransaction:false }); }}>New Transaction</button>
              </>
            )}

            {/* ITEM MODAL */}
            {modalType==="item" && (
              <>
                <h3>{form.id ? "Edit Item" : "New Item"}</h3>
                <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name", e.target.value)} />
                <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand", e.target.value)} />
                <input style={styles.input} placeholder="Unit Price" type="number" value={form.price} onChange={e=>handleFormChange("price", e.target.value)} />
                <button style={styles.buttonPrimary} onClick={handleSubmit}>Save</button>
              </>
            )}

            {/* TRANSACTION MODAL */}
            {modalType==="transaction" && (
              <>
                <h3>{form.id ? "Edit Transaction" : "New Transaction"}</h3>
                <input style={styles.input} type="date" value={form.date} onChange={e=>handleFormChange("date", e.target.value)} />
                <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name", e.target.value)} />
                <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand", e.target.value)} />
                <div style={styles.toggleGroup}>
                  <button style={styles.toggleButton(form.type==="IN")} onClick={()=>handleFormChange("type","IN")}>IN</button>
                  <button style={styles.toggleButton(form.type==="OUT")} onClick={()=>handleFormChange("type","OUT")}>OUT</button>
                </div>
                <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e=>handleFormChange("quantity", e.target.value)} />
                <button style={styles.buttonPrimary} onClick={handleSubmit}>Save</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

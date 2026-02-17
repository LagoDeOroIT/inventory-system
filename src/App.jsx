import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", fontFamily: "Inter, Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6" },
  sidebar: { width: 230, background: "#111827", color: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  sidebarHeader: { fontSize: 20, fontWeight: 700, marginBottom: 24 },
  sidebarSelect: { marginBottom: 24, padding: 8, borderRadius: 6, border: "none", width: "100%" },
  sidebarTabs: { display: "flex", flexDirection: "column", gap: 10 },
  tabButton: (active) => ({ padding: 10, borderRadius: 6, background: active ? "#1f2937" : "transparent", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }),
  main: { flex: 1, padding: 24 },
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8 },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 10, width: 420, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #d1d5db" },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active) => ({ flex: 1, padding: 8, borderRadius: 6, border: active ? "none" : "1px solid #d1d5db", background: active ? "#1f2937" : "#fff", color: active ? "#fff" : "#374151", cursor: "pointer" }),
};

// ================= EMPTY ROW =================
const emptyRowComponent = (colSpan, text) => (
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
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalReturnType, setModalReturnType] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [form, setForm] = useState({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });

  const stockRooms = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price, location)")
      .order("date", { ascending:false });

    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };

      if (key === "item_name") {
        const found = items.find(i => i.item_name === value && i.location === selectedStockRoom);
        if (found) {
          updated.item_id = found.id;
          updated.brand = found.brand;
          updated.price = found.unit_price;
        } else {
          updated.item_id = "";
          updated.brand = "";
          updated.price = "";
        }
      }
      return updated;
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!selectedStockRoom) return alert("Select stock room first");

    // ITEM
    if (modalType === "item") {
      const { data:newItem } = await supabase.from("items").insert({
        item_name: form.item_name,
        brand: form.brand,
        unit_price: form.price,
        location: selectedStockRoom
      }).select().single();

      await loadData();

      if (modalReturnType === "transaction") {
        setForm(prev => ({ ...prev, item_id: newItem.id }));
        setModalType("transaction");
      } else {
        setShowModal(false);
      }
    }

    // TRANSACTION
    if (modalType === "transaction") {
      const existing = items.find(i => i.item_name === form.item_name && i.location === selectedStockRoom);

      if (existing && existing.brand !== form.brand) {
        setModalType("newBrandPrompt");
        setModalReturnType("transaction");
        return;
      }

      let itemId = existing?.id;

      if (!existing) {
        const { data:newItem } = await supabase.from("items").insert({
          item_name: form.item_name,
          brand: form.brand,
          unit_price: form.price,
          location: selectedStockRoom
        }).select().single();
        itemId = newItem.id;
      }

      await supabase.from("inventory_transactions").insert({
        date: form.date,
        item_id: itemId,
        type: form.type,
        quantity: form.quantity,
        unit_price: form.price
      });

      await loadData();
      setShowModal(false);
    }
  };

  // ================= UI =================
  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r=><option key={r}>{r}</option>)}
          </select>

          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
          </div>
        </div>

        <button style={styles.buttonPrimary} onClick={()=>{setModalType("newOption");setShowModal(true)}}>+ New</button>
      </div>

      <div style={styles.main}>
        {activeTab==="stock" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i=>i.location===selectedStockRoom).length===0
                  ? emptyRowComponent(3,"No items")
                  : items.filter(i=>i.location===selectedStockRoom).map(i=>(
                    <tr key={i.id}>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>₱{i.unit_price}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="transactions" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t=>t.items?.location===selectedStockRoom).length===0
                  ? emptyRowComponent(5,"No transactions")
                  : transactions.filter(t=>t.items?.location===selectedStockRoom).map(t=>(
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{t.items?.item_name}</td>
                      <td style={styles.thtd}>{t.items?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
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

            {modalType==="newOption" && (
              <>
                <h3>Add</h3>
                <button style={styles.buttonPrimary} onClick={()=>setModalType("transaction")}>Transaction</button>
                <br /><br />
                <button style={styles.buttonSecondary} onClick={()=>setModalType("item")}>Item</button>
              </>
            )}

            {modalType==="transaction" && (
              <>
                <h3>New Transaction</h3>
                <input style={styles.input} type="date" value={form.date} onChange={e=>handleFormChange("date",e.target.value)} />
                <input style={styles.input} list="items" placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name",e.target.value)} />
                <datalist id="items">
                  {items.filter(i=>i.location===selectedStockRoom).map(i=><option key={i.id} value={i.item_name} />)}
                </datalist>
                <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand",e.target.value)} />
                <input style={styles.input} type="number" placeholder="Qty" value={form.quantity} onChange={e=>handleFormChange("quantity",e.target.value)} />
                <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange("price",e.target.value)} />
                <button style={styles.buttonPrimary} onClick={handleSubmit}>Submit</button>
              </>
            )}

            {modalType==="item" && (
              <>
                <h3>New Item</h3>
                <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name",e.target.value)} />
                <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand",e.target.value)} />
                <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange("price",e.target.value)} />
                <button style={styles.buttonPrimary} onClick={handleSubmit}>Save</button>
              </>
            )}

            {modalType==="newBrandPrompt" && (
              <>
                <h3>New Brand Detected</h3>
                <p>This item exists with a different brand. Create new item?</p>
                <button style={styles.buttonPrimary} onClick={()=>setModalType("item")}>Yes</button>
                <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

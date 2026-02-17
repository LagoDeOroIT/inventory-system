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
const emptyRowComponent = (colSpan, text) => (
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
  const [inSearch, setInSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [form, setForm] = useState({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id: null });
  const [confirmAction, setConfirmAction] = useState(null);

  // ================= AUTH FORM =================
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

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

  const handleAuth = async () => {
    if (!authEmail || !authPassword) return alert("Fill email and password");
    const result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (result.error) return alert(result.error.message);
  };

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions").select("*").order("date", { ascending: false });

    const itemsWithDeleted = (itemsData || []).map(i => ({ ...i, deleted: i.deleted ?? false }));
    const txWithDeleted = (tx || []).map(t => ({ ...t, deleted: t.deleted ?? false }));

    setItems(itemsWithDeleted);
    setTransactions(txWithDeleted);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= FILTERED DATA =================
  const filteredTransactions = transactions
    .filter(t => !t.deleted)
    .filter(t => !selectedStockRoom || t.location === selectedStockRoom);

  // ================= STOCK INVENTORY =================
  const stockInventory = items
    .filter(i => !i.deleted)
    .filter(i => !selectedStockRoom || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id && !t.deleted);
      const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)), 0);
      return { ...i, stock };
    });

  const deletedItems = items.filter(i => i.deleted).filter(i => !selectedStockRoom || i.location === selectedStockRoom);
  const deletedTransactions = transactions.filter(t => t.deleted).filter(t => !selectedStockRoom || t.location === selectedStockRoom);

  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      if (key === "item_name") {
        const selectedItem = items.find(i => i.item_name === value && !i.deleted && i.location === selectedStockRoom);
        if (selectedItem) {
          updated.item_id = selectedItem.id;
          updated.brand = selectedItem.brand;
          updated.price = selectedItem.unit_price;
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
      if (!form.item_name || !form.brand || !form.price) return alert("Fill all item fields");

      if (form.id) {
        await supabase.from("items").update({
          item_name: form.item_name,
          brand: form.brand,
          unit_price: form.price,
          location: selectedStockRoom
        }).eq("id", form.id);
      } else {
        await supabase.from("items").insert([{
          item_name: form.item_name,
          brand: form.brand,
          unit_price: form.price,
          location: selectedStockRoom
        }]);
      }
    }

    // TRANSACTION
    if (modalType === "transaction") {
      if (!form.date || !form.item_id || !form.quantity || !form.price) return alert("Fill all transaction fields");

      if (form.id) {
        await supabase.from("inventory_transactions").update({
          date: form.date,
          item_id: form.item_id,
          type: form.type,
          quantity: form.quantity,
          unit_price: form.price,
          location: selectedStockRoom
        }).eq("id", form.id);
      } else {
        await supabase.from("inventory_transactions").insert([{
          date: form.date,
          item_id: form.item_id,
          type: form.type,
          quantity: form.quantity,
          unit_price: form.price,
          location: selectedStockRoom
        }]);
      }
    }

    setShowModal(false);
    setForm({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
    loadData();
  };

  // ================= NEW BUTTON =================
  const handleNewClick = () => {
    if (!selectedStockRoom) {
      setModalType("stockRoomPrompt");
      setShowModal(true);
    } else {
      setModalType("newOption");
      setShowModal(true);
    }
  };

  // ================= AUTH SCREEN =================
  if (!session) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Inventory Login</h2>
      <input style={styles.input} placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
      <button style={{ ...styles.buttonPrimary, marginTop: 12 }} onClick={handleAuth}>Login</button>
    </div>
  );

  // ================= MAIN UI =================
  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock Inventory</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
            <button style={styles.tabButton(activeTab==="deleted")} onClick={()=>setActiveTab("deleted")}>🗑️ Deleted History</button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
          <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff"}}
            onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>
            Logout
          </button>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div style={styles.main}>

        {/* ================= STOCK ================= */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Stock</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length===0 ? emptyRowComponent(5,"No stock data") :
                  stockInventory.map(i => (
                    <tr key={i.id}>
                      <td style={styles.thtd}>{i.stock}</td>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>₱{i.unit_price}</td>
                      <td style={styles.thtd}>₱{(i.stock * i.unit_price).toFixed(2)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TRANSACTIONS ================= */}
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
                  <th style={styles.thtd}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.filter(t=>t.item_id && items.find(i=>i.id===t.item_id)?.item_name.toLowerCase().includes(inSearch.toLowerCase())).length===0
                  ? emptyRowComponent(6,"No transactions")
                  : filteredTransactions
                      .filter(t=>items.find(i=>i.id===t.item_id)?.item_name.toLowerCase().includes(inSearch.toLowerCase()))
                      .map(t => {
                        const item = items.find(i => i.id === t.item_id);
                        return (
                          <tr key={t.id}>
                            <td style={styles.thtd}>{t.date}</td>
                            <td style={styles.thtd}>{item?.item_name}</td>
                            <td style={styles.thtd}>{item?.brand}</td>
                            <td style={styles.thtd}>{t.type}</td>
                            <td style={styles.thtd}>{t.quantity}</td>
                            <td style={styles.thtd}>₱{(t.quantity * t.unit_price).toFixed(2)}</td>
                          </tr>
                        );
                      })
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DELETED ================= */}
        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h3>Deleted Items</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.length===0 ? emptyRowComponent(3,"No deleted items") :
                  deletedItems.map(i => (
                    <tr key={i.id}>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>₱{i.unit_price}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <h3 style={{ marginTop:24 }}>Deleted Transactions</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.length===0 ? emptyRowComponent(4,"No deleted transactions") :
                  deletedTransactions.map(t => {
                    const item = items.find(i => i.id === t.item_id);
                    return (
                      <tr key={t.id}>
                        <td style={styles.thtd}>{t.date}</td>
                        <td style={styles.thtd}>{item?.item_name}</td>
                        <td style={styles.thtd}>{t.type}</td>
                        <td style={styles.thtd}>{t.quantity}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ================= MODALS ================= */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              {modalType === "newOption" && (
                <>
                  <h3>What do you want to add?</h3>
                  <button style={{ ...styles.newOptionButton, background:"#1f2937", color:"#fff" }} onClick={() => setModalType("item")}>Add New Item</button>
                  <button style={{ ...styles.newOptionButton, background:"#e5e7eb", color:"#374151" }} onClick={() => setModalType("transaction")}>Add New Transaction</button>
                </>
              )}

              {modalType === "stockRoomPrompt" && (
                <>
                  <h3>Select Stock Room First</h3>
                  <select style={styles.input} value={selectedStockRoom} onChange={e => { setSelectedStockRoom(e.target.value); setModalType("newOption"); }}>
                    <option value="">Select Stock Room</option>
                    {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </>
              )}

              {modalType === "item" && (
                <>
                  <h3>New Item</h3>
                  <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e => handleFormChange("item_name", e.target.value)} />
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e => handleFormChange("brand", e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e => handleFormChange("price", e.target.value)} />
                  <button style={styles.buttonPrimary} onClick={handleSubmit}>Submit</button>
                </>
              )}

              {modalType === "transaction" && (
                <>
                  <h3>New Transaction</h3>
                  <input style={styles.input} type="date" value={form.date} onChange={e => handleFormChange("date", e.target.value)} />
                  <input style={styles.input} list="items-list" placeholder="Select Item" value={form.item_name} onChange={e => handleFormChange("item_name", e.target.value)} />
                  <datalist id="items-list">
                    {items.filter(i => i.location === selectedStockRoom && !i.deleted).map(i => (
                      <option key={i.id} value={i.item_name} />
                    ))}
                  </datalist>

                  <div style={styles.toggleGroup}>
                    <button style={styles.toggleButton(form.type==="IN")} onClick={() => handleFormChange("type","IN")}>IN</button>
                    <button style={styles.toggleButton(form.type==="OUT")} onClick={() => handleFormChange("type","OUT")}>OUT</button>
                  </div>

                  <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e => handleFormChange("quantity", e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e => handleFormChange("price", e.target.value)} />
                  <button style={styles.buttonPrimary} onClick={handleSubmit}>Submit</button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

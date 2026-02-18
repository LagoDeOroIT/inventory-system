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

// ================= SEARCHABLE DROPDOWN COMPONENT =================
function SearchableDropdown({ options = [], value, onChange, placeholder = "Select or type...", allowCustom = true }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(value || "");

  React.useEffect(() => {
    setSearch(value || "");
  }, [value]);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        style={styles.input}
        value={search}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          if (allowCustom) onChange(e.target.value);
        }}
      />

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          maxHeight: 180,
          overflowY: "auto",
          zIndex: 9999,
          boxShadow: "0 6px 18px rgba(0,0,0,.15)"
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 8, color: "#6b7280" }}>No results</div>
          )}
          {filtered.map((o, i) => (
            <div
              key={i}
              style={{
                padding: 8,
                cursor: "pointer",
                background: o === value ? "#1f2937" : "white",
                color: o === value ? "#fff" : "#111827"
              }}
              onMouseDown={() => {
                onChange(o);
                setSearch(o);
                setOpen(false);
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================= MAIN APP =================
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
  const [modalTypeBeforeItem, setModalTypeBeforeItem] = useState(""); 
  const [brandConfirm, setBrandConfirm] = useState(null);

  // ================= AUTH FORM =================
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

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

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (result.error) return alert(result.error.message);
      alert("Sign up successful! Please check your email to confirm.");
    } else {
      result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (result.error) return alert(result.error.message);
    }
  };

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const itemsWithDeleted = (itemsData || []).map(i => ({ ...i, deleted: i.deleted ?? false }));

    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price, location)")
      .order("date", { ascending: false });
    const transactionsWithDeleted = (tx || []).map(t => ({ ...t, deleted: t.deleted ?? false }));

    setItems(itemsWithDeleted);
    setTransactions(transactionsWithDeleted);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= FILTERED DATA =================
  const filteredTransactions = transactions
    .filter(t => !t.deleted)
    .filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom);

  // ================= STOCK INVENTORY CALCULATION =================
  const stockInventory = items
    .filter(i => !i.deleted)
    .filter(i => !selectedStockRoom || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id && !t.deleted);
      const stock = related.reduce(
        (sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)),
        0
      );
      return { id: i.id, item_name: i.item_name, brand: i.brand, unit_price: i.unit_price, stock, location: i.location };
    });

  // ================= DELETED ITEMS =================
  const deletedItems = items.filter(i => i.deleted).filter(i => !selectedStockRoom || i.location === selectedStockRoom);
  const deletedTransactions = transactions.filter(t => t.deleted).filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom);

  // ================= HELPERS =================
  const getItemNames = () => [...new Set(items.filter(i => !i.deleted && i.location === selectedStockRoom).map(i => i.item_name))];
  const getBrandsForItem = (itemName) => items.filter(i => i.item_name === itemName && !i.deleted && i.location === selectedStockRoom).map(i => i.brand);

  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };

      if (key === "item_name") {
        const selectedItem = items.find(i => i.item_name === value && !i.deleted);
        if (selectedItem) {
          updated.item_id = selectedItem.id;
          updated.brand = selectedItem.brand;
          updated.price = selectedItem.unit_price;
        } else {
          updated.item_id = "";
          updated.brand = "";
          updated.price = "";
        }
      }

      if (key === "brand") {
        const match = items.find(
          i => i.item_name === updated.item_name && i.brand === value && !i.deleted
        );
        if (match) {
          updated.item_id = match.id;
          updated.price = match.unit_price;
        } else {
          updated.item_id = ""; // new brand → new item
        }
      }

      return updated;
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (modalType === "transaction") {
      if (!form.item_name || !form.quantity || !form.date) return alert("Fill required fields");

      const existingItem = items.find(i => i.item_name === form.item_name && !i.deleted);

      if (existingItem && existingItem.brand !== form.brand) {
        setBrandConfirm({
          item_name: form.item_name,
          oldBrand: existingItem.brand,
          newBrand: form.brand,
        });
        return;
      }

      if (form.id) {
        await supabase.from("inventory_transactions").update({
          date: form.date, item_id: form.item_id, brand: form.brand, type: form.type,
          quantity: Number(form.quantity), location: selectedStockRoom,
          unit_price: Number(form.price || items.find(i => i.id === form.item_id)?.unit_price || 0)
        }).eq("id", form.id);
      } else {
        await supabase.from("inventory_transactions").insert([{
          date: form.date, item_id: form.item_id, brand: form.brand, type: form.type,
          quantity: Number(form.quantity), location: selectedStockRoom,
          unit_price: Number(form.price || items.find(i => i.id === form.item_id)?.unit_price || 0)
        }]);
      }

      setForm({ date: "", item_id: "", item_name: "", brand: "", type: "IN", quantity: "", price: "", id: null });
      loadData();
    } else if (modalType === "item") {
      if (!form.item_name || !form.brand || !form.price) return alert("Fill required fields");

      if (form.id) {
        await supabase.from("items").update({
          item_name: form.item_name, brand: form.brand, unit_price: Number(form.price), location: selectedStockRoom
        }).eq("id", form.id);
      } else {
        const { data } = await supabase.from("items").insert([{ item_name: form.item_name, brand: form.brand, unit_price: Number(form.price), location: selectedStockRoom }]);
        if (data?.length) {
          const newItemId = data[0].id;
          if (modalTypeBeforeItem === "transaction") {
            setForm(prev => ({ ...prev, item_id: newItemId }));
            setModalType("transaction");
            setShowModal(true);
            return;
          }
        }
      }

      setShowModal(false);
      setModalType("");
      setForm({ date: "", item_id: "", item_name: "", brand: "", type: "IN", quantity: "", price: "", id: null });
      loadData();
    }
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

  // ================= EMPTY ROW COMPONENT =================
  const emptyRowComponent = (colSpan, text) => <tr><td colSpan={colSpan} style={styles.emptyRow}>{text}</td></tr>;

  // ================= AUTH SCREEN =================
  if (!session) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      {!session?.user ? (
        <>
          <h2>{isSignUp ? "Sign Up for Inventory" : "Inventory Login"}</h2>
          <input style={styles.input} placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
          <button style={{ ...styles.buttonPrimary, marginBottom: 12 }} onClick={handleAuth}>{isSignUp ? "Sign Up" : "Login"}</button>
          <div>
            <button style={styles.buttonSecondary} onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>Welcome back, {session.user.email}!</h2>
          <button style={{ ...styles.buttonPrimary, marginTop: 12 }} onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>Logout</button>
        </>
      )}
    </div>
  );

  // ================= MAIN APP =================
  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e => setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab === "stock")} onClick={() => setActiveTab("stock")}>📦 Stock Inventory</button>
            <button style={styles.tabButton(activeTab === "transactions")} onClick={() => setActiveTab("transactions")}>📄 Transactions</button>
            <button style={styles.tabButton(activeTab === "deleted")} onClick={() => setActiveTab("deleted")}>🗑️ Deleted History</button>
            <button style={styles.tabButton(activeTab === "report")} onClick={() => setActiveTab("report")}>📊 Monthly Report</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
          {session?.user?.email && (
            <div style={{ color: "#fff", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Logged in as:<br />{session.user.email}
            </div>
          )}
          <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
          <button style={{ ...styles.buttonSecondary, background: "#ef4444", color: "#fff" }}
            onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>
            Logout
          </button>
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
      <div style={styles.main}>
        {/* ================= TRANSACTION MODAL ================= */}
        {showModal && modalType === "transaction" && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <h3>{form.id ? "Edit Transaction" : "New Transaction"}</h3>
              <input style={styles.input} type="date" value={form.date} onChange={e => handleFormChange("date", e.target.value)} />

              <SearchableDropdown
                options={getItemNames()}
                value={form.item_name}
                placeholder="Search item..."
                onChange={v => handleFormChange("item_name", v)}
              />

              <SearchableDropdown
                options={getBrandsForItem(form.item_name)}
                value={form.brand}
                placeholder="Search or type brand..."
                onChange={v => handleFormChange("brand", v)}
              />

              <div style={styles.toggleGroup}>
                <button style={styles.toggleButton(form.type === "IN")} onClick={() => handleFormChange("type", "IN")}>IN</button>
                <button style={styles.toggleButton(form.type === "OUT")} onClick={() => handleFormChange("type", "OUT")}>OUT</button>
              </div>

              <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e => handleFormChange("quantity", e.target.value)} />
              <input style={styles.input} type="number" placeholder="Price per unit" value={form.price} onChange={e => handleFormChange("price", e.target.value)} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id ? "Save Changes" : "Submit"}</button>
                <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ================= BRAND CONFIRM ================= */}
        {brandConfirm && (
          <div style={styles.modalOverlay} onClick={() => setBrandConfirm(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <h3>Confirm Brand</h3>
              <p>You already have an item named <b>{brandConfirm.item_name}</b> with brand <b>{brandConfirm.oldBrand}</b>.</p>
              <p>Do you want to create a new item with brand <b>{brandConfirm.newBrand}</b>?</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button style={styles.buttonPrimary} onClick={() => {
                  setModalType("item");
                  setShowModal(true);
                  setBrandConfirm(null);
                }}>Yes, create new</button>
                <button style={styles.buttonSecondary} onClick={() => setBrandConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react"; // make sure useMemo is imported

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://mkfhjklomofrvnnwwknh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmhqa2xvbW9mcnZubnd3a25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTczNzAsImV4cCI6MjA4ODU5MzM3MH0.6Q8p9ms8mnf2daONf7HTP3jGZD_bQuNQrv6cpy0ZUts";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    background: "#f9fafb",
  },
  sidebar: {
    background: "#111827",
    color: "#f9fafb",
  },
  sidebarHeader: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
  },
  sidebarSelect: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "none",
    outline: "none",
    marginBottom: 12,
  },
  sidebarTabs: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tabButton: (active) => ({
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    background: active ? "#1f2937" : "transparent",
    color: active ? "#fff" : "#d1d5db",
    fontWeight: 600,
    transition: "background 0.2s",
  }),
  main: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  welcomeScreen: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeContainer: { textAlign: "center" },
  welcomeLogo: { width: 100, marginBottom: 16 },
  welcomeTitle: { fontSize: 20, fontWeight: 700, lineHeight: 1.4 },
  welcomeDivider: { height: 2, width: 40, background: "#2563eb", margin: "16px auto" },
  welcomeSubtitle: { fontSize: 16, color: "#6b7280" },
  welcomeInstruction: { fontSize: 14, color: "#9ca3af" },
  stockRoomHeader: { fontSize: 16, fontWeight: 600 },
  dashboard: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 },
  dashboardCard: { background: "#fff", flex: 1, padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  dashboardTitle: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  dashboardValue: { fontSize: 18, fontWeight: 700 },
  categoryRow: { background: "#f9fafb", cursor: "pointer" },
  categoryContainer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  categoryLeft: { display: "flex", alignItems: "center", gap: 8, fontWeight: 600 },
  categoryRight: { display: "flex", alignItems: "center", gap: 12 },
  thtd: { padding: "12px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 14 },
  buttonPrimary: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  buttonSecondary: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 500,
  },
  buttonEdit: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  buttonDelete: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  buttonRestore: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background: "#10b981",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  input: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
  },
  toggleGroup: { display: "flex", gap: 12, margin: "10px 0" },
  toggleButton: (active) => ({
    flex: 1,
    padding: "8px 0",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: 600,
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#374151",
  }),
  card: { background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "400px",
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  newOptionButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    marginBottom: 10,
    width: "100%",
  },
  // ================= STYLES (add these) =================
loginPage: {
  display: "flex",
  height: "100vh",
  width: "100vw",
  fontFamily: "'Inter', sans-serif",
},
loginLeft: {
  flex: 1,
  background: "#111827",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
},
loginRight: {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},
loginCard: {
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  width: 320,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
},
loginTitle: { fontSize: 20, fontWeight: 700 },
loginSubtitle: { fontSize: 14, color: "#6b7280" },
loginInput: {
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
},
loginButton: {
  padding: "10px 12px",
  borderRadius: 6,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
},
tableHeader: {
  textAlign: "left",
  padding: "10px",
  background: "#f3f4f6",
  fontWeight: 600,
  fontSize: 14,
  borderBottom: "1px solid #e5e7eb",
},
tableCell: {
  padding: "10px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
},
searchInput: {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  marginBottom: 12,
  width: "100%",
},
modalBackdrop: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
},
modalContent: {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  width: "400px",
  maxHeight: "90vh",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 12,
},
emptyRow: {
  textAlign: "center",
  padding: 16,
  color: "#6b7280",
  fontStyle: "italic",
},
};

// ================= HELPERS =================
const formatNumber = (num) => (num == null ? "" : Number(num).toLocaleString());

const capitalizeWords = (text) => text ? text.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : text;

const displayBrand = (brand) => (!brand || brand.trim() === "" ? "No Brand" : capitalizeWords(brand));

// ================= STOCK ROOMS =================
const stockRooms = [
  "L1", "L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
  "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room"
];

// ================= APP COMPONENT =================
export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userRooms, setUserRooms] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [brandOptions, setBrandOptions] = useState([]);
  const [inSearch, setInSearch] = useState("");
  const [outSearch, setOutSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const [deletedItemSearch, setDeletedItemSearch] = useState("");
  const [deletedTxSearch, setDeletedTxSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalTypeBeforeItem, setModalTypeBeforeItem] = useState("");
  const [form, setForm] = useState({
    date: "", item_id: "", item_name: "", brand: "", category: "", brandOptions: [], type: "IN", quantity: "", price: "", id: null, location: ""
  });
  const [confirmAction, setConfirmAction] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

   // ================= EFFECTS =================
  // load categories, session, user profile, and data
  useEffect(() => {
    const savedCategories = localStorage.getItem("openCategories");
    if (savedCategories) setOpenCategories(JSON.parse(savedCategories));
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) loadUserProfile(data.session.user.id);
    };
    initAuth();

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadUserProfile(s.user.id);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadUserProfile(session.user.id);
      loadData();
    }
  }, [session]);

  // ================= USEMEMO COMPUTED VALUES =================
  const stockInventory = useMemo(
    () => items.filter(i => i.location === selectedStockRoom && !i.deleted),
    [items, selectedStockRoom]
  );

  const inTransactions = useMemo(
    () => transactions.filter(t => t.type === "IN" && !t.deleted && t.location === selectedStockRoom),
    [transactions, selectedStockRoom]
  );

  const outTransactions = useMemo(
    () => transactions.filter(t => t.type === "OUT" && !t.deleted && t.location === selectedStockRoom),
    [transactions, selectedStockRoom]
  );

  const deletedItems = useMemo(
    () => items.filter(i => i.deleted),
    [items]
  );

  const deletedTransactions = useMemo(
    () => transactions.filter(t => t.deleted),
    [transactions]
  );
// ================= OTHER COMPUTED VALUES =================
  const totalInventoryValue = stockInventory.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
  const totalItems = stockInventory.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockItems = stockInventory.filter(i => i.quantity <= 5).length;
  const totalCategories = new Set(stockInventory.map(i => i.category || "Uncategorized")).size;

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === Number(reportMonth) &&
           date.getFullYear() === Number(reportYear) &&
           t.location === selectedStockRoom;
  });

  const monthlySummary = {
    totalTx: monthlyTransactions.length,
  };

  const netValue = monthlyTransactions.reduce((sum, t) => sum + (t.quantity * t.unit_price || 0), 0);
  // ================= LOAD USER PROFILE =================
  const loadUserProfile = async (userId) => {
    const { data, error } = await supabase.from("profiles").select("stock_rooms, role").eq("id", userId).single();
    if (error) return console.error("Profile error:", error);
    setUserRooms(data.role === "admin" ? stockRooms : data.stock_rooms || []);
  };
  // ================= HANDLE FORM SUBMIT =================
const handleSubmit = async () => {
  if (!session?.user?.id) {
    return alert("Session expired, please login again.");
  }
  if (!form.item_name || !form.quantity) {
    return alert("Please fill all required fields.");
  }

  try {
    if (modalType === "item") {
      // Add new item
      const { error } = await supabase.from("items").insert([{
        item_name: form.item_name,
        brand: form.brand,
        category: form.category,
        quantity: Number(form.quantity),
        unit_price: Number(form.price),
        location: form.location
      }]);
      if (error) throw error;
    } else if (modalType === "transaction") {
      // Add new transaction
      const { error } = await supabase.from("inventory_transactions").insert([{
        item_id: form.item_id,
        type: form.type, // "IN" or "OUT"
        quantity: Number(form.quantity),
        price: Number(form.price),
        date: form.date || new Date().toISOString().slice(0,10),
        user_id: session.user.id
      }]);
      if (error) throw error;
    } else if (modalType === "edit") {
      // Edit item
      const { error } = await supabase.from("items").update({
        item_name: form.item_name,
        brand: form.brand,
        category: form.category,
        quantity: Number(form.quantity),
        unit_price: Number(form.price),
        location: form.location
      }).eq("id", form.id);
      if (error) throw error;
    } else if (modalType === "editIn" || modalType === "editOut") {
      // Edit transaction
      const { error } = await supabase.from("inventory_transactions").update({
        item_id: form.item_id,
        type: form.type,
        quantity: Number(form.quantity),
        price: Number(form.price),
        date: form.date
      }).eq("id", form.id);
      if (error) throw error;
    }

    setShowModal(false);
    await loadData(); // Refresh data
  } catch (err) {
    console.error(err);
    alert("Error saving data: " + err.message);
  }
};
  // ================= EXPORT MONTHLY REPORT =================
const exportMonthlyReport = (stockRoom, month, year) => {
  if (!session?.user?.id) return alert("Session expired, please login again.");

  const filtered = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return tx.location === stockRoom &&
           txDate.getMonth() + 1 === Number(month) &&
           txDate.getFullYear() === Number(year);
  });

  if (!filtered.length) return alert("No transactions for this month.");

  let csv = "Date,Item,Brand,Qty,Type,Value\n";
  filtered.forEach(tx => {
    const itemName = tx.items?.item_name || "Unknown";
    const brand = tx.items?.brand || "No Brand";
    const value = (tx.quantity * tx.price) || 0;
    csv += `${tx.date},${itemName},${brand},${tx.quantity},${tx.type},${value}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `MonthlyReport_${stockRoom}_${month}-${year}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // ================= LOAD DATA =================
  const loadData = async () => {
    const { data: itemsData } = await supabase.from("items").select("*");
    const itemsWithDeleted = (itemsData || []).map(i => ({ ...i, deleted: i.deleted ?? false }));

    const { data: tx } = await supabase.from("inventory_transactions").select("*, items(item_name, brand, unit_price, location, category)").order("date", { ascending: false });
    const transactionsWithDeleted = (tx || []).map(t => ({ ...t, deleted: t.deleted ?? false }));

    setItems(itemsWithDeleted);
    setTransactions(transactionsWithDeleted);

    // Initialize open categories if not saved
    const opened = {};
    itemsWithDeleted.forEach(i => { const cat = i.category || "Uncategorized"; if (!(cat in opened)) opened[cat] = true; });
    if (!localStorage.getItem("openCategories")) setOpenCategories(opened);
  };

  // ================= CATEGORY TOGGLE =================
  const toggleCategory = (category) => {
    setOpenCategories(prev => {
      const updated = { ...prev, [category]: !prev[category] };
      localStorage.setItem("openCategories", JSON.stringify(updated));
      return updated;
    });
  };

  // ================= AUTH HANDLER =================
  const handleAuth = async () => {
    if (!authEmail || !authPassword) return alert("Enter email and password");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) alert(error.message);
  };

  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
    if (typeof value === "string") value = capitalizeWords(value.trimStart());

    if (key === "item_name") {
      const relatedBrands = items.filter(i => i.item_name && i.item_name.toLowerCase().includes(value.toLowerCase()) && !i.deleted).map(i => i.brand).filter(Boolean);
      setBrandOptions([...new Set(relatedBrands)]);
    }

    setForm(prev => {
      const updated = { ...prev, [key]: value };

      // Reset brand when item name changes
      if (key === "item_name") {
        updated.brand = "";
        const exactMatchBrands = items.filter(i => i.item_name && i.item_name.toLowerCase() === value.toLowerCase() && !i.deleted).map(i => i.brand);
        if (exactMatchBrands.length === 1) updated.brand = exactMatchBrands[0];
      }

      // Auto-fill price
      if (key === "brand") {
        const selectedItem = items.find(i => i.item_name?.toLowerCase() === prev.item_name?.toLowerCase() && i.brand === value && !i.deleted);
        if (selectedItem) updated.price = selectedItem.unit_price;
      }

      return updated;
    });
  };

  // ================= OPEN MODALS =================
  const openNewItemModal = () => {
    setForm({ date: "", item_id: "", item_name: "", brand: "", brandOptions: [], type: "IN", quantity: "", price: "", id: null, location: selectedStockRoom });
    setModalType("item");
    setShowModal(true);
  };

  const openNewTransactionModal = () => {
    setForm({ date: "", item_id: "", item_name: "", brand: "", brandOptions: [], type: "IN", quantity: "", price: "", id: null, location: selectedStockRoom });
    setModalType("transaction");
    setShowModal(true);
  };

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

  // ================= LOGIN SCREEN =================
  if (!session) return (
    <div style={styles.loginPage}>
      <div style={styles.loginLeft}>
        <div style={{ background: "#fff", padding: "10px 18px", borderRadius: 12, marginBottom: 25, boxShadow: "0 6px 18px rgba(0,0,0,0.25)" }}>
          <img src="/logo.jpg" alt="Lago De Oro" style={{ width: 110, display: "block" }} />
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>Lago De Oro</div>
        <div style={{ fontSize: 15, opacity: 0.85, letterSpacing: 1, textTransform: "uppercase" }}>Inventory Management System</div>
      </div>
      <div style={styles.loginRight}>
        <div style={styles.loginCard}>
          <div style={styles.loginTitle}>Login</div>
          <div style={styles.loginSubtitle}>Authorized Personnel Only</div>
          <input style={styles.loginInput} placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          <input style={styles.loginInput} type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
          <button style={styles.loginButton} onClick={handleAuth}>Login</button>
        </div>
      </div>
    </div>
  );
  // ================= COMPUTED VARIABLES =================

// Filter items for selected stock room
const stockInventory = useMemo(
  () => items.filter(i => i.location === selectedStockRoom && !i.deleted),
  [items, selectedStockRoom]
);

// Inventory totals
const totalInventoryValue = stockInventory.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
const totalItems = stockInventory.reduce((sum, i) => sum + i.quantity, 0);
const lowStockItems = stockInventory.filter(i => i.quantity <= 5).length;
const totalCategories = new Set(stockInventory.map(i => i.category || "Uncategorized")).size;

// Transactions separated by type
const inTransactions = useMemo(
  () => transactions.filter(t => t.type === "IN" && !t.deleted && t.location === selectedStockRoom),
  [transactions, selectedStockRoom]
);

const outTransactions = useMemo(
  () => transactions.filter(t => t.type === "OUT" && !t.deleted && t.location === selectedStockRoom),
  [transactions, selectedStockRoom]
);

// Deleted history
const deletedItems = items.filter(i => i.deleted);
const deletedTransactions = transactions.filter(t => t.deleted);

// Monthly report
const monthlyTransactions = transactions.filter(t => {
  const date = new Date(t.date);
  return date.getMonth() + 1 === Number(reportMonth) &&
         date.getFullYear() === Number(reportYear) &&
         t.location === selectedStockRoom;
});

const monthlySummary = {
  totalTx: monthlyTransactions.length,
};

const netValue = monthlyTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0);
// ================= MAIN APP =================
return (
  <div style={styles.container}>
    {/* SIDEBAR */}
    <div
      style={{
        ...styles.sidebar,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "space-between",
        padding: "16px 12px",
        boxSizing: "border-box",
        width: "220px",
        minWidth: "180px",
        maxWidth: "250px",
      }}
    >
      {/* Top Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={styles.sidebarHeader}>Lago De Oro</div>

        <select
          style={{ ...styles.sidebarSelect, width: "100%" }}
          value={selectedStockRoom}
          onChange={(e) => setSelectedStockRoom(e.target.value)}
        >
          <option value="">Select Stock Room</option>
          {stockRooms
            .filter((r) => userRooms.includes(r))
            .map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
        </select>

        <div style={styles.sidebarTabs}>
          <button
            style={styles.tabButton(activeTab === "stock")}
            onClick={() => setActiveTab("stock")}
          >
            📦 Stock Inventory
          </button>
          <button
            style={styles.tabButton(activeTab === "transactions")}
            onClick={() => setActiveTab("transactions")}
          >
            📄 Transactions
          </button>
          <button
            style={styles.tabButton(activeTab === "deleted")}
            onClick={() => setActiveTab("deleted")}
          >
            🗑️ Deleted History
          </button>
          <button
            style={styles.tabButton(activeTab === "report")}
            onClick={() => setActiveTab("report")}
          >
            📊 Monthly Report
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
          paddingBottom: 16,
          textAlign: "center",
        }}
      >
        {session?.user?.email && (
          <div
            style={{
              color: "#f9fafb",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}
          >
            Logged in as
            <br />
            <span style={{ fontWeight: 700 }}>{session.user.email}</span>
          </div>
        )}

        {/* + New Button */}
        <button
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            transition: "background 0.2s, transform 0.1s",
          }}
          onClick={handleNewClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2563eb";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          + New
        </button>

        {/* Logout Button */}
        <button
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "#ef4444",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            transition: "background 0.2s, transform 0.1s",
          }}
          onClick={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#dc2626";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ef4444";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Logout
        </button>
      </div>
    </div>

    {/* MAIN AREA */}
    <div style={styles.main}>
      {!selectedStockRoom ? (
        <div style={styles.welcomeScreen}>
          <div style={styles.welcomeContainer}>
            <img src="/logo.jpg" alt="Lago de Oro" style={styles.welcomeLogo} />
            <h1 style={styles.welcomeTitle}>
              LAGO DE ORO NORTHERN LIGHTS AGRI-AQUATIC
              <br />
              AND RESORTS DEVELOPMENT INC.
              <br />
              INVENTORY SYSTEM
            </h1>
            <div style={styles.welcomeDivider}></div>
            <p style={styles.welcomeSubtitle}>Inventory Management Portal</p>
            <p style={styles.welcomeInstruction}>
              Please select a Stock Room from the left panel to begin
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.stockRoomHeader}>Stock Room: {selectedStockRoom}</div>

          {/* ================= STOCK INVENTORY TAB ================= */}
          {activeTab === "stock" && (
            <StockInventoryTab
              stockInventory={stockInventory}
              stockSearch={stockSearch}
              openCategories={openCategories}
              toggleCategory={toggleCategory}
              setForm={setForm}
              setModalType={setModalType}
              setShowModal={setShowModal}
              totalInventoryValue={totalInventoryValue}
              totalItems={totalItems}
              lowStockItems={lowStockItems}
              totalCategories={totalCategories}
            />
          )}

          {/* ================= TRANSACTIONS TAB ================= */}
          {activeTab === "transactions" && (
            <TransactionsTab
              inTransactions={inTransactions}
              outTransactions={outTransactions}
              inSearch={inSearch}
              outSearch={outSearch}
              setForm={setForm}
              setModalType={setModalType}
              setShowModal={setShowModal}
            />
          )}

          {/* ================= DELETED TAB ================= */}
          {activeTab === "deleted" && (
            <DeletedTab
              deletedItems={deletedItems}
              deletedTransactions={deletedTransactions}
              deletedItemSearch={deletedItemSearch}
              deletedTxSearch={deletedTxSearch}
              setConfirmAction={setConfirmAction}
            />
          )}

          {/* ================= MONTHLY REPORT TAB ================= */}
          {activeTab === "report" && (
            <MonthlyReportTab
              monthlyTransactions={monthlyTransactions}
              reportMonth={reportMonth}
              reportYear={reportYear}
              setReportMonth={setReportMonth}
              setReportYear={setReportYear}
              selectedStockRoom={selectedStockRoom}
              exportMonthlyReport={exportMonthlyReport}
              monthlySummary={monthlySummary}
              netValue={netValue}
            />
          )}

          {/* ================= MODAL ================= */}
          {showModal && (
            <Modal
              modalType={modalType}
              setShowModal={setShowModal}
              form={form}
              setForm={setForm}
              items={items}
              brandOptions={brandOptions}
              setBrandOptions={setBrandOptions}
              handleFormChange={handleFormChange}
              handleSubmit={handleSubmit}
              selectedStockRoom={selectedStockRoom}
            />
          )}

          {/* ================= CONFIRM MODAL ================= */}
          {confirmAction && (
            <ConfirmModal
              confirmAction={confirmAction}
              setConfirmAction={setConfirmAction}
              loadData={loadData}
              supabase={supabase}
            />
          )}

          {/* ================= PRINT STYLING ================= */}
          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                #reportSection, #reportSection * { visibility: visible; }
                #reportSection { position: absolute; left: 0; top: 0; width: 100%; }
              }
            `}
          </style>
        </>
      )}
    </div>
  </div>
);

// ================= STOCK INVENTORY TAB =================
function StockInventoryTab({ stockInventory, stockSearch, openCategories, toggleCategory, setForm, setModalType, setShowModal, totalInventoryValue, totalItems, lowStockItems, totalCategories }) {
  return (
    <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search items..."
        value={stockSearch}
        onChange={(e) => setStockSearch(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
      />

      {/* Inventory summary */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div>Total Items: {totalItems}</div>
        <div>Low Stock: {lowStockItems}</div>
        <div>Total Categories: {totalCategories}</div>
        <div>Total Inventory Value: ₱{totalInventoryValue.toLocaleString()}</div>
      </div>

      {/* Inventory table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Category</th>
              <th style={styles.tableHeader}>Item Name</th>
              <th style={styles.tableHeader}>Brand</th>
              <th style={styles.tableHeader}>Stock</th>
              <th style={styles.tableHeader}>Unit Price</th>
              <th style={styles.tableHeader}>Value</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stockInventory.map((item) => (
              <tr key={item.id}>
                <td style={styles.tableCell}>{item.category}</td>
                <td style={styles.tableCell}>{item.item_name}</td>
                <td style={styles.tableCell}>{displayBrand(item.brand)}</td>
                <td style={styles.tableCell}>{item.quantity}</td>
                <td style={styles.tableCell}>₱{item.unit_price?.toLocaleString()}</td>
                <td style={styles.tableCell}>₱{(item.quantity * item.unit_price)?.toLocaleString()}</td>
                <td style={styles.tableCell}>
                  <button onClick={() => { setForm(item); setModalType("edit"); setShowModal(true); }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= TRANSACTIONS TAB =================
function TransactionsTab({ inTransactions, outTransactions, inSearch, outSearch, setForm, setModalType, setShowModal }) {
  return (
    <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
      {/* IN Transactions */}
      <h2>IN Transactions</h2>
      <input
        type="text"
        placeholder="Search IN transactions..."
        value={inSearch}
        onChange={(e) => setInSearch(e.target.value)}
        style={styles.searchInput}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Date</th>
              <th style={styles.tableHeader}>Item</th>
              <th style={styles.tableHeader}>Qty</th>
              <th style={styles.tableHeader}>By</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inTransactions.map(tx => (
              <tr key={tx.id}>
                <td style={styles.tableCell}>{tx.date}</td>
                <td style={styles.tableCell}>{tx.items?.item_name}</td>
                <td style={styles.tableCell}>{tx.quantity}</td>
                <td style={styles.tableCell}>{tx.user_email || tx.user_id}</td>
                <td style={styles.tableCell}>
                  <button onClick={() => { setForm(tx); setModalType("editIn"); setShowModal(true); }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OUT Transactions */}
      <h2 style={{ marginTop: 20 }}>OUT Transactions</h2>
      <input
        type="text"
        placeholder="Search OUT transactions..."
        value={outSearch}
        onChange={(e) => setOutSearch(e.target.value)}
        style={styles.searchInput}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Date</th>
              <th style={styles.tableHeader}>Item</th>
              <th style={styles.tableHeader}>Qty</th>
              <th style={styles.tableHeader}>By</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {outTransactions.map(tx => (
              <tr key={tx.id}>
                <td style={styles.tableCell}>{tx.date}</td>
                <td style={styles.tableCell}>{tx.items?.item_name}</td>
                <td style={styles.tableCell}>{tx.quantity}</td>
                <td style={styles.tableCell}>{tx.user_email || tx.user_id}</td>
                <td style={styles.tableCell}>
                  <button onClick={() => { setForm(tx); setModalType("editOut"); setShowModal(true); }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= DELETED TAB =================
function DeletedTab({ deletedItems, deletedTransactions, deletedItemSearch, deletedTxSearch, setConfirmAction }) {
  return (
    <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
      <h2>Deleted Items</h2>
      <input
        type="text"
        placeholder="Search deleted items..."
        value={deletedItemSearch}
        onChange={(e) => setDeletedItemSearch(e.target.value)}
        style={styles.searchInput}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Item</th>
              <th style={styles.tableHeader}>Category</th>
              <th style={styles.tableHeader}>Deleted By</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deletedItems.map(d => (
              <tr key={d.id}>
                <td style={styles.tableCell}>{d.item_name}</td>
                <td style={styles.tableCell}>{d.category}</td>
                <td style={styles.tableCell}>{d.deleted_by}</td>
                <td style={styles.tableCell}>
                  <button onClick={() => setConfirmAction({ type: "restoreItem", item: d })}>Restore</button>
                  <button onClick={() => setConfirmAction({ type: "deleteItem", item: d })}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 20 }}>Deleted Transactions</h2>
      <input
        type="text"
        placeholder="Search deleted transactions..."
        value={deletedTxSearch}
        onChange={(e) => setDeletedTxSearch(e.target.value)}
        style={styles.searchInput}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Item</th>
              <th style={styles.tableHeader}>Qty</th>
              <th style={styles.tableHeader}>Deleted By</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deletedTransactions.map(d => (
              <tr key={d.id}>
                <td style={styles.tableCell}>{d.items?.item_name}</td>
                <td style={styles.tableCell}>{d.quantity}</td>
                <td style={styles.tableCell}>{d.deleted_by}</td>
                <td style={styles.tableCell}>
                  <button onClick={() => setConfirmAction({ type: "restoreTx", tx: d })}>Restore</button>
                  <button onClick={() => setConfirmAction({ type: "deleteTx", tx: d })}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= MONTHLY REPORT TAB =================
function MonthlyReportTab({ monthlyTransactions, reportMonth, reportYear, setReportMonth, setReportYear, selectedStockRoom, exportMonthlyReport, monthlySummary, netValue }) {
  return (
    <div style={{ flex: 1, padding: 20, overflowY: "auto" }} id="reportSection">
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input type="month" value={`${reportYear}-${reportMonth}`} onChange={(e) => {
          const [y, m] = e.target.value.split("-");
          setReportYear(Number(y));
          setReportMonth(Number(m));
        }} />
        <button onClick={() => exportMonthlyReport(selectedStockRoom, reportMonth, reportYear)}>Export Report</button>
      </div>

      <h2>Monthly Summary</h2>
      <div>Total Transactions: {monthlySummary.totalTx}</div>
      <div>Net Value: ₱{netValue.toLocaleString()}</div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Date</th>
              <th style={styles.tableHeader}>Item</th>
              <th style={styles.tableHeader}>Qty</th>
              <th style={styles.tableHeader}>Type</th>
              <th style={styles.tableHeader}>Value</th>
            </tr>
          </thead>
          <tbody>
            {monthlyTransactions.map(tx => (
              <tr key={tx.id}>
                <td style={styles.tableCell}>{tx.date}</td>
                <td style={styles.tableCell}>{tx.items?.item_name}</td>
                <td style={styles.tableCell}>{tx.quantity}</td>
                <td style={styles.tableCell}>{tx.type}</td>
                <td style={styles.tableCell}>₱{(tx.quantity * tx.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= MODAL COMPONENT =================
function Modal({ modalType, setShowModal, form, setForm, items, brandOptions, setBrandOptions, handleFormChange, handleSubmit, selectedStockRoom }) {
  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent}>
        <h3>{modalType}</h3>

        {/* Item Name */}
        <input
          type="text"
          placeholder="Item Name"
          value={form.item_name || ""}
          onChange={(e) => handleFormChange("item_name", e.target.value)}
        />

        {/* Brand */}
        <input
          type="text"
          placeholder="Brand"
          list="brandOptions"
          value={form.brand || ""}
          onChange={(e) => handleFormChange("brand", e.target.value)}
        />
        <datalist id="brandOptions">
          {brandOptions.map((b, idx) => <option key={idx} value={b} />)}
        </datalist>

        {/* Category */}
        <input
          type="text"
          placeholder="Category"
          value={form.category || ""}
          onChange={(e) => handleFormChange("category", e.target.value)}
        />

        {/* Quantity */}
        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity || ""}
          onChange={(e) => handleFormChange("quantity", e.target.value)}
        />

        {/* Price */}
        <input
          type="number"
          placeholder="Unit Price"
          value={form.price || ""}
          onChange={(e) => handleFormChange("price", e.target.value)}
        />

        {/* Date (for transactions) */}
        {(modalType === "transaction" || modalType.startsWith("edit")) && (
          <input
            type="date"
            value={form.date || ""}
            onChange={(e) => handleFormChange("date", e.target.value)}
          />
        )}

        {/* Type (IN/OUT for transactions) */}
        {(modalType === "transaction" || modalType.startsWith("edit")) && (
          <select value={form.type} onChange={(e) => handleFormChange("type", e.target.value)}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        )}

        {/* Location */}
        <input
          type="text"
          placeholder="Location"
          value={form.location || selectedStockRoom}
          onChange={(e) => handleFormChange("location", e.target.value)}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleSubmit}>Submit</button>
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ================= CONFIRM MODAL =================
function ConfirmModal({ confirmAction, setConfirmAction, loadData, supabase }) {
  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent}>
        <h3>Confirm {confirmAction.type}</h3>
        <p>Are you sure you want to proceed?</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={async () => {
            // handle confirm logic
            setConfirmAction(null);
            await loadData();
          }}>Yes</button>
          <button onClick={() => setConfirmAction(null)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

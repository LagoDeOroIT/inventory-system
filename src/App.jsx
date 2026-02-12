import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" }; // highlight edited row

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

// ================= REUSABLE COMPONENTS =================
const Button = ({ children, onClick, variant }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      background: variant === "secondary" ? "#e5e7eb" : "#1f2937",
      color: variant === "secondary" ? "#111827" : "#fff",
      fontWeight: 500,
    }}
  >
    {children}
  </button>
);

const InputField = props => (
  <input
    {...props}
    style={{
      height: 36,
      padding: "0 10px",
      borderRadius: 6,
      border: "1px solid #d1d5db",
      fontSize: 14,
      ...props.style
    }}
  />
);

const Modal = ({ children, onClose }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        width: 700,
        maxWidth: "95%",
        padding: 24,
        boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
      }}
    >
      {children}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          fontSize: 24,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "#6b7280"
        }}
      >
        &times;
      </button>
    </div>
  </div>
);

export default function App() {
  // ================= AUTH =================
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= GLOBAL STATE =================
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");

  const stockRooms = [
    "All Stock Rooms",
    "L1",
    "L2 Room 1",
    "L2 Room 2",
    "L2 Room 3",
    "L2 Room 4",
    "L3",
    "L5",
    "L6",
    "L7",
    "Maintenance Bodega 1",
    "Maintenance Bodega 2",
    "Maintenance Bodega 3",
    "SKI Stock Room",
    "Quarry Stock Room",
  ];

  // ================= SEARCH / FILTER STATE =================
  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");
  const [deletedSearch, setDeletedSearch] = useState("");

  useEffect(() => { setInSearch(""); }, [inFilter]);
  useEffect(() => { setOutSearch(""); }, [outFilter]);

  // ================= LOAD DATA =================
  const loadData = async () => {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", false).order("date", { ascending: false });
    const { data: deletedTx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", true).order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  };

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= STOCK INVENTORY =================
  const stockInventory = items
    .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id);
      const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)), 0);
      const latestTx = related.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return {
        id: i.id,
        item_name: i.item_name,
        brand: latestTx?.brand || i.brand || "—",
        volume_pack: latestTx?.volume_pack || "—",
        unit_price: Number(latestTx?.unit_price ?? i.unit_price ?? 0),
        stock,
        location: i.location
      };
    });

  // ================= FILTERED TRANSACTIONS =================
  const filteredTransactions = transactions.filter(t => selectedStockRoom === "All Stock Rooms" ? true : t.location === selectedStockRoom);

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = filteredTransactions.reduce((acc, t) => {
    if(!t.date) return acc;
    const month = t.date.slice(0,7);
    acc[month] = acc[month] || {IN:0, OUT:0};
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  // ================= MODALS =================
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({});
  const [deletedAction, setDeletedAction] = useState(null);

  const openTransactionModal = (tx=null) => {
    if(tx) {
      setTransactionForm({ ...tx, quantity: String(tx.quantity), unit_price: String(tx.unit_price || "") });
    } else {
      setTransactionForm({ item_id:"", type:"IN", quantity:"", unit_price:"", date:new Date().toISOString().slice(0,10), location:selectedStockRoom });
    }
    setIsTransactionOpen(true);
  };

  const handleSaveTransaction = async () => {
    if(!transactionForm.item_id || !transactionForm.quantity || !transactionForm.unit_price) return alert("Fill all required fields");

    const payload = {
      ...transactionForm,
      quantity: Number(transactionForm.quantity),
      unit_price: Number(transactionForm.unit_price)
    };

    const { error } = await supabase.from("inventory_transactions").insert([payload]);
    if(error) return alert(error.message);
    setIsTransactionOpen(false);
    loadData();
  };

  const openDeletedAction = (type, transaction) => setDeletedAction({ type, transaction });
  const handleDeletedAction = async () => {
    if(!deletedAction) return;
    const { type, transaction } = deletedAction;
    if(type==="restore") {
      await supabase.from("inventory_transactions").update({ deleted:false, deleted_at:null }).eq("id", transaction.id);
    } else {
      await supabase.from("inventory_transactions").delete().eq("id", transaction.id);
    }
    setDeletedAction(null);
    loadData();
  };

  // ================= AUTH CHECK =================
  if(!session) return (
    <div style={{padding:40}}>
      <h2>Inventory Login</h2>
      <button onClick={()=>supabase.auth.signInWithOAuth({ provider:"google" })}>Login with Google</button>
    </div>
  );

  // ================= RENDER =================
  return (
    <div style={{ padding: 20 }}>

      {/* ===== STOCK ROOM SELECTOR ===== */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
        <label>Stock Room: </label>
        <select value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
          {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* ===== TAB BUTTONS ===== */}
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        {["stock","transactions","report","deleted"].map(tab=>(
          <Button key={tab} onClick={()=>setActiveTab(tab)} variant={activeTab===tab ? undefined : "secondary"}>
            {tab === "stock" ? "📦 Stock" : tab==="transactions"?"📄 Transactions":tab==="report"?"📊 Report":"🗑️ Deleted"}
          </Button>
        ))}
      </div>

      {/* ================= TRANSACTION MODAL ================= */}
      {isTransactionOpen && (
        <Modal onClose={()=>setIsTransactionOpen(false)}>
          <h3>{transactionForm.id?"Edit Transaction":"Add Transaction"}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <select value={transactionForm.item_id} onChange={e=>setTransactionForm({...transactionForm, item_id:e.target.value})}>
              <option value="">-- Select Item --</option>
              {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
            </select>
            <select value={transactionForm.type} onChange={e=>setTransactionForm({...transactionForm, type:e.target.value})}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
            <InputField type="number" placeholder="Quantity" value={transactionForm.quantity} onChange={e=>setTransactionForm({...transactionForm, quantity:e.target.value})}/>
            <InputField type="number" placeholder="Unit Price" value={transactionForm.unit_price} onChange={e=>setTransactionForm({...transactionForm, unit_price:e.target.value})}/>
            <InputField type="date" value={transactionForm.date} onChange={e=>setTransactionForm({...transactionForm, date:e.target.value})}/>
            <select value={transactionForm.location} onChange={e=>setTransactionForm({...transactionForm, location:e.target.value})}>
              {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
            <Button onClick={handleSaveTransaction}>Save</Button>
            <Button variant="secondary" onClick={()=>setIsTransactionOpen(false)}>Cancel</Button>
          </div>
        </Modal>
      )}

      {/* ================= DELETED MODAL ================= */}
      {deletedAction && (
        <Modal onClose={()=>setDeletedAction(null)}>
          <h3>{deletedAction.type==="restore"?"Restore Transaction":"Permanently Delete Transaction"}</h3>
          <p>{deletedAction.type==="restore"?"Restore this transaction?":"This cannot be undone!"}</p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
            <Button onClick={handleDeletedAction}>{deletedAction.type==="restore"?"Restore":"Delete"}</Button>
            <Button variant="secondary" onClick={()=>setDeletedAction(null)}>Cancel</Button>
          </div>
        </Modal>
      )}

      {/* ================= TABS ================= */}
      {activeTab === "stock" && (
        <div>
          <h2>📦 Stock Inventory</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Volume Pack</th>
                <th style={thtd}>Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length===0 && emptyRow(6,"No stock data")}
              {stockInventory.map(i=>(
                <tr key={i.id} style={i.stock<=5?{background:"#fee2e2"}:undefined}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.volume_pack}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{i.unit_price.toFixed(2)}</td>
                  <td style={thtd}>₱{(i.stock*i.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "transactions" && (
        <div>
          <h2>📄 Transactions</h2>
          <Button onClick={()=>openTransactionModal()}>➕ Add Transaction</Button>
          {/* Render your filtered IN/OUT tables similarly */}
        </div>
      )}

      {activeTab === "deleted" && (
        <div>
          <h2>🗑️ Deleted Transactions</h2>
          <InputField placeholder="Search..." value={deletedSearch} onChange={e=>setDeletedSearch(e.target.value)} />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length===0 && emptyRow(5,"No deleted records")}
              {deletedTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(deletedSearch.toLowerCase())).map(t=>(
                <tr key={t.id}>
                  <td style={thtd}>{new Date(t.deleted_at||t.date).toLocaleDateString("en-CA")}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.brand}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={()=>openDeletedAction("restore",t)}>♻️ Restore</button>
                    <button onClick={()=>openDeletedAction("delete",t)}>❌ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "report" && (
        <div>
          <h2>📊 Monthly Report</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Month</th>
                <th style={thtd}>IN Total</th>
                <th style={thtd}>OUT Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyTotals).length===0 && emptyRow(3,"No data")}
              {Object.entries(monthlyTotals).map(([m,v])=>(
                <tr key={m}>
                  <td style={thtd}>{m}</td>
                  <td style={thtd}>₱{v.IN.toFixed(2)}</td>
                  <td style={thtd}>₱{v.OUT.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

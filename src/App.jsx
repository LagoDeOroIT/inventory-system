import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-4 text-gray-400">
      {text}
    </td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");

  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const originalFormRef = useRef(null);
  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    unit_price: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });
  const [itemSearch, setItemSearch] = useState("");

  const stockRooms = [
    "All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3",
    "L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2",
    "Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const [inSearch, setInSearch] = useState("");
  const [outSearch, setOutSearch] = useState("");
  const [deletedSearch, setDeletedSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outFilter, setOutFilter] = useState("all");

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand, location");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false)
      .order("date", { ascending: false });

    const { data: deletedTx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", true)
      .order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
    setShowTxForm(false);
  }, [session]);

  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(
      k => String(originalFormRef.current[k] || "") !== String(form[k] || "")
    );
  }

  async function saveTransaction() {
    if (!form.quantity) return alert("Complete the form");

    let item = items.find(i => i.id === Number(form.item_id));
    if (!item && itemSearch) {
      if (selectedStockRoom === "All Stock Rooms") {
        alert("Select a stock room to create a new item");
        return;
      }
      const { data: newItemData, error: itemErr } = await supabase
        .from("items")
        .insert([{ item_name: itemSearch, location: selectedStockRoom }])
        .select()
        .single();
      if (itemErr) return alert(itemErr.message);
      item = newItemData;
    }
    if (!item) return alert("Item not found");

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(item.id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price) || item.unit_price || 0,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    if (form.type === "IN" && form.unit_price) {
      await supabase.from("items").update({ unit_price: Number(form.unit_price) }).eq("id", item.id);
    }

    const { error } = editingTxId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingTxId)
      : await supabase.from("inventory_transactions").insert([payload]);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingTxId(null);
    loadData();
  }

  const stockInventory = items
    .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id);
      const stock = related.reduce(
        (sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)),
        0
      );
      const latestTx = related.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
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

  const filteredTransactions = transactions.filter(t => selectedStockRoom === "All Stock Rooms" || t.location === selectedStockRoom);
  const monthlyTotals = filteredTransactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const month = t.date.slice(0, 7);
    acc[month] = acc[month] || { IN: 0, OUT: 0 };
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  if (!session) return (
    <div className="p-10 flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold">Inventory Login</h2>
      <button
        onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Login with Google
      </button>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* ===== STOCK ROOM SELECTOR ===== */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <label className="text-gray-700 text-sm">Stock Room</label>
          <select
            value={selectedStockRoom}
            onChange={e => setSelectedStockRoom(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 text-sm"
          >
            {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Lago De Oro Inventory System</h1>
        <p className="text-gray-500 text-sm">Manage stock IN / OUT and reports</p>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex justify-center gap-2 mb-6">
        {["stock","transactions","report","deleted"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1 rounded-full font-medium transition ${
              activeTab === tab ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab === "stock" ? "📦 Stock" : tab === "transactions" ? "📄 Transactions" : tab === "report" ? "📊 Report" : "🗑️ Deleted"}
          </button>
        ))}
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4 text-center">
            <h3 className="text-lg font-semibold">Confirm Action</h3>
            <p className="text-gray-600">{confirm.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                onClick={() => { confirm.onConfirm(); closeConfirm(); }}
              >Confirm</button>
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={closeConfirm}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRANSACTIONS TAB ===== */}
      {activeTab === "transactions" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTxForm(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
            >
              + Add Transaction
            </button>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IN Transactions */}
            <div className="overflow-x-auto border rounded">
              <h4 className="text-center py-2 bg-gray-100 font-medium">⬇️ IN Transactions</h4>
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date","Item","Brand","Volume/Pack","Quantity","Unit Price","Actions"].map(h => (
                      <th key={h} className="border px-2 py-1 text-left text-sm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t=>t.type==="IN").length===0 && emptyRow(7,"No IN transactions")}
                  {filteredTransactions.filter(t=>t.type==="IN").map((t,idx)=>(
                    <tr key={t.id} className={`${idx%2===0?"bg-white":"bg-gray-50"} hover:bg-gray-100`}>
                      <td className="border px-2 py-1 text-sm">{t.date}</td>
                      <td className="border px-2 py-1 text-sm">{t.items?.item_name}</td>
                      <td className="border px-2 py-1 text-sm">{t.brand || "—"}</td>
                      <td className="border px-2 py-1 text-sm">{t.volume_pack || "—"}</td>
                      <td className="border px-2 py-1 text-sm">{t.quantity}</td>
                      <td className="border px-2 py-1 text-sm">₱{Number(t.unit_price||0).toFixed(2)}</td>
                      <td className="border px-2 py-1 flex gap-1">
                        <button className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">✏️</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* OUT Transactions */}
            <div className="overflow-x-auto border rounded">
              <h4 className="text-center py-2 bg-gray-100 font-medium">⬆️ OUT Transactions</h4>
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date","Item","Brand","Volume/Pack","Quantity","Unit Price","Actions"].map(h => (
                      <th key={h} className="border px-2 py-1 text-left text-sm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t=>t.type==="OUT").length===0 && emptyRow(7,"No OUT transactions")}
                  {filteredTransactions.filter(t=>t.type==="OUT").map((t,idx)=>(
                    <tr key={t.id} className={`${idx%2===0?"bg-white":"bg-gray-50"} hover:bg-gray-100`}>
                      <td className="border px-2 py-1 text-sm">{t.date}</td>
                      <td className="border px-2 py-1 text-sm">{t.items?.item_name}</td>
                      <td className="border px-2 py-1 text-sm">{t.brand || "—"}</td>
                      <td className="border px-2 py-1 text-sm">{t.volume_pack || "—"}</td>
                      <td className="border px-2 py-1 text-sm">{t.quantity}</td>
                      <td className="border px-2 py-1 text-sm">₱{Number(t.unit_price||0).toFixed(2)}</td>
                      <td className="border px-2 py-1 flex gap-1">
                        <button className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">✏️</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== STOCK TAB ===== */}
      {activeTab==="stock" && (
        <div className="overflow-x-auto border rounded">
          <h4 className="text-center py-2 bg-gray-100 font-medium">📦 Stock Inventory</h4>
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["Item","Brand","Volume Pack","Stock","Unit Price","Total","Actions"].map(h => (
                  <th key={h} className="border px-2 py-1 text-left text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockInventory.length===0 && emptyRow(7,"No stock data")}
              {stockInventory.map((i,idx)=>(
                <tr key={i.id} className={`${idx%2===0?"bg-white":"bg-gray-50"} hover:bg-gray-100`}>
                  <td className="border px-2 py-1 text-sm">{i.item_name}</td>
                  <td className="border px-2 py-1 text-sm">{i.brand}</td>
                  <td className="border px-2 py-1 text-sm">{i.volume_pack}</td>
                  <td className={`border px-2 py-1 text-sm font-medium ${i.stock<=5?"text-red-600":""}`}>{i.stock}</td>
                  <td className="border px-2 py-1 text-sm">₱{i.unit_price.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-sm">₱{(i.unit_price*i.stock).toFixed(2)}</td>
                  <td className="border px-2 py-1 flex gap-1">
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">✏️</button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MONTHLY REPORT TAB ===== */}
      {activeTab==="report" && (
        <div className="overflow-x-auto border rounded">
          <h4 className="text-center py-2 bg-gray-100 font-medium">📊 Monthly Report</h4>
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["Month","IN Total","OUT Total"].map(h => <th key={h} className="border px-2 py-1 text-left text-sm">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyTotals).length===0 && emptyRow(3,"No data")}
              {Object.entries(monthlyTotals).map(([m,v],idx)=>(
                <tr key={m} className={`${idx%2===0?"bg-white":"bg-gray-50"} hover:bg-gray-100`}>
                                  <td className="border px-2 py-1 text-sm">{m}</td>
                  <td className="border px-2 py-1 text-sm">₱{v.IN.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-sm">₱{v.OUT.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== DELETED TRANSACTIONS TAB ===== */}
      {activeTab === "deleted" && (
        <div className="overflow-x-auto border rounded">
          <h4 className="text-center py-2 bg-gray-100 font-medium">🗑️ Deleted Transactions</h4>
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["Date","Item","Brand","Volume/Pack","Quantity","Unit Price","Deleted At","Actions"].map(h => (
                  <th key={h} className="border px-2 py-1 text-left text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length === 0 && emptyRow(8, "No deleted transactions")}
              {deletedTransactions.map((t, idx) => (
                <tr key={t.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                  <td className="border px-2 py-1 text-sm">{t.date}</td>
                  <td className="border px-2 py-1 text-sm">{t.items?.item_name}</td>
                  <td className="border px-2 py-1 text-sm">{t.brand || "—"}</td>
                  <td className="border px-2 py-1 text-sm">{t.volume_pack || "—"}</td>
                  <td className="border px-2 py-1 text-sm">{t.quantity}</td>
                  <td className="border px-2 py-1 text-sm">₱{Number(t.unit_price || 0).toFixed(2)}</td>
                  <td className="border px-2 py-1 text-sm">{t.deleted_at?.slice(0, 10)}</td>
                  <td className="border px-2 py-1 flex gap-1">
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() =>
                        openConfirm("Restore this transaction?", async () => {
                          await supabase.from("inventory_transactions").update({ deleted: false }).eq("id", t.id);
                          loadData();
                        })
                      }
                    >
                      ♻️ Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== TRANSACTION FORM MODAL ===== */}
      {showTxForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">{editingTxId ? "Edit Transaction" : "Add Transaction"}</h3>
            <input
              type="text"
              placeholder="Search or new item"
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Unit Price"
              value={form.unit_price}
              onChange={e => setForm({ ...form, unit_price: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowTxForm(false);
                  setEditingTxId(null);
                  setForm({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                onClick={saveTransaction}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

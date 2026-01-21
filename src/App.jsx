import { useState, useMemo } from "react";

/* ---------- HELPERS ---------- */
const confirmAction = (msg) => window.confirm(msg);

const paginate = (data, page, size) =>
  data.slice((page - 1) * size, page * size);

/* ---------- APP ---------- */
export default function App() {
  const [tab, setTab] = useState("dashboard");

  const [items, setItems] = useState([
    { id: 1, name: "Cement", brand: "ABC", price: 250 },
    { id: 2, name: "Steel", brand: "XYZ", price: 500 },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, date: "2026-01-21", itemId: 2, type: "OUT", qty: 16 },
    { id: 2, date: "2026-01-21", itemId: 1, type: "IN", qty: 1 },
    { id: 3, date: "2026-01-20", itemId: 1, type: "IN", qty: 10 },
  ]);

  const [deleted, setDeleted] = useState([]);

  const [newItem, setNewItem] = useState({ name: "", brand: "", price: "" });
  const [txForm, setTxForm] = useState({ itemId: "", type: "IN", qty: "", date: "" });

  const [txPage, setTxPage] = useState(1);
  const [delPage, setDelPage] = useState(1);

  const PAGE_SIZE = 5;

  /* ---------- STOCK CALC ---------- */
  const stock = useMemo(() => {
    return items.map((i) => {
      const ins = transactions
        .filter((t) => t.itemId === i.id && t.type === "IN")
        .reduce((a, b) => a + b.qty, 0);
      const outs = transactions
        .filter((t) => t.itemId === i.id && t.type === "OUT")
        .reduce((a, b) => a + b.qty, 0);
      const qty = ins - outs;
      return { ...i, qty, value: qty * i.price };
    });
  }, [items, transactions]);

  const lowStockCount = stock.filter((i) => i.qty <= 5).length;

  /* ---------- ACTIONS ---------- */
  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    setItems([...items, { id: Date.now(), ...newItem, price: +newItem.price }]);
    setNewItem({ name: "", brand: "", price: "" });
  };

  const addTransaction = () => {
    if (!txForm.itemId || !txForm.qty || !txForm.date) return;
    setTransactions([
      ...transactions,
      { id: Date.now(), ...txForm, qty: +txForm.qty },
    ]);
    setTxForm({ itemId: "", type: "IN", qty: "", date: "" });
  };

  const deleteTx = (tx) => {
    if (!confirmAction("Confirm delete?")) return;
    setTransactions(transactions.filter((t) => t.id !== tx.id));
    setDeleted([...deleted, tx]);
  };

  const restoreTx = (tx) => {
    if (!confirmAction("Confirm restore?")) return;
    setDeleted(deleted.filter((d) => d.id !== tx.id));
    setTransactions([...transactions, tx]);
  };

  const deleteForever = (tx) => {
    if (!confirmAction("Delete permanently?")) return;
    setDeleted(deleted.filter((d) => d.id !== tx.id));
  };

  /* ---------- REPORT ---------- */
  const report = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const month = t.date.slice(0, 7);
      map[month] = (map[month] || 0) + (t.type === "IN" ? t.qty : -t.qty);
    });
    return Object.entries(map);
  }, [transactions]);

  /* ---------- UI ---------- */
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Inventory System</h1>

      {["dashboard", "transactions", "deleted", "report"].map((t) => (
        <button key={t} onClick={() => setTab(t)} style={{ marginRight: 6 }}>
          {t.toUpperCase()}
        </button>
      ))}

      {/* ---------- DASHBOARD ---------- */}
      {tab === "dashboard" && (
        <>
          <div style={{ marginTop: 20 }}>
            <strong>Low Stock (≤5)</strong>
            <h2>{lowStockCount}</h2>
          </div>

          <h3>Add New Item</h3>
          <input placeholder="Item name" value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Brand" value={newItem.brand}
            onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })} />
          <input type="number" placeholder="Price" value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
          <button onClick={addItem}>Add</button>

          <h3>Stock Inventory</h3>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Item</th><th>Brand</th><th>Qty</th><th>Value</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((i) => (
                <tr key={i.id} style={i.qty <= 5 ? { background: "#fee2e2" } : {}}>
                  <td>{i.name}</td>
                  <td>{i.brand}</td>
                  <td>{i.qty}</td>
                  <td>₱{i.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ---------- TRANSACTIONS ---------- */}
      {tab === "transactions" && (
        <>
          <h3>Add / Edit Transaction</h3>
          <select value={txForm.itemId}
            onChange={(e) => setTxForm({ ...txForm, itemId: +e.target.value })}>
            <option value="">Select item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>

          <select value={txForm.type}
            onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}>
            <option>IN</option>
            <option>OUT</option>
          </select>

          <input type="number" placeholder="Qty" value={txForm.qty}
            onChange={(e) => setTxForm({ ...txForm, qty: e.target.value })} />
          <input type="date" value={txForm.date}
            onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
          <button onClick={addTransaction}>Save</button>

          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(transactions, txPage, PAGE_SIZE).map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{items.find(i => i.id === t.itemId)?.name}</td>
                  <td>{t.type}</td>
                  <td>{t.qty}</td>
                  <td>
                    <button onClick={() => deleteTx(t)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button disabled={txPage === 1} onClick={() => setTxPage(txPage - 1)}>Prev</button>
          <button onClick={() => setTxPage(txPage + 1)}>Next</button>
        </>
      )}

      {/* ---------- DELETED ---------- */}
      {tab === "deleted" && (
        <>
          <table border="1" width="100%">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginate(deleted, delPage, PAGE_SIZE).map((t) => (
                <tr key={t.id}>
                  <td>{items.find(i => i.id === t.itemId)?.name}</td>
                  <td>{t.qty}</td>
                  <td>
                    <button onClick={() => restoreTx(t)}>Restore</button>
                    <button onClick={() => deleteForever(t)}>Delete Permanently</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button disabled={delPage === 1} onClick={() => setDelPage(delPage - 1)}>Prev</button>
          <button onClick={() => setDelPage(delPage + 1)}>Next</button>
        </>
      )}

      {/* ---------- REPORT ---------- */}
      {tab === "report" && (
        <>
          <h3>Monthly Report</h3>
          <table border="1" width="100%">
            <thead>
              <tr><th>Month</th><th>Net Qty</th></tr>
            </thead>
            <tbody>
              {report.map(([m, q]) => (
                <tr key={m}><td>{m}</td><td>{q}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

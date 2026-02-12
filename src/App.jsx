import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  app: {
    display: "flex",
    fontFamily:
      "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial",
    WebkitFontSmoothing: "antialiased",
    background: "#f8fafc",
    minHeight: "100vh",
  },

  sidebar: {
    width: 250,
    background: "linear-gradient(180deg,#020617,#020617)",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
  },

  logo: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 32,
    letterSpacing: -0.5,
  },

  navBtn: (active) => ({
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: active ? "#1e293b" : "transparent",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
    cursor: "pointer",
    textAlign: "left",
  }),

  main: { flex: 1, padding: 28 },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  h1: { fontSize: 26, fontWeight: 800, margin: 0 },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 6px 20px rgba(0,0,0,.06)",
    marginBottom: 24,
  },

  select: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
  },

  button: {
    background: "#020617",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: 12,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#475569",
    borderBottom: "2px solid #e5e7eb",
    textAlign: "left",
  },
  td: { padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 14 },

  modalBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },

  modal: {
    background: "#fff",
    width: 520,
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,.25)",
  },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
  },
};

// ================= APP =================
export default function App() {
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState("");
  const [items, setItems] = useState([]);
  const [tx, setTx] = useState([]);
  const [deleted, setDeleted] = useState([]);
  const [tab, setTab] = useState("stock");
  const [show, setShow] = useState(false);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadRooms();
  }, [session]);

  useEffect(() => {
    if (room) loadData(room);
  }, [room]);

  async function loadRooms() {
    const { data } = await supabase.from("stock_rooms").select("*");
    setRooms(data || []);
    if (data?.length) setRoom(data[0].id);
  }

  async function loadData(id) {
    const { data: i } = await supabase
      .from("items")
      .select("*")
      .eq("stock_room_id", id);

    const { data: t } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("stock_room_id", id)
      .eq("deleted", false)
      .order("date", { ascending: false });

    const { data: d } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("stock_room_id", id)
      .eq("deleted", true)
      .order("deleted_at", { ascending: false });

    setItems(i || []);
    setTx(t || []);
    setDeleted(d || []);
  }

  const stock = items.map((i) => {
    const rel = tx.filter((t) => t.item_id === i.id);
    const qty = rel.reduce(
      (s, t) => s + (t.type === "IN" ? +t.quantity : -t.quantity),
      0
    );
    return { ...i, stock: qty };
  });

  async function save() {
    if (!form.item_id || !form.quantity || !form.unit_price || !form.date)
      return alert("Complete all required fields");

    await supabase
      .from("inventory_transactions")
      .insert([{ ...form, stock_room_id: room }]);

    setShow(false);
    loadData(room);
  }

  if (!session)
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <h2>Enterprise Inventory Login</h2>
        <button
          style={styles.button}
          onClick={() =>
            supabase.auth.signInWithOAuth({ provider: "google" })
          }
        >
          Login with Google
        </button>
      </div>
    );

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Lago De Oro</div>

        <button style={styles.navBtn(tab === "stock")} onClick={() => setTab("stock")}>📦 Stock</button>
        <button style={styles.navBtn(tab === "tx")} onClick={() => setTab("tx")}>📄 Transactions</button>
        <button style={styles.navBtn(tab === "deleted")} onClick={() => setTab("deleted")}>🗑 Deleted</button>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.h1}>Inventory System</h1>
          <div style={{ display: "flex", gap: 12 }}>
            <select style={styles.select} value={room} onChange={(e) => setRoom(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <button style={styles.button} onClick={() => setShow(true)}>
              + Transaction
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Pack</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Unit Price</th>
                <th style={styles.th}>Value</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((i) => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : {}}>
                  <td style={styles.td}>{i.item_name}</td>
                  <td style={styles.td}>{i.brand}</td>
                  <td style={styles.td}>{i.volume_pack}</td>
                  <td style={styles.td}>{i.stock}</td>
                  <td style={styles.td}>₱{i.unit_price}</td>
                  <td style={styles.td}>
                    ₱{(i.stock * i.unit_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL */}
      {show && (
        <div style={styles.modalBg} onClick={() => setShow(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Add Transaction</h3>
            <div style={styles.grid}>
              <select style={styles.input} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.item_name}
                  </option>
                ))}
              </select>

              <select style={styles.input} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>

              <input style={styles.input} placeholder="Quantity" type="number" onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              <input style={styles.input} placeholder="Unit Price" type="number" onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
              <input style={styles.input} type="date" onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <input style={styles.input} placeholder="Brand" onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              <input style={styles.input} placeholder="Unit" onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <input style={styles.input} placeholder="Pack" onChange={(e) => setForm({ ...form, volume_pack: e.target.value })} />
            </div>

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button style={styles.button} onClick={save}>
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

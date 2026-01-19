const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const footerTd = { ...thtd, fontWeight: "bold", background: "#f6f6f6" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

// ================= ITEM MANAGER =================
function ItemManager({ onAdded, onEditRef }) {
function ItemManager({ onAdded, onEdit }) {
  const [editingItemId, setEditingItemId] = useState(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!onEditRef) return;
    onEditRef.current = (item) => {
    if (!onEdit) return;
    onEdit.current = (item) => {
      setEditingItemId(item.id);
      setName(item.item_name);
      setBrand(item.brand || "");
      setPrice(item.unit_price);
    };
  }, [onEditRef]);
  }, [onEdit]);

  async function addOrUpdateItem() {
    if (!name || !price) return alert("Item name and price required");
@@ -55,7 +55,9 @@ function ItemManager({ onAdded, onEditRef }) {
    onAdded && onAdded();
  }

  return (
export default function App() {


    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} />
@@ -65,17 +67,43 @@ function ItemManager({ onAdded, onEditRef }) {
  );
}

// ================= MAIN APP =================
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input placeholder="Item name (e.g. Cement, Beer)" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} />
      <input type="number" placeholder="Unit price" value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={addOrUpdateItem}>{editingItemId ? "Update Item" : "Add Item"}</button>
    </div>
  );
}


export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const editItemRef = useRef(null);

  const [deletedTransactions, setDeletedTransactions] = useState([]);

  // Pagination
  const PAGE_SIZE = 5;
  const REPORT_PAGE_SIZE = 5;
  const [pageIn, setPageIn] = useState(1);
  const [pageOut, setPageOut] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  // Filters / UI
  const [deletedSearch, setDeletedSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [reportMonth, setReportMonth] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);

  // Currency (fixed to PHP)
  const currencySymbol = "₱";
  const formatMoney = (v) => `${currencySymbol}${new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(Number(v || 0))}`;
  const formatMoney = (v) => `${currencySymbol}${new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0))}`;

  // Form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
@@ -86,6 +114,7 @@ export default function App() {
    volume_pack: "",
  });

  // Item search
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);
@@ -103,17 +132,25 @@ export default function App() {
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
  }, [session]);

  // ================= SAVE TRANSACTION =================
  // ================= SAVE =================
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");

@@ -126,19 +163,42 @@ export default function App() {
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      brand: item.brand,
      brand: form.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    const { error } = await supabase.from("inventory_transactions").insert(payload);
    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= CONFIRM HELPERS =================
  const confirm = (text, action, danger) => setConfirmModal({ text, action, danger });

  const paginate = (current, set, total) => (
    <div style={{ marginTop: 10 }}>
      <button disabled={current === 1} onClick={() => set(current - 1)}>Prev</button>
      <span style={{ margin: "0 10px" }}>Page {current}</span>
      <button disabled={current >= total} onClick={() => set(current + 1)}>Next</button>
    </div>
  );

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
@@ -150,95 +210,323 @@ export default function App() {

  return (
    <div style={{ padding: 20 }}>
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: 20 }}>
            <p>{confirmModal.text}</p>
            <button
              style={{ marginRight: 8, color: confirmModal.danger ? "red" : "black" }}
              onClick={() => {
                confirmModal.action();
                setConfirmModal(null);
              }}
            >
              Confirm
            </button>
            <button onClick={() => setConfirmModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      <h1 style={{ textAlign: "center" }}>Inventory System</h1>

      {/* ITEM MENU */}
      <div style={{ border: "1px solid #ddd", padding: 15, marginBottom: 20 }}>
        <h2>Item Menu</h2>
        <ItemManager onAdded={loadData} onEditRef={editItemRef} />

        <table style={{ ...tableStyle, marginTop: 15, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thtd}>Item</th>
              <th style={thtd}>Brand</th>
              <th style={thtd}>Unit Price</th>
              <th style={thtd}>Action</th>
        <h2>Item Menu (Add New Item)</h2>
        {(() => {
  const editRef = useRef(null);
  return (
    <>
      <ItemManager onAdded={loadData} onEdit={editRef} />
      <table style={{ ...tableStyle, marginTop: 15, fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Unit Price</th>
            <th style={thtd}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && emptyRow(4, "No items yet")}
          {items.map(i => (
            <tr key={i.id}>
              <td style={thtd}>{i.item_name}</td>
              <td style={thtd}>{i.brand}</td>
              <td style={thtd}>{formatMoney(i.unit_price)}</td>
              <td style={thtd}>
                <button onClick={() => confirm("Edit this item?", () => editRef.current(i))}>✏️</button>
                <button onClick={() => confirm("Delete this item?", async () => {
                  await supabase.from("items").delete().eq("id", i.id);
                  loadData();
                }, true)}>🗑️</button>
              </td>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && emptyRow(4, "No items yet")}
            {items.map(i => (
              <tr key={i.id}>
                <td style={thtd}>{i.item_name}</td>
                <td style={thtd}>{i.brand}</td>
                <td style={thtd}>{formatMoney(i.unit_price)}</td>
                <td style={thtd}>
                  <button onClick={() => editItemRef.current(i)}>✏️</button>
                  <button onClick={async () => {
                    await supabase.from("items").delete().eq("id", i.id);
                    loadData();
                  }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          ))}
        </tbody>
      </table>
    </>
  );
})()}

      <table style={{ ...tableStyle, marginTop: 15, fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Unit Price</th>
            <th style={thtd}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && emptyRow(4, "No items yet")}
          {items.map(i => (
            <tr key={i.id}>
              <td style={thtd}>{i.item_name}</td>
              <td style={thtd}>{i.brand}</td>
              <td style={thtd}>{formatMoney(i.unit_price)}</td>
              <td style={thtd}>
                <button onClick={() => confirm("Edit this item?", () => {
                  setEditingId(null);
                  document.querySelector('input[placeholder="Item name (e.g. Cement, Beer)"]').value = i.item_name;
                })}>✏️</button>
                <button onClick={() => confirm("Delete this item?", async () => {
                  await supabase.from("items").delete().eq("id", i.id);
                  loadData();
                }, true)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* TRANSACTION FORM */}
      

      {/* FORM */}
      <div ref={searchRef} style={{ position: "relative", width: 250 }}>
        <input
          value={itemSearch}
          placeholder="Search item"
          onFocus={() => setDropdownOpen(true)}
          onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }}
        />
        <input value={itemSearch} placeholder="Search item" onFocus={() => setDropdownOpen(true)} onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }} />
        {dropdownOpen && (
          <div style={{ border: "1px solid #ccc", background: "#fff" }}>
            {items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
              <div key={i.id} onClick={() => {
                setForm({ ...form, item_id: i.id });
                setItemSearch(`${i.item_name} (${i.brand})`);
                setDropdownOpen(false);
              }}>{i.item_name} ({i.brand})</div>
              <div key={i.id} onClick={() => { setForm({ ...form, item_id: i.id }); setItemSearch(i.item_name); setDropdownOpen(false); }}>{i.item_name}</div>
            ))}
          </div>
        )}
      </div>

      <input placeholder="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
      <input placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      <input placeholder="Volume / Pack" value={form.volume_pack} onChange={e => setForm({ ...form, volume_pack: e.target.value })} />
      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>IN</option><option>OUT</option></select>
      <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <button onClick={saveTransaction}>Save</button>
      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

      {/* TRANSACTIONS */}
      <h2 style={{ textAlign: "center", marginTop: 30 }}>Transactions</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Qty</th>
            <th style={thtd}>Total</th>
<h2 style={{ textAlign: "center", width: "100%" }}>Transactions History</h2>
<div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
  <div style={{ flex: 1, minWidth: 420 }}>
    <h2 style={{ textAlign: "center" }}>IN</h2>
    <table style={{ ...tableStyle, fontSize: 13 }}>
      <thead>
        <tr><th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Vol</th><th style={thtd}>Qty</th><th style={thtd}>Total Price</th><th style={thtd}>Act</th></tr>
      </thead>
      <tbody>
        {transactions.filter(t=>t.type==="IN").length===0 && emptyRow(8,"No IN transactions")}
        {transactions.filter(t=>t.type==="IN")
          .slice((pageIn-1)*PAGE_SIZE,pageIn*PAGE_SIZE)
          .map(t=> (
          <tr key={t.id}>
            <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
            <td style={thtd}>{t.items?.item_name}</td>
            <td style={thtd}>{t.brand}</td>
            <td style={thtd}>{t.unit}</td>
            <td style={thtd}>{t.volume_pack}</td>
            <td style={thtd}>{t.quantity}</td>
            <td style={thtd}>{formatMoney(t.quantity * t.unit_price)}</td>
            <td style={thtd}>
              <button onClick={()=>confirm("Edit this transaction?",()=>{
                setEditingId(t.id);
                setForm({ item_id:t.item_id,type:t.type,quantity:t.quantity,date:t.date,brand:t.brand||"",unit:t.unit||"",volume_pack:t.volume_pack||""});
                setItemSearch(t.items?.item_name||"");
              })}>✏️</button>
              <button onClick={()=>confirm("Delete transaction?",async()=>{await supabase.from("inventory_transactions").update({deleted:true}).eq("id",t.id);loadData();},true)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {paginate(pageIn,setPageIn,Math.ceil(transactions.filter(t=>t.type==="IN").length/PAGE_SIZE))}
  </div>

  <div style={{ flex: 1, minWidth: 420, borderLeft: "1px solid #e0e0e0", paddingLeft: 20 }}>
    <h2 style={{ textAlign: "center" }}>OUT</h2>
    <table style={{ ...tableStyle, fontSize: 13 }}>
      <thead>
        <tr><th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Vol</th><th style={thtd}>Qty</th><th style={thtd}>Total Price</th><th style={thtd}>Act</th></tr>
      </thead>
      <tbody>
        {transactions.filter(t=>t.type==="OUT").length===0 && emptyRow(8,"No OUT transactions")}
        {transactions.filter(t=>t.type==="OUT").slice((pageOut-1)*PAGE_SIZE,pageOut*PAGE_SIZE).map(t=> (
          <tr key={t.id}>
            <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
            <td style={thtd}>{t.items?.item_name}</td>
            <td style={thtd}>{t.brand}</td>
            <td style={thtd}>{t.unit}</td>
            <td style={thtd}>{t.volume_pack}</td>
            <td style={thtd}>{t.quantity}</td>
            <td style={thtd}>{formatMoney(t.quantity * t.unit_price)}</td>
            <td style={thtd}>
              <button onClick={()=>confirm("Edit this transaction?",()=>{
                setEditingId(t.id);
                setForm({ item_id:t.item_id,type:t.type,quantity:t.quantity,date:t.date,brand:t.brand||"",unit:t.unit||"",volume_pack:t.volume_pack||""});
                setItemSearch(t.items?.item_name||"");
              })}>✏️</button>
              <button onClick={()=>confirm("Delete transaction?",async()=>{await supabase.from("inventory_transactions").update({deleted:true}).eq("id",t.id);loadData();},true)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {paginate(pageOut,setPageOut,Math.ceil(transactions.filter(t=>t.type==="OUT").length/PAGE_SIZE))}
  </div>
</div>

      {/* DELETE HISTORY */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30 }}>
  <h2>Delete History</h2>
  <button
    title="Toggle Delete History"
    onClick={() => setShowDeleted(v => !v)}
    style={{ fontSize: 18 }}
  >
    🗑️
  </button>
</div>
      {showDeleted && (
        <input
          placeholder="Search delete history"
          value={deletedSearch}
          onChange={e => {
            setDeletedSearch(e.target.value);
            setDeletedPage(1);
          }}
        />
      )}

      {showDeleted && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Unit</th>
                <th style={thtd}>Volume</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions
                .filter(t =>
                  !deletedSearch ||
                  t.items?.item_name?.toLowerCase().includes(deletedSearch.toLowerCase()) ||
                  t.brand?.toLowerCase().includes(deletedSearch.toLowerCase())
                )
                .slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE)
                .map(t => (
                  <tr key={t.id}>
                    <td style={thtd}>{new Date(t.deleted_at || t.date).toLocaleDateString("en-CA")}</td>
                    <td style={thtd}>{t.items?.item_name}</td>
                    <td style={thtd}>{t.brand}</td>
                    <td style={thtd}>{t.unit}</td>
                    <td style={thtd}>{t.volume_pack}</td>
                    <td style={thtd}>{t.quantity}</td>
                    <td style={thtd}>
                      <button onClick={() => confirm("Restore transaction?", async () => {
                        await supabase.from("inventory_transactions").update({ deleted: false }).eq("id", t.id);
                        loadData();
                      })}>♻️</button>
                      <button onClick={() => confirm("Permanent delete?", async () => {
                        await supabase.from("inventory_transactions").delete().eq("id", t.id);
                        loadData();
                      }, true)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              {deletedTransactions.length === 0 && emptyRow(7, "No deleted records")}
            </tbody>
          </table>
          {paginate(deletedPage, setDeletedPage, Math.ceil(deletedTransactions.length / PAGE_SIZE))}
        </>
      )}

      {/* MONTHLY REPORT */}
<div style={{ marginTop: 40 }}>
  <h2 style={{ textAlign: "center" }}>Monthly Report</h2>
  <input type="month" value={reportMonth} onChange={e=>{setReportMonth(e.target.value);setReportPage(1);}} />

  <div style={{ display: "flex", gap: 20, marginTop: 20, alignItems: "flex-start", flexWrap: "wrap", borderTop: "1px solid #ddd", paddingTop: 20 }}>
    <div style={{ flex: 1, minWidth: 420 }}>
      <h2 style={{ textAlign: "center" }}>IN</h2>
      <table style={{ ...tableStyle, fontSize: 13 }}>
        <thead>
          <tr><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Vol</th><th style={thtd}>Qty</th><th style={thtd}>Total</th></tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(5, "No transactions")}
          {transactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>{formatMoney(t.quantity * t.unit_price)}</td>
            </tr>
          ))}
          {(() => {
            const filtered = transactions.filter(t=>t.type==="IN" && (!reportMonth || t.date?.startsWith(reportMonth)));
            const grouped = {};
            filtered.forEach(t=>{
              const key = `${t.item_id}-${t.brand}-${t.unit}-${t.volume_pack}`;
              if(!grouped[key]) grouped[key]={name:t.items?.item_name,brand:t.brand,unit:t.unit,volume:t.volume_pack,qty:0,total:0};
              grouped[key].qty+=t.quantity;
              grouped[key].total+=t.quantity*t.unit_price;
            });
            const rows = Object.values(grouped);
            if(!rows.length) return emptyRow(6,"No IN data");
            return rows.slice((reportPage-1)*REPORT_PAGE_SIZE,reportPage*REPORT_PAGE_SIZE).map((r,i)=>(
              <tr key={i}><td style={thtd}>{r.name}</td><td style={thtd}>{r.brand}</td><td style={thtd}>{r.unit}</td><td style={thtd}>{r.volume}</td><td style={thtd}>{r.qty}</td><td style={thtd}>{formatMoney(r.total)}</td></tr>
            ));
          })()}
        </tbody>
      </table>
    </div>

    <div style={{ flex: 1, minWidth: 420 }}>
      <h2 style={{ textAlign: "center" }}>OUT</h2>
      <table style={{ ...tableStyle, fontSize: 13 }}>
        <thead>
          <tr><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Vol</th><th style={thtd}>Qty</th><th style={thtd}>Total</th></tr>
        </thead>
        <tbody>
          {(() => {
            const filtered = transactions.filter(t=>t.type==="OUT" && (!reportMonth || t.date?.startsWith(reportMonth)));
            const grouped = {};
            filtered.forEach(t=>{
              const key = `${t.item_id}-${t.brand}-${t.unit}-${t.volume_pack}`;
              if(!grouped[key]) grouped[key]={name:t.items?.item_name,brand:t.brand,unit:t.unit,volume:t.volume_pack,qty:0,total:0};
              grouped[key].qty+=t.quantity;
              grouped[key].total+=t.quantity*t.unit_price;
            });
            const rows = Object.values(grouped);
            if(!rows.length) return emptyRow(6,"No OUT data");
            return rows.slice((reportPage-1)*REPORT_PAGE_SIZE,reportPage*REPORT_PAGE_SIZE).map((r,i)=>(
              <tr key={i}><td style={thtd}>{r.name}</td><td style={thtd}>{r.brand}</td><td style={thtd}>{r.unit}</td><td style={thtd}>{r.volume}</td><td style={thtd}>{r.qty}</td><td style={thtd}>{formatMoney(r.total)}</td></tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  </div>

  {paginate(reportPage, setReportPage, Math.ceil(
    transactions.filter(t => (!reportMonth || t.date?.startsWith(reportMonth))).length / REPORT_PAGE_SIZE
  ))}
</div>
    </div>
  );

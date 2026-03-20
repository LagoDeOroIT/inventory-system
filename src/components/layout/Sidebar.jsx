export default function Sidebar({
  stockRooms,
  userRooms,
  selectedStockRoom,
  setSelectedStockRoom,
  activeTab,
  setActiveTab,
  handleNewClick,
  session,
  supabase,
  setSession
}) {
  return (
    <div
      style={{
        width: 220,
        background: "#111827",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100vh",
        padding: "16px 12px",
        boxSizing: "border-box"
      }}
    >
      {/* Top Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Lago De Oro
        </div>

        <select
          style={{
            padding: 8,
            borderRadius: 6,
            border: "none",
            width: "100%"
          }}
          value={selectedStockRoom}
          onChange={(e) => {
            const room = e.target.value;
            setSelectedStockRoom(room === "" ? "" : room);
          }}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setActiveTab("stock")}>📦 Stock Inventory</button>
          <button onClick={() => setActiveTab("transactions")}>📄 Transactions</button>
          <button onClick={() => setActiveTab("deleted")}>🗑️ Deleted History</button>
          <button onClick={() => setActiveTab("report")}>📊 Monthly Report</button>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {session?.user?.email && (
          <div style={{ fontSize: 12 }}>
            Logged in as <br />
            <b>{session.user.email}</b>
          </div>
        )}

        <button onClick={handleNewClick}>+ New</button>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setSelectedStockRoom("");
            setSession(null);
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

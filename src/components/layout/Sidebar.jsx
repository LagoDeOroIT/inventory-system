export default function Sidebar({
  styles,
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
            <span style={{ fontWeight: 700 }}>
              {session.user.email}
            </span>
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
            setSelectedStockRoom("");
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
  );
}

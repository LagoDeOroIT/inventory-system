// ================= STYLES =================

const styles = {
  // ================= LAYOUT =================
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "12px",
    gap: "12px",
    background: "#f3f4f6"
  },

  sidebar: {
    width: 220,
    background: "#111827",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    top: 0
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    padding: "16px"
  },

  // ================= SIDEBAR =================
  sidebarHeader: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 24
  },

  sidebarSelect: {
    marginBottom: 24,
    padding: 8,
    borderRadius: 6,
    border: "none",
    width: "100%"
  },

  sidebarTabs: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  tabButton: (active) => ({
    padding: 10,
    borderRadius: 6,
    background: active ? "#1f2937" : "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left"
  }),

  // ================= TABLE =================
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 16
  },

  thtd: {
    border: "1px solid #e5e7eb",
    padding: 8,
    textAlign: "left"
  },

  // ================= CARD =================
  card: {
    background: "#fff",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },

  // ================= DASHBOARD =================
  dashboard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 20,
    marginBottom: 20
  },

  dashboardCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "18px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
  },

  dashboardTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6
  },

  dashboardValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827"
  },

  // ================= CATEGORY =================
  categoryRow: {
    background: "#f8fafc",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    cursor: "pointer"
  },

  categoryContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600
  },

  categoryLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 15
  },

  categoryRight: {
    display: "flex",
    gap: 20,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 500
  },

  // ================= LOGIN =================
  loginPage: {
    display: "flex",
    height: "100vh",
    width: "100%"
  },

  loginLeft: {
    flex: 1,
    background: "#111827",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px"
  },

  loginRight: {
    flex: 1,
    background: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loginCard: {
    width: 380,
    background: "#fff",
    padding: "40px",
    borderRadius: 12,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
  },

  loginTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10
  },

  loginSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 25
  },

  loginInput: {
    width: "100%",
    padding: 12,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    marginBottom: 14
  },

  loginButton: {
    width: "100%",
    padding: 12,
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer"
  },

  // ================= GENERAL UI =================
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111827"
  },

  buttonPrimary: {
    background: "#1f2937",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },

  buttonSecondary: {
    background: "#e5e7eb",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },

  input: {
    width: "100%",
    padding: 8,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #d1d5db"
  },

  notification: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#f59e0b",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 8,
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 10000
  },

  // ================= MODAL =================
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },

  modalCard: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    minWidth: 320,
    maxWidth: 400,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    position: "relative",
    zIndex: 10000
  }
};

export default styles;

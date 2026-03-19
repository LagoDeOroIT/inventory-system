export const styles = {
  container: {
    display: "flex",
    fontFamily: "Inter, Arial, sans-serif",
    height: "100vh",
    padding: "12px",
    gap: "12px",
    background: "#f3f4f6",
    boxSizing: "border-box",
    overflow: "hidden"
  },

  sidebar: {
    width: 220,
    background: "#111827",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    padding: "16px",
    boxSizing: "border-box"
  },

  thtd: {
    border: "1px solid #e5e7eb",
    padding: 10,
    textAlign: "left"
  },

  buttonSecondary: {
    background: "#e5e7eb",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },

  buttonPrimary: {
    background: "#1f2937",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },

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

  welcomeCard: {
    background: "#ffffff",
    padding: "60px 80px",
    borderRadius: 12,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    maxWidth: 700
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    border: "1px solid #d1d5db",
    borderRadius: 10,
    marginTop: 4,
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    maxHeight: 160,
    overflowY: "auto",
    zIndex: 1000
  },

  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    borderBottom: "1px solid #f3f4f6"
  },

  welcomeScreen: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%"
  },

  welcomeContainer: {
    background: "#ffffff",
    padding: "70px 90px",
    borderRadius: 16,
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    maxWidth: 750
  },

  welcomeDivider: {
    width: 120,
    height: 4,
    background: "#d97706",
    margin: "20px auto",
    borderRadius: 2
  },

  welcomeLogo: {
    width: 220,
    marginBottom: 25
  },

  welcomeTitle: {
    fontSize: 30,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.4,
    marginBottom: 10
  },

  welcomeSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 5
  },

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

  card: {
    background: "#fff",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 16
  },

  emptyRow: {
    textAlign: "center",
    padding: 12,
    color: "#6b7280"
  },

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
    position: "relative"
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

  input: {
    width: "100%",
    padding: 8,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #d1d5db"
  },

  toggleGroup: {
    display: "flex",
    gap: 12,
    marginBottom: 12
  },

  newOptionButton: {
    padding: "12px 0",
    marginBottom: 12,
    borderRadius: 8,
    border: "none",
    width: "100%",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 16
  }
};

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "white", background: "#0f172a", minHeight: "100vh" }}>
          <h1 style={{ color: "#ef4444" }}>Algo salió mal (Error de Aplicación)</h1>
          <p>Por favor toma una captura de este error y envíala al desarrollador:</p>
          <pre style={{ background: "rgba(255,255,255,0.1)", padding: "1rem", overflow: "auto", borderRadius: "0.5rem" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

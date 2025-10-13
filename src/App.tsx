import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context
import { AuthProvider } from "./context/AuthContext";
import { STOMPProvider } from "./context/STOMP";

// Config & Constants
import { routes } from "./routes";
import { pageConfigs } from "./configs/pageConfig";
import { ROUTES } from "./constant/routes";

// Components
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Loading } from "@/components/Loading"; // Thêm import này

// Styles
import styles from "./styles/App.module.css";
import RequireAuth from "./components/RequireAuth/RequireAuth";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  let matchedConfig = pageConfigs[ROUTES.NOT_FOUND.path];

  const sortedPageConfigs = Object.entries(pageConfigs).sort(([a], [b]) => b.length - a.length);

  for (const [path, cfg] of sortedPageConfigs) {
    const matched = matchPath({ path, end: true }, location.pathname);
    if (matched) {
      matchedConfig = cfg;
      break;
    }
  }

  return (
    <STOMPProvider>
      <AuthProvider>
        {matchedConfig.showNav && (
          <Navbar
            sidebarOpen={false}
            setSidebarOpen={() => {}}
          />
        )}
        <main className={styles.mainContainer}>{children}</main>
        {matchedConfig.showFooter && <Footer />}
      </AuthProvider>
    </STOMPProvider>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={client}>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              width: "100%",
            }}
          >
            <Loading isVisible variant="fullscreen" />
          </div>
        }
      >
        {" "}
        {/* Thay thế div loading bằng Loading component */}
        <Router>
          <Layout>
            <Routes>
              {routes.map((route) => {
                const routeElement = route.authOnly
                  ? <RequireAuth>{route.element}</RequireAuth>
                  : route.element;

                return (
                  <Route key={route.path} path={route.path} element={routeElement}>
                    {"children" in route &&
                      Array.isArray(route.children) &&
                      route.children.map((child: any) => {
                        const childElement = child.authOnly
                          ? <RequireAuth>{child.element}</RequireAuth>
                          : child.element;

                        return (
                          <Route
                            key={child.path ?? "index"}
                            path={child.index ? undefined : child.path}
                            index={child.index ?? false}
                            element={childElement}
                          />
                        );
                      })}
                  </Route>
                );
              })}
            </Routes>
          </Layout>
        </Router>
      </Suspense>
    </QueryClientProvider>
  );
};

export default App;

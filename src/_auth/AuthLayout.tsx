import { Outlet, Navigate } from "react-router-dom";

import { useUserContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated } = useUserContext();

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <div className="auth-layout">
          <section className="auth-form_section">
            <Outlet />
          </section>

          <section className="auth-showcase">
            <img
              src="/assets/images/explore.jpg"
              alt="Snapgram preview"
              className="auth-showcase_img"
            />
            <div className="auth-showcase_overlay" />
            <div className="auth-showcase_content">
              <div className="auth-showcase_badge">Live moments</div>
              <h1 className="auth-showcase_title">
                Share your world with people who get it.
              </h1>
              <p className="auth-showcase_copy">
                Discover creators, save favorite posts, and keep your best
                memories one tap away.
              </p>

              <div className="auth-showcase_stats">
                <div>
                  <p className="body-bold text-light-1">24k+</p>
                  <p className="small-regular text-light-3">moments shared</p>
                </div>
                <div>
                  <p className="body-bold text-light-1">8k+</p>
                  <p className="small-regular text-light-3">creators</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

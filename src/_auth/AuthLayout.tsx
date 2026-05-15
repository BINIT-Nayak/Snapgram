import { Outlet, Navigate } from "react-router-dom";

import { useUserContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated } = useUserContext();

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <>
          <section className="flex flex-1 justify-center items-center flex-col px-5 py-10">
            <Outlet />
          </section>

          <section className="relative hidden h-screen w-1/2 overflow-hidden xl:block">
            <img
              src="/assets/images/explore.jpg"
              alt="Snapgram preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </section>
        </>
      )}
    </>
  );
}

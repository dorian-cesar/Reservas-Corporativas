// "use client";

// import { create } from "zustand";

// interface UserData {
//   id: string;
//   email: string;
//   name: string;
//   role: string;
//   companyId: string;
//   companyName: string;
//   companyEstado: boolean;
//   companyRecargo: number;
//   companyPorcentajeDevolucion: string;
//   centroCostoId: string;
//   centroCostoName: string;
//   centroCostoEstado: boolean;
// }

// interface UserStore {
//   user: UserData | null;
//   loading: boolean;
//   fetchUser: () => Promise<void>;
// }

// export const useUserStore = create<UserStore>((set) => ({
//   user: null,
//   loading: true,

//   fetchUser: async () => {
//     try {
//       const local = localStorage.getItem("auth-storage");
//       if (!local) {
//         set({ user: null, loading: false });
//         return;
//       }

//       const parsed = JSON.parse(local);
//       const token = parsed?.state?.token;
//       if (!token) {
//         set({ user: null, loading: false });
//         return;
//       }

//       const res = await fetch("/api/users", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.ok) {
//         set({ user: null, loading: false });
//         return;
//       }

//       const data = await res.json();
//       set({ user: data, loading: false });
//     } catch (err) {
//       console.error("Error cargando usuario:", err);
//       set({ user: null, loading: false });
//     }
//   },
// }));

"use client";

import { create } from "zustand";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  companyName: string;
  companyEstado: boolean;
  companyRecargo: number;
  companyPorcentajeDevolucion: string;
  centroCostoId: string;
  centroCostoName: string;
  centroCostoEstado: boolean;
}

interface UserStore {
  user: UserData | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const local = localStorage.getItem("auth-storage");
      if (!local) {
        set({ user: null, loading: false });
        return;
      }

      const parsed = JSON.parse(local);
      const token = parsed?.state?.token;

      if (!token) {
        set({ user: null, loading: false });
        return;
      }

      await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      const fakeUser: UserData = {
        id: "1",
        email: "user@wit.la",
        name: "Test User",
        role: "subusuario",
        companyId: "4",
        companyName: "Wit.la",
        companyEstado: true,
        companyRecargo: 15,
        companyPorcentajeDevolucion: "0.80",
        centroCostoId: "4",
        centroCostoName: "Instalaciones",
        centroCostoEstado: true,
      };

      set({
        user: fakeUser,
        loading: false,
      });
    } catch (err) {
      console.error("Error cargando usuario:", err);
      set({ user: null, loading: false });
    }
  },
}));

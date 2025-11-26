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
      const userId = parsed?.state?.user?.id;

      if (!token || !userId) {
        set({ user: null, loading: false });
        return;
      }

      const res = await fetch(`/api/user?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Error fetching user from API:", res.status);
        set({ user: null, loading: false });
        return;
      }

      const data = await res.json();

      const mappedUser: UserData = {
        id: data.id?.toString() || "",
        email: data.email || "",
        name: data.nombre || "",
        role: data.rol || "",

        companyId: data.empresa?.id?.toString() || "",
        companyName: data.empresa?.nombre || "",
        companyEstado: data.empresa?.estado || false,
        companyRecargo: data.empresa?.recargo || 0,
        companyPorcentajeDevolucion:
          data.empresa?.porcentaje_devolucion?.toString() || "0",

        centroCostoId: data.centroCosto?.id?.toString() || "",
        centroCostoName: data.centroCosto?.nombre || "",
        centroCostoEstado: data.centroCosto?.estado || false,
      };

      set({ user: mappedUser, loading: false });
    } catch (err) {
      console.error("Error cargando usuario:", err);
      set({ user: null, loading: false });
    }
  },
}));

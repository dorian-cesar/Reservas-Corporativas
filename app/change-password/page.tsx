import { Suspense } from "react";
import ChangePasswordClient from "./ChangePasswordClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <ChangePasswordClient />
        </Suspense>
    );
}

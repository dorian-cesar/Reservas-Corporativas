import { SweetAlertOptions } from "sweetalert2";

// Configuración de SweetAlert2 con estilos personalizados
export const swalConfig: SweetAlertOptions = {
  customClass: {
    container: "swal-container",
    popup:
      "swal-popup bg-background border-2 border-border rounded-lg shadow-xl",
    header: "swal-header",
    title: "swal-title text-foreground font-bold text-xl",
    closeButton: "swal-close",
    icon: "swal-icon",
    image: "swal-image",
    content: "swal-content text-foreground",
    htmlContainer: "swal-html-container text-foreground",
    input: "swal-input",
    inputLabel: "swal-input-label",
    validationMessage: "swal-validation-message",
    actions: "swal-actions gap-3",
    confirmButton:
      "swal-confirm-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 py-2 px-4",
    cancelButton:
      "swal-cancel-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4",
    footer: "swal-footer",
  },
  buttonsStyling: false,
  reverseButtons: true,
};

// Configuraciones específicas para diferentes tipos de alertas
export const swalSuccessConfig: SweetAlertOptions = {
  ...swalConfig,
  icon: "success",
  iconColor: "#16a34a",
};

export const swalErrorConfig: SweetAlertOptions = {
  ...swalConfig,
  icon: "error",
  iconColor: "#dc2626",
};

export const swalWarningConfig: SweetAlertOptions = {
  ...swalConfig,
  icon: "warning",
  iconColor: "#d97706",
};

export const swalInfoConfig: SweetAlertOptions = {
  ...swalConfig,
  icon: "info",
  iconColor: "#2563eb",
};

// Función helper para crear alertas con la configuración base
export const createSwalAlert = (
  customConfig: SweetAlertOptions
): SweetAlertOptions => ({
  ...swalConfig,
  ...customConfig,
});

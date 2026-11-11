import Swal from 'sweetalert2';

export const alertDialog = Swal.mixin({
    buttonsStyling: false,
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    customClass: {
        popup: 'rounded-3xl border border-slate-200 shadow-2xl',
        title: 'text-slate-950',
        htmlContainer: 'text-slate-600',
        confirmButton: 'rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800',
        cancelButton: 'mr-3 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50',
    },
});

export function showSuccess(title, text = '') {
    return alertDialog.fire({
        icon: 'success',
        title,
        text,
    });
}

export function showError(title, text = '') {
    return alertDialog.fire({
        icon: 'error',
        title,
        text,
    });
}

export function showInfo(title, text = '') {
    return alertDialog.fire({
        icon: 'info',
        title,
        text,
    });
}

export function showWarning(title, text = '') {
    return alertDialog.fire({
        icon: 'warning',
        title,
        text,
    });
}

export function showLoading(title, text = '') {
    return alertDialog.fire({
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
}

export function closeAlert() {
    Swal.close();
}

export function confirmAction(title, text = '') {
    return alertDialog.fire({
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
    });
}


import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export async function sweetAlert(): Promise<boolean> {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  });

  return result.isConfirmed;
}

export function successDeleteAlert(): void {
  void Swal.fire({
    title: 'Deleted!',
    text: 'Record has been deleted.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  });
}

export function toastSuccess(message: string): void {
  toast.success(message);
}

export function toastError(message: string): void {
  toast.error(message);
}

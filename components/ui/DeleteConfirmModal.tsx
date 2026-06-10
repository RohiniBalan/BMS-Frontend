"use client";

import Button from "@/components/ui/Button";

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Confirm Delete",
  description,
  entityName = "this item",
}: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0C1426] rounded-2xl p-6 w-[420px] border border-white/10">

        {/* Title */}
        <h2 className="text-white text-lg font-semibold mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6">
          {description
            ? description
            : `Are you sure you want to delete ${entityName}? This action cannot be undone.`}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            className="bg-red-600"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
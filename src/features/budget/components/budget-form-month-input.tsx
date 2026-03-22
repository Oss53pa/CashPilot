import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatFCFA } from "./budget-form-utils";

// ─── Month Input (FCFA formatted) ────────────────────────────────────────────

interface MonthInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function MonthInput({ value, onChange }: MonthInputProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const handleFocus = () => {
    setEditing(true);
    setEditValue(String(Math.round(value / 100)));
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseInt(editValue.replace(/\s/g, ""), 10);
    if (!isNaN(parsed)) {
      onChange(parsed * 100);
    }
  };

  return (
    <Input
      className="h-7 text-xs text-right w-[90px] px-1"
      value={editing ? editValue : formatFCFA(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => setEditValue(e.target.value)}
    />
  );
}

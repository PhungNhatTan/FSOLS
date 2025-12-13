import { useState } from "react";
import { Btn } from "../ui/Btn";

export function CreateExamForm({ onSubmit }: { onSubmit: (title: string, durationPreset?: string, durationCustom?: number) => Promise<void> | void }) {
  const [title, setTitle] = useState("Midterm");
  const [durationType, setDurationType] = useState<"preset" | "custom" | "none">("none");
  const [durationPreset, setDurationPreset] = useState<string>("P_30");
  const [durationCustom, setDurationCustom] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  const presetOptions = [
    { value: "P_15", label: "15 minutes" },
    { value: "P_30", label: "30 minutes" },
    { value: "P_60", label: "60 minutes" },
    { value: "P_90", label: "90 minutes" },
    { value: "P_120", label: "120 minutes" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const preset = durationType === "preset" ? durationPreset : undefined;
      const custom = durationType === "custom" ? durationCustom : undefined;
      await onSubmit(title, preset, custom);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <input className="w-full px-3 py-2 rounded-xl border" placeholder="Exam title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        
        <div>
          <label className="block text-sm font-medium mb-2">Duration</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="durationType" value="none" checked={durationType === "none"} onChange={(e) => setDurationType(e.target.value as "preset" | "custom" | "none")} />
              <span className="text-sm">No limit</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="durationType" value="preset" checked={durationType === "preset"} onChange={(e) => setDurationType(e.target.value as "preset" | "custom" | "none")} />
              <span className="text-sm">Preset</span>
            </label>
            {durationType === "preset" && (
              <select className="w-full px-3 py-2 rounded-xl border ml-6" value={durationPreset} onChange={(e) => setDurationPreset(e.target.value)}>
                {presetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2">
              <input type="radio" name="durationType" value="custom" checked={durationType === "custom"} onChange={(e) => setDurationType(e.target.value as "preset" | "custom" | "none")} />
              <span className="text-sm">Custom</span>
            </label>
            {durationType === "custom" && (
              <input type="number" className="w-full px-3 py-2 rounded-xl border ml-6" placeholder="Minutes" min="1" value={durationCustom} onChange={(e) => setDurationCustom(Number(e.target.value))} />
            )}
          </div>
        </div>

        <Btn variant="primary" type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Btn>
      </div>
    </form>
  );
}
import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; minutes: number | null }[] = [
  { label: "10 min", minutes: 10 },
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "Åpen", minutes: null },
];

export function FocusMode({
  text,
  categoryLabel,
  onComplete,
  onClose,
  onBell,
}: {
  text: string;
  categoryLabel: string;
  onComplete: () => void;
  onClose: () => void;
  onBell: () => void;
}) {
  const [minutes, setMinutes] = useState<number | null>(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const rang = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    rang.current = false;
    setElapsed(0);
    setRemaining(minutes ? minutes * 60 : 0);
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (minutes === null) {
        setElapsed((e) => e + 1);
      } else {
        setRemaining((r) => Math.max(0, r - 1));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, minutes]);

  useEffect(() => {
    if (minutes !== null && remaining === 0 && running && !rang.current) {
      rang.current = true;
      setRunning(false);
      onBell();
    }
  }, [remaining, running, minutes, onBell]);

  const seconds = minutes === null ? elapsed : remaining;
  const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const progress = minutes === null ? 0 : 1 - remaining / (minutes * 60);

  const reset = () => {
    rang.current = false;
    setRunning(false);
    setElapsed(0);
    setRemaining(minutes ? minutes * 60 : 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-zen animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fokus</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11 text-muted-foreground"
          aria-label="Avslutt fokus"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-16 text-center">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground">
            {categoryLabel}
          </span>
          <h1 className="mx-auto max-w-xl text-2xl sm:text-3xl font-light leading-snug tracking-tight text-foreground">
            {text}
          </h1>
        </div>

        <div className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" strokeWidth="2" className="stroke-border" />
            {minutes !== null && (
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
                className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            )}
          </svg>
          <span className="text-4xl sm:text-5xl font-light tabular-nums tracking-tight text-foreground">
            {display}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setMinutes(p.minutes)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm transition-colors",
                minutes === p.minutes
                  ? "bg-primary/15 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="h-12 w-12 rounded-full"
            aria-label="Nullstill"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => setRunning((r) => !r)}
            className="h-14 min-w-36 rounded-full text-base"
          >
            {running ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onComplete}
            className="h-12 w-12 rounded-full"
            aria-label="Marker som fullført"
          >
            <Check className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">Trykk Esc for å gå tilbake til listen</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
}

const motivationalQuotes = [
  "One step at a time leads to miles of greatness.",
  "Progress, not perfection, is what we aim for.",
  "Small daily improvements lead to stunning results.",
  "Focus on being productive instead of busy.",
  "The journey of a thousand miles begins with one step.",
  "Simplicity is the ultimate sophistication.",
  "Do less, but do it better.",
  "Peace comes from within. Focus on what matters.",
];

function SortableTask({ task, onToggle, onDelete }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: "bg-priority-low",
    medium: "bg-priority-medium",
    high: "bg-priority-high",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border transition-all duration-200",
        isDragging && "opacity-50 shadow-lg scale-105",
        !isDragging && "hover:shadow-md hover:border-primary/20",
        task.completed && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
          task.completed
            ? "bg-primary border-primary animate-check-bounce"
            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/5"
        )}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && <Check className="h-4 w-4 text-primary-foreground" />}
      </button>

      <div className={cn("flex-1 transition-all duration-300", task.completed && "line-through text-muted-foreground")}>
        {task.text}
      </div>

      <div className={cn("h-2 w-2 rounded-full", priorityColors[task.priority])} aria-label={`Priority: ${task.priority}`} />

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-destructive-foreground hover:text-destructive transition-all duration-200"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [quote, setQuote] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("zen-tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (tasks.length > 0 || localStorage.getItem("zen-tasks")) {
      localStorage.setItem("zen-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Set daily quote
  useEffect(() => {
    const today = new Date().toDateString();
    const savedQuoteData = localStorage.getItem("zen-quote");
    
    if (savedQuoteData) {
      const { date, quote: savedQuote } = JSON.parse(savedQuoteData);
      if (date === today) {
        setQuote(savedQuote);
        return;
      }
    }
    
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
    localStorage.setItem("zen-quote", JSON.stringify({ date: today, quote: randomQuote }));
  }, []);

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false,
        priority: newPriority,
      };
      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-zen p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header with Quote */}
        <header className="mb-8 text-center animate-fade-in">
          <h1 className="mb-3 text-4xl font-light tracking-tight text-foreground">Zen Tasks</h1>
          <p className="text-sm italic text-muted-foreground max-w-md mx-auto leading-relaxed">{quote}</p>
        </header>

        {/* Progress indicator */}
        {totalCount > 0 && (
          <div className="mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Add Task Form */}
        <div className="mb-6 rounded-2xl bg-card p-6 shadow-lg border border-border animate-scale-in">
          <div className="flex gap-3 mb-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Add a new task..."
              className="flex-1 border-input bg-background"
            />
            <Button onClick={handleAddTask} size="icon" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground mr-2">Priority:</span>
            {(["low", "medium", "high"] as Priority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => setNewPriority(priority)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  newPriority === priority
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <p className="text-lg">No tasks yet. Add one to get started.</p>
              <p className="text-sm mt-2">Find your focus, one task at a time.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {tasks.map((task) => (
                  <SortableTask key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

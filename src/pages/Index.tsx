import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, Plus, Trash2, Menu, ListTodo, Flag, CheckCircle2, Sparkles, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";
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

function SortableTask({ 
  task, 
  onToggle, 
  onDelete, 
  onEdit,
  isEditing,
  onStartEdit 
}: { 
  task: Task; 
  onToggle: (id: string) => void; 
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  isEditing: boolean;
  onStartEdit: (id: string, text: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const [editValue, setEditValue] = useState(task.text);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: "bg-priority-low",
    medium: "bg-priority-medium",
    high: "bg-priority-high",
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onEdit(task.id, editValue.trim());
    } else {
      setEditValue(task.text);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2 sm:gap-3 rounded-xl bg-card p-3 sm:p-4 shadow-sm border border-border transition-all duration-200",
        isDragging && "opacity-50 shadow-lg scale-105",
        !isDragging && "hover:shadow-md hover:border-primary/20",
        task.completed && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground transition-colors flex h-9 w-6 items-center justify-center -ml-1"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 sm:h-4 sm:w-4" />
      </button>

      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "flex h-7 w-7 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
          task.completed
            ? "bg-primary border-primary animate-check-bounce"
            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/5"
        )}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && <Check className="h-4 w-4 text-primary-foreground" />}
      </button>

      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") {
              setEditValue(task.text);
              onEdit(task.id, task.text);
            }
          }}
          onBlur={handleSaveEdit}
          className="flex-1 min-w-0 h-9 text-base sm:text-sm border-input bg-background"
          autoFocus
        />
      ) : (
        <div
          className={cn("flex-1 min-w-0 break-words text-sm sm:text-base transition-all duration-300", task.completed && "line-through text-muted-foreground")}
          onDoubleClick={() => onStartEdit(task.id, task.text)}
        >
          {task.text}
        </div>
      )}

      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", priorityColors[task.priority])} aria-label={`Priority: ${task.priority}`} />

      {!isEditing && (
        <>
          <button
            onClick={() => onStartEdit(task.id, task.text)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

type Filter = "all" | Priority;

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [quote, setQuote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

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

  const handleEditTask = (id: string, text: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, text } : task)));
    setEditingId(null);
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
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

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const visibleTasks = filter === "all" ? sortedTasks : sortedTasks.filter((t) => t.priority === filter);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-zen px-4 py-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+11rem)] sm:pb-8">
      <div className="mx-auto max-w-2xl">
        {/* Header with Quote */}
        <header className="mb-6 sm:mb-8 text-center animate-fade-in">
          <h1 className="mb-2 sm:mb-3 text-3xl sm:text-4xl font-light tracking-tight text-foreground">Zen Tasks</h1>
          <p className="text-sm italic text-muted-foreground max-w-md mx-auto leading-relaxed px-2">{quote}</p>
        </header>

        {/* Progress indicator */}
        {totalCount > 0 && (
          <div className="mb-5 sm:mb-6 animate-scale-in">
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

        {/* Filter chips (always visible) */}
        {totalCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Filter:</span>
            {(["all", "high", "medium", "low"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "min-h-9 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Add Task Form (desktop/tablet) */}
        <div className="hidden sm:block mb-6 rounded-2xl bg-card p-4 sm:p-6 shadow-lg border border-border animate-scale-in">
          <div className="flex gap-2 sm:gap-3 mb-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Add a new task..."
              className="flex-1 h-11 sm:h-10 text-base sm:text-sm border-input bg-background"
            />
            <Button onClick={handleAddTask} size="icon" className="h-11 w-11 sm:h-10 sm:w-10 shrink-0 bg-primary hover:bg-primary/90">
              <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Priority:</span>
            {(["low", "medium", "high"] as Priority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => setNewPriority(priority)}
                className={cn(
                  "min-h-9 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
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
          {visibleTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <p className="text-lg">
                {totalCount === 0 ? "No tasks yet. Add one to get started." : "No tasks match this filter."}
              </p>
              {totalCount === 0 && <p className="text-sm mt-2">Find your focus, one task at a time.</p>}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {visibleTasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    isEditing={editingId === task.id}
                    onStartEdit={handleStartEdit}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Sticky mobile action bar */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-8px_24px_-12px_hsl(var(--foreground)/0.15)] px-4 pt-3 animate-fade-in"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex gap-2 mb-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Add a new task..."
              className="flex-1 h-11 text-base border-input bg-background"
            />
            <Button
              onClick={handleAddTask}
              size="icon"
              className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
              aria-label="Add task"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs text-muted-foreground shrink-0">Priority:</span>
            {(["low", "medium", "high"] as Priority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => setNewPriority(priority)}
                className={cn(
                  "min-h-9 shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  newPriority === priority
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

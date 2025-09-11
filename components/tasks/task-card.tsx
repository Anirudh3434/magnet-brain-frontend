"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  MoreHorizontal, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Circle
} from "lucide-react"
import type { Task } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, status: "pending" | "completed") => void
  onPriorityChange: (taskId: string, priority: "high" | "medium" | "low") => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const priorityConfig = {
  high: {
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/50",
    accent: "bg-red-500",
    icon: AlertTriangle,
    label: "High Priority"
  },
  medium: {
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50",
    accent: "bg-amber-500",
    icon: Clock,
    label: "Medium Priority"
  },
  low: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50",
    accent: "bg-emerald-500",
    icon: Circle,
    label: "Low Priority"
  }
}

export function TaskCard({ task, onStatusChange, onPriorityChange, onEdit, onDelete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      await onStatusChange(task.id, checked ? "completed" : "pending")
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePriorityChange = async (priority: "high" | "medium" | "low") => {
    setIsUpdating(true)
    try {
      await onPriorityChange(task.id, priority)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest('[role="checkbox"]') || target.closest('[role="menuitem"]')) {
      return
    }
    router.push(`/task/${task._id}`)
  }

  console.log(task)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMinutes > 0) return `${diffMinutes}m ago`
    return "Just now"
  }

  const isOverdue = new Date(task.dueDate) < new Date() && task.status === "pending"
  const priorityInfo = priorityConfig[task.priority]
  const PriorityIcon = priorityInfo.icon

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-0 shadow-sm bg-gradient-to-br from-background to-muted/20",
          task.status === "completed" && "opacity-80 hover:opacity-100",
          isOverdue && "ring-2 ring-red-200 dark:ring-red-800/50 shadow-red-100/50 dark:shadow-red-900/20",
          "before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-transparent before:to-muted/10 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
        )}
        onClick={handleCardClick}
      >
        {/* Priority accent bar */}
        <div className={cn("absolute top-0 left-0 w-full h-1 rounded-t-lg", priorityInfo.accent)} />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="mt-0.5">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={handleStatusChange}
                  disabled={isUpdating}
                  className={cn(
                    "transition-all duration-200",
                    task.status === "completed" && "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  )}
                />
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={cn(
                      "font-semibold text-base leading-tight transition-colors",
                      task.status === "completed" 
                        ? "line-through text-muted-foreground" 
                        : "text-foreground group-hover:text-primary"
                    )}
                  >
                    {task.title}
                  </h3>
                  
                  {task.status === "completed" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Assignee and Creator Info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
            
                  
                  {task.assignedTo && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <span>Assigned to</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(task.assignedTo.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{task.assignedTo.name}</p>
                            <p className="text-xs text-muted-foreground">{task.assignedTo.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(`/task/${task.id}`)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)} 
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "cursor-pointer text-xs font-medium gap-1.5 px-2.5 py-1 hover:shadow-sm transition-all",
                    priorityInfo.color
                  )}
                >
                  <PriorityIcon className="h-3 w-3" />
                  {priorityInfo.label}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44">
                <DropdownMenuItem onClick={() => handlePriorityChange("high")} className="gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <AlertTriangle className="h-3 w-3" />
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange("medium")} className="gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <Clock className="h-3 w-3" />
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange("low")} className="gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <Circle className="h-3 w-3" />
                  Low Priority
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-3 text-xs">
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                isOverdue 
                  ? "text-destructive bg-destructive/10" 
                  : "text-muted-foreground bg-muted/50"
              )}>
                <Calendar className="h-3 w-3" />
                <span className="font-medium">{formatDate(task.dueDate)}</span>
              </div>
              
              <div className="text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                <span>Updated {formatRelativeDate(task.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
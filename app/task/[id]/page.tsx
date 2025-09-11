"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { taskApi, type Task } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { AuthModal } from "@/components/auth/auth-modal"
import { TaskForm } from "@/components/tasks/task-form"
import { DeleteConfirmationModal } from "@/components/tasks/delete-confirmation-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Flag,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Shield,
  User,
  Timer,
  Star,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const priorityConfig = {
  high: {
    color:
      "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200 dark:from-red-950/30 dark:to-red-900/30 dark:text-red-400 dark:border-red-800/50",
    icon: "🔥",
    gradient: "from-red-500 to-red-600",
  },
  medium: {
    color:
      "bg-gradient-to-r from-amber-50 to-orange-100 text-amber-800 border-amber-200 dark:from-amber-950/30 dark:to-orange-900/30 dark:text-amber-400 dark:border-amber-800/50",
    icon: "⚡",
    gradient: "from-amber-500 to-orange-500",
  },
  low: {
    color:
      "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200 dark:from-emerald-950/30 dark:to-green-900/30 dark:text-emerald-400 dark:border-emerald-800/50",
    icon: "🌱",
    gradient: "from-emerald-500 to-green-500",
  },
}

const priorityLabels = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
}

const statusConfig = {
  pending: {
    color:
      "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border-blue-200 dark:from-blue-950/30 dark:to-indigo-900/30 dark:text-blue-400 dark:border-blue-800/50",
    icon: "⏳",
    gradient: "from-blue-500 to-indigo-500",
  },
  completed: {
    color:
      "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200 dark:from-emerald-950/30 dark:to-green-900/30 dark:text-emerald-400 dark:border-emerald-800/50",
    icon: "✅",
    gradient: "from-emerald-500 to-green-500",
  },
}

function TaskDetailsContent({ role }: { role: string }) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { user } = useAuth()

  console.log("user", user?.role)
  const isAdmin = user?.role === "admin"
  const isOwner = task && user && task?.createdBy?.name === user.name
  const canEdit = isAdmin 
  const canDelete = isAdmin

  const taskId = params.id as string

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
  }, [taskId])

  const fetchTask = async () => {
    try {
      setLoading(true)
      setError(null)
      const taskData = await taskApi.getTask(taskId)
      setTask(taskData)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch task details")
    } finally {
      setLoading(false)
    }
  }

  // Enhanced refresh function
  const refreshTask = async () => {
    try {
      setRefreshing(true)
      const taskData = await taskApi.getTask(taskId)
      setTask(taskData)
      
      // Force router refresh for server-side data
      router.refresh()
      
      // Small delay to ensure UI updates are visible
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (err: any) {
      console.error('Failed to refresh task:', err)
      toast({
        title: "Warning",
        description: "Failed to refresh task data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!task) return

    try {
      const newStatus = task.status === "completed" ? "pending" : "completed"
      const taskId = task.id || task._id
      const updatedTask = await taskApi.updateTaskStatus(taskId, newStatus)
      
      // Update local state immediately for instant feedback
      setTask(updatedTask)
      
      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      })
      
      // Perform comprehensive refresh
      await refreshTask()
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
      
      // Refresh to ensure UI consistency even on error
      await refreshTask()
    }
  }

  const handleEditSubmit = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    if (!task) return

    try {
      const taskId = task.id || task._id
      const updatedTask = await taskApi.updateTask(taskId, taskData)
      
      // Update local state immediately
      setTask(updatedTask)
      setEditModalOpen(false)
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      })

      // Perform comprehensive refresh
      await refreshTask()
      
    } catch (error) {
      // Refresh to ensure UI consistency even on error
      await refreshTask()
      throw error
    }
  }

  const handleDelete = async () => {
    if (!task) return

    try {
      const taskId = task.id || task._id
      await taskApi.deleteTask(taskId)
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
      
      // Navigate back to home and refresh
      router.push("/")
      router.refresh()
      
    } catch (error) {
      await refreshTask()
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const isOverdue = task && new Date(task.dueDate) < new Date() && task.status === "pending"
  const daysUntilDue = task ? getDaysUntilDue(task.dueDate) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <Star className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-center">{error || "Task not found"}</AlertDescription>
          </Alert>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/")} size="lg" className="min-w-[200px]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={fetchTask} variant="outline" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Animated Header */}
        <div className="flex items-center gap-6 mb-8 animate-in slide-in-from-top duration-500">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="p-3 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                Task Overview
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Manage and track your task progress with style
              </p>
            </div>
          </div>

          {/* Admin Badge */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-lg">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold">Admin Access</span>
            </div>
          )}

          {/* Manual Refresh Button */}
          <Button
            onClick={refreshTask}
            variant="outline"
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canEdit && (
              <Button
                onClick={() => setEditModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteModalOpen(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Refreshing Indicator */}
        {refreshing && (
          <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-8 animate-in slide-in-from-bottom duration-700 delay-200">
          {/* Hero Task Card */}
          <Card
            className={cn(
              "overflow-hidden border-0 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-300",
              isOverdue && "ring-2 ring-red-500/50 shadow-red-500/20",
              task.status === "completed" && "ring-2 ring-green-500/50 shadow-green-500/20",
              refreshing && "opacity-75 scale-[0.99]",
            )}
          >
            {/* Card Header with Gradient */}
            <div className={cn("h-2 bg-gradient-to-r", priorityConfig[task.priority]?.gradient)}></div>

            <CardHeader className="pb-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <CardTitle
                    className={cn(
                      "text-3xl font-bold leading-tight transition-all duration-300",
                      task.status === "completed" && "line-through text-muted-foreground/70",
                    )}
                  >
                    {task.title}
                  </CardTitle>

                  {/* Enhanced Badges */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge className={cn("text-sm px-4 py-2 shadow-md transition-all duration-300", priorityConfig[task.priority]?.color)}>
                      <span className="mr-2">{priorityConfig[task.priority]?.icon}</span>
                      <Flag className="mr-2 h-4 w-4" />
                      {priorityLabels[task.priority]}
                    </Badge>

                    <Badge className={cn("text-sm px-4 py-2 shadow-md transition-all duration-300", statusConfig[task.status]?.color)}>
                      <span className="mr-2">{statusConfig[task.status]?.icon}</span>
                      {task.status === "completed" ? (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      ) : (
                        <Circle className="mr-2 h-4 w-4" />
                      )}
                      {task.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>

                    {isOverdue && (
                      <Badge className="text-sm px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md animate-pulse">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Overdue by {Math.abs(daysUntilDue)} days
                      </Badge>
                    )}

                    {!isOverdue && daysUntilDue >= 0 && task.status === "pending" && (
                      <Badge className="text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
                        <Timer className="mr-2 h-4 w-4" />
                        {daysUntilDue === 0 ? "Due Today" : `${daysUntilDue} days left`}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status Toggle Button */}
                <Button
                  size="lg"
                  variant={task.status === "completed" ? "secondary" : "default"}
                  onClick={handleStatusToggle}
                  disabled={refreshing}
                  className={cn(
                    "shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5",
                    task.status === "completed"
                      ? "bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
                    refreshing && "opacity-75",
                  )}
                >
                  {task.status === "completed" ? (
                    <>
                      <Circle className="mr-2 h-5 w-5" />
                      Reopen Task
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Complete Task
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {task.description && (
              <CardContent className="pt-0">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Description</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap pl-11">
                    {task.description}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Details Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Due Date Card */}
            <Card className={cn(
              "group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg",
              refreshing && "opacity-75"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-gradient-to-r shadow-md",
                      isOverdue ? "from-red-500 to-red-600" : "from-blue-500 to-indigo-500",
                    )}
                  >
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  Due Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className={cn("text-lg font-bold", isOverdue && "text-red-600 dark:text-red-400")}>
                  {formatDate(task.dueDate)}
                </p>
                {isOverdue && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
                    ⚠️ This task is overdue
                  </p>
                )}
                {!isOverdue && daysUntilDue <= 3 && daysUntilDue >= 0 && task.status === "pending" && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                    ⏰ Due soon - stay focused!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className={cn(
              "group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg",
              refreshing && "opacity-75"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Created
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {formatDateTime(task.createdAt)}
                  </p>
                </div>
                <Separator className="bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Last Updated
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {formatDateTime(task.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Owner/Admin Info Card */}
            <Card className={cn(
              "group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg",
              refreshing && "opacity-75"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Task Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {task.createdBy?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {isOwner ? "You" : `${task.createdBy?.name}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isOwner ? "Task Owner" : "External User"}
                    </p>
                  </div>
                </div>
                {isAdmin && !isOwner && (
                  <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      🛡️ Admin privileges allow you to edit this task
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <TaskForm
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditSubmit}
          task={task}
          mode="edit"
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          taskTitle={task.title}
        />
      </div>
    </div>
  )
}

export default function TaskDetailsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user } = useAuth()

  const handleOpenAuth = () => setAuthModalOpen(true)
  const handleCloseAuth = () => setAuthModalOpen(false)

  return (
    <>
      <ProtectedRoute>
        <Navbar onOpenAuth={handleOpenAuth} />
        <TaskDetailsContent role={user?.role} />
      </ProtectedRoute>

      <AuthModal isOpen={authModalOpen} onClose={handleCloseAuth} defaultMode="login" />
    </>
  )
}
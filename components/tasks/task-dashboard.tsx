"use client"

import { useState, useEffect, useMemo } from "react"
import { taskApi, type Task, type TasksResponse } from "@/lib/api"
import { TaskCard } from "./task-card"
import { TaskFilters } from "./task-filters"
import { Pagination } from "./pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckSquare, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TaskDashboardProps {
  role: string
  onCreateTask: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string, taskTitle: string) => void
  refreshTrigger?: number
}

export function TaskDashboard({ role, onCreateTask, onEditTask, onDeleteTask, refreshTrigger }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const limit = 12

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [tasks, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === "completed").length
    const pending = tasks.filter((task) => task.status === "pending").length
    const overdue = tasks.filter((task) => task.status === "pending" && new Date(task.dueDate) < new Date()).length

    return { total, completed, pending, overdue }
  }, [tasks])

  const fetchTasks = async (page = 1, status = "all") => {
    try {
      setLoading(true)
      setError(null)
      const response: TasksResponse = await taskApi.getTasks(page, limit, status === "all" ? undefined : status)
      setTasks(response.tasks)
      setTotalPages(response.totalPages)
      setCurrentPage(response.page)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch tasks")
      toast({
        title: "Error",
        description: "Failed to fetch tasks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(1, statusFilter)
  }, [statusFilter, refreshTrigger])

  const handlePageChange = (page: number) => {
    fetchTasks(page, statusFilter)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleStatusChange = async (taskId: string, status: "pending" | "completed") => {
    try {
      await taskApi.updateTaskStatus(taskId, status)
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)))
      toast({
        title: "Success",
        description: `Task marked as ${status}`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (taskId: string, priority: "high" | "medium" | "low") => {
    try {
      await taskApi.updateTaskPriority(taskId, priority)
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, priority } : task)))
      toast({
        title: "Success",
        description: "Task priority updated",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update task priority",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      onDeleteTask(taskId, task.title)
    }
  }

  const refreshTasks = () => {
    fetchTasks(currentPage, statusFilter)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleBasedTitle = (base: string) => {
    if (role === "admin") return base
    if (role === "user") return `Your ${base.toLowerCase()}`
    return base
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{roleBasedTitle("Total Tasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{roleBasedTitle("Completed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold">{stats.completed}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{roleBasedTitle("Pending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="text-2xl font-bold">{stats.pending}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{roleBasedTitle("Overdue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-2xl font-bold">{stats.overdue}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TaskFilters
        role={role}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateTask={onCreateTask}
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No tasks found</CardTitle>
            <CardDescription>
              {searchQuery
                ? "No tasks match your search criteria"
                : statusFilter === "all"
                ? "Get started by creating your first task"
                : `No ${statusFilter} tasks found`}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onEdit={onEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
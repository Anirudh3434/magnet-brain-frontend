"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { AuthModal } from "@/components/auth/auth-modal"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TaskDashboard } from "@/components/tasks/task-dashboard"
import { TaskForm } from "@/components/tasks/task-form"
import { DeleteConfirmationModal } from "@/components/tasks/delete-confirmation-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Plus, Filter, Search } from "lucide-react"
import { taskApi, type Task } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

function WelcomeScreen({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={onOpenAuth} />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <CheckSquare className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to TaskFlow</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A professional task management application designed to enhance your productivity. Organize, prioritize, and
            track your tasks with ease.
          </p>
          <Button size="lg" onClick={onOpenAuth}>
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easily create and organize your tasks with detailed descriptions, due dates, and priority levels.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-secondary" />
                Priority Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Color-coded priority system helps you focus on what matters most - high, medium, and low priority tasks.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-chart-3" />
                Track Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your productivity with filtering options and real-time updates on task completion.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ role }: { role: string }) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskFormMode, setTaskFormMode] = useState<"create" | "edit">("create")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()

  const handleCreateTask = () => {
    setEditingTask(null)
    setTaskFormMode("create")
    setTaskFormOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskFormMode("edit")
    setTaskFormOpen(true)
  }

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setTaskToDelete({ id: taskId, title: taskTitle })
    setDeleteModalOpen(true)
  }

  const handleTaskFormSubmit = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (taskFormMode === "create") {
        await taskApi.createTask(taskData)
        toast({
          title: "Success",
          description: "Task created successfully",
        })
      } else if (editingTask) {
        await taskApi.updateTask(editingTask.id, taskData)
        toast({
          title: "Success",
          description: "Task updated successfully",
        })
      }

      setRefreshTrigger((prev) => prev + 1)
      setTaskFormOpen(false)
    } catch (error) {
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return

    try {
      await taskApi.deleteTask(taskToDelete.id)
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })

      setRefreshTrigger((prev) => prev + 1)
      setDeleteModalOpen(false)
      setTaskToDelete(null)
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2"> {role === "admin" ? "Admin Dashboard" : "User Task Board"} </h1>
          <p className="text-muted-foreground">Manage and track your tasks efficiently</p>
        </div>

        <TaskDashboard
          role={role}
          onCreateTask={handleCreateTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          refreshTrigger={refreshTrigger}
        />
      </div>

      <TaskForm
        isOpen={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSubmit={handleTaskFormSubmit}
        task={editingTask}
        mode={taskFormMode}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setTaskToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        taskTitle={taskToDelete?.title || ""}
      />
    </div>
  )
}

export default function HomePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user } = useAuth()

  const handleOpenAuth = () => setAuthModalOpen(true)
  const handleCloseAuth = () => setAuthModalOpen(false)

  return (
    <>
      {user ? (
        <ProtectedRoute>
          <Navbar onOpenAuth={handleOpenAuth} />
          <Dashboard role={user.role} />
        </ProtectedRoute>
      ) : (
        <WelcomeScreen onOpenAuth={handleOpenAuth} />
      )}

      <AuthModal isOpen={authModalOpen} onClose={handleCloseAuth} defaultMode="login" />
    </>
  )
}

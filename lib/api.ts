import axios from "axios"

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface Task {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  status: "pending" | "completed"
  dueDate: string
  assignedTo?: object
  createdAt: string
  updatedAt: string
}

export interface TasksResponse {
  tasks: Task[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const taskApi = {
  // Get all tasks with pagination and filters
  getTasks: async (page = 1, limit = 10, status?: string): Promise<TasksResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (status) {
      params.append("status", status)
    }

    const response = await axios.get(`/api/v1/task?${params.toString()}`)
    return response.data
  },

  // Get task by ID
  getTask: async (id: string): Promise<Task> => {
    const response = await axios.get(`/api/v1/task/${id}`)
    return response.data
  },

  // Create new task
  createTask: async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> => {
    const response = await axios.post("/api/v1/task", taskData)
    return response.data
  },

  // Update task
  updateTask: async (id: string, taskData: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task> => {
    const response = await axios.put(`/api/v1/task/${id}`, taskData)
    return response.data
  },

  // Delete task
  deleteTask: async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/task/${id}`)
  },

  // Update task status
  updateTaskStatus: async (id: string, status: "pending" | "completed"): Promise<Task> => {
    const response = await axios.patch(`/api/v1/task/${id}/status`, { status })
    return response.data
  },

  // Update task priority
  updateTaskPriority: async (id: string, priority: "high" | "medium" | "low"): Promise<Task> => {
    const response = await axios.patch(`/api/v1/task/${id}/priority`, { priority })
    return response.data
  },
}

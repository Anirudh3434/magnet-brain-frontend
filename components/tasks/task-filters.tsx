"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Plus } from "lucide-react"

interface TaskFiltersProps {
  role: string
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateTask: () => void
}

export function TaskFilters({
  role,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  onCreateTask,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
{/* 
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

     { role === "admin" && <Button onClick={onCreateTask} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        New Task
      </Button>}
    </div>
  )
}

"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

interface Group {
  _id: string
  name: string
  description: string
  members: Array<{ _id: string; name: string; email: string }>
  createdBy: { _id: string; name: string; email: string }
}

interface DeleteGroupDialogProps {
  children: React.ReactNode
  group: Group
  onGroupDeleted: (groupId: string) => void
}

export function DeleteGroupDialog({ children, group, onGroupDeleted }: DeleteGroupDialogProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)

  const deleteGroup = async () => {
    if (confirmText !== group.name) {
      toast({
        title: "Error",
        description: "Please type the group name exactly to confirm deletion",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${group._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        onGroupDeleted(group._id)
        setOpen(false)
        setConfirmText("")
        toast({
          title: "Success",
          description: "Group deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete group",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Only show delete option to group creator
  if (group.createdBy._id !== user?.id) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Group</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the group "{group.name}" and all associated
            expenses and settlements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <Trash2 className="h-4 w-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              All expenses, settlements, and member data will be permanently deleted.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Type <span className="font-mono font-bold">{group.name}</span> to confirm:
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={group.name}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={deleteGroup} disabled={loading || confirmText !== group.name}>
            {loading ? "Deleting..." : "Delete Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

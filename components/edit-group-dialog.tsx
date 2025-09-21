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
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, UserMinus } from "lucide-react"

interface Group {
  _id: string
  name: string
  description: string
  members: Array<{ _id: string; name: string; email: string }>
  createdBy: { _id: string; name: string; email: string }
}

interface EditGroupDialogProps {
  children: React.ReactNode
  group: Group
  onGroupUpdated: (group: Group) => void
}

export function EditGroupDialog({ children, group, onGroupUpdated }: EditGroupDialogProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const addMember = async () => {
    if (!newMemberEmail.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${group._id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberEmails: [newMemberEmail] }),
      })

      const data = await response.json()
      if (response.ok) {
        onGroupUpdated(data)
        setNewMemberEmail("")
        toast({
          title: "Success",
          description: "Member added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add member",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (memberId === group.createdBy._id) {
      toast({
        title: "Error",
        description: "Cannot remove group creator",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${group._id}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        onGroupUpdated(data)
        toast({
          title: "Success",
          description: "Member removed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Group: {group.name}</DialogTitle>
          <DialogDescription>Add or remove members from this group.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Member Section */}
          <div className="space-y-2">
            <Label htmlFor="memberEmail">Add Member</Label>
            <div className="flex gap-2">
              <Input
                id="memberEmail"
                type="email"
                placeholder="Enter email address"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addMember()}
              />
              <Button onClick={addMember} disabled={loading || !newMemberEmail.trim()}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Members */}
          <div className="space-y-2">
            <Label>Current Members ({group.members.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {group.members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">{member.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    {member._id === group.createdBy._id && (
                      <Badge variant="secondary" className="text-xs">
                        Creator
                      </Badge>
                    )}
                  </div>
                  {member._id !== group.createdBy._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

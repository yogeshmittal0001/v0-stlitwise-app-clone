"use client"

import type React from "react"
import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

interface CreateGroupDialogProps {
  children: React.ReactNode
  onGroupCreated: (group: any) => void
}

export function CreateGroupDialog({ children, onGroupCreated }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [memberEmail, setMemberEmail] = useState("")
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()
  const { toast } = useToast()

  const addMember = () => {
    if (memberEmail && !memberEmails.includes(memberEmail)) {
      setMemberEmails([...memberEmails, memberEmail])
      setMemberEmail("")
    }
  }

  const removeMember = (email: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          memberEmails,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onGroupCreated(data)
        setOpen(false)
        setName("")
        setDescription("")
        setMemberEmails([])
        toast({
          title: "Success",
          description: "Group created successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create group",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>Create a group to split expenses with friends and family.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Roommates"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group for?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="flex gap-2">
              <Input
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Enter email address"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMember())}
              />
              <Button type="button" onClick={addMember} variant="outline">
                Add
              </Button>
            </div>
            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {memberEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeMember(email)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

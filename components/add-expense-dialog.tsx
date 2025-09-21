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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Group {
  _id: string
  name: string
  members: Array<{ _id: string; name: string; email: string }>
}

interface AddExpenseDialogProps {
  children: React.ReactNode
  group: Group
  onExpenseAdded: () => void
}

export function AddExpenseDialog({ children, group, onExpenseAdded }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("General")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [splitType, setSplitType] = useState("equal")
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()
  const { toast } = useToast()

  const categories = ["General", "Food", "Transportation", "Entertainment", "Utilities", "Shopping", "Travel", "Other"]

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one member to split with",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const totalAmount = Number.parseFloat(amount)
      const splitAmount = totalAmount / selectedMembers.length

      const splitBetween = selectedMembers.map((memberId) => ({
        user: memberId,
        amount: splitAmount,
      }))

      const response = await fetch(`http://localhost:5000/api/groups/${group._id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          amount: totalAmount,
          splitBetween,
          category,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onExpenseAdded()
        setOpen(false)
        setDescription("")
        setAmount("")
        setCategory("General")
        setSelectedMembers([])
        toast({
          title: "Success",
          description: "Expense added successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add expense",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense",
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
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Add a new expense to split with group members.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner at restaurant"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Split with</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {group.members.map((member) => (
                <div key={member._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={member._id}
                    checked={selectedMembers.includes(member._id)}
                    onCheckedChange={() => handleMemberToggle(member._id)}
                  />
                  <Label htmlFor={member._id} className="text-sm font-normal">
                    {member.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

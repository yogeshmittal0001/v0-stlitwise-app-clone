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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Group {
  _id: string
  name: string
  members: Array<{ _id: string; name: string; email: string }>
}

interface SettleUpDialogProps {
  children: React.ReactNode
  group: Group
  balances: Record<string, number>
  onSettlement: () => void
}

export function SettleUpDialog({ children, group, balances, onSettlement }: SettleUpDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const { token, user } = useAuth()
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount))
  }

  const getSettlementSuggestions = () => {
    const suggestions = []
    const userBalance = balances[user?.id || ""] || 0

    if (userBalance < 0) {
      // User owes money
      for (const member of group.members) {
        const memberBalance = balances[member._id] || 0
        if (memberBalance > 0 && member._id !== user?.id) {
          const suggestedAmount = Math.min(Math.abs(userBalance), memberBalance)
          suggestions.push({
            member,
            amount: suggestedAmount,
            reason: `You owe ${member.name}`,
          })
        }
      }
    }

    return suggestions
  }

  const suggestions = getSettlementSuggestions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !amount) {
      toast({
        title: "Error",
        description: "Please select a member and enter an amount",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`http://localhost:5000/api/groups/${group._id}/settlements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: selectedMember,
          amount: Number.parseFloat(amount),
          description: description || "Settlement payment",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSettlement()
        setOpen(false)
        setSelectedMember("")
        setAmount("")
        setDescription("")
        toast({
          title: "Success",
          description: "Settlement recorded successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to record settlement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record settlement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = (suggestion: any) => {
    setSelectedMember(suggestion.member._id)
    setAmount(suggestion.amount.toString())
    setDescription(`Settlement to ${suggestion.member.name}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settle Up</DialogTitle>
          <DialogDescription>Record a payment to settle your balance with a group member.</DialogDescription>
        </DialogHeader>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Label>Suggested Settlements</Label>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {suggestion.member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{suggestion.member.name}</p>
                      <p className="text-xs text-gray-500">{suggestion.reason}</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold">{formatCurrency(suggestion.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">Pay to</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {group.members
                  .filter((member) => member._id !== user?.id)
                  .map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Settlement payment"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

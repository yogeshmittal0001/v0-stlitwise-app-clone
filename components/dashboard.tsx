"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { SettleUpDialog } from "@/components/settle-up-dialog"
import { EditGroupDialog } from "@/components/edit-group-dialog"
import { DeleteGroupDialog } from "@/components/delete-group-dialog"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Plus, Users, Receipt, DollarSign, LogOut, Settings, Trash2 } from "lucide-react"

interface Group {
  _id: string
  name: string
  description: string
  members: Array<{ _id: string; name: string; email: string }>
  createdBy: { _id: string; name: string; email: string }
}

interface Expense {
  _id: string
  description: string
  amount: number
  paidBy: { _id: string; name: string; email: string }
  splitBetween: Array<{ user: { _id: string; name: string; email: string }; amount: number }>
  category: string
  date: string
}

export function Dashboard() {
  const { user, token, logout } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchGroups = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setGroups(data)
        if (data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0])
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive",
      })
    }
  }

  const fetchExpenses = async (groupId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${groupId}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setExpenses(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      })
    }
  }

  const fetchBalances = async (groupId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${groupId}/balances`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setBalances(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch balances",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchGroups().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchExpenses(selectedGroup._id)
      fetchBalances(selectedGroup._id)
    }
  }, [selectedGroup])

  const handleGroupCreated = (newGroup: Group) => {
    setGroups([...groups, newGroup])
    setSelectedGroup(newGroup)
  }

  const handleExpenseAdded = () => {
    if (selectedGroup) {
      fetchExpenses(selectedGroup._id)
      fetchBalances(selectedGroup._id)
    }
  }

  const handleSettlement = () => {
    if (selectedGroup) {
      fetchBalances(selectedGroup._id)
    }
  }

  const handleGroupUpdated = (updatedGroup: Group) => {
    setGroups(groups.map((group) => (group._id === updatedGroup._id ? updatedGroup : group)))
    setSelectedGroup(updatedGroup)
  }

  const handleGroupDeleted = (groupId: string) => {
    const updatedGroups = groups.filter((group) => group._id !== groupId)
    setGroups(updatedGroups)
    if (selectedGroup?._id === groupId) {
      setSelectedGroup(updatedGroups.length > 0 ? updatedGroups[0] : null)
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-green-600">SplitWise</h1>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-green-100 text-green-600">
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Button variant="outline" onClick={logout} className="flex items-center gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Groups */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Groups</CardTitle>
                <CreateGroupDialog onGroupCreated={handleGroupCreated}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CreateGroupDialog>
              </CardHeader>
              <CardContent className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group._id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?._id === group._id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.members.length} members</p>
                      </div>
                    </div>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No groups yet. Create your first group!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedGroup ? (
              <Tabs defaultValue="expenses" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                    <p className="text-gray-600">{selectedGroup.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <AddExpenseDialog group={selectedGroup} onExpenseAdded={handleExpenseAdded}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    </AddExpenseDialog>
                    <SettleUpDialog group={selectedGroup} balances={balances} onSettlement={handleSettlement}>
                      <Button variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Settle Up
                      </Button>
                    </SettleUpDialog>
                    <EditGroupDialog group={selectedGroup} onGroupUpdated={handleGroupUpdated}>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Group
                      </Button>
                    </EditGroupDialog>
                    <DeleteGroupDialog group={selectedGroup} onGroupDeleted={handleGroupDeleted}>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </DeleteGroupDialog>
                  </div>
                </div>

                <TabsList>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="balances">Balances</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-4">
                  {expenses.map((expense) => (
                    <Card key={expense._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Receipt className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-gray-500">
                                Paid by {expense.paidBy.name} • {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                            <Badge variant="secondary" className="text-xs">
                              {expense.category}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {expenses.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No expenses yet. Add your first expense!</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="balances" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Balances</CardTitle>
                      <CardDescription>Who owes whom in this group</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedGroup.members.map((member) => {
                        const balance = balances[member._id] || 0
                        return (
                          <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{member.name}</span>
                            </div>
                            <div className={`font-semibold ${getBalanceColor(balance)}`}>
                              {balance > 0 && "+"}
                              {formatCurrency(balance)}
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a group to view expenses and balances</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

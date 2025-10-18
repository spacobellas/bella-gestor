"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export default function DashboardPage() {
  const { user } = useAuth()
  const { clients, appointments } = useData()

  // Calculate statistics
  const activeClients = clients.filter((c) => c.status === "active").length
  const todayAppointments = appointments.filter((a) => {
    const today = new Date().toISOString().split("T")[0]
    return a.date === today
  }).length
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0)
  const monthlyRevenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, appointment) => sum + appointment.price, 0)

  // Revenue chart data (mock monthly data)
  const revenueData = [
    { month: "Jan", revenue: 12500 },
    { month: "Fev", revenue: 15200 },
    { month: "Mar", revenue: 14800 },
    { month: "Abr", revenue: 16900 },
    { month: "Mai", revenue: 18200 },
    { month: "Jun", revenue: 19500 },
  ]

  const stats = [
    {
      title: "Clientes Ativos",
      value: activeClients,
      icon: Users,
      description: `${clients.length} clientes no total`,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Agendamentos Hoje",
      value: todayAppointments,
      icon: Calendar,
      description: `${appointments.length} agendamentos totais`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Receita Total",
      value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Receita acumulada",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Crescimento",
      value: "+12.5%",
      icon: TrendingUp,
      description: "vs. mês anterior",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Olá, {user?.name}!</h1>
        <p className="text-muted-foreground mt-2">Aqui está um resumo do seu negócio hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Receita Mensal</CardTitle>
          <p className="text-sm text-muted-foreground">Evolução da receita nos últimos 6 meses</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{appointment.clientName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{appointment.startTime}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(appointment.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Clientes Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients
                .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
                .slice(0, 5)
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        R$ {client.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(client.registrationDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

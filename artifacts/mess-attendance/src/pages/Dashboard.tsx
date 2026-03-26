import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { useGetAttendance, useGetResidents, useGetSettings } from "@workspace/api-client-react"
import { format } from "date-fns"
import { Users, CheckCircle2, XCircle, Coffee, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: residents, isLoading: loadingRes } = useGetResidents()
  const { data: attendance, isLoading: loadingAtt } = useGetAttendance({ date: today })
  const { data: settings, isLoading: loadingSet } = useGetSettings()

  const stats = useMemo(() => {
    if (!attendance || !residents) return { present: 0, absent: 0, half: 0, breakfast: 0, total: 0 }
    
    let present = 0, absent = 0, half = 0, breakfast = 0;
    attendance.forEach(record => {
      if (record.status === 'present') present++;
      else if (record.status === 'absent') absent++;
      else if (record.status === 'half') half++;
      else if (record.status === 'breakfast') breakfast++;
    })
    
    return {
      total: residents.filter(r => r.isActive).length,
      present,
      absent,
      half,
      breakfast,
      unmarked: residents.filter(r => r.isActive).length - attendance.length
    }
  }, [attendance, residents])

  if (loadingRes || loadingAtt || loadingSet) {
    return <div className="flex h-full items-center justify-center text-muted-foreground animate-pulse">Loading dashboard...</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, Manager</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in {settings?.messName || 'the mess'} today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Residents" 
          value={stats.total} 
          icon={<Users className="w-5 h-5 text-primary" />} 
          trend="Total enrolled"
        />
        <StatCard 
          title="Present Today" 
          value={stats.present} 
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} 
          trend={`${Math.round((stats.present / (stats.total || 1)) * 100)}% attendance`}
        />
        <StatCard 
          title="P/2 & Breakfast" 
          value={stats.half + stats.breakfast} 
          icon={<Coffee className="w-5 h-5 text-amber-500" />} 
          trend={`${stats.half} Half, ${stats.breakfast} Breakfast`}
        />
        <StatCard 
          title="Absent" 
          value={stats.absent} 
          icon={<XCircle className="w-5 h-5 text-rose-500" />} 
          trend="Missed today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-display mb-4">Today's Overview</h3>
            <div className="h-64 flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium w-24">Present</span>
                <div className="flex-1 mx-4 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(stats.present / (stats.total || 1)) * 100}%` }} 
                    className="h-full bg-emerald-500 rounded-full" 
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.present}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium w-24">Half (P/2)</span>
                <div className="flex-1 mx-4 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(stats.half / (stats.total || 1)) * 100}%` }} 
                    className="h-full bg-amber-400 rounded-full" 
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.half}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium w-24">Breakfast</span>
                <div className="flex-1 mx-4 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(stats.breakfast / (stats.total || 1)) * 100}%` }} 
                    className="h-full bg-sky-400 rounded-full" 
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.breakfast}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium w-24">Absent</span>
                <div className="flex-1 mx-4 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(stats.absent / (stats.total || 1)) * 100}%` }} 
                    className="h-full bg-rose-500 rounded-full" 
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.absent}</span>
              </div>
            </div>
            {stats.unmarked > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Action Needed</p>
                  <p className="text-sm text-amber-800">You have {stats.unmarked} residents without attendance marked for today.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-blue-700 text-white border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-display mb-1 text-blue-100">Current Rates</h3>
            <p className="text-sm text-blue-200 mb-8">Settings active for {format(new Date(), 'MMMM yyyy')}</p>
            
            <div className="space-y-6">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Full Diet Rate</p>
                <p className="text-4xl font-display font-bold">{formatCurrency(settings?.dietRatePerDay || 0, settings?.currency)}<span className="text-lg text-blue-300 font-normal">/day</span></p>
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Breakfast Only Rate</p>
                <p className="text-2xl font-display font-bold">{formatCurrency(settings?.breakfastRate || 0, settings?.currency)}<span className="text-sm text-blue-300 font-normal">/day</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function StatCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
        <p className="text-3xl font-bold font-display">{value}</p>
        <p className="text-xs text-muted-foreground mt-2">{trend}</p>
      </CardContent>
    </Card>
  )
}

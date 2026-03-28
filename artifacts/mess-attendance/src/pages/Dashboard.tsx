import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { useGetAttendance, useGetResidents, useGetSettings } from "@workspace/api-client-react"
import { format } from "date-fns"
import { Users, CheckCircle2, XCircle, Coffee, Clock, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Link } from "wouter"

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: residents, isLoading: loadingRes } = useGetResidents()
  const { data: attendance, isLoading: loadingAtt } = useGetAttendance({ date: today })
  const { data: settings, isLoading: loadingSet } = useGetSettings()

  const stats = useMemo(() => {
    if (!attendance || !residents) return { present: 0, absent: 0, half: 0, breakfast: 0, total: 0, unmarked: 0 }
    let present = 0, absent = 0, half = 0, breakfast = 0
    attendance.forEach(record => {
      if (record.status === 'present') present++
      else if (record.status === 'absent') absent++
      else if (record.status === 'half') half++
      else if (record.status === 'breakfast') breakfast++
    })
    const total = residents.filter(r => r.isActive).length
    return { total, present, absent, half, breakfast, unmarked: total - attendance.length }
  }, [attendance, residents])

  if (loadingRes || loadingAtt || loadingSet) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  const attendancePct = Math.round((stats.present / (stats.total || 1)) * 100)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium mb-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {settings?.messName || 'Hostel Mess'}
          </h1>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Residents"
          value={stats.total}
          sub="enrolled"
          icon={<Users className="w-4 h-4" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Present Today"
          value={stats.present}
          sub={`${attendancePct}% attendance`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
          accent="text-emerald-600"
        />
        <StatCard
          label="Half & Breakfast"
          value={stats.half + stats.breakfast}
          sub={`${stats.half} half · ${stats.breakfast} brkfst`}
          icon={<Coffee className="w-4 h-4" />}
          iconBg="bg-amber-50 text-amber-600"
          accent="text-amber-600"
        />
        <StatCard
          label="Absent"
          value={stats.absent}
          sub="missed today"
          icon={<XCircle className="w-4 h-4" />}
          iconBg="bg-rose-50 text-rose-600"
          accent="text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-slate-900">Today's Overview</h2>
            <span className="text-xs text-slate-400">{format(new Date(), 'd MMM')}</span>
          </div>
          <div className="space-y-5">
            <BarRow label="Present" value={stats.present} total={stats.total} color="bg-emerald-500" textColor="text-emerald-600" />
            <BarRow label="Half Day" value={stats.half} total={stats.total} color="bg-amber-400" textColor="text-amber-600" />
            <BarRow label="Breakfast" value={stats.breakfast} total={stats.total} color="bg-sky-400" textColor="text-sky-600" />
            <BarRow label="Absent" value={stats.absent} total={stats.total} color="bg-rose-400" textColor="text-rose-600" />
          </div>

          {stats.unmarked > 0 && (
            <Link href="/attendance">
              <div className="mt-6 flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/70 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Attendance pending</p>
                  <p className="text-xs text-amber-700">{stats.unmarked} resident{stats.unmarked > 1 ? 's' : ''} not yet marked — tap to mark</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Rates card */}
        <div className="bg-[hsl(162,38%,11%)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Current Rates</p>
            </div>
            <p className="text-sm text-white/30 mt-0.5">{format(new Date(), 'MMMM yyyy')}</p>
          </div>

          <div className="mt-8 space-y-5">
            <RateRow emoji="🌿" label="Veg Diet" value={formatCurrency(settings?.vegDietRate || 0, settings?.currency)} />
            <div className="h-px bg-white/8" />
            <RateRow emoji="🍗" label="Non-Veg Diet" value={formatCurrency(settings?.nonVegDietRate || 0, settings?.currency)} />
            <div className="h-px bg-white/8" />
            <RateRow emoji="☕" label="Breakfast Only" value={formatCurrency(settings?.breakfastRate || 0, settings?.currency)} small />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, sub, icon, iconBg, accent }: {
  label: string; value: number; sub: string; icon: React.ReactNode; iconBg: string; accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
        {icon}
      </div>
      <p className={`text-2xl font-display font-bold ${accent || 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1 leading-tight">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function BarRow({ label, value, total, color, textColor }: {
  label: string; value: number; total: number; color: string; textColor: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className={`text-sm font-semibold w-5 text-right ${textColor}`}>{value}</span>
    </div>
  )
}

function RateRow({ emoji, label, value, small }: { emoji: string; label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <span className={`font-display font-bold text-white ${small ? 'text-lg' : 'text-xl'}`}>
        {value}<span className="text-xs font-normal text-white/40 ml-0.5">/day</span>
      </span>
    </div>
  )
}

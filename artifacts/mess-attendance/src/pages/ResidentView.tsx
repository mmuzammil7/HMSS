import React, { useState } from "react"
import { motion } from "framer-motion"
import { useGetAttendance, useGetSettings } from "@workspace/api-client-react"
import { format, addDays, subDays } from "date-fns"
import { ChevronLeft, ChevronRight, Utensils, LogOut, CalendarCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present" },
  half: { bg: "bg-amber-100", text: "text-amber-700", label: "Half Day" },
  breakfast: { bg: "bg-sky-100", text: "text-sky-700", label: "Breakfast" },
  absent: { bg: "bg-rose-100", text: "text-rose-700", label: "Absent" },
}

export default function ResidentView() {
  const { logout } = useAuth()
  const [date, setDate] = useState(new Date())
  const dateStr = format(date, "yyyy-MM-dd")
  const { data: attendance, isLoading } = useGetAttendance({ date: dateStr })
  const { data: settings } = useGetSettings()

  const isToday = dateStr === format(new Date(), "yyyy-MM-dd")

  const counts = React.useMemo(() => {
    if (!attendance) return { present: 0, half: 0, breakfast: 0, absent: 0, total: 0 }
    const c = { present: 0, half: 0, breakfast: 0, absent: 0 }
    attendance.forEach(a => { if (a.status in c) c[a.status as keyof typeof c]++ })
    return { ...c, total: attendance.length }
  }, [attendance])

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[hsl(var(--sidebar))] border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-[15px] text-slate-900 leading-tight">{settings?.messName || "Hostel Mess"}</p>
            <p className="text-[11px] text-slate-400">Resident View</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          <div className="flex items-center justify-between bg-[hsl(35,30%,99%)] border border-stone-200 rounded-2xl p-1 mt-2">
            <button
              onClick={() => setDate(d => subDays(d, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                {isToday ? "Today" : format(date, "d MMMM")}
              </p>
              <p className="text-xs text-slate-400">{format(date, "EEEE, d MMM yyyy")}</p>
            </div>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              disabled={isToday}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {(["present", "half", "breakfast", "absent"] as const).map(s => (
              <div key={s} className={cn("rounded-xl p-3 text-center", STATUS_STYLES[s].bg)}>
                <p className={cn("text-xl font-display font-bold", STATUS_STYLES[s].text)}>{counts[s]}</p>
                <p className={cn("text-[10px] font-medium mt-0.5", STATUS_STYLES[s].text)}>{STATUS_STYLES[s].label}</p>
              </div>
            ))}
          </div>

          <div className="bg-[hsl(35,30%,99%)] border border-stone-200 rounded-2xl mt-4 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-slate-800">Attendance</p>
              <span className="text-xs text-slate-400 ml-auto">{counts.total} marked</span>
            </div>

            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : !attendance?.length ? (
              <p className="text-center text-sm text-slate-400 py-10">No attendance recorded for this date.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {attendance.map(a => {
                  const s = STATUS_STYLES[a.status] || STATUS_STYLES.absent
                  const initials = a.residentName?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", s.bg, s.text)}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{a.residentName}</p>
                      </div>
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", s.bg, s.text)}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

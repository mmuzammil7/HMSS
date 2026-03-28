import React, { useState } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetAttendance,
  useGetResidents,
  useMarkAttendance,
  useBulkMarkAttendance,
  AttendanceRecordStatus
} from "@workspace/api-client-react"
import { ChevronLeft, ChevronRight, Check, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const STATUS_CONFIG = {
  present:   { label: "Present",   short: "P",  activeBg: "bg-emerald-500 text-white border-emerald-500", dotColor: "bg-emerald-400" },
  half:      { label: "Half",      short: "½",  activeBg: "bg-amber-400 text-white border-amber-400",     dotColor: "bg-amber-400" },
  breakfast: { label: "Breakfast", short: "B",  activeBg: "bg-sky-400 text-white border-sky-400",         dotColor: "bg-sky-400" },
  absent:    { label: "Absent",    short: "A",  activeBg: "bg-rose-500 text-white border-rose-500",       dotColor: "bg-rose-400" },
} as const

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function stepDate(current: string, delta: number): string {
  const d = new Date(current)
  d.setDate(d.getDate() + delta)
  return format(d, 'yyyy-MM-dd')
}

export default function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: residents = [], isLoading: loadingRes } = useGetResidents()
  const { data: attendance = [], isLoading: loadingAtt } = useGetAttendance({ date })

  const markMutation = useMarkAttendance({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/attendance'] }),
      onError: () => toast({ title: "Failed to save attendance", variant: "destructive" })
    }
  })

  const bulkMutation = useBulkMarkAttendance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/attendance'] })
        toast({ title: "All marked successfully" })
      },
      onError: () => toast({ title: "Bulk action failed", variant: "destructive" })
    }
  })

  const handleMark = (residentId: number, status: AttendanceRecordStatus) => {
    markMutation.mutate({ data: { residentId, date, status } })
  }

  const handleBulkMark = (status: AttendanceRecordStatus) => {
    const entries = activeResidents.map(r => ({ residentId: r.id, status }))
    bulkMutation.mutate({ data: { date, entries } })
  }

  const activeResidents = residents.filter(r => r.isActive)
  const markedCount = attendance.length
  const isToday = date === format(new Date(), 'yyyy-MM-dd')
  const displayDate = isToday ? "Today" : format(new Date(date + "T00:00:00"), 'd MMM yyyy')

  const isLoading = loadingRes || loadingAtt

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isLoading ? "Loading…" : `${markedCount} of ${activeResidents.length} marked`}
          </p>
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-auto">
          <button
            onClick={() => setDate(d => stepDate(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute opacity-0 w-0 h-0"
              id="date-input"
            />
            <label htmlFor="date-input" className="text-sm font-semibold text-slate-800 cursor-pointer min-w-[90px] text-center">
              {displayDate}
            </label>
          </div>
          <button
            onClick={() => setDate(d => stepDate(d, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {activeResidents.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">Mark all:</span>
          {(Object.keys(STATUS_CONFIG) as AttendanceRecordStatus[]).map(s => (
            <button
              key={s}
              onClick={() => handleBulkMark(s)}
              disabled={bulkMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}

      {/* Resident list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : activeResidents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No active residents. Add some in the Residents tab.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeResidents.map((resident, i) => {
            const record = attendance.find(a => a.residentId === resident.id)
            const status = record?.status as AttendanceRecordStatus | undefined

            return (
              <motion.div
                key={resident.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Resident info */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                    status ? STATUS_CONFIG[status].activeBg : "bg-slate-100 text-slate-400"
                  )}>
                    {status ? <Check className="w-4 h-4" /> : getInitials(resident.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm leading-tight">{resident.name}</p>
                    <p className="text-xs text-slate-400">Room {resident.roomNumber}</p>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 w-full sm:w-auto">
                  {(Object.entries(STATUS_CONFIG) as [AttendanceRecordStatus, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleMark(resident.id, key)}
                      disabled={markMutation.isPending}
                      className={cn(
                        "flex-1 sm:flex-none sm:w-24 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
                        status === key
                          ? cfg.activeBg + " shadow-sm"
                          : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                      )}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

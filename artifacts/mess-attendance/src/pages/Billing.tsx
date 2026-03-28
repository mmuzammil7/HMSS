import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  useGetBillingSummary,
  useToggleUnpaidBill,
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Printer, AlertCircle, CheckCircle2, Leaf, Drumstick, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function Billing() {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: summary, isLoading } = useGetBillingSummary({ month, year })

  const toggleUnpaidMut = useToggleUnpaidBill({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/residents'] })
        queryClient.invalidateQueries({ queryKey: ['/api/billing/summary'] })
      }
    }
  })

  const stepMonth = (delta: number) => {
    setMonth(m => {
      let nm = m + delta
      if (nm < 1) { setYear(y => y - 1); return 12 }
      if (nm > 12) { setYear(y => y + 1); return 1 }
      return nm
    })
  }

  const handleToggleUnpaid = (residentId: number, currentStatus: boolean) => {
    toggleUnpaidMut.mutate({ id: residentId, data: { hasUnpaidBill: !currentStatus } })
  }

  const handlePrint = () => {
    if (!summary) return
    const cur = summary.currency
    const unpaidCount = summary.bills.filter(b => b.hasUnpaidBill).length

    const billRows = summary.bills.map(b => `
      <tr class="${b.hasUnpaidBill ? 'unpaid-row' : ''}">
        <td><span class="name-cell">${b.residentName}</span>${b.hasUnpaidBill ? '<span class="unpaid-badge">UNPAID</span>' : ''}</td>
        <td>${b.roomNumber}</td>
        <td><span class="diet-badge ${b.dietType === 'veg' ? 'veg' : 'non-veg'}">${b.dietType === 'veg' ? '🌿 Veg' : '🍗 Non-Veg'}</span></td>
        <td>${b.presentDays}</td><td>${b.halfDays}</td><td>${b.breakfastDays}</td><td>${b.absentDays}</td>
        <td>${cur}${b.dietRate}/day</td>
        <td>${b.totalDays}</td>
        <td class="amount" style="${b.hasUnpaidBill ? 'color:#dc2626' : ''}">${cur}${b.totalAmount}</td>
        <td style="font-weight:600;color:${b.hasUnpaidBill ? '#dc2626' : '#16a34a'}">${b.hasUnpaidBill ? 'UNPAID' : 'PAID'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html><head>
  <title>${summary.messName} — ${MONTHS[month - 1]} ${year} Bill</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;color:#111;font-size:13px;background:#fff}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #1e293b}
    .mess-name{font-size:22px;font-weight:800;color:#1e293b}.period{font-size:13px;color:#64748b;margin-top:4px}.print-date{font-size:11px;color:#94a3b8;text-align:right}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}
    .summary-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
    .summary-value{font-size:18px;font-weight:700;color:#1e293b}.summary-sub{font-size:10px;color:#64748b;margin-top:2px}
    table{width:100%;border-collapse:collapse}
    thead th{background:#1e293b;color:white;text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
    tbody td{padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle;font-size:12px}
    .unpaid-row td{background:#fff1f2!important}.unpaid-row td:first-child{border-left:3px solid #ef4444}
    .name-cell{font-weight:600;color:#1e293b}.unpaid-badge{display:inline-block;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600;margin-left:6px}
    .diet-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600}
    .veg{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}.non-veg{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
    .amount{font-weight:700;font-size:14px;color:#1e293b}
    .total-row td{background:#1e293b!important;color:white;font-weight:700;padding:12px;font-size:13px}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:10px;display:flex;justify-content:space-between}
    @media print{body{padding:16px}@page{margin:1cm}}
  </style>
</head><body>
  <div class="header">
    <div><div class="mess-name">${summary.messName}</div><div class="period">Monthly Bill — ${MONTHS[month - 1]} ${year}</div></div>
    <div class="print-date">Printed: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}${unpaidCount > 0 ? `<div style="color:#ef4444;font-weight:bold;margin-top:4px;">⚠ ${unpaidCount} Unpaid Bill(s)</div>` : ''}</div>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="summary-label">Veg Rate</div><div class="summary-value">${cur}${summary.vegDietRate}</div><div class="summary-sub">per day</div></div>
    <div class="summary-card"><div class="summary-label">Non-Veg Rate</div><div class="summary-value">${cur}${summary.nonVegDietRate}</div><div class="summary-sub">per day</div></div>
    <div class="summary-card"><div class="summary-label">Breakfast Rate</div><div class="summary-value">${cur}${summary.breakfastRate}</div><div class="summary-sub">per day</div></div>
    <div class="summary-card" style="background:#f0fdf4;border-color:#bbf7d0"><div class="summary-label">Total Collectable</div><div class="summary-value" style="color:#15803d">${cur}${summary.totalCollectable}</div><div class="summary-sub">${summary.bills.length} residents</div></div>
  </div>
  <table><thead><tr><th>Resident</th><th>Room</th><th>Diet</th><th>Present</th><th>P/2</th><th>Breakfast</th><th>Absent</th><th>Rate</th><th>Days</th><th>Amount</th><th>Status</th></tr></thead>
  <tbody>${billRows}<tr class="total-row"><td colspan="9" style="text-align:right;padding-right:16px">Total Collectable</td><td class="amount">${cur}${summary.totalCollectable}</td><td></td></tr></tbody></table>
  <div class="footer"><span>Generated by MessMate &bull; ${summary.messName}</span><span>${new Date().toLocaleString("en-IN")}</span></div>
</body></html>`

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const unpaidCount = summary?.bills?.filter(b => b.hasUnpaidBill).length ?? 0
  const paidCount = (summary?.bills?.length ?? 0) - unpaidCount

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Monthly Billing</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review and manage bills for {MONTHS[month - 1]} {year}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month navigator */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button onClick={() => stepMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800 min-w-[110px] text-center">{MONTHS[month - 1]} {year}</span>
            <button onClick={() => stepMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handlePrint}
            disabled={isLoading || !summary?.bills?.length}
            className="gap-2 rounded-xl h-10 bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      {/* Summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 bg-primary rounded-2xl p-6">
          <p className="text-sm text-white/60 font-medium">Total Collectable</p>
          <p className="text-4xl font-display font-bold text-white mt-1">
            {isLoading ? "…" : formatCurrency(summary?.totalCollectable || 0, summary?.currency)}
          </p>
          <p className="text-xs text-white/40 mt-3">
            {summary?.bills?.length ?? 0} residents &middot; Veg {formatCurrency(summary?.vegDietRate ?? 0, summary?.currency)}/day &middot; Non-Veg {formatCurrency(summary?.nonVegDietRate ?? 0, summary?.currency)}/day
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Paid
            </div>
            <span className="text-xl font-display font-bold text-slate-900">{paidCount}</span>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-rose-600">
              <AlertCircle className="w-4 h-4" /> Unpaid
            </div>
            <span className={cn("text-xl font-display font-bold", unpaidCount > 0 ? "text-rose-600" : "text-slate-900")}>{unpaidCount}</span>
          </div>
        </div>
      </div>

      {/* Bills table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !summary?.bills?.length ? (
          <div className="p-12 text-center text-slate-400 text-sm">No attendance records found for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5">Resident</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Diet</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Attendance</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Rate</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5">Amount</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.bills.map(b => (
                  <tr
                    key={b.residentId}
                    className={cn(
                      "border-b border-slate-50 last:border-0 transition-colors",
                      b.hasUnpaidBill ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50/50"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {b.hasUnpaidBill && <div className="w-1 h-8 bg-rose-400 rounded-full shrink-0" />}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{b.residentName}</p>
                          <p className="text-xs text-slate-400">Room {b.roomNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      {b.dietType === "veg" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Leaf className="w-3 h-3" /> Veg
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                          <Drumstick className="w-3 h-3" /> Non-Veg
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">{b.presentDays}P</span>
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{b.halfDays}H</span>
                        <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">{b.breakfastDays}B</span>
                        <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">{b.absentDays}A</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-500">{summary.currency}{b.dietRate}/day</span>
                      <p className="text-xs text-slate-400">{b.totalDays} days</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-sm font-bold", b.hasUnpaidBill ? "text-rose-600" : "text-slate-900")}>
                        {formatCurrency(b.totalAmount, summary.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleUnpaid(b.residentId, b.hasUnpaidBill)}
                        disabled={toggleUnpaidMut.isPending}
                        className={cn(
                          "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                          b.hasUnpaidBill
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        )}
                      >
                        {b.hasUnpaidBill ? "Mark Paid" : "Paid"}
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-primary">
                  <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-white/60 text-right">Total Collectable</td>
                  <td className="px-4 py-4 text-base font-bold text-white">{formatCurrency(summary.totalCollectable, summary.currency)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

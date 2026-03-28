import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  useGetBillingSummary,
  useToggleUnpaidBill,
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Calculator, Printer, AlertCircle, CheckCircle2, Leaf, Drumstick } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

  const handleToggleUnpaid = (residentId: number, currentStatus: boolean) => {
    toggleUnpaidMut.mutate({ id: residentId, data: { hasUnpaidBill: !currentStatus } })
  }

  const handlePrint = () => {
    if (!summary) return
    const cur = summary.currency
    const unpaidCount = summary.bills.filter(b => b.hasUnpaidBill).length

    const billRows = summary.bills.map(b => `
      <tr class="${b.hasUnpaidBill ? 'unpaid-row' : ''}">
        <td>
          <span class="name-cell">${b.residentName}</span>
          ${b.hasUnpaidBill ? '<span class="unpaid-badge">UNPAID</span>' : ''}
        </td>
        <td>${b.roomNumber}</td>
        <td><span class="diet-badge ${b.dietType === 'veg' ? 'veg' : 'non-veg'}">${b.dietType === 'veg' ? '🌿 Veg' : '🍗 Non-Veg'}</span></td>
        <td><span class="tag full">${b.presentDays}</span></td>
        <td><span class="tag half">${b.halfDays}</span></td>
        <td><span class="tag brkfst">${b.breakfastDays}</span></td>
        <td><span class="tag abs">${b.absentDays}</span></td>
        <td>${cur}${b.dietRate}/day</td>
        <td>${b.totalDays}</td>
        <td class="amount" style="${b.hasUnpaidBill ? 'color:#dc2626' : ''}">${cur}${b.totalAmount}</td>
        <td style="font-weight:600;color:${b.hasUnpaidBill ? '#dc2626' : '#16a34a'}">${b.hasUnpaidBill ? 'UNPAID' : 'PAID'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${summary.messName} — ${MONTHS[month-1]} ${year} Bill</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 28px; color: #111; font-size: 13px; background: #fff; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1e293b; }
      .mess-name { font-size: 22px; font-weight: 800; color: #1e293b; }
      .period { font-size: 13px; color: #64748b; margin-top: 4px; }
      .print-date { font-size: 11px; color: #94a3b8; text-align: right; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
      .summary-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
      .summary-value { font-size: 18px; font-weight: 700; color: #1e293b; }
      .summary-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; }
      thead th { background: #1e293b; color: white; text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
      tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 12px; }
      .unpaid-row td { background: #fff1f2 !important; }
      .unpaid-row td:first-child { border-left: 3px solid #ef4444; }
      .name-cell { font-weight: 600; color: #1e293b; }
      .unpaid-badge { display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; margin-left: 6px; }
      .diet-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
      .veg { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
      .non-veg { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
      .tag { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 500; margin-right: 2px; }
      .full { background: #f0fdf4; color: #15803d; }
      .half { background: #fffbeb; color: #b45309; }
      .brkfst { background: #eff6ff; color: #1d4ed8; }
      .abs { background: #fff1f2; color: #be123c; }
      .amount { font-weight: 700; font-size: 14px; color: #1e293b; }
      .total-row td { background: #1e293b !important; color: white; font-weight: 700; padding: 12px; font-size: 13px; }
      .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; display: flex; justify-content: space-between; }
      @media print { body { padding: 16px; } @page { margin: 1cm; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="mess-name">${summary.messName}</div>
        <div class="period">Monthly Bill — ${MONTHS[month-1]} ${year}</div>
      </div>
      <div class="print-date">
        Printed: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        ${unpaidCount > 0 ? `<div style="color:#ef4444;font-weight:bold;margin-top:4px;">⚠ ${unpaidCount} Unpaid Bill(s)</div>` : ''}
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Veg Rate</div>
        <div class="summary-value">${cur}${summary.vegDietRate}</div>
        <div class="summary-sub">per day</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Non-Veg Rate</div>
        <div class="summary-value">${cur}${summary.nonVegDietRate}</div>
        <div class="summary-sub">per day</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Breakfast Rate</div>
        <div class="summary-value">${cur}${summary.breakfastRate}</div>
        <div class="summary-sub">per day</div>
      </div>
      <div class="summary-card" style="background:#f0fdf4;border-color:#bbf7d0;">
        <div class="summary-label">Total Collectable</div>
        <div class="summary-value" style="color:#15803d;">${cur}${summary.totalCollectable}</div>
        <div class="summary-sub">${summary.bills.length} residents</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Resident</th><th>Room</th><th>Diet</th>
          <th>Present</th><th>P/2</th><th>Breakfast</th><th>Absent</th>
          <th>Rate</th><th>Days</th><th>Amount</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${billRows}
        <tr class="total-row">
          <td colspan="9" style="text-align:right;padding-right:16px;">Total Collectable</td>
          <td class="amount">${cur}${summary.totalCollectable}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <span>Generated by MessMate &bull; ${summary.messName}</span>
      <span>${new Date().toLocaleString("en-IN")}</span>
    </div>
  </body>
</html>`

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const monthName = MONTHS[month - 1]
  const unpaidCount = summary?.bills?.filter(b => b.hasUnpaidBill).length ?? 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Monthly Billing</h1>
          <p className="text-muted-foreground mt-1">Review attendance, manage bills, and print PDF.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-card p-2 rounded-2xl shadow-sm border">
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent border-0 font-medium text-sm focus:ring-0 cursor-pointer"
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <div className="w-px h-6 bg-border mx-1"></div>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-20 bg-transparent border-0 font-medium text-sm focus:ring-0"
            />
          </div>
          <Button 
            onClick={handlePrint} 
            disabled={isLoading || !summary?.bills?.length} 
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white h-11 px-5"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Calculator className="w-48 h-48" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-slate-400 font-medium mb-1">Total Collectable — {monthName} {year}</p>
            <h2 className="text-5xl font-display font-bold text-white tracking-tight">
              {isLoading ? "..." : formatCurrency(summary?.totalCollectable || 0, summary?.currency)}
            </h2>
            <p className="text-slate-500 text-sm mt-3">
              {summary?.bills?.length ?? 0} residents &middot;&nbsp;
              Veg {formatCurrency(summary?.vegDietRate ?? 0, summary?.currency)}/day &middot;&nbsp;
              Non-Veg {formatCurrency(summary?.nonVegDietRate ?? 0, summary?.currency)}/day
            </p>
          </CardContent>
        </Card>
        
        <Card className="p-6 flex flex-col justify-center gap-3">
          <h3 className="font-bold font-display text-base">Bill Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Paid
              </span>
              <span className="font-bold text-lg">{(summary?.bills?.length ?? 0) - unpaidCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-rose-600">
                <AlertCircle className="w-4 h-4" /> Unpaid
              </span>
              <span className="font-bold text-lg text-rose-600">{unpaidCount}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Resident</th>
                <th className="px-6 py-4 font-medium">Diet</th>
                <th className="px-6 py-4 font-medium">Attendance</th>
                <th className="px-6 py-4 font-medium">Rate / Days</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Bill Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Calculating bills...</td></tr>
              ) : summary?.bills?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No attendance records found for this month.</td></tr>
              ) : summary?.bills?.map(b => (
                <tr key={b.residentId} className={cn(
                  "transition-colors",
                  b.hasUnpaidBill 
                    ? "bg-rose-50/60 hover:bg-rose-50" 
                    : "hover:bg-slate-50/50"
                )}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {b.hasUnpaidBill && <div className="w-1.5 h-8 bg-rose-500 rounded-full shrink-0" />}
                      <div>
                        <p className="font-semibold text-foreground">{b.residentName}</p>
                        <p className="text-xs text-muted-foreground">Room {b.roomNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {b.dietType === "veg" ? (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                        <Leaf className="w-3 h-3" /> Veg
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                        <Drumstick className="w-3 h-3" /> Non-Veg
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 text-xs flex-wrap">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{b.presentDays} Full</span>
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{b.halfDays} P/2</span>
                      <span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">{b.breakfastDays} Brkfst</span>
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{b.absentDays} Abs</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-sm">{summary.currency}{b.dietRate}/day</span>
                    <p className="text-xs text-muted-foreground">{b.totalDays} billable days</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("font-bold text-base", b.hasUnpaidBill && "text-rose-600")}>
                      {formatCurrency(b.totalAmount, summary.currency)}
                    </span>
                    {b.hasUnpaidBill && (
                      <p className="text-xs text-rose-500 font-medium">Due</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleUnpaid(b.residentId, b.hasUnpaidBill)}
                      disabled={toggleUnpaidMut.isPending}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ml-auto",
                        b.hasUnpaidBill
                          ? "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      )}
                    >
                      {b.hasUnpaidBill ? (
                        <><AlertCircle className="w-3.5 h-3.5" /> Mark Paid</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Paid</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {summary?.bills && summary.bills.length > 0 && (
                <tr className="bg-slate-900 text-white">
                  <td colSpan={4} className="px-6 py-4 font-bold text-right">Total Collectable</td>
                  <td className="px-6 py-4 font-bold text-lg">{formatCurrency(summary.totalCollectable, summary.currency)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}

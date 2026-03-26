import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
import { 
  useGetBillingSummary, 
  useSendMonthlyBills, 
  useSendReminder 
} from "@workspace/api-client-react"
import { Send, BellRing, Calculator, Printer, CheckCircle2, XCircle, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { PinLoginModal } from "@/components/PinLoginModal"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function Billing() {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [sendResults, setSendResults] = useState<null | { sent: number; failed: number; results: any[] }>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const { data: summary, isLoading } = useGetBillingSummary({ month, year })

  const sendBillsMut = useSendMonthlyBills({
    mutation: {
      onSuccess: (data) => {
        setSendResults(data)
        toast({ title: `Bills sent: ${data.sent} succeeded, ${data.failed} failed` })
      },
      onError: (err: any) => {
        toast({ title: err?.message ?? "Failed to send bills", variant: "destructive" })
      }
    }
  })

  const sendReminderMut = useSendReminder({
    mutation: {
      onSuccess: () => toast({ title: "Reminder sent!" }),
      onError: (err: any) => toast({ title: err?.message ?? "Failed to send reminder", variant: "destructive" })
    }
  })

  const handleSendAll = () => {
    if (!isAdmin) { setShowLoginModal(true); return }
    if (confirm(`Send WhatsApp bills to all residents for ${MONTHS[month-1]} ${year}?`)) {
      setSendResults(null)
      sendBillsMut.mutate({ data: { month, year } })
    }
  }

  const handleRemind = (residentId: number) => {
    if (!isAdmin) { setShowLoginModal(true); return }
    sendReminderMut.mutate({ data: { residentId, month, year } })
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>${summary?.messName} - ${MONTHS[month-1]} ${year} Bill</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; font-size: 13px; }
            h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { color: #666; margin-bottom: 20px; font-size: 12px; }
            .summary-row { display: flex; gap: 32px; margin-bottom: 20px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
            .summary-item { }
            .summary-label { font-size: 11px; color: #888; }
            .summary-value { font-size: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #1e293b; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 10px 12px; border-bottom: 1px solid #e9ecef; vertical-align: middle; }
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) td { background: #f9fafb; }
            .name { font-weight: 600; }
            .room { color: #666; font-size: 11px; }
            .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 3px; }
            .full { background: #ecfdf5; color: #059669; }
            .half { background: #fffbeb; color: #d97706; }
            .brkfst { background: #eff6ff; color: #2563eb; }
            .abs { background: #fff1f2; color: #e11d48; }
            .amount { font-weight: 700; font-size: 14px; }
            .total-row td { font-weight: bold; background: #1e293b; color: white; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e9ecef; color: #888; font-size: 11px; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <div class="footer">Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} &bull; ${summary?.messName} &bull; Powered by MessMate</div>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  const monthName = MONTHS[month - 1]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Monthly Billing</h1>
          <p className="text-muted-foreground mt-1">Review attendance and generate bills.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card p-2 rounded-2xl shadow-sm border">
            <select 
              value={month} 
              onChange={(e) => { setMonth(Number(e.target.value)); setSendResults(null) }}
              className="bg-transparent border-0 font-medium text-sm focus:ring-0 cursor-pointer"
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <div className="w-px h-6 bg-border mx-1"></div>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => { setYear(Number(e.target.value)); setSendResults(null) }}
              className="w-20 bg-transparent border-0 font-medium text-sm focus:ring-0"
            />
          </div>
          <Button variant="outline" onClick={handlePrint} disabled={isLoading || !summary?.bills?.length} className="gap-2">
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Calculator className="w-48 h-48" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <p className="text-slate-400 font-medium mb-1">Total Collectable for {monthName} {year}</p>
            <h2 className="text-5xl font-display font-bold text-white tracking-tight">
              {isLoading ? "..." : formatCurrency(summary?.totalCollectable || 0, summary?.currency)}
            </h2>
            <p className="text-slate-500 text-sm mt-3">{summary?.bills?.length ?? 0} residents · Rate {formatCurrency(summary?.dietRatePerDay ?? 0, summary?.currency)}/day</p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary text-primary-foreground flex flex-col justify-center items-center text-center p-6 border-0 shadow-lg shadow-primary/20">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold font-display text-lg mb-2">WhatsApp Bills</h3>
          {!isAdmin && (
            <p className="text-xs text-blue-200 mb-3 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Admin login required
            </p>
          )}
          <Button 
            onClick={handleSendAll} 
            disabled={sendBillsMut.isPending || isLoading || !summary?.bills?.length}
            className="bg-white text-primary hover:bg-slate-100 w-full"
          >
            {sendBillsMut.isPending ? "Sending..." : isAdmin ? "Send All Bills" : "Login to Send"}
          </Button>
        </Card>
      </div>

      {/* Send results */}
      {sendResults && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              WhatsApp Send Results
              <span className="text-sm font-normal text-muted-foreground">— {sendResults.sent} sent, {sendResults.failed} failed</span>
            </h3>
            <div className="space-y-2">
              {sendResults.results.map((r: any) => (
                <div key={r.residentId} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${r.success ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  {r.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span className="font-medium">{r.residentName}</span>
                  <span className="text-muted-foreground">{r.whatsappNumber}</span>
                  <span className={`ml-auto ${r.success ? "text-emerald-700" : "text-rose-700"}`}>{r.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Printable billing table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Resident</th>
                <th className="px-6 py-4 font-medium">Breakdown (Days)</th>
                <th className="px-6 py-4 font-medium">Billable</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Calculating bills...</td></tr>
              ) : summary?.bills?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No attendance records found for this month.</td></tr>
              ) : summary?.bills?.map(b => (
                <tr key={b.residentId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{b.residentName}</p>
                    <p className="text-xs text-muted-foreground">Room {b.roomNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 text-xs flex-wrap">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{b.presentDays} Full</span>
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{b.halfDays} P/2</span>
                      <span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">{b.breakfastDays} Brkfst</span>
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{b.absentDays} Abs</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{b.totalDays}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-base">{formatCurrency(b.totalAmount, summary.currency)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" size="sm" className="gap-2 shadow-sm"
                      onClick={() => handleRemind(b.residentId)}
                      disabled={sendReminderMut.isPending}
                    >
                      <BellRing className="w-4 h-4 text-primary" /> Remind
                    </Button>
                  </td>
                </tr>
              ))}
              {summary?.bills && summary.bills.length > 0 && (
                <tr className="bg-slate-900 text-white">
                  <td colSpan={3} className="px-6 py-4 font-bold text-right">Total Collectable</td>
                  <td className="px-6 py-4 font-bold text-lg">{formatCurrency(summary.totalCollectable, summary.currency)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hidden printable content */}
      <div className="hidden">
        <div ref={printRef}>
          <h1>{summary?.messName} — {monthName} {year} Bill</h1>
          <p className="subtitle">Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          <div className="summary-row">
            <div className="summary-item">
              <div className="summary-label">Diet Rate</div>
              <div className="summary-value">{summary?.currency}{summary?.dietRatePerDay}/day</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Breakfast Rate</div>
              <div className="summary-value">{summary?.currency}{summary?.breakfastRate}/day</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Residents</div>
              <div className="summary-value">{summary?.bills?.length ?? 0}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Collectable</div>
              <div className="summary-value">{summary?.currency}{summary?.totalCollectable}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Room</th>
                <th>Present</th>
                <th>P/2</th>
                <th>Breakfast</th>
                <th>Absent</th>
                <th>Billable Days</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {summary?.bills?.map(b => (
                <tr key={b.residentId}>
                  <td><span className="name">{b.residentName}</span></td>
                  <td>{b.roomNumber}</td>
                  <td><span className="tag full">{b.presentDays}</span></td>
                  <td><span className="tag half">{b.halfDays}</span></td>
                  <td><span className="tag brkfst">{b.breakfastDays}</span></td>
                  <td><span className="tag abs">{b.absentDays}</span></td>
                  <td>{b.totalDays}</td>
                  <td className="amount">{summary.currency}{b.totalAmount}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={7} style={{ textAlign: "right", paddingRight: "16px" }}>Total Collectable</td>
                <td className="amount">{summary?.currency}{summary?.totalCollectable}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showLoginModal && (
        <PinLoginModal onSuccess={() => setShowLoginModal(false)} onCancel={() => setShowLoginModal(false)} />
      )}
    </motion.div>
  )
}

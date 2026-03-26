import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  useGetBillingSummary, 
  useSendMonthlyBills, 
  useSendReminder 
} from "@workspace/api-client-react"
import { Send, BellRing, Calculator } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function Billing() {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1) // 1-12
  const [year, setYear] = useState(currentDate.getFullYear())
  const { toast } = useToast()

  const { data: summary, isLoading, refetch } = useGetBillingSummary({ month, year })
  const sendBillsMut = useSendMonthlyBills({
    mutation: {
      onSuccess: (data) => {
        toast({ title: `Sent ${data.sent} bills. Failed: ${data.failed}` })
      }
    }
  })
  const sendReminderMut = useSendReminder({
    mutation: {
      onSuccess: () => toast({ title: "Reminder sent successfully!" })
    }
  })

  const handleSendAll = () => {
    if(confirm(`Send WhatsApp bills to all residents for ${MONTHS[month-1]} ${year}?`)) {
      sendBillsMut.mutate({ data: { month, year } })
    }
  }

  const handleRemind = (residentId: number) => {
    sendReminderMut.mutate({ data: { residentId, month, year } })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Monthly Billing</h1>
          <p className="text-muted-foreground mt-1">Review attendance and generate bills.</p>
        </div>
        
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Calculator className="w-48 h-48" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <p className="text-slate-400 font-medium mb-1">Total Collectable for {MONTHS[month-1]}</p>
            <h2 className="text-5xl font-display font-bold text-white tracking-tight">
              {isLoading ? "..." : formatCurrency(summary?.totalCollectable || 0, summary?.currency)}
            </h2>
          </CardContent>
        </Card>
        
        <Card className="bg-primary text-primary-foreground flex flex-col justify-center items-center text-center p-6 border-0 shadow-lg shadow-primary/20">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold font-display text-lg mb-2">WhatsApp Integration</h3>
          <Button 
            onClick={handleSendAll} 
            disabled={sendBillsMut.isPending || isLoading || !summary?.bills?.length}
            className="bg-white text-primary hover:bg-slate-100 w-full"
          >
            {sendBillsMut.isPending ? "Sending..." : "Send All Bills"}
          </Button>
        </Card>
      </div>

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
                    <div className="flex gap-2 text-xs">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{b.presentDays} Full</span>
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{b.halfDays} P/2</span>
                      <span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">{b.breakfastDays} Brkfst</span>
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{b.absentDays} Abs</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {b.totalDays}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-base">{formatCurrency(b.totalAmount, summary.currency)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 shadow-sm"
                      onClick={() => handleRemind(b.residentId)}
                    >
                      <BellRing className="w-4 h-4 text-primary" /> Remind
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}

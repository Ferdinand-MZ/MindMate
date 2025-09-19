"use client"
import { useState } from "react"
import {
    DialogTitle,
    DialogDescription,
    Dialog,
    DialogContent,
    DialogHeader,
 } from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"

const activityTypes = [
    {id: "meditation", name: "Meditasi"},
    {id: "exercise", name: "Olahraga"},
    {id: "walking", name: "Jalan Kaki"},
    {id: "reading", name: "Membaca"},
    {id: "journaling", name: "Menulis Jurnal"},
    {id: "therapy", name: "Sesi Terapi"},
]

interface ActivityLoggerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ActivityLogger({open, onOpenChange}
    : ActivityLoggerProps ) {
        const [type, setType] = useState("")
        const [name, setName] = useState("")
        const [duration, setDuration] = useState("")
        const [description, setDescription] = useState("")
        const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {

        setTimeout(() => {
            console.log({
                type,
                name,
                duration,
                description
            })


            // Reset Fields
            setType("")
            setName("")
            setDuration("")
            setDescription("")
            setIsLoading(false)

            alert("Aktivitas log (mock)!")
            onOpenChange(false) //menutup modal
        }, 1000)
    }

    return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Log Aktivitas</DialogTitle>
        <DialogDescription>
          Catat aktivitas sehat harian Anda di sini.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Tipe Aktivitas</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Tipe Aktivitas" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nama</Label>
          <Input
            className="w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meditasi Pagi, Jalan Malam, dll."
          />
        </div>

        <div className="space-y-2">
          <Label>Deskripsi (opsional)</Label>
          <Input
            className="w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bagaimana jalannya?"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost">
            Batal
          </Button>
          <Button type="submit" disabled={!name || !type}>
            Simpan Aktivitas
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
    }
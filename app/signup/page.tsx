'use client'

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Mail, User, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { registerUser } from "@/lib/api/auth"
import {useRouter} from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, SetError] = useState("")
    const [loading, setLoading] = useState(false)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault() // prevent pagenya refresh abis submit
        SetError("")
        if(password !== confirmPassword) {
            SetError("Password dan Konfirmasi Password tidak sesuai")
            return;
        }
        setLoading(true)
        try {
            await registerUser(name, email, password)
            router.push("/login")
        } catch (err: any) {
            setError(err.message || "Gagal Mendaftar. Coba lagi nanti.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 
        via-background to-secondary/30">
            <Container className="flex flex-col items-center justify-center w-full">
                <Card className="w-fullmd:w-5/12 max-w-2xl p-8 md:p-10 rounded-3xl shadow-2xl border border-primary/10
                bg-card/90 backdrop-blur-lg mt-12">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-primary/80
                        bg-clip-text text-transparent mb-1 tracking-tight">
                            Daftar
                        </h1>
                        <p className="text-base text-muted-foreground font-medium">
                            Buat akun anda untuk memulai perjalanan anda
                        </p>
                    </div>

                    {/* Form */}
                    <form action="" className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    {/* Name */}
                                    <label 
                                        htmlFor="name"
                                        className="block text-base font-semibold mb-1"
                                    >
                                        Name
                                    </label>
                                    <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                    id="name"
                                    type="text"
                                    placeholder="Masukkan Nama Anda...."
                                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary 
                                    focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-muted-foreground"
                                    value={name}
                                    onChange={(e) => setName (e.target.value)} required
                                    />
                                    </div>
                                </div>
                                {/* email */}
                                <div className="flex-1">
                                    <label htmlFor="email" className="block text-base font-semibold mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                        id="email"
                                        type="email"
                                        placeholder="Masukkan Email Anda...."
                                        className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary 
                                        focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-muted-foreground"
                                        value={email}
                                        onChange={(e) => setEmail (e.target.value)} required
                                        />
                                    </div>
                                </div>

                                
                            </div>
                            <div>
                                {/* Password */}
                                <label htmlFor="password" className="block text-base font-semibold mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                    id="password"
                                    type="password"
                                    placeholder="Masukkan Password Anda...."
                                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary 
                                    focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-muted-foreground"
                                    value={password}
                                    onChange={(e) => setPassword (e.target.value)} required
                                    />
                                </div>
                            </div>

                            <div>
                                {/* Confirm Password */}
                                <label htmlFor="confirmPassword" className="block text-base font-semibold mb-1">Konfirmasi Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Masukkan Password Anda...."
                                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary 
                                    focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-muted-foreground"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword (e.target.value)} required
                                    />
                                </div>

                            </div>

                            
                        </div>
                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}
                            {/* Button */}
                            <Button
                            className="w-full py-2 text-base rounded-xl font-bold bg-gradient-to-r from-primary
                            to-primary/80 shadow-md hover:from-primary/80 hover:to-primary"
                            size="lg"
                            type="submit"
                            disabled={loading}
                            >
                                {loading ? 'Mendaftarkan...' : 'Daftar'}
                            </Button>

                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                                Sudah Memiliki Akun ?
                            </span>
                            <Link 
                                href="/login"
                                className="text-primary font-semibold underline"
                            >
                                Masuk
                            </Link>
                        </div>
                    </form>
                </Card>
            </Container>
            
        </div>
    )
}
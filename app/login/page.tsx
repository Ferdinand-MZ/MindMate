'use client'

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Mail, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import { useSession } from "@/lib/contexts/session-context"
import { loginUser } from "@/lib/api/auth"

export default function LoginPage() {
    const router = useRouter()
    const {checkSession} = useSession();
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault() // prevent pagenya refresh abis submit
        setError("")
        setLoading(true)
        try {
            const response = await loginUser(email, password);

            localStorage.setItem("token", response.token);

            await checkSession()

            await new Promise((resolve) => setTimeout(resolve, 100));

            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Email atau password invalid. Coba lagi nanti.")
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
                            Masuk
                        </h1>
                        <p className="text-base text-muted-foreground font-medium">
                            Selamat Datang Kembali !
                            <br />
                        Tolong masuk untuk melanjutkan perjalanan anda.
                        </p>
                    </div>

                    {/* Form */}
                    <form action="" className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div>
                                {/* email */}
                                <label htmlFor="email" className="block text-base font-semibold mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                    id="email"
                                    type="email"
                                    placeholder="Masukkan Email Anda...."
                                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary 
                                    focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                    value={email}
                                    onChange={(e) => setEmail (e.target.value)} required
                                    />
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
                                    focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                    value={password}
                                    onChange={(e) => setPassword (e.target.value)} required
                                    />
                                </div>

                            </div>

                            
                        </div>
                            {error && (
                                <p className="text-red-500 text-sm text-center font-medium">{error}</p>
                            )}

                            {/* Button */}
                            <Button
                            className="w-full py-2 text-base rounded-xl font-bold bg-gradient-to-r from-primary
                            to-primary/80 shadow-md hover:from-primary/80 hover:to-primary"
                            size="lg"
                            type="submit"
                            disabled={loading}
                            >
                                {loading ? 'Memproses...' : 'Masuk'}
                            </Button>

                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                                Belum Memiliki Akun ?
                            </span>
                            <Link 
                                href="/signup"
                                className="text-primary font-semibold underline"
                            >
                                Daftar
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link 
                                href="/forgot-password"
                                className="text-primary underline"
                            >
                                Lupa Password ?
                            </Link>
                        </div>
                    </form>
                </Card>
            </Container>
        </div>
    )
}
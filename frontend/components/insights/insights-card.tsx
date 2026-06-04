"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BrainCircuit, Activity, Lightbulb } from "lucide-react";

interface InsightCardProps {
  insights: {
    name: string;
    description: string;
    symptoms: string[];
    solution: string[];
    timestamp: string | Date;
  }[];
}

export function InsightCard({ insights }: InsightCardProps) {
  const latestInsight = insights.length > 0 ? insights[0] : null;

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          Insights
        </CardTitle>
        <CardDescription>
          Insight dari hasil analisis CBT kamu
        </CardDescription>
      </CardHeader>

      <CardContent>
        {latestInsight ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 hover:scale-[1.02] transition-all">
              <h3 className="text-lg font-semibold text-primary">
                {latestInsight.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {latestInsight.description}
              </p>

              {/* Gejala (Symptoms) */}
        <div className="mt-4">
          <h4 className="font-medium mb-1">Gejala yang Teridentifikasi:</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {(latestInsight.symptoms || []).map((symptom, i) => (
              <li key={i}>{symptom}</li>
            ))}
          </ul>
        </div>

        {/* Solusi (Solution) */}
        <div className="mt-4">
          <h4 className="font-medium mb-1 flex items-center gap-1">
            <Lightbulb className="w-4 h-4 text-primary" /> Rekomendasi Solusi:
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {(latestInsight.solution || []).map((sol, i) => (
              <li key={i}>{sol}</li>
            ))}
          </ul>
        </div>


              {/* Timestamp */}
              <p className="text-xs text-muted-foreground mt-4 text-right">
                {new Date(latestInsight.timestamp).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>Selesaikan kuis CBT untuk mendapatkan wawasan personal.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

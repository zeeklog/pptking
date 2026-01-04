'use client';import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string;
  gradient?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  image, 
  gradient = false,
  onClick,
  className 
}: FeatureCardProps) {
  return (
    <Card 
      className={cn(
        "template-card hover-lift cursor-pointer group transition-all duration-300 shadow-purple-md hover:shadow-purple-lg",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={cn(
            "p-3 rounded-lg flex-shrink-0 transition-all duration-200",
            gradient 
              ? "bg-gradient-primary shadow-purple-sm" 
              : "bg-purple-100 group-hover:bg-purple-200"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              gradient ? "text-white" : "text-purple-600"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-tech-800 mb-2 group-hover:text-purple-600 transition-colors">
              {title}
            </h3>
            <p className="text-tech-600 text-sm leading-relaxed">
              {description}
            </p>
          </div>
          
          {image && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-purple-sm">
              <img 
                src={image} 
                alt={title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
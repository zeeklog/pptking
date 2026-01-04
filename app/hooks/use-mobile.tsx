'use client';import * as React from "react"

// 响应式断点定义
const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.md)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg)
    }
    mql.addEventListener("change", onChange)
    setIsTablet(window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.lg)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= BREAKPOINTS.lg)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.md) {
        setDeviceType('mobile')
      } else if (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  return deviceType
}

export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS) {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
    const onChange = () => {
      setIsAboveBreakpoint(window.innerWidth >= BREAKPOINTS[breakpoint])
    }
    mql.addEventListener("change", onChange)
    setIsAboveBreakpoint(window.innerWidth >= BREAKPOINTS[breakpoint])
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return isAboveBreakpoint
}

// 导出断点常量供其他地方使用
export { BREAKPOINTS }

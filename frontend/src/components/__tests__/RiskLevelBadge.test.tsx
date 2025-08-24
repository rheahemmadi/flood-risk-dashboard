import { render, screen } from '../../test-utils'
import { RiskLevelBadge } from '../RiskLevelBadge'

describe('RiskLevelBadge', () => {
  it('renders low risk badge correctly', () => {
    render(<RiskLevelBadge riskLevel="green" />)
    
    const badge = screen.getByText('Low Risk')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('renders medium risk badge correctly', () => {
    render(<RiskLevelBadge riskLevel="amber" />)
    
    const badge = screen.getByText('Medium Risk')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('renders high risk badge correctly', () => {
    render(<RiskLevelBadge riskLevel="red" />)
    
    const badge = screen.getByText('High Risk')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('renders unknown risk badge correctly', () => {
    render(<RiskLevelBadge riskLevel="unknown" as any />)
    
    const badge = screen.getByText('Unknown')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('applies custom className when provided', () => {
    render(<RiskLevelBadge riskLevel="green" className="custom-class" />)
    
    const badge = screen.getByText('Low Risk')
    expect(badge).toHaveClass('custom-class')
  })

  it('renders with correct base classes', () => {
    render(<RiskLevelBadge riskLevel="red" />)
    
    const badge = screen.getByText('High Risk')
    expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium')
  })
})

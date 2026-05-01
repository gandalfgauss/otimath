'use client'

import { Button } from "@/components/global/Button";
import { Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type InfoBoxType = 'info' | 'warning' | 'success' | 'error' | 'concept';

interface RouletteInfoBoxProps {
  type: InfoBoxType;
  title?: string;
  message: string;
  showConfirmButton?: boolean;
  confirmButtonText?: string;
  onConfirm?: () => void;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  children?: React.ReactNode;
}

const typeStyles: Record<InfoBoxType, { bg: string; border: string; icon: React.ReactNode; titleColor: string; roleLabel: string }> = {
  info: {
    bg: 'bg-feedback-info-lighter',
    border: 'border-feedback-info-dark',
    icon: <Info size={20} className="text-feedback-info-dark" aria-hidden="true" />,
    titleColor: 'text-feedback-info-darkest',
    roleLabel: 'Informação'
  },
  warning: {
    bg: 'bg-feedback-warning-lighter',
    border: 'border-feedback-warning-dark',
    icon: <AlertTriangle size={20} className="text-feedback-warning-dark" aria-hidden="true" />,
    titleColor: 'text-feedback-warning-darkest',
    roleLabel: 'Aviso'
  },
  success: {
    bg: 'bg-feedback-success-lighter',
    border: 'border-feedback-success-dark',
    icon: <CheckCircle size={20} className="text-feedback-success-dark" aria-hidden="true" />,
    titleColor: 'text-feedback-success-darkest',
    roleLabel: 'Sucesso'
  },
  error: {
    bg: 'bg-feedback-error-lighter',
    border: 'border-feedback-error-dark',
    icon: <XCircle size={20} className="text-feedback-error-dark" aria-hidden="true" />,
    titleColor: 'text-feedback-error-darkest',
    roleLabel: 'Erro'
  },
  concept: {
    bg: 'bg-brand-otimath-lightest',
    border: 'border-brand-otimath-pure',
    icon: <Info size={20} className="text-brand-otimath-pure" aria-hidden="true" />,
    titleColor: 'text-brand-otimath-dark',
    roleLabel: 'Conceito'
  }
};

export function RouletteInfoBox({
  type,
  title,
  message,
  showConfirmButton = false,
  confirmButtonText = "Li.",
  onConfirm,
  secondaryButtonText,
  onSecondaryClick,
  children
}: RouletteInfoBoxProps) {
  const styles = typeStyles[type];
  const isUrgent = type === 'error' || type === 'warning';

  return (
    <div
      className={`${styles.bg} p-macro rounded-md border-l-4 ${styles.border} flex flex-col gap-y-micro`}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-label={styles.roleLabel}
    >
      <div className="flex items-start gap-x-micro">
        {styles.icon}
        <div className="flex flex-col gap-y-micro flex-1">
          {title && (
            <h4 className={`ds-body-bold ${styles.titleColor}`}>{title}</h4>
          )}
          <p className="ds-small text-neutral-darkest" dangerouslySetInnerHTML={{ __html: message }} />
          {children}
        </div>
      </div>

      {(showConfirmButton || secondaryButtonText) && (
        <div className="flex justify-end gap-x-micro mt-micro">
          {secondaryButtonText && onSecondaryClick && (
            <Button
              style="primary"
              size="small"
              onClick={onSecondaryClick}
            >
              {secondaryButtonText}
            </Button>
          )}
          {showConfirmButton && onConfirm && (
            <Button
              style="secondary"
              size="small"
              icon={<Check />}
              onClick={onConfirm}
            >
              {confirmButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

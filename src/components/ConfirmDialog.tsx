import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AlertTriangle, Trash2, XCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-600';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 rounded-full p-3 ${getIconBgColor()}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg mb-2">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="bg-white border-gray-300 hover:bg-gray-50">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
            className={`${getConfirmButtonClass()} text-white`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook personalizado para usar el ConfirmDialog de manera imperativa
export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    open: false,
    title: '',
    description: '',
  });

  const confirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        ...options,
        onConfirm: () => resolve(true),
      });
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && state.onConfirm) {
      // Si se cierra sin confirmar, resolvemos como false
      setState((prev) => ({ ...prev, open: false }));
    }
  };

  const handleConfirm = () => {
    if (state.onConfirm) {
      state.onConfirm();
    }
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
    />
  );

  return { confirm, dialog };
}

// Necesitamos importar React para el hook
import React from 'react';

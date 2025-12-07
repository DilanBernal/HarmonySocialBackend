export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export type Email = {
  // Campos obligatorios
  to: string[];
  from: string;
  subject: string;

  // Contenido (al menos uno requerido)
  text?: string;
  html?: string;

  // Campos opcionales para casos avanzados
  cc?: string[];
  bcc?: string[];
  replyTo?: string;

  // Configuraciones adicionales
  priority?: "low" | "normal" | "high";
  attachments?: EmailAttachment[];

  // Metadatos simples
  tags?: string[];

  // Configuración de entrega
  sendAt?: Date; // Para programar envío
  retryAttempts?: number;
};

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export default Email;

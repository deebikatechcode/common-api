export interface SendMailInterface {
    from?: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    html: string;
  }
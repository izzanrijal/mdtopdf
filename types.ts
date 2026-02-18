export interface ConversionOptions {
  fontSize: 'small' | 'medium' | 'large';
  columns: 1 | 2 | 3;
  darkMode: boolean;
}

export interface MarkdownFile {
  url: string;
  content: string;
  filename: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  GENERATING_PDF = 'GENERATING_PDF'
}
